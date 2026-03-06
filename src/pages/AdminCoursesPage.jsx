import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

export default function AdminCoursesPage() {
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

  const professorOptions = users.filter((user) => user.role === 'PROFESOR');

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
      <header className="rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Admin - Cursos</h1>
          <Link to="/inicio" className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
            Volver al inicio
          </Link>
        </div>
      </header>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <section className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-slate-900">Crear curso</h2>
        <form onSubmit={createCourse} className="grid gap-3">
          <input
            placeholder="Titulo"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <textarea
            placeholder="Descripcion"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <select
            value={form.professorId}
            onChange={(e) => setForm({ ...form, professorId: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Selecciona profesor</option>
            {professorOptions.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.name} ({prof.email})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publicado
          </label>
          <button className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white">Crear</button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-slate-900">Cursos</h2>
        {courses.length === 0 ? (
          <p className="text-slate-600">No hay cursos registrados.</p>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <article key={course.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{course.title}</p>
                  <p className="text-xs text-slate-600">Profesor: {course.professor_name}</p>
                </div>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
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
