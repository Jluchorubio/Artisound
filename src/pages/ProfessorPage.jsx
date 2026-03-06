import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProfessorPage() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [classForm, setClassForm] = useState({
    title: '',
    description: '',
    classOrder: 1,
    scheduledAt: '',
    durationMinutes: 60,
  });

  const [gradeForm, setGradeForm] = useState({ classId: '', studentId: '', grade: '', feedback: '' });

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      setError('');
      try {
        const res = await apiRequest('/courses/mine');
        setCourses(res.courses || []);
        if ((res.courses || []).length > 0) {
          setSelectedCourseId(res.courses[0].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  useEffect(() => {
    async function loadCourseData() {
      if (!selectedCourseId) return;
      try {
        const [classesRes, studentsRes] = await Promise.all([
          apiRequest(`/courses/${selectedCourseId}/classes`),
          apiRequest(`/courses/${selectedCourseId}/students`),
        ]);
        setClasses(classesRes.classes || []);
        setStudents(studentsRes.students || []);
      } catch (err) {
        setError(err.message);
      }
    }

    loadCourseData();
  }, [selectedCourseId]);

  const createClass = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await apiRequest(`/courses/${selectedCourseId}/classes`, {
        method: 'POST',
        body: JSON.stringify({
          ...classForm,
          classOrder: Number(classForm.classOrder),
          durationMinutes: Number(classForm.durationMinutes),
          scheduledAt: classForm.scheduledAt ? new Date(classForm.scheduledAt).toISOString() : undefined,
        }),
      });
      setMessage('Clase creada');
      setClassForm({ title: '', description: '', classOrder: classes.length + 1, scheduledAt: '', durationMinutes: 60 });
      const classesRes = await apiRequest(`/courses/${selectedCourseId}/classes`);
      setClasses(classesRes.classes || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitGrade = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await apiRequest(`/classes/${gradeForm.classId}/grades`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: Number(gradeForm.studentId),
          grade: Number(gradeForm.grade),
          feedback: gradeForm.feedback,
        }),
      });
      setMessage('Calificacion registrada');
      setGradeForm({ classId: '', studentId: '', grade: '', feedback: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p className="text-zinc-300">Cargando panel profesor...</p>;
  }

  return (
    <section className="space-y-5">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(120deg,#0b1327_0%,#121735_45%,#31140a_100%)] shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.22),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.16),transparent_35%)]" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Seccion Profesor</p>
              <h1 className="mt-2 text-4xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Control de clases y notas</h1>
              <p className="mt-2 text-zinc-200">Administra contenido de tus cursos, registra clases y evalua estudiantes.</p>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <Link to="/inicio" className="rounded-xl border border-amber-200/35 bg-amber-500/15 px-4 py-2 text-amber-100 transition-all duration-300 hover:-translate-y-0.5">
                Dashboard
              </Link>
              <Link to="/profesor" className="rounded-xl border border-indigo-200/35 bg-indigo-500/15 px-4 py-2 text-indigo-100 transition-all duration-300 hover:-translate-y-0.5">
                Mis clases
              </Link>
              <Link to="/dibujos" className="rounded-xl border border-cyan-200/35 bg-cyan-500/15 px-4 py-2 text-cyan-100 transition-all duration-300 hover:-translate-y-0.5">
                Tu talento
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
        </div>
      </header>

      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
      {message && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}

      <section className="rounded-2xl border border-white/10 bg-[#0b1225] p-6 shadow-xl">
        <h2 className="mb-3 text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Tus cursos</h2>
        {courses.length === 0 ? (
          <p className="text-zinc-300">No tienes cursos asignados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-300 ${
                  selectedCourseId === course.id
                    ? 'border border-cyan-300/40 bg-cyan-300/20 text-cyan-100'
                    : 'border border-white/10 bg-white/5 text-zinc-200 hover:border-white/30'
                }`}
              >
                {course.title}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedCourseId && (
        <>
          <section className="rounded-2xl border border-white/10 bg-[#101329] p-6 shadow-xl">
            <h2 className="mb-3 text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Crear clase</h2>
            <form onSubmit={createClass} className="grid gap-3 md:grid-cols-2">
              <input
                placeholder="Titulo"
                value={classForm.title}
                onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                required
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none transition-all duration-300 focus:border-cyan-300"
              />
              <input
                type="number"
                min={1}
                placeholder="Orden"
                value={classForm.classOrder}
                onChange={(e) => setClassForm({ ...classForm, classOrder: e.target.value })}
                required
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none transition-all duration-300 focus:border-cyan-300"
              />
              <input
                type="datetime-local"
                value={classForm.scheduledAt}
                onChange={(e) => setClassForm({ ...classForm, scheduledAt: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none transition-all duration-300 focus:border-cyan-300"
              />
              <input
                type="number"
                min={1}
                value={classForm.durationMinutes}
                onChange={(e) => setClassForm({ ...classForm, durationMinutes: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none transition-all duration-300 focus:border-cyan-300"
              />
              <textarea
                placeholder="Descripcion o tematica"
                value={classForm.description}
                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none transition-all duration-300 focus:border-cyan-300 md:col-span-2"
              />
              <button className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-2 text-sm font-bold text-black shadow-xl transition-all duration-300 hover:scale-105 md:col-span-2">
                Crear clase
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#120d1d] p-6 shadow-xl">
            <h2 className="mb-3 text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Clases del curso</h2>
            {classes.length === 0 ? (
              <p className="text-zinc-300">No hay clases aun.</p>
            ) : (
              <div className="space-y-2">
                {classes.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-sm text-zinc-400">Orden {item.class_order}</p>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-zinc-300">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-xl">
            <h2 className="mb-3 text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Calificar estudiante</h2>
            <form onSubmit={submitGrade} className="grid gap-3 md:grid-cols-2">
              <select
                value={gradeForm.classId}
                onChange={(e) => setGradeForm({ ...gradeForm, classId: e.target.value })}
                required
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none"
              >
                <option value="" className="text-slate-900">Selecciona clase</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id} className="text-slate-900">
                    {item.title}
                  </option>
                ))}
              </select>

              <select
                value={gradeForm.studentId}
                onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}
                required
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none"
              >
                <option value="" className="text-slate-900">Selecciona estudiante</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id} className="text-slate-900">
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="Nota"
                value={gradeForm.grade}
                onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                required
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none"
              />

              <input
                placeholder="Feedback"
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none"
              />

              <button className="rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-400 px-4 py-2 text-sm font-bold text-black shadow-xl transition-all duration-300 hover:scale-105 md:col-span-2">
                Guardar calificacion
              </button>
            </form>
          </section>
        </>
      )}
    </section>
  );
}
