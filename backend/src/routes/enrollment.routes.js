import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

async function canViewCourseStudents(user, courseId) {
  if (user.role === 'ADMIN') return true;
  if (user.role !== 'PROFESOR') return false;

  const rows = await query('SELECT id FROM courses WHERE id = ? AND professor_id = ? LIMIT 1', [courseId, user.id]);
  return Boolean(rows[0]);
}

router.post('/courses/:courseId/enroll', authenticate, authorizeRoles('USUARIO'), async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso invalido' });
    }

    const courseRows = await query('SELECT id, status FROM courses WHERE id = ? LIMIT 1', [courseId]);
    const course = courseRows[0];

    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    if (course.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'El curso no esta disponible para inscripcion' });
    }

    await query(
      `INSERT INTO enrollments (user_id, course_id, status)
       VALUES (?, ?, 'ACTIVE')
       ON DUPLICATE KEY UPDATE status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, courseId],
    );

    return res.status(200).json({ message: 'Inscripcion exitosa' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo inscribir en el curso' });
  }
});

router.delete('/courses/:courseId/enroll', authenticate, authorizeRoles('USUARIO'), async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso invalido' });
    }

    const result = await query(
      `UPDATE enrollments
       SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND course_id = ? AND status IN ('ACTIVE','PAUSED','COMPLETED')`,
      [req.user.id, courseId],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'No tienes una inscripcion activa en este curso' });
    }

    return res.status(200).json({ message: 'Inscripcion cancelada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo cancelar la inscripcion' });
  }
});

router.get('/me/enrollments', authenticate, authorizeRoles('USUARIO'), async (req, res) => {
  try {
    const rows = await query(
      `SELECT e.id, e.course_id, e.status, e.created_at,
              c.title, c.description, c.total_classes,
              u.name AS professor_name
       FROM enrollments e
       INNER JOIN courses c ON c.id = e.course_id
       INNER JOIN users u ON u.id = c.professor_id
       WHERE e.user_id = ? AND e.status IN ('ACTIVE','COMPLETED')
       ORDER BY e.created_at DESC`,
      [req.user.id],
    );

    return res.status(200).json({ enrollments: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudieron obtener tus cursos inscritos' });
  }
});

router.get('/courses/:courseId/students', authenticate, authorizeRoles('ADMIN', 'PROFESOR'), async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso invalido' });
    }

    const allowed = await canViewCourseStudents(req.user, courseId);
    if (!allowed) {
      return res.status(403).json({ message: 'No tienes permisos para ver estudiantes de este curso' });
    }

    const rows = await query(
      `SELECT u.id, u.name, u.email, e.status, e.created_at
       FROM enrollments e
       INNER JOIN users u ON u.id = e.user_id
       WHERE e.course_id = ?
       ORDER BY e.created_at DESC`,
      [courseId],
    );

    return res.status(200).json({ students: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo obtener el listado de estudiantes' });
  }
});

export default router;
