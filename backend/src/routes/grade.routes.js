import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

const gradeSchema = z.object({
  studentId: z.number().int().positive(),
  grade: z.number().min(1).max(100),
  feedback: z.string().max(2000).optional(),
});

async function canGradeClass(user, classId) {
  if (user.role === 'ADMIN') return true;
  if (user.role !== 'PROFESOR') return false;

  const rows = await query(
    `SELECT cl.id
     FROM classes cl
     INNER JOIN courses c ON c.id = cl.course_id
     WHERE cl.id = ? AND c.professor_id = ?
     LIMIT 1`,
    [classId, user.id],
  );

  return Boolean(rows[0]);
}

router.post('/classes/:classId/grades', authenticate, authorizeRoles('ADMIN', 'PROFESOR'), async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    if (Number.isNaN(classId)) {
      return res.status(400).json({ message: 'ID de clase invalido' });
    }

    const allowed = await canGradeClass(req.user, classId);
    if (!allowed) {
      return res.status(403).json({ message: 'No tienes permisos para calificar esta clase' });
    }

    const parsed = gradeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos', errors: parsed.error.issues });
    }

    const { studentId, grade, feedback = null } = parsed.data;

    const enrollmentRows = await query(
      `SELECT e.id
       FROM enrollments e
       INNER JOIN classes cl ON cl.course_id = e.course_id
       WHERE cl.id = ? AND e.user_id = ? AND e.status IN ('ACTIVE','COMPLETED')
       LIMIT 1`,
      [classId, studentId],
    );

    if (!enrollmentRows[0]) {
      return res.status(400).json({ message: 'El estudiante no pertenece a este curso' });
    }

    await query(
      `INSERT INTO grades (class_id, student_id, professor_id, grade, feedback)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE grade = VALUES(grade), feedback = VALUES(feedback), updated_at = CURRENT_TIMESTAMP`,
      [classId, studentId, req.user.id, grade, feedback],
    );

    return res.status(200).json({ message: 'Calificacion registrada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo registrar la calificacion' });
  }
});

router.get('/me/grades', authenticate, authorizeRoles('USUARIO'), async (req, res) => {
  try {
    const rows = await query(
      `SELECT g.id, g.grade, g.feedback, g.created_at,
              cl.id AS class_id, cl.title AS class_title,
              c.id AS course_id, c.title AS course_title
       FROM grades g
       INNER JOIN classes cl ON cl.id = g.class_id
       INNER JOIN courses c ON c.id = cl.course_id
       WHERE g.student_id = ?
       ORDER BY g.created_at DESC`,
      [req.user.id],
    );

    const avgRows = await query('SELECT ROUND(AVG(grade), 2) AS average_grade FROM grades WHERE student_id = ?', [req.user.id]);

    return res.status(200).json({
      grades: rows,
      averageGrade: avgRows[0]?.average_grade || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudieron obtener tus calificaciones' });
  }
});

export default router;
