import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!databaseUrl) {
  throw new Error('DATABASE_URL es requerido');
}

const parsed = new URL(databaseUrl);
const dbName = parsed.pathname.replace('/', '') || 'artisound_db';

const rootUri = `${parsed.protocol}//${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}@${parsed.host}`;

const bootstrap = await mysql.createConnection({ uri: rootUri });
await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await bootstrap.end();

const schemaPath = path.resolve('backend/database/schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8').replace(/artisound_db/g, dbName);
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter(Boolean);

const connection = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

try {
  for (const statement of statements) {
    await connection.query(statement);
  }

  const nameColumnRows = await connection.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'roles' AND column_name = 'name'`,
  );
  const hasNameColumn = nameColumnRows[0][0].total > 0;

  if (!hasNameColumn) {
    const legacyColumnRows = await connection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'roles' AND column_name = 'nombre'`,
    );
    const hasLegacyColumn = legacyColumnRows[0][0].total > 0;

    if (hasLegacyColumn) {
      await connection.query('ALTER TABLE roles CHANGE nombre name VARCHAR(50) NOT NULL');
    }
  }

  const defaultRoles = ['ADMIN', 'PROFESOR', 'USUARIO'];
  for (const role of defaultRoles) {
    await connection.execute('INSERT IGNORE INTO roles (name) VALUES (?)', [role]);
  }

  if (adminEmail && adminPassword) {
    const [roleRows] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['ADMIN']);
    const adminRoleId = roleRows[0]?.id;

    if (adminRoleId) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await connection.execute(
        `INSERT INTO users (name, email, password_hash, role_id)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), active = TRUE`,
        ['Administrador', adminEmail, passwordHash, adminRoleId],
      );
    }
  }

  console.log('Base de datos inicializada correctamente');
} finally {
  await connection.end();
}
