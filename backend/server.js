require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = ['電子機器', '家具', '文房具', 'その他'];

const ensureDefaultCategories = async (organizationId) => {
  const existing = await prisma.category.findMany({
    where: { organizationId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((c) => c.name));

  for (const name of DEFAULT_CATEGORIES) {
    if (!existingNames.has(name)) {
      await prisma.category.create({
        data: { organizationId, name },
      });
    }
  }
};

app.use(cors({
  origin: '*'
}));

app.use(express.json());

const getDateStart = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isPastDueDate = (value) => getDateStart(value) < getDateStart(new Date());

// 認証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'トークンがありません' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'トークンが無効です' });
    }
    req.user = user;
    next();
  });
};

const normalizeRole = (role) => {
  if (!role) return role;
  if (role === 'GUEST') return 'GEST';
  return role;
};

const isSystemAdmin = (role) => role === 'ADMIN';
const isOrganizationAdmin = (role) => role === 'USER';
const isGuestUser = (role) => role === 'GEST' || role === 'GUEST';
const canManageUsers = (role) => isSystemAdmin(role) || isOrganizationAdmin(role);

const toSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId,
  organizationName: user.organization?.name || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ログインエンドポイント
app.post('/api/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'ユーザーが見つかりません' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'パスワードが間違っています' });
    }

    await ensureDefaultCategories(user.organizationId);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, organizationId: user.organizationId },
      'your-secret-key', // 本番では環境変数を使用
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API OK' });
});

