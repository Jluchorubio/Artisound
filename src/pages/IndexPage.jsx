import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const featuredCourses = [
  {
    id: 1,
    area: 'Musica',
    title: 'Produccion Musical desde Cero',
    description: 'Fundamentos de ritmo, armonia y DAW para crear tus primeras pistas.',
    level: 'Basico',
  },
  {
    id: 2,
    area: 'Arte',
    title: 'Oleo y Teoria del Color',
    description: 'Combinacion de color, luces/sombras y tecnicas de pincel para retrato.',
    level: 'Intermedio',
  },
  {
    id: 3,
    area: 'Musica',
    title: 'Entrenamiento Auditivo Moderno',
    description: 'Reconocimiento de intervalos, acordes y progresiones para composicion.',
    level: 'Intermedio',
  },
  {
    id: 4,
    area: 'Arte',
    title: 'Composicion Artistica Avanzada',
    description: 'Estructura visual, balance y narrativa para piezas de alto impacto.',
    level: 'Avanzado',
  },
];

export default function IndexPage() {
  const { user, logout } = useAuth();

  return (
    <section className="rounded-2xl bg-white p-6 shadow-xl md:p-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Artisound Academy</h1>
          <p className="mt-2 text-slate-600">
            Plataforma de cursos de musica y artes con seguimiento de progreso y evaluaciones.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            Sesion: {user.name} ({user.role})
          </span>
          <Link to="/dashboard" className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
            Seguridad 2FA
          </Link>
          {user.role === 'ADMIN' && (
            <Link to="/admin/users" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
              Panel ADMIN
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Cerrar sesion
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {featuredCourses.map((course) => (
          <article key={course.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-800">{course.area}</span>
              <span className="text-xs font-semibold text-slate-500">{course.level}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{course.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{course.description}</p>
            <button className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Ver curso
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
