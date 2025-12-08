import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/shared/apiClient';

export default function ForcePassword() {
  const [mustChange, setMustChange] = useState<boolean>(true);
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/api/password/force-change-check')
      .then((r) => {
        if (!r.data?.must_change_password) {
          window.location.href = '/dashboard';
        } else {
          setMustChange(true);
        }
      })
      .catch(() => setMustChange(true));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.post('/api/password/force-change', {
        current_password: current,
        password,
        password_confirmation: confirm,
      });
      window.location.href = '/dashboard';
    } catch (err: any) {
      const resp = err?.response?.data;
      if (resp?.errors?.password) {
        setError(
          'Heslo nespĺňa požiadavky. Musí mať aspoň 8 znakov, obsahovať aspoň jedno veľké písmeno, jedno malé písmeno a jeden špeciálny znak.'
        );
      } else if (resp?.message) {
        setError(resp.message);
      } else {
        setError('Zmena hesla zlyhala.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!mustChange) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 text-green-900 dark:bg-slate-900 dark:text-green-100 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-center text-green-700 dark:text-green-300">
          Zmena hesla
        </h1>

        <p className="mt-2 text-sm text-green-700 dark:text-green-200 text-center">
          Pred pokračovaním si prosím nastav nové heslo.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="block text-sm text-green-900 dark:text-green-200">
              Aktuálne heslo
            </span>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 dark:bg-slate-800 dark:border-green-700"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm text-green-900 dark:text-green-200">
              Nové heslo
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 dark:bg-slate-800 dark:border-green-700"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm text-green-900 dark:text-green-200">
              Potvrdenie hesla
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 dark:bg-slate-800 dark:border-green-700"
              required
            />
          </label>

          <p className="text-xs text-green-700 dark:text-green-300">
            Heslo musí mať minimálne <strong>8 znakov</strong>, obsahovať aspoň{' '}
            <strong>jedno veľké písmeno</strong>, <strong>jedno malé písmeno</strong> a{' '}
            <strong>jeden špeciálny znak</strong>.
          </p>

          {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}

          <button
            disabled={busy}
            className="w-full rounded-xl px-4 py-2 bg-green-700 text-white hover:shadow disabled:opacity-50 dark:bg-green-600"
          >
            {busy ? 'Ukladám…' : 'Uložiť nové heslo'}
          </button>
        </form>
      </div>
    </div>
  );
}
