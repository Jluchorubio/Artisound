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

Si usas PowerShell y te sale error de *ExecutionPolicy* con `npm`, usa `npm.cmd` o ejecuta los comandos desde CMD:

```bash
npm.cmd install
```

## 3) Inicializar base de datos

```bash
npm run db:init
```

Este comando ejecuta el SQL de [`backend/database/schema.sql`](backend/database/schema.sql), crea roles base y asegura usuarios iniciales.

Credenciales de prueba:

- Admin: `admin@artisound.com` / `Admin1234!`
- Profesor: `profesor@artisound.com` / `Profe1234!`
- Usuario: `joselu.rubio2008@gmail.com` / `12345678`

## 4) Ejecutar proyecto

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`

## Troubleshooting DB (ETIMEDOUT / ECONNREFUSED)

Si el backend muestra `Error: connect ETIMEDOUT` o `ECONNREFUSED`, el problema casi siempre es que MySQL/MariaDB no esta levantado o no esta escuchando en el puerto configurado.

1) Verifica que XAMPP -> **MySQL** este en **Running**.
2) Confirma que existe `C:\xampp\mysql\data` (en XAMPP esa carpeta es el `datadir`). Si solo tienes `data_old`, restaura el nombre a `data` o ajusta `datadir` en `C:\xampp\mysql\bin\my.ini` y reinicia MySQL.
3) Prueba la conexion desde el proyecto:

```bash
npm run db:check
```

## 5) Endpoints implementados en esta etapa

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/email/verify`
- `POST /api/auth/email/resend`
- `GET /api/auth/me`
- `POST /api/auth/2fa/setup`
- `POST /api/auth/2fa/enable`
- `POST /api/auth/2fa/disable`
- `GET /api/users` (ADMIN)
- `PATCH /api/users/:id/role` (ADMIN)
- `GET /api/roles` (ADMIN)
- `GET /api/courses/public`
- `GET /api/courses`
- `GET /api/courses/mine` (PROFESOR)
- `POST /api/courses` (ADMIN)
- `PATCH /api/courses/:id` (ADMIN)
- `DELETE /api/courses/:id` (ADMIN)
- `GET /api/courses/:courseId/classes`
- `POST /api/courses/:courseId/classes` (ADMIN, PROFESOR)
- `PATCH /api/classes/:id` (ADMIN, PROFESOR)
- `DELETE /api/classes/:id` (ADMIN, PROFESOR)
- `POST /api/courses/:courseId/enroll` (USUARIO)
- `DELETE /api/courses/:courseId/enroll` (USUARIO)
- `GET /api/me/enrollments` (USUARIO)
- `GET /api/courses/:courseId/students` (ADMIN, PROFESOR)
- `POST /api/classes/:classId/grades` (ADMIN, PROFESOR)
- `GET /api/me/grades` (USUARIO)
- `POST /api/classes/:classId/complete` (USUARIO)
- `GET /api/me/progress` (USUARIO)
- `GET /api/me/overview` (USUARIO)
- `POST /api/drawings` (autenticado)
- `PUT /api/drawings/:id` (autenticado)
- `GET /api/drawings/me` (autenticado)
- `DELETE /api/drawings/:id` (autenticado)
- `GET /api/health`

## 6) Frontend actual

- `/` (landing)
- `/login`
- `/register`
- `/redirect`
- `/inicio`
- `/estudiante` (USUARIO)
- `/profesor` (PROFESOR)
- `/dibujos`
- `/dashboard`
- `/admin/users` (solo ADMIN)
- `/admin/cursos` (solo ADMIN)

## 7) Flujo de inicio de sesion

1. El usuario envia correo + contrasena a `POST /api/auth/login`.
2. Si son validos, el backend envia codigo por correo y responde `challengeToken`.
3. El frontend valida ese codigo en `POST /api/auth/email/verify`.
4. Solo despues de verificar el codigo se entrega `accessToken` y se inicia sesion.
