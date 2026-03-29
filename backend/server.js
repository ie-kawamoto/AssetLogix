require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: '*'
}));

app.use(express.json());

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

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      'your-secret-key', // 本番では環境変数を使用
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
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

app.listen(3000, '0.0.0.0', async () => {
  console.log('http://api.asset-logix.local:3000');

  // Seed initial user
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'USER',
      },
    });
    console.log('Seeded user:', user.email);
  } catch (error) {
    console.error('Seeding error:', error);
  }
});
