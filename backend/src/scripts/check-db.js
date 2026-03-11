import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const connectTimeout = Number(process.env.DB_CONNECT_TIMEOUT_MS || 10_000);

if (!databaseUrl) {
  console.error('Falta DATABASE_URL en tu .env');
  process.exit(1);
}

const parsed = new URL(databaseUrl);
const host = parsed.hostname;
const port = Number(parsed.port || 3306);
const user = decodeURIComponent(parsed.username || '');
const database = parsed.pathname.replace('/', '') || '(sin DB en URL)';

console.log('Probando conexion MySQL...');
console.log(`- host: ${host}`);
console.log(`- port: ${port}`);
console.log(`- user: ${user || '(vacio)'}`);
console.log(`- database: ${database}`);
console.log(`- connectTimeout: ${connectTimeout}ms`);

try {
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname.replace('/', ''),
    connectTimeout,
  });

  const [[health]] = await connection.query('SELECT 1 AS ok');
  const [[version]] = await connection.query('SELECT VERSION() AS version');
  await connection.end();

  console.log('Conexion OK:', health);
  console.log('Version:', version?.version);
} catch (error) {
  console.error('Fallo conexion MySQL.');
  console.error(error);
  process.exit(1);
}

