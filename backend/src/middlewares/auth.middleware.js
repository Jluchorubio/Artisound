import { verifyAccessToken } from '../utils/jwt.js';
import { query } from '../config/db.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);

    const rows = await query(
      `SELECT u.id, u.name, u.email, u.role_id, u.twofa_enabled, u.active, r.name AS role
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?
       LIMIT 1`,
      [userId],
    );

    const user = rows[0];

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Usuario no autorizado' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.role_id,
      role: user.role,
      twoFaEnabled: Boolean(user.twofa_enabled),
      active: Boolean(user.active),
    };

    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}
