import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [showClassWorkspace, setShowClassWorkspace] = useState(false);
  const classWorkspaceRef = useRef(null);

  const [classForm, setClassForm] = useState({
    title: '',
    classOrder: 1,
    plannedTotalClasses: '',
    scheduledAt: '',
    durationMinutes: 60,
    description: '',
  });

  const [gradeForm, setGradeForm] = useState({ classId: '', studentId: '', grade: '', feedback: '' });

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId],
  );

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      setError('');

      try {
        const res = await apiRequest('/courses/mine');
        const mine = res.courses || [];
        setCourses(mine);
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

      setError('');
      try {
        const [classesRes, studentsRes] = await Promise.all([
          apiRequest(`/courses/${selectedCourseId}/classes`),
          apiRequest(`/courses/${selectedCourseId}/students`),
        ]);
        setClasses(classesRes.classes || []);
        setStudents(studentsRes.students || []);
        setClassForm((prev) => ({ ...prev, classOrder: (classesRes.classes || []).length + 1 }));
      } catch (err) {
        setError(err.message);
      }
    }

    loadCourseData();
  }, [selectedCourseId]);

  useEffect(() => {
    if (!showClassWorkspace || !selectedCourseId) return;
    classWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showClassWorkspace, selectedCourseId]);

  const openClassesWorkspace = (courseId) => {
    setSelectedCourseId(courseId);
    setShowClassWorkspace(true);
  };

  const createClass = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await apiRequest(`/courses/${selectedCourseId}/classes`, {
        method: 'POST',
        body: JSON.stringify({
          title: classForm.title,
          description: classForm.description,
          classOrder: Number(classForm.classOrder),
          durationMinutes: Number(classForm.durationMinutes),
          scheduledAt: classForm.scheduledAt ? new Date(classForm.scheduledAt).toISOString() : undefined,
        }),
      });

      const classesRes = await apiRequest(`/courses/${selectedCourseId}/classes`);
      setClasses(classesRes.classes || []);

      setMessage('Clase creada correctamente');
      setClassForm({
        title: '',
        classOrder: (classesRes.classes || []).length + 1,
        plannedTotalClasses: classForm.plannedTotalClasses,
        scheduledAt: '',
        durationMinutes: 60,
        description: '',
      });
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
          <h1 className="mt-3 text-3xl md:text-5xl font-black italic uppercase leading-none">
            Cursos
            <br />
            <span className="text-blue-500">Asignados</span>
          </h1>
          <p className="mt-4 text-zinc-300">Solo veras los cursos donde fuiste asignado como profesor.</p>
        </section>

        {error && <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {message && <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-4 text-3xl font-black italic uppercase">Tus cursos</h2>
          {courses.length === 0 ? (
            <p className="text-zinc-300">No tienes cursos asignados.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => {
                const active = selectedCourseId === course.id;
                return (
                  <article
                    key={course.id}
                    className={`border border-white/10 bg-[#1a1a1a] p-4 ${active ? 'border-l-4 border-l-blue-500' : ''}`}
                  >
                    <h3 className="text-xl font-black uppercase">{course.title}</h3>
                    <p className="mt-2 text-sm text-zinc-300">{course.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.12em] text-zinc-400">
                      Total de clases del curso: {course.total_classes ?? 0}
                    </p>
                    <button
                      type="button"
                      onClick={() => openClassesWorkspace(course.id)}
                      className="mt-4 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black transition hover:-skew-x-6 hover:bg-blue-400 hover:text-white"
                    >
                      Clases
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {!showClassWorkspace && (
          <section className="border border-white/10 bg-[#121212] p-6">
            <p className="text-sm text-zinc-300">
              Selecciona un curso y presiona <strong className="text-white">Clases</strong> para abrir la vista de creacion y gestion de clase.
            </p>
          </section>
        )}

        {selectedCourse && showClassWorkspace && (
          <>
            <section ref={classWorkspaceRef} className="border border-white/10 bg-[#101010] p-6">
              <h2 className="mb-4 text-3xl md:text-5xl font-black italic uppercase leading-none">Crear clase</h2>
              <p className="mb-4 text-sm text-zinc-400">
                Curso activo: <strong className="text-zinc-200">{selectedCourse.title}</strong>
              </p>

              <form onSubmit={createClass} className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.1em] text-zinc-400">
                    Titulo de la clase (tematica)
                  </label>
                  <p className="mb-2 text-xs text-zinc-500">Escribe el nombre de la clase. Ejemplo: Bases de diseno.</p>
                  <input
                    placeholder="Ej: Bases de diseno"
                    value={classForm.title}
                    onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                    required
                    className="w-full border border-white/20 bg-black/30 px-3 py-3 text-white outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.1em] text-zinc-400">
                    Numero de clase en el curso
                  </label>
                  <p className="mb-2 text-xs text-zinc-500">Indica el orden de esta clase. Ejemplo: 1 (primera clase).</p>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ej: 1"
                    value={classForm.classOrder}
                    onChange={(e) => setClassForm({ ...classForm, classOrder: e.target.value })}
                    required
                    className="w-full border border-white/20 bg-black/30 px-3 py-3 text-white outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.1em] text-zinc-400">
                    Total estimado de clases del curso
                  </label>
                  <p className="mb-2 text-xs text-zinc-500">Cantidad total que planeas para este curso. Ejemplo: 12.</p>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ej: 12"
                    value={classForm.plannedTotalClasses}
                    onChange={(e) => setClassForm({ ...classForm, plannedTotalClasses: e.target.value })}
                    className="w-full border border-white/20 bg-black/30 px-3 py-3 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.1em] text-zinc-400">
                    Fecha y hora programada
                  </label>
                  <p className="mb-2 text-xs text-zinc-500">Cuando vas a dictar la clase (dia y hora).</p>
                  <input
                    type="datetime-local"
                    value={classForm.scheduledAt}
                    onChange={(e) => setClassForm({ ...classForm, scheduledAt: e.target.value })}
                    className="w-full border border-white/20 bg-black/30 px-3 py-3 text-white outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.1em] text-zinc-400">
                    Duracion de la clase (minutos)
                  </label>
                  <p className="mb-2 text-xs text-zinc-500">Escribe minutos. Ejemplo: 60 (si dura 1 hora), 90 (si dura 1h 30m).</p>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ej: 60"
                    value={classForm.durationMinutes}
                    onChange={(e) => setClassForm({ ...classForm, durationMinutes: e.target.value })}
                    className="w-full border border-white/20 bg-black/30 px-3 py-3 text-white outline-none focus:border-blue-400"
                  />
                </div>
                <div className="border border-white/20 bg-black/20 px-3 py-3 text-xs uppercase tracking-[0.1em] text-zinc-400">
                  Clases creadas en este curso: <span className="font-bold text-zinc-200">{classes.length}</span>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.1em] text-zinc-400">
                    Descripcion de la tematica
                  </label>
                  <p className="mb-2 text-xs text-zinc-500">
                    Explica objetivos, materiales, ejercicios y resultado esperado de la clase.
                  </p>
                  <textarea
                    placeholder="Ej: Veremos composicion basica, usaremos referencias visuales y cerraremos con ejercicio practico."
                    value={classForm.description}
                    onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    className="w-full border border-white/20 bg-black/30 px-3 py-3 text-white outline-none focus:border-blue-400"
                    rows={4}
                  />
                </div>

                <button className="bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:-skew-x-6 hover:bg-blue-400 hover:text-white md:col-span-2">
                  Crear clase
                </button>
              </form>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <section className="border border-white/10 bg-[#121212] p-6">
                <h3 className="mb-3 text-3xl font-black italic uppercase">Clases del curso</h3>
                {classes.length === 0 ? (
                  <p className="text-zinc-300">Aun no hay clases creadas en este curso.</p>
                ) : (
                  <div className="space-y-2">
                    {classes.map((item) => (
                      <article key={item.id} className="border border-white/10 bg-[#1a1a1a] p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Clase #{item.class_order}</p>
                        <p className="text-lg font-bold text-white">{item.title}</p>
                        <p className="text-sm text-zinc-300">{item.description || 'Sin descripcion'}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="border border-white/10 bg-[#121212] p-6">
                <h3 className="mb-3 text-3xl font-black italic uppercase">Estudiantes inscritos</h3>
                {students.length === 0 ? (
                  <p className="text-zinc-300">Nadie se ha inscrito aun en este curso.</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <article key={student.id} className="border border-white/10 bg-[#1a1a1a] p-3">
                        <p className="font-semibold text-white">{student.name}</p>
                        <p className="text-sm text-zinc-300">{student.email}</p>
                        <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">Estado: {student.status}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>

            <section className="border border-white/10 bg-[#101010] p-6">
              <h2 className="mb-4 text-3xl md:text-5xl font-black italic uppercase leading-none">Calificar estudiante</h2>
              <form onSubmit={submitGrade} className="grid gap-3">
                <select
                  value={gradeForm.classId}
                  onChange={(e) => setGradeForm({ ...gradeForm, classId: e.target.value })}
                  required
                  className="border border-white/20 bg-black/30 px-3 py-3 text-white outline-none"
                >
                  <option value="" className="text-slate-900">Selecciona clase</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id} className="text-slate-900">
                      Clase #{item.class_order} - {item.title}
                    </option>
                  ))}
                </select>

                <select
                  value={gradeForm.studentId}
                  onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}
                  required
                  className="border border-white/20 bg-black/30 px-3 py-3 text-white outline-none"
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
                  min={1}
                  max={100}
                  step="1"
                  placeholder="Nota del estudiante (1 a 100). Ej: 85"
                  value={gradeForm.grade}
                  onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                  required
                  className="border border-white/20 bg-black/30 px-3 py-3 text-white outline-none"
                />

                <input
                  placeholder="Feedback individual. Ej: buena composicion, mejorar contraste"
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  className="border border-white/20 bg-black/30 px-3 py-3 text-white outline-none"
                />

                <button className="bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:-skew-x-6 hover:bg-yellow-300">
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

