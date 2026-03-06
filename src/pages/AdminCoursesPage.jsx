import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import RebelHeader from '../components/RebelHeader';
import { useAuth } from '../context/AuthContext';

export default function AdminCoursesPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'ARTE',
    imageUrl: '',
    professorId: '',
    published: true,
  });

  const loadData = async () => {
    setError('');

    const [usersResult, coursesResult] = await Promise.allSettled([apiRequest('/users'), apiRequest('/courses')]);

    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value.users || []);
    } else {
      setUsers([]);
      setError((prev) => (prev ? `${prev} | No se pudo listar profesores` : 'No se pudo listar profesores'));
    }

    if (coursesResult.status === 'fulfilled') {
      setCourses(coursesResult.value.courses || []);
    } else {
      setCourses([]);
      setError((prev) => (prev ? `${prev} | No se pudo listar cursos` : 'No se pudo listar cursos'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const professorOptions = users.filter((item) => item.role === 'PROFESOR' && item.active);

  const createCourse = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await apiRequest('/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          imageUrl: form.imageUrl || undefined,
          professorId: Number(form.professorId),
          published: Boolean(form.published),
        }),
      });

      setMessage('Curso creado');
      setForm({ title: '', description: '', category: 'ARTE', imageUrl: '', professorId: '', published: true });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteCourse = async (courseId) => {
    setError('');
    setMessage('');
    try {
      await apiRequest(`/courses/${courseId}`, { method: 'DELETE' });
      setMessage('Curso eliminado');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <RebelHeader user={user} onLogout={logout} />

      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <section className="border border-white/10 bg-[#111] p-6 shadow-[14px_14px_0px_#3b82f6]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">Administracion</p>
          <h1 className="mt-3 text-5xl font-black italic uppercase leading-none">
            Gestion de
            <br />
            <span className="text-blue-500">Cursos</span>
          </h1>
          <p className="mt-4 text-zinc-300">Crea cursos, asigna profesores y organiza la oferta academica.</p>
        </section>

        {error && <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {message && <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-4 text-3xl font-black uppercase italic">Crear curso</h2>
          <form onSubmit={createCourse} className="grid gap-3 md:grid-cols-2">
            <input
              placeholder="Titulo"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none md:col-span-2"
            />
            <textarea
              placeholder="Descripcion"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none md:col-span-2"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none"
            >
              <option value="ARTE" className="text-slate-900">Arte</option>
              <option value="MUSICA" className="text-slate-900">Musica</option>
            </select>
            <input
              placeholder="Imagen URL"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none"
            />
            <select
              value={form.professorId}
              onChange={(e) => setForm({ ...form, professorId: e.target.value })}
              required
              className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none"
            >
              <option value="" className="text-slate-900">Selecciona profesor</option>
              {professorOptions.map((prof) => (
                <option key={prof.id} value={prof.id} className="text-slate-900">
                  {prof.name} ({prof.email})
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 border border-white/20 bg-black/30 px-3 py-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Publicado
            </label>
            <button className="bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:-skew-x-6 hover:bg-blue-400 hover:text-white md:col-span-2">
              Crear
            </button>
          </form>
        </section>

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-4 text-3xl font-black uppercase italic">Cursos</h2>
          {courses.length === 0 ? (
            <p className="text-zinc-300">No hay cursos registrados.</p>
          ) : (
            <div className="space-y-2">
              {courses.map((course) => (
                <article key={course.id} className="flex flex-col gap-3 border border-white/10 bg-[#1a1a1a] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{course.title}</p>
                    <p className="text-xs text-zinc-300">Categoria: {course.category} · Profesor: {course.professor_name}</p>
                  </div>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="bg-rose-600 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:brightness-110"
                  >
                    Eliminar
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}
