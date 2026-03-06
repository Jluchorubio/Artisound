import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import RebelHeader from '../components/RebelHeader';
import { useAuth } from '../context/AuthContext';

export default function StudentPage() {
  const { user, logout } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [averageGrade, setAverageGrade] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [removingCourseId, setRemovingCourseId] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      setMessage('');

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

  const removeEnrollment = async (courseId) => {
    setError('');
    setMessage('');
    setRemovingCourseId(courseId);

    try {
      const response = await apiRequest(`/courses/${courseId}/enroll`, { method: 'DELETE' });
      setMessage(response.message || 'Inscripcion cancelada');
      setEnrollments((prev) => prev.filter((item) => item.course_id !== courseId));
      setProgressMap((prev) => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingCourseId(null);
    }
  };

  if (loading) {
    return (
      <>
        <RebelHeader user={user} onLogout={logout} />
        <p className="mx-auto max-w-7xl px-4 py-10 text-zinc-300">Cargando panel de estudiante...</p>
      </>
    );
  }

  return (
    <>
      <RebelHeader user={user} onLogout={logout} />

      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <section className="border border-white/10 bg-[#111] p-6 shadow-[14px_14px_0px_#facc15]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">Panel de usuario</p>
          <h1 className="mt-3 text-5xl font-black italic uppercase leading-none">
            Mis
            <br />
            <span className="text-yellow-400">Cursos</span>
          </h1>
          <p className="mt-4 text-zinc-300">Promedio general: {averageGrade ?? 'Sin calificaciones'}</p>
        </section>

        {message && <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
        {error && <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-4 text-3xl font-black uppercase italic">Cursos inscritos</h2>

          {enrollments.length === 0 ? (
            <p className="text-zinc-300">Aun no tienes cursos inscritos.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {enrollments.map((course) => {
                const progress = progressMap[course.course_id];
                return (
                  <article key={course.id} className="border border-white/10 border-l-4 border-l-blue-500 bg-[#1a1a1a] p-4">
                    <h3 className="text-xl font-black uppercase">{course.title}</h3>
                    <p className="mt-1 text-sm text-zinc-300">{course.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-zinc-400">Profesor: {course.professor_name}</p>
                    <p className="mt-3 text-sm font-bold text-yellow-300">
                      Progreso: {progress ? `${progress.progressPercent}% (${progress.completedClasses}/${progress.totalClasses})` : '...'}
                    </p>
                    <p className="text-sm text-zinc-200">Promedio curso: {progress?.averageGrade ?? 'Sin notas'}</p>
                    <button
                      type="button"
                      onClick={() => removeEnrollment(course.course_id)}
                      disabled={removingCourseId === course.course_id}
                      className="mt-4 bg-rose-600 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:brightness-110 disabled:opacity-60"
                    >
                      {removingCourseId === course.course_id ? 'Quitando...' : 'Quitar inscripcion'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-4 text-3xl font-black uppercase italic">Calificaciones por clase</h2>

          {grades.length === 0 ? (
            <p className="text-zinc-300">No hay calificaciones registradas.</p>
          ) : (
            <div className="space-y-3">
              {grades.map((grade) => (
                <article key={grade.id} className="border border-white/10 bg-[#1a1a1a] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{grade.course_title}</p>
                  <h3 className="text-lg font-bold text-white">{grade.class_title}</h3>
                  <p className="text-sm text-zinc-200">Nota: {grade.grade}</p>
                  {grade.feedback && <p className="text-sm text-zinc-300">Feedback: {grade.feedback}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}
