const crypto = require('node:crypto');
const path = require('node:path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: '餐饮', icon: 'food', color: '#F97316', sortOrder: 10 },
  { name: '交通', icon: 'transport', color: '#0EA5E9', sortOrder: 20 },
  { name: '购物', icon: 'shopping', color: '#EC4899', sortOrder: 30 },
  { name: '日用', icon: 'daily', color: '#14B8A6', sortOrder: 40 },
  { name: '住房', icon: 'house', color: '#8B5CF6', sortOrder: 50 },
  { name: '水电煤', icon: 'utilities', color: '#6366F1', sortOrder: 60 },
  { name: '娱乐', icon: 'entertainment', color: '#F59E0B', sortOrder: 70 },
  { name: '医疗', icon: 'medical', color: '#EF4444', sortOrder: 80 },
  { name: '学习', icon: 'study', color: '#22C55E', sortOrder: 90 },
  { name: '其他', icon: 'other', color: '#64748B', sortOrder: 100 },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: '工资', icon: 'salary', color: '#16A34A', sortOrder: 10 },
  { name: '奖金', icon: 'bonus', color: '#65A30D', sortOrder: 20 },
  { name: '报销', icon: 'reimburse', color: '#0891B2', sortOrder: 30 },
  { name: '转入', icon: 'transfer-in', color: '#2563EB', sortOrder: 40 },
  { name: '其他', icon: 'other', color: '#64748B', sortOrder: 50 },
];

function buildCategoryRows(userId) {
  const now = new Date();
  const expenseRows = DEFAULT_EXPENSE_CATEGORIES.map((item) => ({
    id: crypto.randomUUID().replace(/-/g, ''),
    userId,
    name: item.name,
    type: 'EXPENSE',
    icon: item.icon,
    color: item.color,
    sortOrder: item.sortOrder,
    isDefault: 1,
    isEnabled: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));

  const incomeRows = DEFAULT_INCOME_CATEGORIES.map((item) => ({
    id: crypto.randomUUID().replace(/-/g, ''),
    userId,
    name: item.name,
    type: 'INCOME',
    icon: item.icon,
    color: item.color,
    sortOrder: item.sortOrder,
    isDefault: 1,
    isEnabled: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));

  return [...expenseRows, ...incomeRows];
}

function getUserIdFromArgs() {
  const userIdArg = process.argv.find((arg) => arg.startsWith('--userId='));
  return userIdArg ? userIdArg.split('=')[1] : null;
}

async function fetchTargetUsers(connection, userId) {
  if (userId) {
    const [rows] = await connection.query(
      'SELECT id FROM `User` WHERE id = ? AND status = ?',
      [userId, 'ACTIVE'],
    );
    return rows;
  }

  const [rows] = await connection.query(
    'SELECT id FROM `User` WHERE status = ? ORDER BY createdAt ASC',
    ['ACTIVE'],
  );

  return rows;
}

async function upsertCategoriesForUser(connection, userId) {
  const rows = buildCategoryRows(userId);

  for (const row of rows) {
    await connection.query(
      `INSERT INTO \`Category\`
        (id, userId, name, type, icon, color, sortOrder, isDefault, isEnabled, createdAt, updatedAt, deletedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         icon = VALUES(icon),
         color = VALUES(color),
         sortOrder = VALUES(sortOrder),
         isDefault = VALUES(isDefault),
         isEnabled = VALUES(isEnabled),
         deletedAt = VALUES(deletedAt),
         updatedAt = VALUES(updatedAt)`,
      [
        row.id,
        row.userId,
        row.name,
        row.type,
        row.icon,
        row.color,
        row.sortOrder,
        row.isDefault,
        row.isEnabled,
        row.createdAt,
        row.updatedAt,
        row.deletedAt,
      ],
    );
  }

  return rows.length;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing in .env');
  }

  const connection = await mysql.createConnection(databaseUrl);

  try {
    const userId = getUserIdFromArgs();
    const users = await fetchTargetUsers(connection, userId);

    if (users.length === 0) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            message: userId
              ? `No active user found for userId=${userId}`
              : 'No active users found. Seed skipped.',
            insertedUsers: 0,
            insertedCategories: 0,
          },
          null,
          2,
        ),
      );
      return;
    }

    let insertedCategories = 0;

    for (const user of users) {
      insertedCategories += await upsertCategoriesForUser(connection, user.id);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          insertedUsers: users.length,
          insertedCategories,
          userIds: users.map((user) => user.id),
        },
        null,
        2,
      ),
    );
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
