import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminCoursesPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({ title: '', description: '', professorId: '', published: true });

  const loadData = async () => {
    try {
      const [usersRes, coursesRes] = await Promise.all([apiRequest('/users'), apiRequest('/courses')]);
      setUsers(usersRes.users || []);
      setCourses(coursesRes.courses || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const professorOptions = users.filter((item) => item.role === 'PROFESOR');

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
          professorId: Number(form.professorId),
          published: Boolean(form.published),
        }),
      });

      setMessage('Curso creado');
      setForm({ title: '', description: '', professorId: '', published: true });
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
    <section className="space-y-4">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(120deg,#1b0f31_0%,#101c37_50%,#2a1a09_100%)] shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(192,132,252,0.18),transparent_35%)]" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-fuchsia-200">Administracion</p>
              <h1 className="mt-2 text-4xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Gestion de cursos</h1>
              <p className="mt-2 text-zinc-200">Crea cursos, asigna profesores y organiza la oferta academica.</p>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <Link to="/inicio" className="rounded-xl border border-amber-200/35 bg-amber-500/15 px-4 py-2 text-amber-100 transition-all duration-300 hover:-translate-y-0.5">
                Dashboard
              </Link>
              <Link to="/admin/users" className="rounded-xl border border-violet-200/35 bg-violet-500/15 px-4 py-2 text-violet-100 transition-all duration-300 hover:-translate-y-0.5">
                Usuarios
              </Link>
              <Link to="/admin/cursos" className="rounded-xl border border-fuchsia-200/35 bg-fuchsia-500/20 px-4 py-2 text-fuchsia-100 transition-all duration-300 hover:-translate-y-0.5">
                Cursos
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

      <section className="rounded-2xl border border-white/10 bg-[#0d1225] p-6 shadow-xl">
        <h2 className="mb-3 text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Crear curso</h2>
        <form onSubmit={createCourse} className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="Titulo"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none transition-all duration-300 focus:border-fuchsia-300 md:col-span-2"
          />
          <textarea
            placeholder="Descripcion"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none transition-all duration-300 focus:border-fuchsia-300 md:col-span-2"
          />
          <select
            value={form.professorId}
            onChange={(e) => setForm({ ...form, professorId: e.target.value })}
            required
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none"
          >
            <option value="" className="text-slate-900">Selecciona profesor</option>
            {professorOptions.map((prof) => (
              <option key={prof.id} value={prof.id} className="text-slate-900">
                {prof.name} ({prof.email})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publicado
          </label>
          <button className="rounded-xl bg-gradient-to-r from-fuchsia-300 to-violet-500 px-4 py-2 text-sm font-bold text-black shadow-xl transition-all duration-300 hover:scale-105 md:col-span-2">
            Crear
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-xl">
        <h2 className="mb-3 text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Cursos</h2>
        {courses.length === 0 ? (
          <p className="text-zinc-300">No hay cursos registrados.</p>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <article key={course.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">{course.title}</p>
                  <p className="text-xs text-zinc-300">Profesor: {course.professor_name}</p>
                </div>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-red-600"
                >
                  Eliminar
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
