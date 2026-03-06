import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import EmailCodeModal from '../components/EmailCodeModal';
import { useAuth } from '../context/AuthContext';
import { getHomePathByRole } from '../utils/authRedirect';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [challengeToken, setChallengeToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState(10);
  const [otpError, setOtpError] = useState('');
  const [otpWarning, setOtpWarning] = useState('');
  const [debugCode, setDebugCode] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setOtpError('');
    setOtpWarning('');
    setDebugCode('');
    setLoading(true);

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (response.requiresEmailVerification) {
        setChallengeToken(response.challengeToken);
        setMaskedEmail(response.maskedEmail);
        setExpiresInMinutes(response.expiresInMinutes || 10);
        setOtpWarning(response.deliveryWarning || '');
        setDebugCode(response.debugCode || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async (code) => {
    setOtpError('');
    setLoading(true);

    try {
      const response = await apiRequest('/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeToken, code }),
      });

      await loginWithToken(response.accessToken);
      navigate(response.redirectTo || getHomePathByRole(response.user?.role));
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setOtpError('');
    setLoading(true);

    try {
      const response = await apiRequest('/auth/email/resend', {
        method: 'POST',
        body: JSON.stringify({ challengeToken }),
      });

      setChallengeToken(response.challengeToken);
      setMaskedEmail(response.maskedEmail);
      setExpiresInMinutes(response.expiresInMinutes || 10);
      setOtpWarning(response.deliveryWarning || '');
      setDebugCode(response.debugCode || '');
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeOtp = () => {
    if (loading) return;
    setChallengeToken('');
    setOtpError('');
    setOtpWarning('');
    setDebugCode('');
  };

  return (
    <>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-8 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(59,130,246,0.2),transparent_50%)]" />
        <div className="pointer-events-none absolute left-[-14%] top-1/2 h-16 w-[140%] -translate-y-1/2 rotate-[14deg] border-y-2 border-black bg-[#3b82f6] shadow-[0_0_40px_rgba(0,0,0,0.9)] md:h-20" />

        <div className="relative w-full max-w-md border border-white/10 bg-[#191919] p-8 shadow-[14px_14px_0px_#3b82f6] md:p-10">
          <span className="absolute -top-4 right-5 rotate-3 bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
            Nuevo expediente
          </span>

          <p className="text-3xl font-black italic tracking-tight">
            AXM<span className="text-blue-400">.</span>
          </p>
          <h1 className="mt-5 text-3xl md:text-5xl font-black italic uppercase leading-none">
            Join The
            <br />
            <span className="text-blue-400">Collective</span>
          </h1>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
            Registro de nuevos talentos
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre artistico"
                required
                minLength={2}
                className="w-full border-0 border-b-2 border-white/10 bg-white/5 px-4 py-3 font-semibold text-white outline-none transition focus:border-blue-400 focus:bg-white/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="alias@axm.com"
                required
                className="w-full border-0 border-b-2 border-white/10 bg-white/5 px-4 py-3 font-semibold text-white outline-none transition focus:border-blue-400 focus:bg-white/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimo 8 caracteres"
                  required
                  minLength={8}
                  className="w-full border-0 border-b-2 border-white/10 bg-white/5 px-4 py-3 pr-14 font-semibold text-white outline-none transition focus:border-blue-400 focus:bg-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-zinc-300 transition hover:text-blue-300"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white px-5 py-3 text-base font-black uppercase tracking-[0.14em] text-black transition hover:-skew-x-6 hover:bg-blue-400 hover:text-white hover:shadow-[5px_5px_0px_#fff] disabled:opacity-60"
            >
              {loading ? 'Enviando codigo...' : 'Registrarme'}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Ya tienes acceso?
            <Link to="/login" className="ml-2 border-b border-blue-400 text-white transition hover:text-blue-400">
              Inicia sesion
            </Link>
          </p>
        </div>
      </section>

      <EmailCodeModal
        open={Boolean(challengeToken)}
        maskedEmail={maskedEmail}
        expiresInMinutes={expiresInMinutes}
        onVerify={verifyEmailCode}
        onResend={resendCode}
        onBack={closeOtp}
        loading={loading}
        error={otpError}
        warning={otpWarning}
        debugCode={debugCode}
      />
    </>
  );
}

