const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function ensureDefaultCategories(organizationId) {
  const defaultCategories = ['電子機器', '家具', '文房具', 'その他'];

  for (const name of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: {
        organizationId,
        name,
      },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          organizationId,
          name,
        },
      });
    }
  }
}

async function main() {
  try {
    // テストカンパニーという組織を作成（存在する場合は再利用）
    const organization = await prisma.organization.upsert({
      where: { email: 'test@company.example.com' },
      update: { name: 'テストカンパニー' },
      create: {
        name: 'テストカンパニー',
        email: 'test@company.example.com',
      },
    });

    console.log('✓ 組織を作成しました:', organization);

    await ensureDefaultCategories(organization.id);
    console.log('✓ デフォルトカテゴリを登録しました: 電子機器, 家具, 文房具, その他');

    // テストカンパニーに属するテスト用アカウントを作成（存在する場合は再利用）
    const hashedPassword = await bcrypt.hash('test1234', 10);

    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        name: 'テストユーザー',
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: organization.id,
      },
      create: {
        name: 'テストユーザー',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: organization.id,
      },
    });

    console.log('✓ テスト用アカウントを作成しました:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    console.log('\n--- ログイン情報 ---');
    console.log('メール: test@example.com');
    console.log('パスワード: test1234');

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
