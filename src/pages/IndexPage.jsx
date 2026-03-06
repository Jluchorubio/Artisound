import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

function CourseCard({ course, canEnroll, onEnroll, enrollingId }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-800">Curso</span>
        <span className="text-xs font-semibold text-slate-500">{course.total_classes} clases</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{course.description}</p>
      <p className="mt-3 text-xs text-slate-500">Profesor: {course.professor_name}</p>

      {canEnroll && (
        <button
          type="button"
          onClick={() => onEnroll(course.id)}
          disabled={enrollingId === course.id}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
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
      <header className="rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Artisound Academy</h1>
            <p className="mt-2 text-slate-600">
              Academia digital de Musica y Artes. Bienvenido {user.name} ({user.role}).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isStudent && (
              <Link to="/estudiante" className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
                Mi progreso
              </Link>
            )}
            {isProfessor && (
              <Link to="/profesor" className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">
                Panel profesor
              </Link>
            )}
            {isAdmin && (
              <>
                <Link to="/admin/users" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
                  Usuarios
                </Link>
                <Link to="/admin/cursos" className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800">
                  Cursos
                </Link>
              </>
            )}
            <Link to="/dibujos" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Demuestra tu talento
            </Link>
            <Link to="/dashboard" className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300">
              Seguridad
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Cursos disponibles</h2>

        {loading ? (
          <p className="text-slate-600">Cargando cursos...</p>
        ) : courses.length === 0 ? (
          <p className="text-slate-600">No hay cursos disponibles por ahora.</p>
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

