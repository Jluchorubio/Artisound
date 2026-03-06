import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

function CourseCard({ course, canEnroll, onEnroll, enrollingId }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full border border-cyan-200/40 bg-cyan-400/15 px-2 py-1 text-xs font-bold text-cyan-100">Curso</span>
        <span className="text-xs font-semibold text-zinc-300">{course.total_classes} clases</span>
      </div>
      <h3 className="text-lg font-bold text-white">{course.title}</h3>
      <p className="mt-2 text-sm text-zinc-300">{course.description}</p>
      <p className="mt-3 text-xs text-zinc-400">Profesor: {course.professor_name}</p>

      {canEnroll && (
        <button
          type="button"
          onClick={() => onEnroll(course.id)}
          disabled={enrollingId === course.id}
          className="mt-4 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-400 px-4 py-2 text-sm font-bold text-black transition-all duration-300 hover:scale-105 disabled:opacity-60"
        >
          {enrollingId === course.id ? 'Inscribiendo...' : 'Inscribirme'}
        </button>
      )}
    </article>
  );
}

export default function IndexPage() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);

  useEffect(() => {
    apiRequest('/courses')
      .then((res) => setCourses(res.courses || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const onEnroll = async (courseId) => {
    setError('');
    setMessage('');
    setEnrollingId(courseId);

    try {
      const response = await apiRequest(`/courses/${courseId}/enroll`, { method: 'POST' });
      setMessage(response.message || 'Inscripcion realizada');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnrollingId(null);
    }
  };

  const isStudent = user.role === 'USUARIO';
  const isProfessor = user.role === 'PROFESOR';
  const isAdmin = user.role === 'ADMIN';

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(140deg,#110d1e_0%,#0d182f_50%,#281409_100%)] p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Panel principal</p>
            <h1 className="mt-2 text-3xl font-black text-white [font-family:'Bebas_Neue',sans-serif] md:text-4xl">Artisound Academy</h1>
            <p className="mt-2 text-zinc-200">Bienvenido {user.name} ({user.role}).</p>
          </div>

          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            {isStudent && (
              <>
                <Link to="/estudiante" className="rounded-xl border border-cyan-200/40 bg-cyan-400/15 px-4 py-2 text-cyan-100 transition-all duration-300 hover:scale-105">
                  Mis cursos
                </Link>
                <Link to="/dibujos" className="rounded-xl border border-emerald-200/40 bg-emerald-500/15 px-4 py-2 text-emerald-100 transition-all duration-300 hover:scale-105">
                  Tu talento
                </Link>
                <Link to="/inicio" className="rounded-xl border border-amber-200/40 bg-amber-500/15 px-4 py-2 text-amber-100 transition-all duration-300 hover:scale-105">
                  Dashboard
                </Link>
              </>
            )}
            {isProfessor && (
              <>
                <Link to="/profesor" className="rounded-xl border border-indigo-200/40 bg-indigo-500/15 px-4 py-2 text-indigo-100 transition-all duration-300 hover:scale-105">
                  Mi panel
                </Link>
                <Link to="/dibujos" className="rounded-xl border border-cyan-200/40 bg-cyan-500/15 px-4 py-2 text-cyan-100 transition-all duration-300 hover:scale-105">
                  Tu talento
                </Link>
              </>
            )}
            {isAdmin && (
              <>
                <Link to="/admin/users" className="rounded-xl border border-violet-200/40 bg-violet-500/15 px-4 py-2 text-violet-100 transition-all duration-300 hover:scale-105">
                  Usuarios
                </Link>
                <Link to="/admin/cursos" className="rounded-xl border border-fuchsia-200/40 bg-fuchsia-500/15 px-4 py-2 text-fuchsia-100 transition-all duration-300 hover:scale-105">
                  Cursos
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-red-500 px-4 py-2 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-red-600"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

      {message && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      <section className="rounded-2xl border border-white/10 bg-[#0a1223] p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Cursos disponibles</h2>

        {loading ? (
          <p className="text-zinc-300">Cargando cursos...</p>
        ) : courses.length === 0 ? (
          <p className="text-zinc-300">No hay cursos disponibles por ahora.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                canEnroll={isStudent}
                onEnroll={onEnroll}
                enrollingId={enrollingId}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
