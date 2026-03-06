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
    { to: '/profesor', label: 'Clases' },
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

  return (
    <header className="sticky top-0 z-40 border-b-4 border-yellow-400 bg-black px-4 py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <p className="text-3xl font-black italic tracking-tight">
            AXM<span className="text-yellow-400">.</span>
          </p>
          <div className="hidden h-8 w-px bg-white/15 md:block" />
          <div className="hidden md:block">
            <p className="text-[9px] font-black uppercase leading-none tracking-[0.25em] text-zinc-500">Usuario conectado</p>
            <p className="text-xs font-bold uppercase text-zinc-200">{user?.name || 'Invitado'} · {user?.role || 'N/A'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className="border border-white/20 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-100 transition hover:border-yellow-400 hover:text-yellow-300"
          >
            Inicio
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
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
      </div>
    </header>
  );
}
