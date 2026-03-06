import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function StudentPage() {
  const { user, logout } = useAuth();
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
    return <p className="text-zinc-300">Cargando panel de estudiante...</p>;
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-[linear-gradient(140deg,#2a140b_0%,#131b30_60%,#090b16_100%)] p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Panel de usuario</p>
            <h1 className="mt-2 text-3xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Mis cursos</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <Link to="/estudiante" className="rounded-xl border border-cyan-200/40 bg-cyan-400/15 px-4 py-2 text-cyan-100 transition-all duration-300 hover:scale-105">
              Mis cursos
            </Link>
            <Link to="/dibujos" className="rounded-xl border border-emerald-200/40 bg-emerald-500/15 px-4 py-2 text-emerald-100 transition-all duration-300 hover:scale-105">
              Tu talento
            </Link>
            <Link to="/inicio" className="rounded-xl border border-amber-200/40 bg-amber-500/15 px-4 py-2 text-amber-100 transition-all duration-300 hover:scale-105">
              Dashboard
            </Link>
            <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-zinc-100">Bienvenido {user.name}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-red-500 px-4 py-2 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-red-600"
            >
              Cerrar sesion
            </button>
          </nav>
        </div>
        <p className="mt-3 text-zinc-200">Promedio general: {averageGrade ?? 'Sin calificaciones'}</p>
      </header>

      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      <section className="rounded-2xl border border-white/10 bg-[#0b152b] p-6 shadow-xl">
        <h2 className="mb-3 text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Cursos inscritos</h2>

        {enrollments.length === 0 ? (
          <p className="text-zinc-300">Aun no tienes cursos inscritos.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((course) => {
              const progress = progressMap[course.course_id];
              return (
                <article key={course.id} className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl">
                  <h3 className="text-lg font-bold text-white">{course.title}</h3>
                  <p className="mt-1 text-sm text-zinc-300">{course.description}</p>
                  <p className="mt-2 text-xs text-zinc-400">Profesor: {course.professor_name}</p>
                  <p className="mt-2 text-sm font-semibold text-cyan-300">
                    Progreso: {progress ? `${progress.progressPercent}% (${progress.completedClasses}/${progress.totalClasses})` : '...'}
                  </p>
                  <p className="text-sm text-zinc-200">Promedio curso: {progress?.averageGrade ?? 'Sin notas'}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#120d1f] p-6 shadow-xl">
        <h2 className="mb-3 text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Calificaciones por clase</h2>

        {grades.length === 0 ? (
          <p className="text-zinc-300">No hay calificaciones registradas.</p>
        ) : (
          <div className="space-y-3">
            {grades.map((grade) => (
              <article key={grade.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-400">{grade.course_title}</p>
                <h3 className="font-semibold text-white">{grade.class_title}</h3>
                <p className="text-sm text-zinc-200">Nota: {grade.grade}</p>
                {grade.feedback && <p className="text-sm text-zinc-300">Feedback: {grade.feedback}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
