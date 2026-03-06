# Artisound - React + Tailwind + Express + MySQL

Stack actual del proyecto (sin ORM):

- Frontend: React + JavaScript + Tailwind CSS
- Backend: Node.js + Express
- Base de datos: MySQL
- Driver DB: mysql2
- Seguridad: JWT + 2FA TOTP (Google Authenticator)

## 1) Variables de entorno

Crea `.env` desde `.env.example` y ajusta:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_2FA_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `PROFESSOR_EMAIL`
- `PROFESSOR_PASSWORD`
- `STUDENT_EMAIL`
- `STUDENT_PASSWORD`

Ejemplo `DATABASE_URL`:

```env
DATABASE_URL="mysql://root:@localhost:3306/artisound_db"
```

## 2) Instalar dependencias

```bash
npm install
```

## 3) Inicializar base de datos

```bash
npm run db:init
```

Este comando ejecuta el SQL de [`backend/database/schema.sql`](backend/database/schema.sql), crea roles base y asegura usuarios iniciales.

Credenciales demo por defecto:

- Admin: `admin@artisound.com` / `Admin1234!`
- Profesor: `profesor@artisound.com` / `Profe1234!`
- Usuario: `joselu.rubio2008@gmail.com` / `12345678`

## 4) Ejecutar proyecto

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`

## 5) Endpoints implementados en esta etapa

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/2fa/verify-login`
- `GET /api/auth/me`
- `POST /api/auth/2fa/setup`
- `POST /api/auth/2fa/enable`
- `POST /api/auth/2fa/disable`
- `GET /api/users` (ADMIN)
- `PATCH /api/users/:id/role` (ADMIN)
- `GET /api/roles` (ADMIN)

## 6) Frontend actual

- `/login`
- `/register`
- `/dashboard`
- `/admin/users` (solo ADMIN)