// Organization endpoint (system admin only)
app.get('/api/organizations', authenticateToken, async (req, res) => {
  if (!isSystemAdmin(req.user.role)) {
    return res.status(403).json({ error: 'この操作を実行する権限がありません' });
  }

  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    res.json(organizations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/organizations', authenticateToken, async (req, res) => {
  if (!isSystemAdmin(req.user.role)) {
    return res.status(403).json({ error: 'この操作を実行する権限がありません' });
  }

  const { name, email } = req.body;
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;
  const emailValue = normalizedEmail || null;

  if (!normalizedName) {
    return res.status(400).json({ error: '組織名は必須です' });
  }

  try {
    const existingOrg = await prisma.organization.findFirst({
      where: { name: normalizedName },
      select: { id: true },
    });

    if (existingOrg) {
      return res.status(409).json({ error: '同じ名前の組織が既に存在します' });
    }

    if (emailValue) {
      const existingEmail = await prisma.organization.findFirst({
        where: { email: emailValue },
        select: { id: true },
      });

      if (existingEmail) {
        return res.status(409).json({ error: '同じメールアドレスの組織が既に存在します' });
      }
    }

    const organization = await prisma.organization.create({
      data: {
        name: normalizedName,
        email: emailValue,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.status(201).json(organization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/organizations/:id', authenticateToken, async (req, res) => {
  if (!isSystemAdmin(req.user.role)) {
    return res.status(403).json({ error: 'この操作を実行する権限がありません' });
  }

  const organizationId = Number(req.params.id);
  if (Number.isNaN(organizationId)) {
    return res.status(400).json({ error: '組織IDが不正です' });
  }

  const { name, email } = req.body;
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;
  const emailValue = normalizedEmail || null;

  if (!normalizedName) {
    return res.status(400).json({ error: '組織名は必須です' });
  }

  try {
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!existingOrg) {
      return res.status(404).json({ error: '組織が見つかりません' });
    }

    const duplicateName = await prisma.organization.findFirst({
      where: {
        name: normalizedName,
        id: { not: organizationId },
      },
      select: { id: true },
    });

    if (duplicateName) {
      return res.status(409).json({ error: '同じ名前の組織が既に存在します' });
    }

    if (emailValue) {
      const duplicateEmail = await prisma.organization.findFirst({
        where: {
          email: emailValue,
          id: { not: organizationId },
        },
        select: { id: true },
      });

      if (duplicateEmail) {
        return res.status(409).json({ error: '同じメールアドレスの組織が既に存在します' });
      }
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: normalizedName,
        email: emailValue,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.json(updatedOrg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.delete('/api/organizations/:id', authenticateToken, async (req, res) => {
  if (!isSystemAdmin(req.user.role)) {
    return res.status(403).json({ error: 'この操作を実行する権限がありません' });
  }

  const organizationId = Number(req.params.id);
  if (Number.isNaN(organizationId)) {
    return res.status(400).json({ error: '組織IDが不正です' });
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        _count: {
          select: { users: true },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ error: '組織が見つかりません' });
    }

    if (organization._count.users > 0) {
      return res.status(409).json({ error: 'この組織にはユーザーが所属しているため削除できません' });
    }

    await prisma.organization.delete({
      where: { id: organizationId },
    });

    res.json({ message: '組織を削除しました' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// User endpoints
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const whereClause = isSystemAdmin(req.user.role)
      ? {}
      : { organizationId: req.user.organizationId };

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ organizationId: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(users.map(toSafeUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  if (!canManageUsers(req.user.role)) {
    return res.status(403).json({ error: 'この操作を実行する権限がありません' });
  }

  const { name, email, password, role, organizationId } = req.body;
  const normalizedRole = normalizeRole(role);

  if (!name || !email || !password) {
    return res.status(400).json({ error: '名前、メールアドレス、パスワードは必須です' });
  }

  if (!['ADMIN', 'USER', 'GEST'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'ロールが不正です' });
  }

  if (!isSystemAdmin(req.user.role) && normalizedRole === 'ADMIN') {
    return res.status(403).json({ error: 'ADMINロールは作成できません' });
  }

  const targetOrganizationId = isSystemAdmin(req.user.role)
    ? Number(organizationId)
    : req.user.organizationId;

  if (!targetOrganizationId || Number.isNaN(targetOrganizationId)) {
    return res.status(400).json({ error: '組織IDが不正です' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ error: '同じメールアドレスのユーザーが存在します' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: targetOrganizationId },
      select: { id: true },
    });

    if (!organization) {
      return res.status(404).json({ error: '組織が見つかりません' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: normalizedRole,
        organizationId: targetOrganizationId,
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(201).json(toSafeUser(createdUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (!canManageUsers(req.user.role)) {
    return res.status(403).json({ error: 'この操作を実行する権限がありません' });
  }

  const targetUserId = Number(req.params.id);
  if (Number.isNaN(targetUserId)) {
    return res.status(400).json({ error: 'ユーザーIDが不正です' });
  }

  const { name, email, password, role, organizationId } = req.body;
  const normalizedRole = role ? normalizeRole(role) : undefined;

  if (normalizedRole && !['ADMIN', 'USER', 'GEST'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'ロールが不正です' });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        organizationId: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    if (!isSystemAdmin(req.user.role) && targetUser.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: '他組織のユーザーは更新できません' });
    }

    if (!isSystemAdmin(req.user.role)) {
      if (targetUser.role === 'ADMIN') {
        return res.status(403).json({ error: 'ADMINユーザーは更新できません' });
      }
      if (normalizedRole === 'ADMIN') {
        return res.status(403).json({ error: 'ADMINロールへ変更できません' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (normalizedRole !== undefined) updateData.role = normalizedRole;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // アカウント作成後の所属組織変更は禁止
    if (organizationId !== undefined && Number(organizationId) !== targetUser.organizationId) {
      return res.status(400).json({ error: '登録後に所属組織は変更できません' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json(toSafeUser(updatedUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (!canManageUsers(req.user.role)) {
    return res.status(403).json({ error: 'この操作を実行する権限がありません' });
  }

  const targetUserId = Number(req.params.id);
  if (Number.isNaN(targetUserId)) {
    return res.status(400).json({ error: 'ユーザーIDが不正です' });
  }

  if (targetUserId === req.user.userId) {
    return res.status(400).json({ error: '自分自身は削除できません' });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        organizationId: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    if (!isSystemAdmin(req.user.role) && targetUser.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: '他組織のユーザーは削除できません' });
    }

    if (!isSystemAdmin(req.user.role) && targetUser.role === 'ADMIN') {
      return res.status(403).json({ error: 'ADMINユーザーは削除できません' });
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Item endpoints
app.get('/api/items', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { organizationId: req.user.organizationId },
      include: {
        category: true,
        instances: {
          include: {
            location: true
          }
        }
      },
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/items', authenticateToken, async (req, res) => {
  const { name, categoryId, description } = req.body;

  try {
    const item = await prisma.item.create({
      data: {
        name,
        categoryId,
        organizationId: req.user.organizationId,
        description,
      },
      include: {
        category: true,
        instances: true
      },
    });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, categoryId, description } = req.body;

  try {
    const item = await prisma.item.update({
      where: { id: parseInt(id), organizationId: req.user.organizationId },
      data: {
        name,
        categoryId,
        description,
      },
      include: {
        category: true,
        instances: true
      },
    });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.item.delete({
      where: { id: parseInt(id), organizationId: req.user.organizationId },
    });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Instance endpoints
app.get('/api/instances', authenticateToken, async (req, res) => {
  try {
    const instances = await prisma.instance.findMany({
      where: { organizationId: req.user.organizationId },
      include: {
        item: {
          include: {
            category: true
          }
        },
        location: true,
      },
    });
    res.json(instances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/instances', authenticateToken, async (req, res) => {
  const { itemId, instanceName, serialNumber, status, locationId, description } = req.body;

  try {
    const parsedItemId = parseInt(itemId, 10);
    if (Number.isNaN(parsedItemId)) {
      return res.status(400).json({ error: '品目IDが不正です' });
    }

    const item = await prisma.item.findFirst({
      where: {
        id: parsedItemId,
        organizationId: req.user.organizationId,
      },
      select: { id: true },
    });

    if (!item) {
      return res.status(404).json({ error: '対象の品目が見つかりません' });
    }

    let parsedLocationId = null;
    if (locationId !== null && locationId !== undefined && locationId !== '') {
      parsedLocationId = parseInt(locationId, 10);
      if (Number.isNaN(parsedLocationId)) {
        return res.status(400).json({ error: '保管場所IDが不正です' });
      }

      const location = await prisma.location.findFirst({
        where: {
          id: parsedLocationId,
          organizationId: req.user.organizationId,
        },
        select: { id: true },
      });

      if (!location) {
        return res.status(404).json({ error: '対象の保管場所が見つかりません' });
      }
    }

    const instance = await prisma.instance.create({
      data: {
        itemId: parsedItemId,
        organizationId: req.user.organizationId,
        instanceName: instanceName || null,
        serialNumber: serialNumber || null,
        status: status || 'AVAILABLE',
        locationId: parsedLocationId,
        description: description || null,
      },
      include: {
        item: {
          include: {
            category: true
          }
        },
        location: true,
      },
    });
    res.json(instance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '個体の登録に失敗しました' });
  }
});

app.put('/api/instances/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { itemId, instanceName, serialNumber, status, locationId, description } = req.body;

  try {
    const instance = await prisma.instance.update({
      where: { id: parseInt(id), organizationId: req.user.organizationId },
      data: {
        itemId,
        instanceName: instanceName || null,
        serialNumber,
        status,
        locationId: locationId || null,
        description,
      },
      include: {
        item: {
          include: {
            category: true
          }
        },
        location: true,
      },
    });
    res.json(instance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.delete('/api/instances/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.instance.delete({
      where: { id: parseInt(id), organizationId: req.user.organizationId },
    });
    res.json({ message: 'Instance deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Category endpoints
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  const { name } = req.body;

  try {
    const category = await prisma.category.create({
      data: { 
        name,
        organizationId: req.user.organizationId
      }
    });
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const category = await prisma.category.update({
      where: { id: parseInt(id), organizationId: req.user.organizationId },
      data: { name }
    });
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.category.delete({
      where: { id: parseInt(id), organizationId: req.user.organizationId }
    });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Location endpoints
app.get('/api/locations', authenticateToken, async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/locations', authenticateToken, async (req, res) => {
  const { name } = req.body;

  try {
    const location = await prisma.location.create({
      data: { 
        name,
        organizationId: req.user.organizationId
      }
    });
    res.json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/locations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const location = await prisma.location.update({
      where: { id: parseInt(id), organizationId: req.user.organizationId },
      data: { name }
    });
    res.json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.delete('/api/locations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.location.delete({
      where: { id: parseInt(id), organizationId: req.user.organizationId }
    });
    res.json({ message: 'Location deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Borrower endpoints (貸出先管理)
app.get('/api/borrowers', authenticateToken, async (req, res) => {
  try {
    const borrowers = await prisma.borrower.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(borrowers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/borrowers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const borrower = await prisma.borrower.findUnique({
      where: { id: parseInt(id) },
      include: {
        loans: {
          include: {
            instance: {
              include: {
                item: true
              }
            }
          }
        }
      }
    });

    if (!borrower || borrower.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: '見つかりません' });
    }

    res.json(borrower);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/borrowers', authenticateToken, async (req, res) => {
  const { name, type, departmentId, contactInfo, notes } = req.body;

  try {
    const borrower = await prisma.borrower.create({
      data: {
        name,
        type,
        departmentId,
        contactInfo,
        notes,
        organizationId: req.user.organizationId
      }
    });
    res.json(borrower);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/borrowers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, type, departmentId, contactInfo, notes } = req.body;
  const borrowerId = parseInt(id, 10);

  try {
    const existingBorrower = await prisma.borrower.findFirst({
      where: {
        id: borrowerId,
        organizationId: req.user.organizationId
      }
    });

    if (!existingBorrower) {
      return res.status(404).json({ error: '見つかりません' });
    }

    const borrower = await prisma.borrower.update({
      where: { id: borrowerId },
      data: {
        name,
        type,
        departmentId,
        contactInfo,
        notes
      }
    });
    res.json(borrower);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.delete('/api/borrowers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const borrowerId = parseInt(id, 10);

  try {
    const existingBorrower = await prisma.borrower.findFirst({
      where: {
        id: borrowerId,
        organizationId: req.user.organizationId
      },
      include: {
        loans: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    });

    if (!existingBorrower) {
      return res.status(404).json({ error: '見つかりません' });
    }

    if (existingBorrower.loans.length > 0) {
      return res.status(400).json({ error: '貸出中の記録があるため削除できません' });
    }

    await prisma.borrower.delete({
      where: { id: borrowerId }
    });
    res.json({ message: 'Borrower deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Loan endpoints (貸し出し管理)
app.get('/api/loans', authenticateToken, async (req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { organizationId: req.user.organizationId },
      include: {
        instance: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        },
        borrower: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(loans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.get('/api/loans/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: parseInt(id) },
      include: {
        instance: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        },
        borrower: true
      }
    });

    if (!loan || loan.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: '見つかりません' });
    }

    res.json(loan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/loans', authenticateToken, async (req, res) => {
  const { instanceId, borrowerId, dueDate, notes } = req.body;
  const parsedDueDate = new Date(dueDate);
  const status = isPastDueDate(parsedDueDate) ? 'OVERDUE' : 'ACTIVE';

  try {
    // Check if instance exists and is available
    const instance = await prisma.instance.findUnique({
      where: { id: parseInt(instanceId) }
    });

    if (!instance || instance.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: 'アイテムが見つかりません' });
    }

    if (instance.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'このアイテムは貸出可能ではありません' });
    }

    // Create loan
    const loan = await prisma.loan.create({
      data: {
        instanceId: parseInt(instanceId),
        borrowerId: parseInt(borrowerId),
        dueDate: parsedDueDate,
        status,
        notes,
        organizationId: req.user.organizationId
      },
      include: {
        instance: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        },
        borrower: true
      }
    });

    // Update instance status to RENTED
    await prisma.instance.update({
      where: { id: parseInt(instanceId) },
      data: { status: 'RENTED' }
    });

    res.json(loan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.put('/api/loans/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, dueDate } = req.body;
  const loanId = parseInt(id, 10);

  try {
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, organizationId: req.user.organizationId },
      include: { instance: true }
    });

    if (!loan) {
      return res.status(404).json({ error: '見つかりません' });
    }

    const updateData = {};
    const nextDueDate = dueDate !== undefined ? new Date(dueDate) : loan.dueDate;
    const requestedStatus = status !== undefined ? status : loan.status;
    const nextStatus = requestedStatus === 'RETURNED'
      ? 'RETURNED'
      : (isPastDueDate(nextDueDate) ? 'OVERDUE' : requestedStatus);

    if (dueDate !== undefined) {
      updateData.dueDate = nextDueDate;
    }
    if (status !== undefined || dueDate !== undefined) {
      updateData.status = nextStatus;
      // ステータスに合わせてインスタンス状態を同期
      if (nextStatus === 'RETURNED' && loan.status !== 'RETURNED') {
        updateData.returnDate = new Date();
        await prisma.instance.update({
          where: { id: loan.instanceId },
          data: { status: 'AVAILABLE' }
        });
      } else if (nextStatus !== 'RETURNED' && loan.status === 'RETURNED') {
        updateData.returnDate = null;
        await prisma.instance.update({
          where: { id: loan.instanceId },
          data: { status: 'RENTED' }
        });
      }
    }

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: updateData,
      include: {
        instance: { include: { item: { include: { category: true } } } },
        borrower: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.post('/api/loans/:id/return', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const loan = await prisma.loan.findUnique({
      where: { id: parseInt(id) },
      include: {
        instance: true
      }
    });

    if (!loan || loan.organizationId !== req.user.organizationId) {
      return res.status(404).json({ error: '見つかりません' });
    }

    if (loan.status === 'RETURNED') {
      return res.status(400).json({ error: 'すでに返却されています' });
    }

    // Update loan status
    const updatedLoan = await prisma.loan.update({
      where: { id: parseInt(id) },
      data: {
        status: 'RETURNED',
        returnDate: new Date()
      },
      include: {
        instance: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        },
        borrower: true
      }
    });

    // Update instance status to AVAILABLE
    await prisma.instance.update({
      where: { id: loan.instanceId },
      data: { status: 'AVAILABLE' }
    });

    res.json(updatedLoan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('http://api.asset-logix.local:3000');
});
