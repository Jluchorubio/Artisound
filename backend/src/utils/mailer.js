import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

if (env.smtpHost && env.smtpUser && env.smtpPass) {
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

export function getMailerStatus() {
  return {
    configured: Boolean(transporter),
    host: env.smtpHost || null,
    user: env.smtpUser || null,
    from: env.smtpFrom || null,
  };
}

export function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!local || !domain) return email;
  if (local.length <= 3) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export async function sendEmailCode({ to, name, code, minutes }) {
  const subject = 'Verificacion 2FA para acceso a tu cuenta de Artisound';
  const text = [
    `Hola ${name || 'usuario'},`,
    '',
    'Detectamos un intento de acceso a tu cuenta en Artisound.',
    'Para completar el inicio de sesion aplicamos la verificacion 2FA por correo.',
    '',
    `Tu codigo de verificacion es: ${code}`,
    `Este codigo es valido por ${minutes} minutos.`,
    '',
    'Si no fuiste tu, cambia tu contrasena inmediatamente.',
  ].join('\n');
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#111;">
      <h2 style="margin-bottom:8px;">Verificacion 2FA de Artisound</h2>
      <p>Hola ${name || 'usuario'},</p>
      <p>Detectamos un intento de acceso a tu cuenta. Para autorizarlo, aplicamos la verificacion en dos pasos (2FA).</p>
      <p style="margin:18px 0 8px;">Tu codigo de verificacion:</p>
      <div style="font-size:28px; font-weight:700; letter-spacing:6px; background:#f3f4f6; padding:12px 16px; width:max-content; border-radius:8px;">
        ${code}
      </div>
      <p style="margin-top:10px;">Este codigo es valido por <strong>${minutes} minutos</strong>.</p>
      <p>Si no fuiste tu, cambia tu contrasena inmediatamente.</p>
    </div>
  `;

  if (env.emailCodeLogToTerminal) {
    console.info(`[EMAIL CODE] to=${to} name="${name || 'usuario'}" code=${code} expiresIn=${minutes}m`);
  }

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.smtpFrom,
        to,
        subject,
        text,
        html,
      });
      return { delivered: true, mode: 'smtp-global' };
    } catch (error) {
      console.error('Fallo SMTP global:', error.message);
      if (env.nodeEnv !== 'production') {
        console.warn(`[DEBUG 2FA] para ${to}: codigo ${code}. Error SMTP: ${error.message}`);
        return {
          delivered: false,
          mode: 'debug',
          debugCode: code,
          warning: error.message,
        };
      }
      throw new Error(error.message || 'No se pudo enviar correo 2FA');
    }
  }

  if (env.nodeEnv !== 'production') {
    console.warn(`[DEBUG 2FA] para ${to}: codigo ${code}. Error SMTP: sin transporte SMTP`);
    return {
      delivered: false,
      mode: 'debug',
      debugCode: code,
      warning: 'SMTP global no configurado',
    };
  }

  throw new Error('SMTP global no configurado');
}
