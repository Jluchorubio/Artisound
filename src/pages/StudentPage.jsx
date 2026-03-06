import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

export default function StudentPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [averageGrade, setAverageGrade] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [enrollRes, gradesRes] = await Promise.all([apiRequest('/me/enrollments'), apiRequest('/me/grades')]);

        setEnrollments(enrollRes.enrollments || []);
        setGrades(gradesRes.grades || []);
        setAverageGrade(gradesRes.averageGrade);

        const progressEntries = await Promise.all(
          (enrollRes.enrollments || []).map(async (item) => {
            const progress = await apiRequest(`/me/progress?courseId=${item.course_id}`);
            return [item.course_id, progress];
          }),
        );

        setProgressMap(Object.fromEntries(progressEntries));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <p className="text-slate-600">Cargando panel de estudiante...</p>;
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Panel de estudiante</h1>
          <Link to="/inicio" className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
            Volver al inicio
          </Link>
        </div>
        <p className="mt-2 text-slate-600">Promedio general: {averageGrade ?? 'Sin calificaciones'}</p>
      </header>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-slate-900">Mis cursos inscritos</h2>

        {enrollments.length === 0 ? (
          <p className="text-slate-600">Aun no tienes cursos inscritos.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((course) => {
              const progress = progressMap[course.course_id];
              return (
                <article key={course.id} className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{course.description}</p>
                  <p className="mt-2 text-xs text-slate-500">Profesor: {course.professor_name}</p>
                  <p className="mt-2 text-sm font-semibold text-cyan-700">
                    Progreso: {progress ? `${progress.progressPercent}% (${progress.completedClasses}/${progress.totalClasses})` : '...'}
                  </p>
                  <p className="text-sm text-slate-700">Promedio curso: {progress?.averageGrade ?? 'Sin notas'}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-slate-900">Calificaciones por clase</h2>

        {grades.length === 0 ? (
          <p className="text-slate-600">No hay calificaciones registradas.</p>
        ) : (
          <div className="space-y-3">
            {grades.map((grade) => (
              <article key={grade.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">{grade.course_title}</p>
                <h3 className="font-semibold text-slate-900">{grade.class_title}</h3>
                <p className="text-sm text-slate-700">Nota: {grade.grade}</p>
                {grade.feedback && <p className="text-sm text-slate-600">Feedback: {grade.feedback}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
