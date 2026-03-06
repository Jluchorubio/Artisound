import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const professorEmail = process.env.PROFESSOR_EMAIL || 'profesor@artisound.com';
const professorPassword = process.env.PROFESSOR_PASSWORD || 'Profe1234!';
const studentEmail = process.env.STUDENT_EMAIL || 'joselu.rubio2008@gmail.com';
const studentPassword = process.env.STUDENT_PASSWORD || '12345678';

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

async function getRoleIdByName(roleName) {
  const [rows] = await connection.execute('SELECT id FROM roles WHERE name = ? LIMIT 1', [roleName]);
  return rows[0]?.id || null;
}

async function upsertUser({ name, email, plainPassword, roleId }) {
  if (!email || !plainPassword || !roleId) return;
  const passwordHash = await bcrypt.hash(plainPassword, 12);
  await connection.execute(
    `INSERT INTO users (name, email, password_hash, role_id)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       role_id = VALUES(role_id),
       active = TRUE`,
    [name, email, passwordHash, roleId],
  );
}

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

  const categoryColumnRows = await connection.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'courses' AND column_name = 'category'`,
  );
  const hasCategoryColumn = categoryColumnRows[0][0].total > 0;
  if (!hasCategoryColumn) {
    await connection.query("ALTER TABLE courses ADD COLUMN category ENUM('ARTE','MUSICA') NOT NULL DEFAULT 'ARTE' AFTER description");
  }

  const imageUrlColumnRows = await connection.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'courses' AND column_name = 'image_url'`,
  );
  const hasImageUrlColumn = imageUrlColumnRows[0][0].total > 0;
  if (!hasImageUrlColumn) {
    await connection.query('ALTER TABLE courses ADD COLUMN image_url VARCHAR(500) NULL AFTER category');
  }

  const statusColumnRows = await connection.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'courses' AND column_name = 'status'`,
  );
  const hasStatusColumn = statusColumnRows[0][0].total > 0;
  if (!hasStatusColumn) {
    await connection.query("ALTER TABLE courses ADD COLUMN status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'INACTIVE' AFTER total_classes");
  }

  await connection.query("UPDATE courses SET status = IF(published = TRUE, 'ACTIVE', 'INACTIVE') WHERE status IS NULL OR status = ''");
  await connection.query("UPDATE courses SET published = (status = 'ACTIVE')");

  const defaultRoles = ['ADMIN', 'PROFESOR', 'USUARIO'];
  for (const role of defaultRoles) {
    await connection.execute('INSERT IGNORE INTO roles (name) VALUES (?)', [role]);
  }

  const adminRoleId = await getRoleIdByName('ADMIN');
  const professorRoleId = await getRoleIdByName('PROFESOR');
  const userRoleId = await getRoleIdByName('USUARIO');

  await upsertUser({
    name: 'Administrador',
    email: adminEmail,
    plainPassword: adminPassword,
    roleId: adminRoleId,
  });

  await upsertUser({
    name: 'Profesor',
    email: professorEmail,
    plainPassword: professorPassword,
    roleId: professorRoleId,
  });

  await upsertUser({
    name: 'Usuario Demo',
    email: studentEmail,
    plainPassword: studentPassword,
    roleId: userRoleId,
  });

  console.log('Base de datos inicializada correctamente');
} finally {
  await connection.end();
}
