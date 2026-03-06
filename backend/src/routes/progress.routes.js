import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

async function getCompletedClassIdsByCourse(userId, courseId) {
  const rows = await query(
    `SELECT p.class_id
     FROM progress p
     INNER JOIN classes cl ON cl.id = p.class_id
     WHERE cl.course_id = ? AND p.student_id = ?`,
    [courseId, userId],
  );

  return rows.map((row) => Number(row.class_id));
}

async function syncEnrollmentCompletion(userId, courseId) {
  const totalRows = await query('SELECT COUNT(*) AS total FROM classes WHERE course_id = ?', [courseId]);
  const totalClasses = totalRows[0]?.total || 0;

  const doneRows = await query(
    `SELECT COUNT(*) AS completed
     FROM progress p
     INNER JOIN classes cl ON cl.id = p.class_id
     WHERE cl.course_id = ? AND p.student_id = ?`,
    [courseId, userId],
  );
  const completedClasses = doneRows[0]?.completed || 0;

  const newStatus = totalClasses > 0 && completedClasses >= totalClasses ? 'COMPLETED' : 'ACTIVE';

  await query(
    `UPDATE enrollments
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND course_id = ? AND status IN ('ACTIVE','COMPLETED')`,
    [newStatus, userId, courseId],
  );

  return { totalClasses, completedClasses, progressPercent: totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0 };
}

router.post('/classes/:classId/complete', authenticate, authorizeRoles('USUARIO'), async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    if (Number.isNaN(classId)) {
      return res.status(400).json({ message: 'ID de clase invalido' });
    }

    const enrollmentRows = await query(
      `SELECT e.id, e.course_id
       FROM enrollments e
       INNER JOIN classes cl ON cl.course_id = e.course_id
       WHERE cl.id = ? AND e.user_id = ? AND e.status IN ('ACTIVE','COMPLETED')
       LIMIT 1`,
      [classId, req.user.id],
    );

    const enrollment = enrollmentRows[0];
    if (!enrollment) {
      return res.status(400).json({ message: 'No puedes completar esta clase porque no estas inscrito' });
    }

    await query(
      `INSERT INTO progress (class_id, student_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
      [classId, req.user.id],
    );

    const progressInfo = await syncEnrollmentCompletion(req.user.id, enrollment.course_id);
    const completedClassIds = await getCompletedClassIdsByCourse(req.user.id, enrollment.course_id);

    return res.status(200).json({
      message: 'Clase marcada como completada',
      ...progressInfo,
      completedClassIds,
    });
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
      'SELECT id, status FROM enrollments WHERE user_id = ? AND course_id = ? AND status IN (\'ACTIVE\',\'COMPLETED\') LIMIT 1',
      [req.user.id, courseId],
    );

    const enrollment = enrollmentRows[0];
    if (!enrollment) {
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
    const completedClassIds = await getCompletedClassIdsByCourse(req.user.id, courseId);

    return res.status(200).json({
      courseId,
      enrollmentStatus: enrollment.status,
      totalClasses,
      completedClasses,
      progressPercent,
      completedClassIds,
      averageGrade: avgRows[0]?.average_grade || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo calcular el progreso' });
  }
});

router.get('/me/overview', authenticate, authorizeRoles('USUARIO'), async (req, res) => {
  try {
    const rows = await query(
      `SELECT e.course_id, e.status, c.title, c.category, c.total_classes,
              COALESCE(pc.completed_classes, 0) AS completed_classes,
              CASE WHEN c.total_classes > 0
                   THEN ROUND((COALESCE(pc.completed_classes, 0) / c.total_classes) * 100)
                   ELSE 0
              END AS progress_percent,
              ga.average_grade
       FROM enrollments e
       INNER JOIN courses c ON c.id = e.course_id
       LEFT JOIN (
         SELECT cl.course_id, p.student_id, COUNT(*) AS completed_classes
         FROM progress p
         INNER JOIN classes cl ON cl.id = p.class_id
         GROUP BY cl.course_id, p.student_id
       ) pc ON pc.course_id = e.course_id AND pc.student_id = e.user_id
       LEFT JOIN (
         SELECT cl.course_id, g.student_id, ROUND(AVG(g.grade), 2) AS average_grade
         FROM grades g
         INNER JOIN classes cl ON cl.id = g.class_id
         GROUP BY cl.course_id, g.student_id
       ) ga ON ga.course_id = e.course_id AND ga.student_id = e.user_id
       WHERE e.user_id = ? AND e.status IN ('ACTIVE', 'COMPLETED')
       ORDER BY e.created_at DESC`,
      [req.user.id],
    );

    const activeCourses = rows.filter((item) => item.status === 'ACTIVE').length;
    const completedCourses = rows.filter((item) => item.status === 'COMPLETED').length;

    const withGrades = rows.filter((item) => item.average_grade !== null);
    const overallAverage = withGrades.length
      ? Number((withGrades.reduce((acc, item) => acc + Number(item.average_grade), 0) / withGrades.length).toFixed(2))
      : null;

    return res.status(200).json({
      summary: {
        enrolledCourses: rows.length,
        activeCourses,
        completedCourses,
        overallAverage,
      },
      courses: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo obtener el resumen del dashboard' });
  }
});

export default router;
