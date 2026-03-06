import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

router.post('/classes/:classId/complete', authenticate, authorizeRoles('USUARIO'), async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    if (Number.isNaN(classId)) {
      return res.status(400).json({ message: 'ID de clase invalido' });
    }

    const enrollmentRows = await query(
      `SELECT e.id
       FROM enrollments e
       INNER JOIN classes cl ON cl.course_id = e.course_id
       WHERE cl.id = ? AND e.user_id = ? AND e.status IN ('ACTIVE','COMPLETED')
       LIMIT 1`,
      [classId, req.user.id],
    );

    if (!enrollmentRows[0]) {
      return res.status(400).json({ message: 'No puedes completar esta clase porque no estas inscrito' });
    }

    await query(
      `INSERT INTO progress (class_id, student_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
      [classId, req.user.id],
    );

    return res.status(200).json({ message: 'Clase marcada como completada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo marcar la clase como completada' });
  }
});

router.get('/me/progress', authenticate, authorizeRoles('USUARIO'), async (req, res) => {
  try {
    const courseId = Number(req.query.courseId);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ message: 'Debes enviar courseId en query params' });
    }

    const enrollmentRows = await query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status IN (\'ACTIVE\',\'COMPLETED\') LIMIT 1',
      [req.user.id, courseId],
    );

    if (!enrollmentRows[0]) {
      return res.status(403).json({ message: 'No estas inscrito en este curso' });
    }

    const totalRows = await query('SELECT COUNT(*) AS total FROM classes WHERE course_id = ?', [courseId]);
    const totalClasses = totalRows[0]?.total || 0;

    const doneRows = await query(
      `SELECT COUNT(*) AS completed
       FROM progress p
       INNER JOIN classes cl ON cl.id = p.class_id
       WHERE cl.course_id = ? AND p.student_id = ?`,
      [courseId, req.user.id],
    );
    const completedClasses = doneRows[0]?.completed || 0;

    const avgRows = await query(
      `SELECT ROUND(AVG(g.grade), 2) AS average_grade
       FROM grades g
       INNER JOIN classes cl ON cl.id = g.class_id
       WHERE cl.course_id = ? AND g.student_id = ?`,
      [courseId, req.user.id],
    );

    const progressPercent = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

    return res.status(200).json({
      courseId,
      totalClasses,
      completedClasses,
      progressPercent,
      averageGrade: avgRows[0]?.average_grade || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo calcular el progreso' });
  }
});

export default router;
