import { useState } from 'react';
import RebelHeader from '../components/RebelHeader';
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
      setMessage('QR generado. Escanealo y confirma con tu codigo.');
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
    <>
      <RebelHeader user={user} onLogout={logout} />

      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <section className="border border-white/10 bg-[#111] p-6 shadow-[14px_14px_0px_#facc15]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">Panel de seguridad</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black italic uppercase leading-none">
            Control de
            <br />
            <span className="text-yellow-400">Acceso</span>
          </h1>
          <div className="mt-4 grid gap-2 text-sm text-zinc-300 md:grid-cols-3">
            <p>Usuario: <strong>{user.name}</strong></p>
            <p>Rol: <strong>{user.role}</strong></p>
            <p>2FA: <strong>{user.twoFaEnabled ? 'Activo' : 'Inactivo'}</strong></p>
          </div>
        </section>

        {message && <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
        {error && <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="text-3xl font-black uppercase italic">Verificacion 2FA</h2>

          {!user.twoFaEnabled && (
            <button
              type="button"
              onClick={setupTwoFa}
              disabled={loading}
              className="mt-4 bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:-skew-x-6 hover:bg-yellow-300 disabled:opacity-60"
            >
              Generar QR para Google Authenticator
            </button>
          )}

          {qrCodeDataUrl && (
            <div className="mt-5 border border-white/10 bg-[#1a1a1a] p-4">
              <img src={qrCodeDataUrl} alt="QR 2FA" width="220" height="220" className="bg-white p-2" />
              <p className="mt-2 text-sm text-zinc-300">Clave manual: {manualKey}</p>
            </div>
          )}

          {(qrCodeDataUrl || user.twoFaEnabled) && (
            <form onSubmit={user.twoFaEnabled ? disableTwoFa : enableTwoFa} className="mt-5 space-y-3">
              <label className="block text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Codigo de 6 digitos</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                className="w-full max-w-xs border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-yellow-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:-skew-x-6 hover:bg-blue-400 hover:text-white disabled:opacity-60"
              >
                {loading
                  ? 'Procesando...'
                  : user.twoFaEnabled
                    ? 'Desactivar 2FA'
                    : 'Confirmar activacion 2FA'}
              </button>
            </form>
          )}
        </section>
      </section>
    </>
  );
}

