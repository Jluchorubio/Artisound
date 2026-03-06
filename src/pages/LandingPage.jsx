import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import anime from 'animejs/lib/anime.es.js';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getHomePathByRole } from '../utils/authRedirect';

function getFallbackImage(category) {
  return category === 'MUSICA'
    ? 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1200'
    : 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&q=80&w=1200';
}

function getCardsPerView(width) {
  if (width >= 1280) return 3;
  if (width >= 768) return 2;
  return 1;
}

export default function LandingPage() {
  const { user } = useAuth();
  const dashboardTarget = user ? getHomePathByRole(user.role) : '/login';
  const isAuthenticated = Boolean(user);

  const heroRef = useRef(null);
  const artRef = useRef(null);
  const musicRef = useRef(null);
  const tapeRef = useRef(null);
  const currentYear = new Date().getFullYear();

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(() => (typeof window === 'undefined' ? 1 : getCardsPerView(window.innerWidth)));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    anime({
      targets: heroRef.current?.querySelectorAll('.axm-fade-in'),
      opacity: [0, 1],
      translateY: [30, 0],
      easing: 'easeOutExpo',
      duration: 900,
      delay: anime.stagger(120),
    });

    anime({
      targets: [artRef.current, musicRef.current],
      scale: [1.05, 1],
      opacity: [0.7, 1],
      easing: 'easeOutQuad',
      duration: 1200,
      delay: anime.stagger(180),
    });

    if (tapeRef.current) {
      anime({
        targets: tapeRef.current,
        translateX: ['0%', '-50%'],
        duration: 20000,
        easing: 'linear',
        loop: true,
      });
    }
  }, []);

  useEffect(() => {
    async function loadCourses() {
      setCoursesLoading(true);
      setCoursesError('');

      try {
        const response = await apiRequest(isAuthenticated ? '/courses' : '/courses/public?limit=3');
        setCourses(response.courses || []);
      } catch (error) {
        setCourses([]);
        setCoursesError(error.message || 'No se pudieron cargar los cursos');
      } finally {
        setCoursesLoading(false);
      }
    }

    loadCourses();
  }, [isAuthenticated]);

  useEffect(() => {
    const onResize = () => setCardsPerView(getCardsPerView(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setCarouselIndex(0);
  }, [isAuthenticated, cardsPerView, courses.length]);

  const courseStats = useMemo(() => {
    const artCount = courses.filter((course) => course.category === 'ARTE').length;
    const musicCount = courses.filter((course) => course.category === 'MUSICA').length;
    return { total: courses.length, artCount, musicCount };
  }, [courses]);

  const maxCarouselIndex = Math.max(0, courses.length - cardsPerView);

  const moveCarousel = (direction) => {
    setCarouselIndex((prev) => {
      if (direction === 'next') return prev >= maxCarouselIndex ? 0 : prev + 1;
      return prev <= 0 ? maxCarouselIndex : prev - 1;
    });
  };

  return (
    <div className="bg-[#0a0a0c] font-['Inter'] text-white">
      <header className="fixed inset-x-0 top-0 z-50 bg-black/55 px-3 py-3 backdrop-blur-lg md:px-10 md:py-6">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex items-center justify-between">
            <a href="#inicio" className="cursor-pointer text-2xl font-black italic tracking-tighter md:text-3xl">
              AXM<span className="text-yellow-400">.</span>
            </a>

            <nav className="hidden gap-10 text-xs font-bold uppercase tracking-widest md:flex">
              <a href="#inicio" className="transition hover:text-yellow-400">Explorar</a>
              <a href="#programas" className="transition hover:text-yellow-400">Programas</a>
              <a href="#footer" className="transition hover:text-yellow-400">Comunidad</a>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              {!user ? (
                <>
                  <Link to="/login" className="text-xs font-bold uppercase">Login</Link>
                  <Link
                    to="/register"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-xl font-bold text-black transition-all duration-300 hover:scale-110"
                  >
                    ?
                  </Link>
                </>
              ) : (
                <Link to={dashboardTarget} className="rounded-full bg-yellow-400 px-4 py-2 text-xs font-black uppercase text-black transition-all duration-300 hover:scale-105">
                  Mi panel
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center border border-white/20 text-white md:hidden"
              aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            >
              <span className="text-lg">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mt-3 space-y-2 border border-white/15 bg-black/80 p-3 md:hidden">
              <a href="#inicio" onClick={() => setMobileMenuOpen(false)} className="block border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em]">Explorar</a>
              <a href="#programas" onClick={() => setMobileMenuOpen(false)} className="block border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em]">Programas</a>
              <a href="#footer" onClick={() => setMobileMenuOpen(false)} className="block border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em]">Comunidad</a>
              {!user ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="border border-white/10 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em]">Login</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-yellow-400 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-black">Registro</Link>
                </div>
              ) : (
                <Link to={dashboardTarget} onClick={() => setMobileMenuOpen(false)} className="block bg-yellow-400 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-black">
                  Mi panel
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main>
        <section id="inicio" ref={heroRef} className="relative flex min-h-[90vh] w-full flex-col overflow-hidden md:h-[90vh] md:flex-row">
          <article
            ref={artRef}
            className="group relative flex min-h-[45vh] flex-1 flex-col justify-center border-r border-white/10 px-6 py-20 transition-all duration-500 hover:flex-[1.5] md:min-h-full md:px-14"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(10,10,12,1) 20%, rgba(10,10,12,.45)), url('https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=1200')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="axm-fade-in max-w-xl">
              <span className="mb-2 inline-block -rotate-2 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-black">Coleccion 2024</span>
              <h1 className="text-6xl font-black italic uppercase leading-none md:text-8xl">Arte<br /><span className="text-yellow-400">Urbano</span></h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed italic text-zinc-300">
                Expresa tu identidad a traves del color y la forma. De la calle a la galeria digital.
              </p>
              <a href="#comparacion" className="mt-8 inline-block border-[3px] border-white px-8 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 hover:border-yellow-500 hover:bg-yellow-500 hover:text-black">
                Empezar a Crear
              </a>
            </div>
          </article>

          <article
            ref={musicRef}
            className="group relative flex min-h-[45vh] flex-1 flex-col items-end justify-center px-6 py-20 text-right transition-all duration-500 hover:flex-[1.5] md:min-h-full md:px-14"
            style={{
              backgroundImage:
                "linear-gradient(to left, rgba(10,10,12,1) 20%, rgba(10,10,12,.45)), url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="axm-fade-in flex max-w-xl flex-col items-end">
              <span className="mb-2 inline-block -rotate-2 bg-blue-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">Sesiones En Vivo</span>
              <h1 className="text-6xl font-black italic uppercase leading-none md:text-8xl">Music<br /><span className="text-blue-500">Lab</span></h1>
              <p className="mt-6 max-w-lg text-right text-lg leading-relaxed italic text-zinc-300">
                Sonidos que rompen el silencio. Produccion, mezcla y el espiritu del rock en tus manos.
              </p>
              <a href="#comparacion" className="mt-8 inline-block border-[3px] border-white px-8 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 hover:border-blue-500 hover:bg-blue-500 hover:text-white">
                Encender Amplis
              </a>
            </div>
          </article>
        </section>

        <section className="relative overflow-hidden bg-black px-4 py-20 md:px-10 md:py-24">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
            <div className="relative h-[320px] md:h-[520px]">
              <div
                className="absolute left-6 top-6 h-[88%] w-[88%] rotate-[-3deg] border-[10px] border-[#ffb000] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "linear-gradient(to top, rgba(0,0,0,.35), rgba(0,0,0,.1)), url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=1200')",
                }}
              />
              <div
                className="absolute left-0 top-0 h-[88%] w-[88%] rotate-[-3deg] border-[10px] border-[#2f3138] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "linear-gradient(to top, rgba(0,0,0,.5), rgba(0,0,0,.18)), url('https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1200')",
                }}
              />
            </div>

            <div className="relative">
              <div className="absolute -right-8 top-2 h-40 w-40 rounded-full bg-blue-600/85 md:h-72 md:w-72" />
              <div className="relative z-10 max-w-2xl rounded-[40%_60%_55%_45%_/_42%_38%_62%_58%] bg-[#e8e8e8] px-8 py-10 text-black shadow-2xl md:px-12 md:py-12">
                <h2 className="text-4xl font-black uppercase italic leading-none md:text-6xl">Quienes<br />Somos?</h2>
                <p className="mt-5 text-base leading-relaxed md:text-xl md:leading-[1.5]">
                  Somos un colectivo de mentes inquietas, rebeldes y apasionadas que creen que la educacion no debe ser aburrida.
                  Nuestra mision es fusionar la tecnica clasica con la rebeldia del arte callejero y la potencia de la musica moderna,
                  para transformar el aprendizaje en una experiencia creativa, cercana y profesional.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-xs font-black uppercase tracking-wider text-white md:text-sm">
                  <span className="bg-black px-3 py-1">Creatividad</span>
                  <span className="bg-black px-3 py-1">Revolucion</span>
                  <span className="bg-black px-3 py-1">Talento</span>
                </div>
              </div>
              <div className="absolute bottom-[-28px] right-[42px] h-16 w-16 rounded-full bg-[#e8e8e8] md:bottom-[-54px] md:h-24 md:w-24" />
            </div>
          </div>
        </section>

        <section id="comparacion" className="relative min-h-[120vh] overflow-hidden bg-[#090b12] px-4 py-14 md:px-10 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_35%)]" />

          <div className="relative z-30 mx-auto flex min-h-[78vh] max-w-7xl flex-col gap-8 md:min-h-[920px] md:block">
            <article className="rounded-2xl border border-white/10 bg-black/85 p-6 shadow-2xl md:absolute md:left-0 md:top-0 md:w-[46%]">
              <div
                className="h-64 w-full rounded-xl border border-white/20 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1525201548112-c7b60203d7fe?q=80&w=1200')",
                }}
              />
              <div className="mt-5">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-blue-400">Guitar Master Class</p>
                <h3 className="font-['Permanent_Marker'] text-3xl uppercase">La musica es la pasion mas grande</h3>
                <p className="mt-3 text-zinc-300">
                  Metodologia enfocada en tecnica, improvisacion y performance en vivo. Cada modulo combina practica guiada,
                  retroalimentacion de profesores y retos semanales para acelerar tu progreso.
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/85 p-6 shadow-2xl md:absolute md:bottom-0 md:right-0 md:w-[48%]">
              <div
                className="h-64 w-full rounded-xl border border-white/20 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1200')",
                }}
              />
              <div className="mt-5 text-right">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-yellow-400">Contemporary Art Lab</p>
                <h3 className="font-['Permanent_Marker'] text-3xl uppercase">El arte es la forma pura de la expresion humana</h3>
                <p className="mt-3 text-zinc-300">
                  Programa intensivo de composicion, color y narrativa visual. Desarrolla proyectos de portafolio con enfoque
                  editorial y acompanamiento profesional desde boceto hasta entrega final.
                </p>
              </div>
            </article>
          </div>

          <div className="pointer-events-none absolute left-[-12%] top-1/2 z-10 flex h-20 w-[145%] -translate-y-1/2 -rotate-[13deg] items-center overflow-hidden border-y-4 border-black bg-[#ffd700] shadow-[0_0_60px_rgba(0,0,0,1)] md:h-28">
            <div ref={tapeRef} className="flex whitespace-nowrap">
              <span className="px-12 text-2xl font-black uppercase text-black md:text-4xl">Musica vs Arte // Musica vs Arte // Musica vs Arte //</span>
              <span className="px-12 text-2xl font-black uppercase text-black md:text-4xl">Musica vs Arte // Musica vs Arte // Musica vs Arte //</span>
              <span className="px-12 text-2xl font-black uppercase text-black md:text-4xl">Musica vs Arte // Musica vs Arte // Musica vs Arte //</span>
            </div>
          </div>
        </section>

        <section
          id="programas"
          className="relative bg-cover bg-center bg-fixed px-4 py-24 md:px-10"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1541944743827-e04bb645f946?q=80&w=1500')",
          }}
        >
          <div className="absolute inset-0 bg-black/75" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-5xl font-black italic uppercase tracking-tighter md:text-6xl">Nuestros <span className="text-yellow-400">Programas</span></h2>
                <p className="mt-4 max-w-3xl text-zinc-300">
                  {!isAuthenticated
                    ? 'Vista previa del catalogo con 3 cursos destacados. Inicia sesion para desbloquear el carrusel completo con todos los cursos de la academia.'
                    : 'Catalogo completo en carrusel, actualizado en tiempo real con la base de datos para mostrar todos los cursos de arte y musica.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-widest">
                  <span className="rounded-full border border-yellow-400/50 bg-yellow-400/10 px-3 py-1 text-yellow-300">Arte: {courseStats.artCount}</span>
                  <span className="rounded-full border border-blue-400/50 bg-blue-400/10 px-3 py-1 text-blue-300">Musica: {courseStats.musicCount}</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-zinc-200">Total: {courseStats.total}</span>
                </div>
              </div>

              <Link
                to={dashboardTarget}
                className="w-fit border-[3px] border-white px-8 py-3 text-sm font-black uppercase tracking-wider transition-all duration-300 hover:bg-white hover:text-black"
              >
                Ver catalogo completo
              </Link>
            </div>

            {coursesLoading ? (
              <p className="rounded-xl border border-white/15 bg-black/30 p-4 text-zinc-200">Cargando cursos...</p>
            ) : coursesError ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{coursesError}</p>
            ) : courses.length === 0 ? (
              <p className="rounded-xl border border-white/15 bg-black/30 p-4 text-zinc-200">No hay cursos disponibles por ahora.</p>
            ) : (
              <div className="space-y-5">
                {isAuthenticated && courses.length > cardsPerView && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => moveCarousel('prev')}
                      className="rounded-full border border-white/30 px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:bg-white hover:text-black"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCarousel('next')}
                      className="rounded-full border border-white/30 px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:bg-white hover:text-black"
                    >
                      Siguiente
                    </button>
                  </div>
                )}

                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500"
                    style={{ transform: `translateX(-${(carouselIndex * 100) / cardsPerView}%)` }}
                  >
                    {courses.map((course) => (
                      <div key={course.id} style={{ width: `${100 / cardsPerView}%` }} className="shrink-0 p-2">
                        <article className="overflow-hidden rounded-2xl border border-white/15 bg-black/45 shadow-xl backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:border-yellow-400/60">
                          <div
                            className="h-44 w-full bg-cover bg-center"
                            style={{
                              backgroundImage: `linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,.1)), url('${course.image_url || getFallbackImage(course.category)}')`,
                            }}
                          />
                          <div className="p-5">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <span className={`text-xs font-black uppercase tracking-widest ${course.category === 'MUSICA' ? 'text-blue-400' : 'text-yellow-400'}`}>
                                {course.category === 'MUSICA' ? 'Audio Lab' : 'Visual Art'}
                              </span>
                              <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-300">
                                {course.total_classes > 0 ? `${course.total_classes} clases` : 'Plan inicial'}
                              </span>
                            </div>

                            <h3 className="text-2xl font-black italic uppercase leading-tight">{course.title}</h3>
                            <p className="mt-3 min-h-16 text-sm text-zinc-300">{course.description}</p>

                            <div className="mt-5 flex items-center justify-between">
                              <p className="text-xs uppercase tracking-wider text-zinc-400">Docente: {course.professor_name || 'Asignado'}</p>
                              <span className="flex h-9 w-9 items-center justify-center border border-white/20 text-lg">?</span>
                            </div>
                          </div>
                        </article>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <footer id="footer" className="border-t border-white/10 bg-[#050507] px-4 py-14 md:px-10">
          <div className="mx-auto grid w-full max-w-7xl gap-10 md:grid-cols-4">
            <div>
              <p className="text-3xl font-black italic">AXM<span className="text-yellow-400">.</span></p>
              <p className="mt-4 text-sm text-zinc-400">
                Plataforma educativa creativa enfocada en arte y musica. Formacion practica para estudiantes, profesores y creadores.
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">Navegacion</p>
              <div className="mt-4 space-y-2 text-sm text-zinc-400">
                <a href="#inicio" className="block hover:text-white">Inicio</a>
                <a href="#comparacion" className="block hover:text-white">Comparacion</a>
                <a href="#programas" className="block hover:text-white">Programas</a>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">Categorias</p>
              <div className="mt-4 space-y-2 text-sm text-zinc-400">
                <p>Arte ({courseStats.artCount})</p>
                <p>Musica ({courseStats.musicCount})</p>
                <p>Cursos visibles ({courseStats.total})</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">Empieza Hoy</p>
              <p className="mt-4 text-sm text-zinc-400">Accede al campus, explora rutas de aprendizaje y construye tu portafolio creativo.</p>
              <Link
                to={dashboardTarget}
                className="mt-5 inline-block rounded-full bg-yellow-400 px-5 py-2 text-xs font-black uppercase tracking-wider text-black transition-all duration-300 hover:scale-105"
              >
                Ir al campus
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-10 flex w-full max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-xs uppercase tracking-widest text-zinc-500 md:flex-row md:items-center md:justify-between">
            <p>Creative Rebel Academy</p>
            <p>&copy; {currentYear} Todos los derechos reservados</p>
          </div>
        </footer>
      </main>

    </div>
  );
}
