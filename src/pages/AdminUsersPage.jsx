import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import RebelHeader from '../components/RebelHeader';
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
    <>
      <RebelHeader user={user} onLogout={logout} />

      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <section className="border border-white/10 bg-[#111] p-6 shadow-[14px_14px_0px_#a855f7]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">Administracion</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black italic uppercase leading-none">
            Gestion de
            <br />
            <span className="text-violet-400">Usuarios</span>
          </h1>
          <p className="mt-4 text-zinc-300">Controla roles y accesos de toda la academia.</p>
        </section>

        {message && <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
        {error && <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <section className="overflow-hidden border border-white/10 bg-[#121212]">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="text-3xl font-black uppercase italic">Listado de usuarios</h2>
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
                  <tr key={item.id} className="border-t border-white/10 transition hover:bg-white/5">
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.role}
                        onChange={(e) => updateRole(item.id, e.target.value)}
                        className="border border-white/20 bg-black/30 px-3 py-1.5 text-zinc-100 outline-none"
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
    </>
  );
}

