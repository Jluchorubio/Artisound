import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

const updateRoleSchema = z.object({
  roleName: z.enum(['ADMIN', 'PROFESOR', 'USUARIO']),
});

router.get('/', authenticate, authorizeRoles('ADMIN'), async (_req, res) => {
  try {
    const users = await query(
      `SELECT u.id, u.name, u.email, u.twofa_enabled, u.active, u.created_at, r.name AS role
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       ORDER BY u.created_at DESC`,
    );

    return res.status(200).json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFaEnabled: Boolean(user.twofa_enabled),
        active: Boolean(user.active),
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo listar usuarios' });
  }
});

router.patch('/:id/role', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Role inválido', errors: parsed.error.issues });
    }

    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const roleRows = await query('SELECT id, name FROM roles WHERE name = ? LIMIT 1', [parsed.data.roleName]);
    const role = roleRows[0];

    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    const result = await query('UPDATE users SET role_id = ? WHERE id = ?', [role.id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const userRows = await query(
      `SELECT u.id, u.name, u.email, r.name AS role
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?
       LIMIT 1`,
      [userId],
    );

    const updatedUser = userRows[0];

    return res.status(200).json({
      message: 'Rol actualizado correctamente',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo actualizar el rol' });
  }
});

export default router;
