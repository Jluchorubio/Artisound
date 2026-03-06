import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

export default function AdminUsersPage() {
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
    <section className="rounded-2xl bg-white p-6 shadow-xl">
      <h1 className="text-2xl font-bold text-slate-900">Administración de usuarios</h1>
      <p className="mt-2 text-sm">
        <Link to="/dashboard" className="font-semibold text-cyan-700 hover:underline">
          Volver al dashboard
        </Link>
      </p>

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">2FA</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{user.name}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">{user.twoFaEnabled ? 'Activo' : 'Inactivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
