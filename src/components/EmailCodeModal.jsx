import { useMemo, useRef, useState } from 'react';

function sanitizeCode(value) {
  return value.replace(/\D/g, '').slice(0, 6);
}

export default function EmailCodeModal({
  open,
  maskedEmail,
  expiresInMinutes,
  onVerify,
  onResend,
  onBack,
  loading,
  error,
  warning,
  debugCode,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef([]);

  const code = useMemo(() => digits.join(''), [digits]);

  if (!open) return null;

  const setDigit = (index, rawValue) => {
    const clean = sanitizeCode(rawValue);

    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const next = [...digits];

    if (clean.length > 1) {
      for (let i = 0; i < 6; i += 1) {
        next[i] = clean[i] || '';
      }
      setDigits(next);
      const targetIndex = Math.min(clean.length - 1, 5);
      inputsRef.current[targetIndex]?.focus();
      return;
    }

    next[index] = clean;
    setDigits(next);
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (code.length !== 6) return;
    await onVerify(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800 text-2xl">@</div>
        <h2 className="text-center text-3xl font-black tracking-tight">Verificacion por correo</h2>
        <p className="mt-2 text-center text-sm text-zinc-400">Enviamos un codigo de 6 digitos a</p>
        <p className="text-center text-sm font-semibold text-emerald-400">{maskedEmail}</p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="flex items-center justify-center gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={digit}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                className="h-14 w-12 rounded-xl border border-zinc-700 bg-zinc-900 text-center text-xl font-bold outline-none ring-emerald-400 focus:ring"
              />
            ))}
          </div>

          <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-center text-sm text-zinc-300">
            Codigo valido por <span className="font-bold text-emerald-400">{expiresInMinutes} minutos</span>
          </div>

          {warning && <p className="text-center text-xs text-amber-300">{warning}</p>}
          {debugCode && (
            <p className="rounded-lg border border-amber-700 bg-amber-900/30 px-3 py-2 text-center text-sm text-amber-200">
              Codigo temporal (modo debug): <strong>{debugCode}</strong>
            </p>
          )}

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-lg font-bold text-zinc-950 hover:bg-emerald-300 disabled:opacity-50"
          >
            Verificar e ingresar
          </button>

          <button
            type="button"
            onClick={onResend}
            disabled={loading}
            className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold hover:bg-zinc-900 disabled:opacity-50"
          >
            Reenviar codigo
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="w-full rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-900 disabled:opacity-50"
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  );
}
