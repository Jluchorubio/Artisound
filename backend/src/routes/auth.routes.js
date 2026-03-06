import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { z } from 'zod';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  signAccessToken,
  signEmailChallengeToken,
  verifyEmailChallengeToken,
} from '../utils/jwt.js';
import { maskEmail, sendEmailCode } from '../utils/mailer.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(64),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
});

const codeSchema = z.object({
  code: z.string().length(6),
});

const verifyEmailSchema = z.object({
  challengeToken: z.string().min(20),
  code: z.string().length(6),
});

const resendSchema = z.object({
  challengeToken: z.string().min(20),
});


function getPublicErrorMessage(error, fallbackMessage) {
  if (error?.message?.toLowerCase().includes('smtp')) {
    return error.message;
  }
  return fallbackMessage;
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getRoleHomePath(role) {
  if (role === 'ADMIN') return '/inicio';
  if (role === 'PROFESOR') return '/inicio';
  return '/inicio';
}

async function ensureRoles() {
  const roles = ['ADMIN', 'PROFESOR', 'USUARIO'];
  for (const roleName of roles) {
    await query('INSERT IGNORE INTO roles (name) VALUES (?)', [roleName]);
  }
}

async function getUserByEmail(email) {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role_id, u.twofa_secret, u.twofa_temp_secret,
            u.twofa_enabled, u.active, r.name AS role
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?
     LIMIT 1`,
    [email],
  );

  return rows[0] || null;
}

async function getUserById(userId) {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role_id, u.twofa_secret, u.twofa_temp_secret,
            u.twofa_enabled, u.active, r.name AS role
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
}

async function createEmailChallenge(user, purpose) {
  const code = generateCode();
  const codeHash = hashCode(code);

  await query('UPDATE email_verification_codes SET used_at = NOW() WHERE user_id = ? AND purpose = ? AND used_at IS NULL', [
    user.id,
    purpose,
  ]);

  await query(
    `INSERT INTO email_verification_codes (user_id, purpose, code_hash, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [user.id, purpose, codeHash, env.emailCodeExpiresMinutes],
  );

  const challengeToken = signEmailChallengeToken(user.id, purpose);

  const mailResult = await sendEmailCode({
    to: user.email,
    name: user.name,
    code,
    minutes: env.emailCodeExpiresMinutes,
  });

  return {
    requiresEmailVerification: true,
    challengeToken,
    maskedEmail: maskEmail(user.email),
    expiresInMinutes: env.emailCodeExpiresMinutes,
    emailDeliveryMode: mailResult.mode,
    debugCode: mailResult.debugCode || null,
    deliveryWarning: mailResult.warning || null,
  };
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    twoFaEnabled: Boolean(user.twofa_enabled),
  };
}

router.post('/register', async (req, res) => {
  try {
    await ensureRoles();

    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos', errors: parsed.error.issues });
    }

    const { name, email, password } = parsed.data;

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'El correo ya esta registrado' });
    }

    const roleRows = await query('SELECT id FROM roles WHERE name = ? LIMIT 1', ['USUARIO']);
    const userRole = roleRows[0];

    if (!userRole) {
      return res.status(500).json({ message: 'No se encontro el rol base USUARIO' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, userRole.id],
    );

    const user = await getUserById(result.insertId);
    const challenge = await createEmailChallenge(user, 'REGISTER');

    return res.status(201).json({
      message: 'Codigo enviado al correo para completar registro',
      ...challenge,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getPublicErrorMessage(error, 'Error interno del servidor') });
  }
});

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos', errors: parsed.error.issues });
    }

    const { email, password } = parsed.data;
    const user = await getUserByEmail(email);

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const challenge = await createEmailChallenge(user, 'LOGIN');

    return res.status(200).json({
      message: 'Codigo enviado al correo para iniciar sesion',
      ...challenge,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getPublicErrorMessage(error, 'Error interno del servidor') });
  }
});

