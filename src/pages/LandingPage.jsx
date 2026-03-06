import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import anime from 'animejs/lib/anime.es.js';
import { useAuth } from '../context/AuthContext';
import { getHomePathByRole } from '../utils/authRedirect';

export default function LandingPage() {
  const { user } = useAuth();
  const dashboardTarget = user ? getHomePathByRole(user.role) : '/login';
  const heroRef = useRef(null);
  const artRef = useRef(null);
  const musicRef = useRef(null);
  const tapeRef = useRef(null);
  const currentYear = new Date().getFullYear();

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

  return (
    <div className="bg-[#0a0a0c] font-['Inter'] text-white">
      <header className="fixed inset-x-0 top-0 z-50 bg-black/50 px-4 py-4 backdrop-blur-lg md:px-10 md:py-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <a href="#inicio" className="cursor-pointer text-3xl font-black italic tracking-tighter">
            AXM<span className="text-yellow-400">.</span>
          </a>

          <nav className="hidden gap-10 text-xs font-bold uppercase tracking-widest md:flex">
            <a href="#inicio" className="transition hover:text-yellow-400">Explorar</a>
            <a href="#programas" className="transition hover:text-yellow-400">Programas</a>
            <a href="#footer" className="transition hover:text-yellow-400">Comunidad</a>
          </nav>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="hidden text-xs font-bold uppercase sm:block">Login</Link>
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

        <section id="comparacion" className="relative flex h-[120vh] w-full flex-col overflow-hidden bg-[#111]">
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1533234407053-adb8220a45e4?q=80&w=1500')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          <div
            className="absolute left-0 top-0 z-20 h-[70%] w-full px-6 py-16 md:px-16"
            style={{
              background: 'linear-gradient(135deg, #0a0a0c 40%, transparent)',
              clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 80%)',
            }}
          >
            <article className="flex max-w-2xl items-center gap-6">
              <div
                className="h-40 w-40 shrink-0 rounded-full border-8 border-white bg-cover bg-center shadow-[0_0_30px_rgba(255,255,255,.1)] md:h-56 md:w-56"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1525201548112-c7b60203d7fe?q=80&w=800')",
                }}
              />
              <div>
                <div className="-rotate-2 bg-white p-4 font-['Permanent_Marker'] text-xl font-black uppercase text-black shadow-[10px_10px_0px_#3b82f6] md:text-2xl">
                  La musica es la pasion mas grande
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-blue-400 md:text-sm">Guitar Master Class</p>
              </div>
            </article>
          </div>

          <div
            className="absolute bottom-[20%] left-[-10%] z-30 flex h-[120px] w-[140%] origin-bottom-left -rotate-[15deg] items-center overflow-hidden border-y-[6px] border-black bg-[#ffd700] shadow-[0_0_60px_rgba(0,0,0,1)]"
          >
            <div ref={tapeRef} className="flex whitespace-nowrap">
              <span className="px-12 text-3xl font-black uppercase text-black md:text-4xl">Musica vs Arte // Musica vs Arte // Musica vs Arte //</span>
              <span className="px-12 text-3xl font-black uppercase text-black md:text-4xl">Musica vs Arte // Musica vs Arte // Musica vs Arte //</span>
              <span className="px-12 text-3xl font-black uppercase text-black md:text-4xl">Musica vs Arte // Musica vs Arte // Musica vs Arte //</span>
            </div>
          </div>

          <div
            className="absolute bottom-0 right-0 z-20 flex h-[70%] w-full items-end justify-end px-6 py-16 md:px-16"
            style={{
              background: 'linear-gradient(135deg, transparent, #0a0a0c 60%)',
              clipPath: 'polygon(0 70%, 100% 20%, 100% 100%, 0 100%)',
            }}
          >
            <article className="flex max-w-2xl items-center gap-6 md:flex-row-reverse">
              <div
                className="h-40 w-40 shrink-0 rounded-full border-8 border-white bg-cover bg-center shadow-[0_0_30px_rgba(255,255,255,.1)] md:h-56 md:w-56"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800')",
                }}
              />
              <div className="text-right">
                <div className="rotate-2 bg-white p-4 text-right font-['Permanent_Marker'] text-xl font-black uppercase text-black shadow-[10px_10px_0px_#f59e0b] md:text-2xl">
                  El arte es la forma pura de la expresion humana
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-yellow-400 md:text-sm">Contemporary Art Lab</p>
              </div>
            </article>
          </div>
        </section>

        <section className="relative grid items-center gap-10 overflow-hidden bg-black px-6 py-20 md:grid-cols-2 md:px-14">
          <div>
            <div
              className="h-[360px] w-full rotate-[-3deg] border-[12px] border-[#222] bg-cover bg-center shadow-[20px_20px_0px_#f59e0b] md:h-[500px]"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?q=80&w=1200')",
              }}
            />
          </div>

          <div className="relative">
            <div className="absolute -right-8 -top-8 z-0 h-[260px] w-[260px] rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] bg-blue-500/80 blur-[5px] md:h-[350px] md:w-[350px]" />
            <div className="relative z-10 max-w-xl rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%] border-b-[20px] border-transparent bg-white p-8 text-black shadow-[0_20px_50px_rgba(0,0,0,.5)] md:p-12">
              <h2 className="mb-6 text-5xl font-black uppercase italic">Quienes<br />Somos?</h2>
              <p className="mb-6 text-lg font-medium leading-relaxed">
                Somos un colectivo de mentes inquietas que creen que la educacion debe ser una revolucion. Fusionamos la tecnica con la rebeldia callejera.
              </p>
              <div className="flex gap-3">
                <span className="bg-black px-3 py-1 text-xs font-black uppercase text-white">Creatividad</span>
                <span className="bg-black px-3 py-1 text-xs font-black uppercase text-white">Revolucion</span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="programas"
          className="relative bg-cover bg-center bg-fixed px-6 py-24 md:px-14"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1541944743827-e04bb645f946?q=80&w=1500')",
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-grayscale-[0.5]" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mb-16">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter md:text-6xl">Nuestros <span className="text-yellow-400">Programas</span></h2>
              <div className="mt-4 h-2 w-32 bg-blue-500" />
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  tag: 'Visual Art',
                  tagColor: 'text-yellow-400',
                  title: 'Grafiti & Muralismo',
                  desc: 'Desde el boceto en papel hasta el control de la boquilla en muros a gran escala.',
                  weeks: '8 Semanas',
                  border: '',
                },
                {
                  tag: 'Audio Lab',
                  tagColor: 'text-blue-400',
                  title: 'Beatmaking 101',
                  desc: 'Produccion de ritmos urbanos, mezcla y teoria musical aplicada al DAW.',
                  weeks: '12 Semanas',
                  border: 'border-t-4 border-blue-500',
                },
                {
                  tag: 'Mixed Media',
                  tagColor: 'text-purple-400',
                  title: 'Diseno Rebelde',
                  desc: 'Creacion de marcas con estetica punk y tipografia experimental.',
                  weeks: '6 Semanas',
                  border: '',
                },
              ].map((card) => (
                <article
                  key={card.title}
                  className={`cursor-pointer border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-yellow-500 hover:bg-white/10 ${card.border}`}
                >
                  <p className={`mb-4 text-xs font-black uppercase tracking-widest ${card.tagColor}`}>{card.tag}</p>
                  <h3 className="mb-4 text-3xl font-black italic uppercase">{card.title}</h3>
                  <p className="mb-6 font-medium text-zinc-400">{card.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black">{card.weeks}</span>
                    <span className="flex h-10 w-10 items-center justify-center border border-white/20">?</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-16 text-center">
              <button className="border-[3px] border-white px-8 py-3 font-black uppercase tracking-wider transition-all duration-300 hover:bg-white hover:text-black">
                Ver Catalogo Completo
              </button>
            </div>
          </div>
        </section>

        <footer id="footer" className="border-t border-white/10 bg-black py-10 text-center">
          <div className="mb-2 text-2xl font-black italic">AXM<span className="text-yellow-400">.</span></div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">Creative Rebel Academy &copy; {currentYear}</p>
        </footer>
      </main>
    </div>
  );
}
