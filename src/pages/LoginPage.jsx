import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import EmailCodeModal from '../components/EmailCodeModal';
import { useAuth } from '../context/AuthContext';
import { getHomePathByRole } from '../utils/authRedirect';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [challengeToken, setChallengeToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState(10);
  const [otpError, setOtpError] = useState('');
  const [otpWarning, setOtpWarning] = useState('');
  const [debugCode, setDebugCode] = useState('');

  const onLogin = async (event) => {
    event.preventDefault();
    setError('');
    setOtpError('');
    setOtpWarning('');
    setDebugCode('');
    setLoading(true);

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_45%)]" />
        <div className="pointer-events-none absolute left-[-14%] top-1/2 h-16 w-[140%] -translate-y-1/2 -rotate-[14deg] border-y-2 border-black bg-[#facc15] shadow-[0_0_40px_rgba(0,0,0,0.9)] md:h-20" />

        <div className="relative w-full max-w-md border border-white/10 bg-[#191919] p-8 shadow-[14px_14px_0px_#facc15] md:p-10">
          <span className="absolute -top-4 right-5 -rotate-3 bg-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
            Acceso restringido
          </span>

          <p className="text-3xl font-black italic tracking-tight">
            AXM<span className="text-yellow-400">.</span>
          </p>
          <h1 className="mt-5 text-5xl font-black italic uppercase leading-none">
            Back To
            <br />
            <span className="text-yellow-400">Base</span>
          </h1>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
            Identificacion requerida
          </p>

          <form onSubmit={onLogin} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Usuario / Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rebel_tag_01@axm.com"
                required
                className="w-full border-0 border-b-2 border-white/10 bg-white/5 px-4 py-3 font-semibold text-white outline-none transition focus:border-yellow-400 focus:bg-white/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="w-full border-0 border-b-2 border-white/10 bg-white/5 px-4 py-3 font-semibold text-white outline-none transition focus:border-yellow-400 focus:bg-white/10"
              />
            </div>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white px-5 py-3 text-base font-black uppercase tracking-[0.14em] text-black transition hover:-skew-x-6 hover:bg-yellow-300 hover:shadow-[5px_5px_0px_#fff] disabled:opacity-60"
            >
              {loading ? 'Enviando codigo...' : 'Acceder'}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Sin credenciales?
            <Link to="/register" className="ml-2 border-b border-yellow-400 text-white transition hover:text-yellow-400">
              Unete al colectivo
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
