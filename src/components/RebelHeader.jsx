import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navByRole = {
  USUARIO: [
    { to: '/inicio', label: 'Dashboard' },
    { to: '/estudiante', label: 'Cursos' },
    { to: '/dibujos', label: 'Lienzo' },
    { to: '/dashboard', label: 'Seguridad' },
  ],
  PROFESOR: [
    { to: '/inicio', label: 'Dashboard' },
    { to: '/profesor', label: 'Cursos' },
    { to: '/dibujos', label: 'Lienzo' },
    { to: '/dashboard', label: 'Seguridad' },
  ],
  ADMIN: [
    { to: '/inicio', label: 'Dashboard' },
    { to: '/admin/users', label: 'Usuarios' },
    { to: '/admin/cursos', label: 'Cursos' },
    { to: '/dashboard', label: 'Seguridad' },
  ],
};

function isActivePath(currentPath, targetPath) {
  return currentPath === targetPath || (targetPath !== '/inicio' && currentPath.startsWith(targetPath));
}

export default function RebelHeader({ user, onLogout }) {
  const location = useLocation();
  const navItems = navByRole[user?.role] || navByRole.USUARIO;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b-4 border-yellow-400 bg-black px-4 py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-2xl font-black italic tracking-tight md:text-3xl">
            AXM<span className="text-yellow-400">.</span>
          </p>
          <div className="hidden h-8 w-px bg-white/15 md:block" />
          <div className="hidden md:block">
            <p className="text-[9px] font-black uppercase leading-none tracking-[0.25em] text-zinc-500">Usuario conectado</p>
            <p className="text-xs font-bold uppercase text-zinc-200">{user?.name || 'Invitado'} · {user?.role || 'N/A'}</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/"
            className="border border-white/20 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-100 transition hover:border-yellow-400 hover:text-yellow-300"
          >
            Inicio
          </Link>

          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActivePath(location.pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition ${
                    active
                      ? '-skew-x-12 bg-yellow-400 text-black'
                      : 'border border-transparent text-white hover:border-white/20'
                  }`}
                >
                  <span className="inline-block skew-x-12">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="bg-rose-600 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110"
          >
            Cerrar sesion
          </button>
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
        <div className="mx-auto mt-3 w-full max-w-7xl space-y-2 border border-white/10 bg-black/80 p-3 md:hidden">
          <Link to="/" className="block border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-100">
            Inicio
          </Link>
          {navItems.map((item) => {
            const active = isActivePath(location.pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`block px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${
                  active
                    ? 'bg-yellow-400 text-black'
                    : 'border border-white/10 text-zinc-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onLogout}
            className="w-full bg-rose-600 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white"
          >
            Cerrar sesion
          </button>
        </div>
      )}
    </header>
  );
}
