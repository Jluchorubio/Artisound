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
      <div className="mx-auto mt-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Iniciar sesion</h1>

        <form onSubmit={onLogin} className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-cyan-400 focus:ring"
          />

          <label className="block text-sm font-medium text-slate-700">Contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-cyan-400 focus:ring"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
          >
            {loading ? 'Enviando codigo...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-cyan-700 hover:underline">
            Registrate
          </Link>
        </p>
      </div>

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
