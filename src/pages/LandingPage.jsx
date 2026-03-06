import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomePathByRole } from '../utils/authRedirect';

const artGallery = [
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
];

const artCourses = [
  'Ilustracion editorial retro',
  'Pintura al oleo para galeria',
  'Composicion visual y narrativa',
];

const musicCourses = [
  'Guitarra moderna y fraseo',
  'Produccion musical en DAW',
  'Composicion y armonia aplicada',
];

const musicVideos = [
  {
    title: 'Sesion de guitarra: dinamica y expresion',
    description: 'Clase demostrativa con enfoque en tecnica y sensibilidad musical.',
    url: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
  },
  {
    title: 'Laboratorio de produccion musical',
    description: 'Workflow profesional para construir una cancion desde cero.',
    url: 'https://www.youtube.com/embed/60ItHLz5WEA',
  },
];

function SectionTag({ children, tone }) {
  const tones = {
    art: 'border-amber-500/40 bg-amber-100/70 text-amber-900',
    music: 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100',
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const dashboardTarget = user ? getHomePathByRole(user.role) : '/login';
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-[#09070a] text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <a href="#inicio" className="text-2xl font-black uppercase tracking-[0.18em] text-amber-200 [font-family:'Bebas_Neue',sans-serif]">
            Artisound
          </a>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-zinc-200 lg:flex">
            <a href="#inicio" className="transition-all duration-300 hover:text-amber-300">Inicio</a>
            <a href="#arte" className="transition-all duration-300 hover:text-amber-300">Arte</a>
            <a href="#musica" className="transition-all duration-300 hover:text-cyan-300">Musica</a>
            <a href="#programas" className="transition-all duration-300 hover:text-violet-300">Programas</a>
          </nav>

          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
                >
                  Iniciar sesion
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-bold text-black shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Registro
                </Link>
              </>
            ) : (
              <Link
                to={dashboardTarget}
                className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-2 text-sm font-bold text-black shadow-xl transition-all duration-300 hover:scale-105"
              >
                Ir a mi panel
              </Link>
            )}
          </div>
        </div>
      </header>

      <section
        id="inicio"
        className="relative flex min-h-screen items-center overflow-hidden px-4 pt-24"
        style={{
          backgroundImage:
            "linear-gradient(115deg, rgba(37,19,9,0.82) 0%, rgba(11,16,35,0.78) 45%, rgba(12,6,22,0.87) 100%), url('https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=2200&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.25),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.2),transparent_35%)]" />

        <div className="relative mx-auto w-full max-w-7xl py-16">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-200">Cursos de arte y musica</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] text-white md:text-7xl [font-family:'Bebas_Neue',sans-serif]">
            Academia de Musica y Arte
          </h1>
          <p className="mt-6 max-w-2xl text-base text-zinc-100 md:text-xl">
            Formacion creativa con enfoque profesional. Aprende a dominar herramientas artisticas y musicales con rutas practicas, docentes activos y proyectos reales.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#arte"
              className="rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-black shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Explorar Arte
            </a>
            <a
              href="#musica"
              className="rounded-xl border border-cyan-200/40 bg-cyan-400/10 px-7 py-4 text-sm font-bold uppercase tracking-wide text-cyan-100 shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Explorar Musica
            </a>
          </div>
        </div>
      </section>

      <section id="programas" className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block" />

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <article id="arte" className="bg-gradient-to-b from-[#f6e7d0] via-[#fff3e1] to-[#f4dcc0] px-5 py-14 text-[#29140f] md:px-10 md:py-20">
            <div className="mx-auto max-w-2xl">
              <SectionTag tone="art">Mundo Arte</SectionTag>
              <h2 className="mt-5 text-4xl font-black md:text-5xl [font-family:'Bebas_Neue',sans-serif]">Galeria y tecnica visual</h2>
              <p className="mt-4 text-base leading-relaxed text-[#5c3628] md:text-lg">
                Un entorno inspirado en museos y estudios de autor. Trabaja color, pincel, composicion y narrativa visual en cursos pensados para construir portafolio.
              </p>

              <div className="mt-8 columns-2 gap-3 md:columns-3">
                {artGallery.map((src, idx) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Muestra artistica ${idx + 1}`}
                    className="mb-3 w-full break-inside-avoid rounded-xl border border-amber-900/10 object-cover shadow-xl transition-all duration-300 hover:-translate-y-1"
                    loading="lazy"
                  />
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {artCourses.map((course) => (
                  <div key={course} className="rounded-xl border border-amber-900/20 bg-white/80 p-3 shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <p className="text-sm font-semibold text-[#5c3628]">{course}</p>
                  </div>
                ))}
              </div>

              <Link
                to={dashboardTarget}
                className="mt-8 inline-flex rounded-xl bg-[#2a120d] px-6 py-3 text-sm font-bold uppercase tracking-wide text-amber-100 shadow-xl transition-all duration-300 hover:bg-[#150905]"
              >
                Explorar cursos de arte
              </Link>
            </div>
          </article>

          <article id="musica" className="bg-[linear-gradient(180deg,#090f27_0%,#110c1e_50%,#05050a_100%)] px-5 py-14 md:px-10 md:py-20">
            <div className="mx-auto max-w-2xl">
              <SectionTag tone="music">Mundo Musica</SectionTag>
              <h2 className="mt-5 text-4xl font-black text-white md:text-5xl [font-family:'Bebas_Neue',sans-serif]">Escenario y produccion</h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-300 md:text-lg">
                Sonido con identidad: instrumento, tecnica, grabacion y mezcla en un plan formativo para artistas y productores con vision profesional.
              </p>

              <div className="mt-8 grid gap-4">
                {musicVideos.map((video) => (
                  <article
                    key={video.title}
                    className="rounded-xl border border-cyan-300/20 bg-white/[0.04] p-3 shadow-xl shadow-cyan-950/40 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
                      <iframe
                        src={video.url}
                        title={video.title}
                        className="h-full w-full"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-cyan-100">{video.title}</h3>
                    <p className="text-sm text-zinc-300">{video.description}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {musicCourses.map((course) => (
                  <div key={course} className="rounded-xl border border-white/15 bg-black/35 p-3 shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <p className="text-sm font-semibold text-cyan-100">{course}</p>
                  </div>
                ))}
              </div>

              <Link
                to={dashboardTarget}
                className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-cyan-300 to-violet-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-black shadow-xl transition-all duration-300 hover:scale-105"
              >
                Explorar cursos de musica
              </Link>
            </div>
          </article>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black px-4 py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
          <p>Artisound Academy</p>
          <p>Plataforma de cursos de arte y musica para estudiantes, profesores y artistas.</p>
          <p>{currentYear}</p>
        </div>
      </footer>
    </div>
  );
}
