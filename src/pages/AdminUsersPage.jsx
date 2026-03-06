import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminUsersPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [usersResponse, rolesResponse] = await Promise.all([apiRequest('/users'), apiRequest('/roles')]);
      setUsers(usersResponse.users);
      setRoles(rolesResponse.roles);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateRole = async (userId, roleName) => {
    setError('');
    setMessage('');

    try {
      await apiRequest(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleName }),
      });
      setMessage('Rol actualizado correctamente');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="space-y-4">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(120deg,#12102a_0%,#191c3f_45%,#2e123a_100%)] shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(167,139,250,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.2),transparent_35%)]" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-violet-200">Administracion</p>
              <h1 className="mt-2 text-4xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Gestion de usuarios</h1>
              <p className="mt-2 text-zinc-200">Controla roles y acceso de toda la academia.</p>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <Link to="/inicio" className="rounded-xl border border-amber-200/35 bg-amber-500/15 px-4 py-2 text-amber-100 transition-all duration-300 hover:-translate-y-0.5">
                Dashboard
              </Link>
              <Link to="/admin/users" className="rounded-xl border border-violet-200/35 bg-violet-500/20 px-4 py-2 text-violet-100 transition-all duration-300 hover:-translate-y-0.5">
                Usuarios
              </Link>
              <Link to="/admin/cursos" className="rounded-xl border border-fuchsia-200/35 bg-fuchsia-500/15 px-4 py-2 text-fuchsia-100 transition-all duration-300 hover:-translate-y-0.5">
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

      {message && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1225] shadow-xl">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-2xl font-black text-white [font-family:'Bebas_Neue',sans-serif]">Listado de usuarios</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-zinc-200">
            <thead className="bg-white/5 text-zinc-100">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">2FA</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-t border-white/10 transition-all duration-300 hover:bg-white/5">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={item.role}
                      onChange={(e) => updateRole(item.id, e.target.value)}
                      className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-zinc-100 outline-none"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.name} className="text-slate-900">
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{item.twoFaEnabled ? 'Activo' : 'Inactivo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
