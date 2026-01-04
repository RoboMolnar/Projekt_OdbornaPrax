import { FormEvent, useMemo, useState } from 'react';
import { api } from '@/shared/apiClient';

function getEmailFromQuery(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('email') || '';
  } catch {
    return '';
  }
}

export default function ResetPassword() {
  const email = useMemo(() => getEmailFromQuery(), []);
  const [tempPassword, setTempPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    if (!email) {
      setBusy(false);
      setError('Chýba e-mail v odkaze. Vráťte sa a požiadajte o nový reset.');
      return;
    }

    if (password !== confirm) {
      setBusy(false);
      setError('Nové heslo a potvrdenie hesla sa nezhodujú.');
      return;
    }

    try {
      await api.post('/api/password/reset-with-temp', {
        email,
        temp_password: tempPassword,
        password,
        password_confirmation: confirm,
      });

      setSuccess('Heslo bolo úspešne zmenené. Teraz sa môžete prihlásiť.');

      // po chvíli presmeruj na login
      setTimeout(() => {
        window.location.href = '/login';
      }, 900);
    } catch (err: any) {
      const resp = err?.response?.data;

      if (resp?.errors?.temp_password?.[0]) {
        setError(resp.errors.temp_password[0]);
      } else if (resp?.errors?.password?.[0]) {
        setError(
          'Heslo nespĺňa požiadavky. Musí mať aspoň 8 znakov, obsahovať aspoň jedno veľké písmeno, jedno malé písmeno a jeden špeciálny znak.'
        );
      } else if (resp?.errors?.email?.[0]) {
        setError(resp.errors.email[0]);
      } else if (resp?.message) {
        setError(resp.message);
      } else {
        setError('Reset hesla zlyhal.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-green-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex-1 grid place-items-center p-6">
        <div className="w-full max-w-md bg-white border border-green-200 rounded-2xl p-6 shadow-sm dark:bg-slate-900 dark:border-green-800">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-green-300 px-3 py-2 text-green-800 hover:bg-green-50 dark:border-green-700 dark:text-green-100 dark:hover:bg-green-900"
          >
            Späť
          </button>

          <h1 className="text-2xl font-bold text-center text-green-700 dark:text-green-300">
            Obnova hesla
          </h1>

          <p className="mt-2 text-sm text-center text-green-800 dark:text-green-200">
            Zadajte dočasné heslo z e-mailu a nastavte si nové heslo.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Dočasné heslo
              </span>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Nové heslo
              </span>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Potvrdenie hesla
              </span>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>

            <p className="text-xs text-green-700 dark:text-green-300">
              Heslo musí mať minimálne <strong>8 znakov</strong>, obsahovať aspoň{' '}
              <strong>jedno veľké písmeno</strong>, <strong>jedno malé písmeno</strong> a{' '}
              <strong>jeden špeciálny znak</strong>.
            </p>

            <button
              disabled={busy}
              className="w-full rounded-xl px-4 py-2 bg-green-700 text-white hover:shadow disabled:opacity-50 dark:bg-green-600"
            >
              {busy ? 'Ukladám…' : 'Nastaviť nové heslo'}
            </button>

            {error && <div className="text-sm text-rose-600">{error}</div>}
            {success && (
              <div className="text-sm text-green-700 dark:text-green-300">
                {success}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
