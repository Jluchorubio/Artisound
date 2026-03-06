import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setupTwoFa = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await apiRequest('/auth/2fa/setup', { method: 'POST' });
      setQrCodeDataUrl(response.qrCodeDataUrl);
      setManualKey(response.manualKey);
      setMessage('QR generado. Escanéalo y confirma con tu código.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enableTwoFa = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await apiRequest('/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setQrCodeDataUrl('');
      setManualKey('');
      setCode('');
      setMessage('2FA activado correctamente.');
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFa = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await apiRequest('/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setCode('');
      setMessage('2FA desactivado correctamente.');
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-xl">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-slate-700">
        Bienvenido, <strong>{user.name}</strong>
      </p>
      <p className="text-slate-700">
        Rol actual: <strong>{user.role}</strong>
      </p>
      <p className="text-slate-700">
        2FA: <strong>{user.twoFaEnabled ? 'Activo' : 'Inactivo'}</strong>
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {user.role === 'ADMIN' && (
          <Link to="/admin/users" className="rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-800">
            Gestionar roles
          </Link>
        )}
        <button
          type="button"
          onClick={logout}
          className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="my-5 h-px w-full bg-slate-200" />

      <h2 className="text-lg font-semibold text-slate-900">Seguridad 2FA</h2>
      {!user.twoFaEnabled && (
        <button
          type="button"
          onClick={setupTwoFa}
          disabled={loading}
          className="mt-3 rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
        >
          Generar QR para Google Authenticator
        </button>
      )}

      {qrCodeDataUrl && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <img src={qrCodeDataUrl} alt="QR 2FA" width="220" height="220" className="rounded-lg bg-white p-2" />
          <p className="mt-2 text-sm text-slate-700">Clave manual: {manualKey}</p>
        </div>
      )}

      {(qrCodeDataUrl || user.twoFaEnabled) && (
        <form onSubmit={user.twoFaEnabled ? disableTwoFa : enableTwoFa} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">Código de 6 dígitos</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 outline-none ring-cyan-400 focus:ring"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
          >
            {loading
              ? 'Procesando...'
              : user.twoFaEnabled
                ? 'Desactivar 2FA'
                : 'Confirmar activación 2FA'}
          </button>
        </form>
      )}

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
