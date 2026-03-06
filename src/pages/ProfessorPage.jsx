import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

export default function ProfessorPage() {
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
    return <p className="text-slate-600">Cargando panel profesor...</p>;
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Panel profesor</h1>
          <Link to="/inicio" className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
            Volver al inicio
          </Link>
        </div>
      </header>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <section className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-slate-900">Tus cursos</h2>
        {courses.length === 0 ? (
          <p className="text-slate-600">No tienes cursos asignados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  selectedCourseId === course.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-800'
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
          <section className="rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-xl font-bold text-slate-900">Crear clase</h2>
            <form onSubmit={createClass} className="grid gap-3 md:grid-cols-2">
              <input
                placeholder="Titulo"
                value={classForm.title}
                onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                type="number"
                min={1}
                placeholder="Orden"
                value={classForm.classOrder}
                onChange={(e) => setClassForm({ ...classForm, classOrder: e.target.value })}
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                type="datetime-local"
                value={classForm.scheduledAt}
                onChange={(e) => setClassForm({ ...classForm, scheduledAt: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                type="number"
                min={1}
                value={classForm.durationMinutes}
                onChange={(e) => setClassForm({ ...classForm, durationMinutes: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <textarea
                placeholder="Descripcion o tematica"
                value={classForm.description}
                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
              />
              <button className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white md:col-span-2">
                Crear clase
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-xl font-bold text-slate-900">Clases del curso</h2>
            {classes.length === 0 ? (
              <p className="text-slate-600">No hay clases aun.</p>
            ) : (
              <div className="space-y-2">
                {classes.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm text-slate-500">Orden {item.class_order}</p>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-xl font-bold text-slate-900">Calificar estudiante</h2>
            <form onSubmit={submitGrade} className="grid gap-3 md:grid-cols-2">
              <select
                value={gradeForm.classId}
                onChange={(e) => setGradeForm({ ...gradeForm, classId: e.target.value })}
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Selecciona clase</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>

              <select
                value={gradeForm.studentId}
                onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}
                required
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Selecciona estudiante</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
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
                className="rounded-lg border border-slate-300 px-3 py-2"
              />

              <input
                placeholder="Feedback"
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />

              <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white md:col-span-2">
                Guardar calificacion
              </button>
            </form>
          </section>
        </>
      )}
    </section>
  );
}
