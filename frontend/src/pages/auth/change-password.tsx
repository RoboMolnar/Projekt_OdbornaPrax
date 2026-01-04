import { FormEvent, useState } from 'react';
import { api } from '@/shared/apiClient';

function goToDashboard(role?: string) {
  switch (role) {
    case 'student':
      window.location.href = '/dashboard-student';
      return;
    case 'company':
      window.location.href = '/dashboard-company';
      return;
    case 'garant':
      window.location.href = '/dashboard-garant';
      return;
    default:
      // keď nevieme rolu, pošli aspoň na login
      window.location.href = '/login';
  }
}

function getRoleFromStorage(): string | undefined {
  try {
    return localStorage.getItem('user_role') || undefined;
  } catch {
    return undefined;
  }
}

async function fetchRoleFromMe(): Promise<string | undefined> {
  try {
    const me = await api.get('/api/me');
    return me.data?.role ?? me.data?.user?.role;
  } catch {
    return undefined;
  }
}

export default function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    if (password !== confirm) {
      setBusy(false);
      setError('Nové heslo a potvrdenie hesla sa nezhodujú.');
      return;
    }

    try {
      const resp = await api.post('/api/password/force-change', {
        current_password: current,
        password,
        password_confirmation: confirm,
      });

      setSuccess('Heslo bolo úspešne zmenené.');

      // 1) rola priamo z response (ak backend posiela)
      const roleFromResp = resp.data?.user?.role ?? resp.data?.role;
      if (roleFromResp) return goToDashboard(roleFromResp);

      // 2) rola z localStorage
      const roleFromStorage = getRoleFromStorage();
      if (roleFromStorage) return goToDashboard(roleFromStorage);

      // 3) rola z /api/me
      const roleFromMe = await fetchRoleFromMe();
      return goToDashboard(roleFromMe);
    } catch (err: any) {
      // ak je user neauth (401), pošli rovno na login
      if (err?.response?.status === 401) {
        window.location.href = '/login';
        return;
      }

      const resp = err?.response?.data;
      if (resp?.errors?.password) {
        setError(
          'Heslo nespĺňa požiadavky. Musí mať aspoň 8 znakov, obsahovať aspoň jedno veľké písmeno, jedno malé písmeno a jeden špeciálny znak.'
        );
      } else if (resp?.message) {
        setError(resp.message);
      } else if (resp?.errors?.current_password) {
        setError('Aktuálne heslo nie je správne.');
      } else {
        setError('Zmena hesla zlyhala.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 text-green-900 dark:bg-slate-900 dark:text-green-100 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-sm">
        <button 
            type="button" 
            onClick={() => window.history.back()} 
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-green-300 px-3 py-2 text-green-800 hover:bg-green-50 dark:border-green-700 dark:text-green-100 dark:hover:bg-green-900"
          >
            Späť
          </button>

        <h1 className="text-2xl font-bold text-center text-green-700 dark:text-green-300">
          Zmeniť heslo
        </h1>

        <p className="mt-2 text-sm text-green-700 dark:text-green-200 text-center">
          Zadaj aktuálne heslo a nastav si nové heslo.
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
          {success && <div className="text-sm text-green-700 mt-2">{success}</div>}

          <button
            disabled={busy}
            className="w-full rounded-xl px-4 py-2 bg-green-700 text-white hover:shadow disabled:opacity-50 dark:bg-green-600"
          >
            {busy ? 'Ukladám…' : 'Zmeniť heslo'}
          </button>
        </form>
      </div>
    </div>
  );
}
