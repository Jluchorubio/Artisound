import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import RebelHeader from '../components/RebelHeader';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  title: '',
  description: '',
  category: 'ARTE',
  imageUrl: '',
  professorId: '',
  published: true,
};

export default function AdminCoursesPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingCourseId, setEditingCourseId] = useState(null);

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

  const resetForm = () => {
    setForm(initialForm);
    setEditingCourseId(null);
  };

  const submitCourse = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (editingCourseId) {
        const response = await apiRequest(`/courses/${editingCourseId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            category: form.category,
            imageUrl: form.imageUrl || undefined,
            professorId: Number(form.professorId),
            published: Boolean(form.published),
          }),
        });

        setMessage(response.message || 'Curso actualizado');
      } else {
        const response = await apiRequest('/courses', {
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

        setMessage(response.message || 'Curso creado');
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditCourse = (course) => {
    setError('');
    setMessage('');
    setEditingCourseId(course.id);
    setForm({
      title: course.title || '',
      description: course.description || '',
      category: course.category || 'ARTE',
      imageUrl: course.image_url || '',
      professorId: course.professor_id ? String(course.professor_id) : '',
      published: course.status === 'ACTIVE',
    });
  };

  const deleteCourse = async (courseId) => {
    setError('');
    setMessage('');
    try {
      await apiRequest(`/courses/${courseId}`, { method: 'DELETE' });
      setMessage('Curso eliminado');
      if (editingCourseId === courseId) {
        resetForm();
      }
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
          <h1 className="mt-3 text-3xl md:text-5xl font-black italic uppercase leading-none">
            Gestion de
            <br />
            <span className="text-blue-500">Cursos</span>
          </h1>
          <p className="mt-4 text-zinc-300">Administra cursos y define su visibilidad: Publico (usuarios/profesores) o Privado (solo profesores/admin).</p>
        </section>

        {error && <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {message && <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-4 text-3xl font-black uppercase italic">{editingCourseId ? 'Editar curso' : 'Crear curso'}</h2>
          <form onSubmit={submitCourse} className="grid gap-3 md:grid-cols-2">
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
            <select
              value={form.published ? 'PUBLIC' : 'PRIVATE'}
              onChange={(e) => setForm({ ...form, published: e.target.value === 'PUBLIC' })}
              className="border border-white/20 bg-black/30 px-3 py-2 text-white outline-none"
            >
              <option value="PUBLIC" className="text-slate-900">Publico (usuarios y profesores)</option>
              <option value="PRIVATE" className="text-slate-900">Privado (solo profesores/admin)</option>
            </select>

            <button className="bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:-skew-x-6 hover:bg-blue-400 hover:text-white md:col-span-2">
              {editingCourseId ? 'Guardar cambios' : 'Crear'}
            </button>

            {editingCourseId && (
              <button
                type="button"
                onClick={resetForm}
                className="border border-white/20 px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-zinc-100 transition hover:border-white/40 md:col-span-2"
              >
                Cancelar edicion
              </button>
            )}
          </form>
        </section>

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-4 text-3xl font-black uppercase italic">Cursos</h2>
          {courses.length === 0 ? (
            <p className="text-zinc-300">No hay cursos registrados.</p>
          ) : (
            <div className="space-y-2">
              {courses.map((course) => (
                <article key={course.id} className="flex flex-col gap-3 border border-white/10 bg-[#1a1a1a] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{course.title}</p>
                      <p className="text-xs text-zinc-300">Categoria: {course.category} · Profesor: {course.professor_name}</p>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${course.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-zinc-700 text-zinc-200'}`}>
                      {course.status === 'ACTIVE' ? 'Publico' : 'Privado'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startEditCourse(course)}
                      className="border border-white/20 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-blue-400 hover:text-blue-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="bg-rose-600 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:brightness-110"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}

