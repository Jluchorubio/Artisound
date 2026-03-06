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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="relative w-full max-w-md border border-white/10 bg-[#161616] p-6 text-zinc-100 shadow-[12px_12px_0px_#facc15]">
        <span className="absolute -top-3 right-4 rotate-2 bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
          Verificacion
        </span>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-white text-2xl font-black text-black">@</div>
        <h2 className="text-center text-3xl font-black italic uppercase leading-none">Codigo de acceso</h2>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.15em] text-zinc-400">Enviado a</p>
        <p className="text-center text-sm font-semibold text-yellow-300">{maskedEmail}</p>

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
                className="h-14 w-12 border border-white/20 bg-black/40 text-center text-xl font-bold outline-none transition focus:border-yellow-400"
              />
            ))}
          </div>

          <div className="border border-white/10 bg-black/35 px-3 py-2 text-center text-sm text-zinc-300">
            Codigo valido por <span className="font-bold text-yellow-300">{expiresInMinutes} minutos</span>
          </div>

          {warning && <p className="text-center text-xs text-amber-300">{warning}</p>}
          {debugCode && (
            <p className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200">
              Codigo temporal (modo debug): <strong>{debugCode}</strong>
            </p>
          )}

          {error && <p className="text-center text-sm text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-white px-4 py-3 text-base font-black uppercase tracking-[0.14em] text-black transition hover:bg-yellow-300 disabled:opacity-50"
          >
            Verificar e ingresar
          </button>

          <button
            type="button"
            onClick={onResend}
            disabled={loading}
            className="w-full border border-white/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-100 transition hover:bg-white/10 disabled:opacity-50"
          >
            Reenviar codigo
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="w-full border border-white/10 px-4 py-3 text-sm uppercase tracking-[0.08em] text-zinc-400 transition hover:bg-white/5 disabled:opacity-50"
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  );
}