router.post('/email/resend', async (req, res) => {
  try {
    const parsed = resendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Token de reto invalido' });
    }

    let payload;
    try {
      payload = verifyEmailChallengeToken(parsed.data.challengeToken);
    } catch {
      return res.status(401).json({ message: 'Token de reto invalido o expirado' });
    }

    if (!payload.emailChallenge || !payload.purpose) {
      return res.status(401).json({ message: 'Token de reto invalido' });
    }

    const user = await getUserById(Number(payload.sub));
    if (!user || !user.active) {
      return res.status(401).json({ message: 'Usuario no autorizado' });
    }

      const challenge = await createEmailChallenge(user, payload.purpose);

    return res.status(200).json({
      message: 'Nuevo codigo enviado al correo',
      ...challenge,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getPublicErrorMessage(error, 'No se pudo reenviar el codigo') });
  }
});

router.post('/email/verify', async (req, res) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos' });
    }

    let payload;
    try {
      payload = verifyEmailChallengeToken(parsed.data.challengeToken);
    } catch {
      return res.status(401).json({ message: 'Token de reto invalido o expirado' });
    }

    if (!payload.emailChallenge || !payload.purpose) {
      return res.status(401).json({ message: 'Token de reto invalido' });
    }

    const user = await getUserById(Number(payload.sub));
    if (!user || !user.active) {
      return res.status(401).json({ message: 'Usuario no autorizado' });
    }

    const rows = await query(
      `SELECT id, code_hash, expires_at
       FROM email_verification_codes
       WHERE user_id = ? AND purpose = ? AND used_at IS NULL
       ORDER BY id DESC
       LIMIT 1`,
      [user.id, payload.purpose],
    );

    const currentCode = rows[0];
    if (!currentCode) {
      return res.status(400).json({ message: 'No hay codigo activo para verificar' });
    }

    const isExpired = new Date(currentCode.expires_at).getTime() < Date.now();
    if (isExpired) {
      return res.status(400).json({ message: 'El codigo expiro. Solicita uno nuevo.' });
    }

    const expectedHash = hashCode(parsed.data.code);
    if (expectedHash !== currentCode.code_hash) {
      return res.status(401).json({ message: 'Codigo incorrecto' });
    }

    await query('UPDATE email_verification_codes SET used_at = NOW() WHERE id = ?', [currentCode.id]);
    const accessToken = signAccessToken(user);

    return res.status(200).json({
      message: 'Verificacion exitosa',
      accessToken,
      user: serializeUser(user),
      redirectTo: getRoleHomePath(user.role),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo verificar el codigo' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      twoFaEnabled: req.user.twoFaEnabled,
    },
  });
});

router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `Artisound (${req.user.email})`,
      issuer: 'Artisound',
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    await query('UPDATE users SET twofa_temp_secret = ? WHERE id = ?', [secret.base32, req.user.id]);

    return res.status(200).json({
      message: 'Escanea el QR y confirma con el codigo de 6 digitos',
      qrCodeDataUrl,
      manualKey: secret.base32,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo generar el codigo QR' });
  }
});

router.post('/2fa/enable', authenticate, async (req, res) => {
  try {
    const parsed = codeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Codigo invalido' });
    }

    const user = await getUserById(req.user.id);
    if (!user || !user.twofa_temp_secret) {
      return res.status(400).json({ message: 'Primero debes generar un secreto 2FA' });
    }

    const validCode = speakeasy.totp.verify({
      secret: user.twofa_temp_secret,
      encoding: 'base32',
      token: parsed.data.code,
      window: 1,
    });

    if (!validCode) {
      return res.status(401).json({ message: 'Codigo 2FA invalido' });
    }

    await query(
      'UPDATE users SET twofa_secret = ?, twofa_temp_secret = NULL, twofa_enabled = TRUE WHERE id = ?',
      [user.twofa_temp_secret, req.user.id],
    );

    return res.status(200).json({ message: '2FA activado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo activar 2FA' });
  }
});

router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const parsed = codeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Codigo invalido' });
    }

    const user = await getUserById(req.user.id);
    if (!user || !user.twofa_enabled || !user.twofa_secret) {
      return res.status(400).json({ message: '2FA no esta activo' });
    }

    const validCode = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token: parsed.data.code,
      window: 1,
    });

    if (!validCode) {
      return res.status(401).json({ message: 'Codigo 2FA invalido' });
    }

    await query('UPDATE users SET twofa_secret = NULL, twofa_temp_secret = NULL, twofa_enabled = FALSE WHERE id = ?', [
      req.user.id,
    ]);

    return res.status(200).json({ message: '2FA desactivado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo desactivar 2FA' });
  }
});

export default router;
