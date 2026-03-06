import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import RebelHeader from '../components/RebelHeader';
import { useAuth } from '../context/AuthContext';

function CourseCard({ course, canEnroll, onEnroll, enrollingId, isEnrolled }) {
  const accentClass = course.category === 'MUSICA' ? 'border-l-blue-500' : 'border-l-yellow-400';

  return (
    <article className={`relative border border-white/10 border-l-4 ${accentClass} bg-[#1a1a1a] p-5 transition hover:bg-[#222]`}>
      <span className="absolute -top-3 left-3 bg-black px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
        {course.category === 'MUSICA' ? 'Music Lab' : 'Art Lab'}
      </span>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{course.total_classes} clases</p>
      <h3 className="mt-2 text-2xl font-black uppercase leading-tight">{course.title}</h3>
      <p className="mt-3 text-sm text-zinc-300">{course.description}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.12em] text-zinc-400">Profesor: {course.professor_name || 'Asignado'}</p>

      {canEnroll && (
        <button
          type="button"
          onClick={() => onEnroll(course.id)}
          disabled={enrollingId === course.id || isEnrolled}
          className={`mt-5 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition disabled:opacity-60 ${
            isEnrolled
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
              : 'bg-white text-black hover:-skew-x-6 hover:bg-yellow-300'
          }`}
        >
          {isEnrolled ? 'Inscrito' : enrollingId === course.id ? 'Inscribiendo...' : 'Inscribirme'}
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
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());

  const isStudent = user.role === 'USUARIO';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const coursesRes = await apiRequest('/courses');
        setCourses(coursesRes.courses || []);

        if (isStudent) {
          const enrollmentsRes = await apiRequest('/me/enrollments');
          setEnrolledCourseIds(new Set((enrollmentsRes.enrollments || []).map((item) => item.course_id)));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isStudent]);

  const onEnroll = async (courseId) => {
    if (enrolledCourseIds.has(courseId)) return;

    setError('');
    setMessage('');
    setEnrollingId(courseId);

    try {
      const response = await apiRequest(`/courses/${courseId}/enroll`, { method: 'POST' });
      setMessage(response.message || 'Inscripcion realizada');
      setEnrolledCourseIds((prev) => {
        const next = new Set(prev);
        next.add(courseId);
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <>
      <RebelHeader user={user} onLogout={logout} />

      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <section className="border border-white/10 bg-[#111] p-6 shadow-[14px_14px_0px_#facc15]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">Panel principal</p>
          <h1 className="mt-3 text-5xl font-black italic uppercase leading-none">
            Estado de
            <br />
            <span className="text-yellow-400">Operaciones</span>
          </h1>
          <p className="mt-4 text-zinc-300">Bienvenido {user.name} ({user.role}).</p>
        </section>

        {message && <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
        {error && <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-5 text-4xl font-black italic uppercase leading-none">
            Modulos
            <br />
            <span className="text-blue-500">Disponibles</span>
          </h2>

          {loading ? (
            <p className="text-zinc-300">Cargando cursos...</p>
          ) : courses.length === 0 ? (
            <p className="text-zinc-300">No hay cursos disponibles por ahora.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  canEnroll={isStudent}
                  onEnroll={onEnroll}
                  enrollingId={enrollingId}
                  isEnrolled={enrolledCourseIds.has(course.id)}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}
