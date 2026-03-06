import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import RebelHeader from '../components/RebelHeader';
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
    return (
      <>
        <RebelHeader user={user} onLogout={logout} />
        <p className="mx-auto max-w-7xl px-4 py-10 text-zinc-300">Cargando panel profesor...</p>
      </>
    );
  }

  return (
    <>
      <RebelHeader user={user} onLogout={logout} />

      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <section className="border border-white/10 bg-[#111] p-6 shadow-[14px_14px_0px_#3b82f6]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">Seccion profesor</p>
          <h1 className="mt-3 text-5xl font-black italic uppercase leading-none">
            Control de
            <br />
            <span className="text-blue-500">Clases</span>
          </h1>
          <p className="mt-4 text-zinc-300">Administra contenido de cursos, clases y calificaciones.</p>
        </section>

        {error && <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {message && <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-3 text-3xl font-black uppercase italic">Tus cursos</h2>
          {courses.length === 0 ? (
            <p className="text-zinc-300">No tienes cursos asignados.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-[0.15em] transition ${
                    selectedCourseId === course.id
                      ? 'bg-yellow-400 text-black -skew-x-12'
                      : 'border border-white/20 text-zinc-100 hover:border-white/40'
                  }`}
                >
                  <span className="inline-block skew-x-12">{course.title}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedCourseId && (
          <>
            <section className="border border-white/10 bg-[#121212] p-6">
              <h2 className="mb-4 text-3xl font-black uppercase italic">Crear clase</h2>
              <form onSubmit={createClass} className="grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Titulo"
                  value={classForm.title}
                  onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                  required
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-blue-400"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Orden"
                  value={classForm.classOrder}
                  onChange={(e) => setClassForm({ ...classForm, classOrder: e.target.value })}
                  required
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-blue-400"
                />
                <input
                  type="datetime-local"
                  value={classForm.scheduledAt}
                  onChange={(e) => setClassForm({ ...classForm, scheduledAt: e.target.value })}
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-blue-400"
                />
                <input
                  type="number"
                  min={1}
                  value={classForm.durationMinutes}
                  onChange={(e) => setClassForm({ ...classForm, durationMinutes: e.target.value })}
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-blue-400"
                />
                <textarea
                  placeholder="Descripcion o tematica"
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-blue-400 md:col-span-2"
                />
                <button className="bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:-skew-x-6 hover:bg-blue-400 hover:text-white md:col-span-2">
                  Crear clase
                </button>
              </form>
            </section>

            <section className="border border-white/10 bg-[#121212] p-6">
              <h2 className="mb-4 text-3xl font-black uppercase italic">Clases del curso</h2>
              {classes.length === 0 ? (
                <p className="text-zinc-300">No hay clases aun.</p>
              ) : (
                <div className="space-y-2">
                  {classes.map((item) => (
                    <div key={item.id} className="border border-white/10 bg-[#1a1a1a] p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Orden {item.class_order}</p>
                      <p className="text-lg font-bold text-white">{item.title}</p>
                      <p className="text-sm text-zinc-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="border border-white/10 bg-[#121212] p-6">
              <h2 className="mb-4 text-3xl font-black uppercase italic">Calificar estudiante</h2>
              <form onSubmit={submitGrade} className="grid gap-3 md:grid-cols-2">
                <select
                  value={gradeForm.classId}
                  onChange={(e) => setGradeForm({ ...gradeForm, classId: e.target.value })}
                  required
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none"
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
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none"
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
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none"
                />

                <input
                  placeholder="Feedback"
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none"
                />

                <button className="bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:-skew-x-6 hover:bg-yellow-300 md:col-span-2">
                  Guardar calificacion
                </button>
              </form>
            </section>
          </>
        )}
      </section>
    </>
  );
}
