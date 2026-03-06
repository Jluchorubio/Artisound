import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorizeRoles('ADMIN'), async (_req, res) => {
  try {
    const roles = await query('SELECT id, name, created_at, updated_at FROM roles ORDER BY id ASC');
    return res.status(200).json({ roles });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudieron obtener los roles' });
  }
});

export default router;
