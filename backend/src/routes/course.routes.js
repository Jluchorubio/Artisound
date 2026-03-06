import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

const courseSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().min(10).max(5000),
  professorId: z.number().int().positive(),
  published: z.boolean().optional(),
});

router.get('/', authenticate, async (req, res) => {
  try {
    const onlyPublished = req.user.role === 'USUARIO';

    const rows = await query(
      `SELECT c.id, c.title, c.description, c.professor_id, c.total_classes, c.published, c.created_at,
              u.name AS professor_name
       FROM courses c
       INNER JOIN users u ON u.id = c.professor_id
       ${onlyPublished ? 'WHERE c.published = TRUE' : ''}
       ORDER BY c.created_at DESC`,
    );

    return res.status(200).json({ courses: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo listar cursos' });
  }
});

router.get('/mine', authenticate, authorizeRoles('PROFESOR'), async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, title, description, professor_id, total_classes, published, created_at
       FROM courses
       WHERE professor_id = ?
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    return res.status(200).json({ courses: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudieron obtener tus cursos' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso invalido' });
    }

    const rows = await query(
      `SELECT c.id, c.title, c.description, c.professor_id, c.total_classes, c.published, c.created_at,
              u.name AS professor_name
       FROM courses c
       INNER JOIN users u ON u.id = c.professor_id
       WHERE c.id = ?
       LIMIT 1`,
      [courseId],
    );

    const course = rows[0];
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    if (req.user.role === 'USUARIO' && !course.published) {
      return res.status(403).json({ message: 'No autorizado para ver este curso' });
    }

    return res.status(200).json({ course });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo obtener el curso' });
  }
});

router.post('/', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const parsed = courseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos', errors: parsed.error.issues });
    }

    const { title, description, professorId, published = true } = parsed.data;

    const professorRows = await query(
      `SELECT u.id
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND r.name = 'PROFESOR' AND u.active = TRUE
       LIMIT 1`,
      [professorId],
    );

    if (!professorRows[0]) {
      return res.status(400).json({ message: 'El profesor asignado no es valido' });
    }

    const result = await query(
      `INSERT INTO courses (title, description, professor_id, total_classes, published)
       VALUES (?, ?, ?, 0, ?)`,
      [title, description, professorId, published],
    );

    return res.status(201).json({ message: 'Curso creado', courseId: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo crear el curso' });
  }
});

router.patch('/:id', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso invalido' });
    }

    const parsed = courseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos', errors: parsed.error.issues });
    }

    const updates = parsed.data;

    if (updates.professorId) {
      const professorRows = await query(
        `SELECT u.id
         FROM users u
         INNER JOIN roles r ON r.id = u.role_id
         WHERE u.id = ? AND r.name = 'PROFESOR' AND u.active = TRUE
         LIMIT 1`,
        [updates.professorId],
      );

      if (!professorRows[0]) {
        return res.status(400).json({ message: 'El profesor asignado no es valido' });
      }
    }

    const fields = [];
    const params = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      params.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description);
    }
    if (updates.professorId !== undefined) {
      fields.push('professor_id = ?');
      params.push(updates.professorId);
    }
    if (updates.published !== undefined) {
      fields.push('published = ?');
      params.push(updates.published);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    params.push(courseId);

    const result = await query(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    return res.status(200).json({ message: 'Curso actualizado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo actualizar el curso' });
  }
});

router.delete('/:id', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso invalido' });
    }

    const result = await query('DELETE FROM courses WHERE id = ?', [courseId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    return res.status(200).json({ message: 'Curso eliminado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo eliminar el curso' });
  }
});

export default router;
