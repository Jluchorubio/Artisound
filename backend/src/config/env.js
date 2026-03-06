import dotenv from 'dotenv';

dotenv.config();

const requiredVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET'];

for (const envVar of requiredVars) {
  if (!process.env[envVar]) {
    throw new Error(`Falta la variable de entorno: ${envVar}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  frontendUrls: (process.env.FRONTEND_URLS || `${process.env.FRONTEND_URL || 'http://localhost:5173'},http://127.0.0.1:5173`)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
  jwtTwoFaSecret: process.env.JWT_2FA_SECRET || process.env.JWT_ACCESS_SECRET,
  jwtTwoFaExpiresIn: process.env.JWT_2FA_EXPIRES_IN || '5m',
  jwtEmailChallengeSecret: process.env.JWT_EMAIL_CHALLENGE_SECRET || process.env.JWT_2FA_SECRET || process.env.JWT_ACCESS_SECRET,
  jwtEmailChallengeExpiresIn: process.env.JWT_EMAIL_CHALLENGE_EXPIRES_IN || '10m',
  emailCodeExpiresMinutes: Number(process.env.EMAIL_CODE_EXPIRES_MINUTES || 10),
  emailCodeLogToTerminal:
    String(process.env.EMAIL_CODE_LOG_TO_TERMINAL || (process.env.NODE_ENV !== 'production' ? 'true' : 'false')) === 'true',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || 'false') === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || (process.env.SMTP_USER ? `Artisound <${process.env.SMTP_USER}>` : 'no-reply@artisound.local'),
};
