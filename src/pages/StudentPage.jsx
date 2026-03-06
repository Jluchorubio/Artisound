import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [openNotesCourseId, setOpenNotesCourseId] = useState(null);
  const [openClassesCourseId, setOpenClassesCourseId] = useState(null);
  const [classesByCourse, setClassesByCourse] = useState({});
  const [loadingClassesCourseId, setLoadingClassesCourseId] = useState(null);
  const [completingClassId, setCompletingClassId] = useState(null);

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadData();

    const intervalId = setInterval(loadData, 20000);
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadData]);

  const gradesByCourse = useMemo(() => {
    const grouped = new Map();
    for (const grade of grades) {
      const key = grade.course_id;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(grade);
    }
    return grouped;
  }, [grades]);

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
      if (openNotesCourseId === courseId) {
        setOpenNotesCourseId(null);
      }
      if (openClassesCourseId === courseId) {
        setOpenClassesCourseId(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingCourseId(null);
    }
  };

  const toggleCourseClasses = async (courseId) => {
    setError('');
    if (openClassesCourseId === courseId) {
      setOpenClassesCourseId(null);
      return;
    }

    setOpenClassesCourseId(courseId);

    setLoadingClassesCourseId(courseId);
    try {
      const response = await apiRequest(`/courses/${courseId}/classes`);
      setClassesByCourse((prev) => ({ ...prev, [courseId]: response.classes || [] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingClassesCourseId(null);
    }
  };

  const completeClass = async (courseId, classId) => {
    setError('');
    setMessage('');
    setCompletingClassId(classId);

    try {
      const response = await apiRequest(`/classes/${classId}/complete`, { method: 'POST' });
      setMessage(response.message || 'Clase marcada como completada');
      const progress = await apiRequest(`/me/progress?courseId=${courseId}`);
      setProgressMap((prev) => ({ ...prev, [courseId]: progress }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCompletingClassId(null);
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
          <h1 className="mt-3 text-3xl md:text-5xl font-black italic uppercase leading-none">
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
                const notes = gradesByCourse.get(course.course_id) || [];
                const notesOpen = openNotesCourseId === course.course_id;
                const classesOpen = openClassesCourseId === course.course_id;
                const courseClasses = classesByCourse[course.course_id] || [];

                return (
                  <article key={course.id} className="border border-white/10 border-l-4 border-l-blue-500 bg-[#1a1a1a] p-4">
                    <h3 className="text-xl font-black uppercase">{course.title}</h3>
                    <p className="mt-1 text-sm text-zinc-300">{course.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-zinc-400">Profesor: {course.professor_name}</p>
                    <p className="mt-3 text-sm font-bold text-yellow-300">
                      Progreso: {progress ? `${progress.progressPercent}% (${progress.completedClasses}/${progress.totalClasses})` : '...'}
                    </p>
                    <p className="text-sm text-zinc-200">Promedio curso: {progress?.averageGrade ?? 'Sin notas'}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCourseClasses(course.course_id)}
                        className="border border-white/20 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:border-blue-400 hover:text-blue-300"
                      >
                        {classesOpen ? 'Ocultar clases' : 'Ver clases / entrar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenNotesCourseId(notesOpen ? null : course.course_id)}
                        className="border border-white/20 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:border-yellow-400 hover:text-yellow-300"
                      >
                        {notesOpen ? 'Ocultar notas' : 'Retroalimentacion / notas'}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeEnrollment(course.course_id)}
                        disabled={removingCourseId === course.course_id}
                        className="bg-rose-600 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:brightness-110 disabled:opacity-60"
                      >
                        {removingCourseId === course.course_id ? 'Quitando...' : 'Quitar inscripcion'}
                      </button>
                    </div>

                    {notesOpen && (
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                        {notes.length === 0 ? (
                          <p className="text-sm text-zinc-300">Aun no hay calificaciones ni feedback para este curso.</p>
                        ) : (
                          notes.map((note) => (
                            <article key={note.id} className="border border-white/10 bg-black/20 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{note.class_title}</p>
                              <p className="text-sm font-semibold text-yellow-300">Nota: {note.grade}</p>
                              <p className="text-sm text-zinc-200">Feedback: {note.feedback || 'Sin feedback'}</p>
                            </article>
                          ))
                        )}
                      </div>
                    )}

                    {classesOpen && (
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                        {loadingClassesCourseId === course.course_id ? (
                          <p className="text-sm text-zinc-300">Cargando clases...</p>
                        ) : courseClasses.length === 0 ? (
                          <p className="text-sm text-zinc-300">Este curso aun no tiene clases publicadas por el profesor.</p>
                        ) : (
                          courseClasses.map((item) => (
                            <article key={item.id} className="border border-white/10 bg-black/20 p-3">
                              <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Clase #{item.class_order}</p>
                              <p className="text-sm font-semibold text-white">{item.title}</p>
                              <p className="text-sm text-zinc-300">{item.description || 'Sin descripcion'}</p>
                              <p className="mt-1 text-xs text-zinc-400">
                                Duracion: {item.duration_minutes ? `${item.duration_minutes} min` : 'No definida'}
                              </p>
                              <button
                                type="button"
                                onClick={() => completeClass(course.course_id, item.id)}
                                disabled={completingClassId === item.id}
                                className="mt-3 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black transition hover:bg-yellow-300 disabled:opacity-60"
                              >
                                {completingClassId === item.id ? 'Guardando...' : 'Marcar completada'}
                              </button>
                            </article>
                          ))
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </>
  );
}

