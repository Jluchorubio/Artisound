import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

const classSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().max(5000).optional(),
  scheduledAt: z.string().datetime().optional(),
  classOrder: z.number().int().positive(),
  durationMinutes: z.number().int().positive().optional(),
  topic: z.string().max(255).optional(),
});

async function getCourse(courseId) {
  const rows = await query('SELECT id, professor_id, status FROM courses WHERE id = ? LIMIT 1', [courseId]);
  return rows[0] || null;
}

async function syncCourseTotalClasses(courseId) {
  const rows = await query('SELECT COUNT(*) AS total FROM classes WHERE course_id = ?', [courseId]);
  const total = rows[0]?.total || 0;
  await query('UPDATE courses SET total_classes = ? WHERE id = ?', [total, courseId]);
}

function canManageClass(user, course) {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'PROFESOR' && course.professor_id === user.id) return true;
  return false;
}

async function canStudentViewCourseClasses(userId, courseId) {
  const rows = await query(
    `SELECT e.id
     FROM enrollments e
     WHERE e.user_id = ? AND e.course_id = ? AND e.status IN ('ACTIVE','COMPLETED')
     LIMIT 1`,
    [userId, courseId],
  );
  return Boolean(rows[0]);
}

router.get('/courses/:courseId/classes', authenticate, async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso invalido' });
    }

    const course = await getCourse(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    if (req.user.role === 'USUARIO') {
      if (course.status !== 'ACTIVE') {
        return res.status(403).json({ message: 'Curso inactivo' });
      }

      const enrolled = await canStudentViewCourseClasses(req.user.id, courseId);
      if (!enrolled) {
        return res.status(403).json({ message: 'Debes inscribirte al curso para ver sus clases' });
      }
    }

    if (req.user.role === 'PROFESOR' && course.professor_id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permisos para ver clases de este curso' });
    }

    const rows = await query(
      `SELECT id, course_id, professor_id, title, description, scheduled_at, class_order, duration_minutes, created_at
       FROM classes
       WHERE course_id = ?
       ORDER BY class_order ASC`,
      [courseId],
    );

    return res.status(200).json({ classes: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudieron obtener las clases' });
  }
});

router.post('/courses/:courseId/classes', authenticate, authorizeRoles('ADMIN', 'PROFESOR'), async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso invalido' });
    }

    const course = await getCourse(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    if (!canManageClass(req.user, course)) {
      return res.status(403).json({ message: 'No tienes permisos sobre este curso' });
    }

    const parsed = classSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos', errors: parsed.error.issues });
    }

    const { title, description = null, scheduledAt = null, classOrder, durationMinutes = null, topic = null } = parsed.data;

    const fullDescription = topic ? `${topic}\n\n${description || ''}`.trim() : description;

    const result = await query(
      `INSERT INTO classes (course_id, professor_id, title, description, scheduled_at, class_order, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [courseId, course.professor_id, title, fullDescription, scheduledAt, classOrder, durationMinutes],
    );

    await syncCourseTotalClasses(courseId);

    return res.status(201).json({ message: 'Clase creada', classId: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo crear la clase' });
  }
});

router.patch('/classes/:id', authenticate, authorizeRoles('ADMIN', 'PROFESOR'), async (req, res) => {
  try {
    const classId = Number(req.params.id);
    if (Number.isNaN(classId)) {
      return res.status(400).json({ message: 'ID de clase invalido' });
    }

    const classRows = await query('SELECT id, course_id FROM classes WHERE id = ? LIMIT 1', [classId]);
    const currentClass = classRows[0];

    if (!currentClass) {
      return res.status(404).json({ message: 'Clase no encontrada' });
    }

    const course = await getCourse(currentClass.course_id);
    if (!course || !canManageClass(req.user, course)) {
      return res.status(403).json({ message: 'No tienes permisos sobre esta clase' });
    }

    const parsed = classSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos', errors: parsed.error.issues });
    }

    const updates = parsed.data;
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
    if (updates.scheduledAt !== undefined) {
      fields.push('scheduled_at = ?');
      params.push(updates.scheduledAt);
    }
    if (updates.classOrder !== undefined) {
      fields.push('class_order = ?');
      params.push(updates.classOrder);
    }
    if (updates.durationMinutes !== undefined) {
      fields.push('duration_minutes = ?');
      params.push(updates.durationMinutes);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    params.push(classId);

    await query(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`, params);

    return res.status(200).json({ message: 'Clase actualizada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo actualizar la clase' });
  }
});

router.delete('/classes/:id', authenticate, authorizeRoles('ADMIN', 'PROFESOR'), async (req, res) => {
  try {
    const classId = Number(req.params.id);
    if (Number.isNaN(classId)) {
      return res.status(400).json({ message: 'ID de clase invalido' });
    }

    const classRows = await query('SELECT id, course_id FROM classes WHERE id = ? LIMIT 1', [classId]);
    const currentClass = classRows[0];

    if (!currentClass) {
      return res.status(404).json({ message: 'Clase no encontrada' });
    }

    const course = await getCourse(currentClass.course_id);
    if (!course || !canManageClass(req.user, course)) {
      return res.status(403).json({ message: 'No tienes permisos sobre esta clase' });
    }

    await query('DELETE FROM classes WHERE id = ?', [classId]);
    await syncCourseTotalClasses(currentClass.course_id);

    return res.status(200).json({ message: 'Clase eliminada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo eliminar la clase' });
  }
});

export default router;
