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
    <div style="margin:0; padding:0; background:#0a0a0c; font-family:Inter,Segoe UI,Roboto,Arial,sans-serif; color:#f4f4f5;">
      <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        Codigo de verificacion Artisound: ${code}
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; background:#0a0a0c; padding:24px 0;">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; max-width:620px;">
              <tr>
                <td style="padding:0 0 14px 0;">
                  <p style="margin:0; font-size:30px; line-height:1; font-weight:900; font-style:italic; letter-spacing:-0.02em; color:#ffffff;">
                    AXM<span style="color:#facc15;">.</span>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background:#191919; border:1px solid #2a2a2d; box-shadow:10px 10px 0 #facc15; padding:28px 24px;">
                  <p style="margin:0 0 8px 0; font-size:10px; letter-spacing:0.22em; text-transform:uppercase; font-weight:800; color:#a1a1aa;">
                    Verificacion de identidad
                  </p>
                  <h1 style="margin:0 0 18px 0; font-size:36px; line-height:1; text-transform:uppercase; font-weight:900; font-style:italic; color:#ffffff;">
                    Acceso<br><span style="color:#facc15;">Restringido</span>
                  </h1>

                  <p style="margin:0 0 12px 0; font-size:16px; line-height:1.55; color:#f4f4f5;">
                    Hola ${name || 'usuario'},
                  </p>
                  <p style="margin:0 0 18px 0; font-size:15px; line-height:1.65; color:#d4d4d8;">
                    Detectamos un intento de acceso a tu cuenta de Artisound. Para autorizarlo, usa este codigo de seguridad:
                  </p>

                  <div style="margin:0 0 16px 0; padding:14px 16px; background:#09090b; border:1px solid #3f3f46;">
                    <p style="margin:0; font-size:36px; line-height:1; font-weight:900; letter-spacing:0.34em; color:#facc15;">
                      ${code}
                    </p>
                  </div>

                  <p style="margin:0 0 18px 0; font-size:14px; line-height:1.6; color:#d4d4d8;">
                    Este codigo es valido por <strong style="color:#ffffff;">${minutes} minutos</strong>.
                  </p>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin:0 0 20px 0;">
                    <tr>
                      <td style="padding:11px 14px; background:#111827; border-left:4px solid #3b82f6; color:#dbeafe; font-size:13px; line-height:1.5;">
                        Si no fuiste tu, cambia tu contrasena inmediatamente y revisa la actividad de tu cuenta.
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0; font-size:11px; line-height:1.55; letter-spacing:0.08em; text-transform:uppercase; color:#71717a;">
                    No compartas este codigo con nadie.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:16px 2px 0 2px; color:#71717a; font-size:12px; line-height:1.55;">
                  Mensaje automatico de seguridad de Artisound.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
