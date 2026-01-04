import React, { useState, FormEvent } from 'react';
import { api, setAuthToken } from '@/shared/apiClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    message?: string;
  }>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      const res = await api.post('/api/login', { email, password });

      const token = res.data?.token as string | undefined;
      if (!token) throw new Error('Neplatná odpoveď servera');

      setAuthToken(token);

      const must = !!res.data?.must_change_password;
      const role = res.data?.user?.role as string | undefined;

      try {
        if (role) localStorage.setItem('user_role', role);
      } catch {
        // ignore
      }

      if (must) {
        window.location.href = '/force-password';
        return;
      }

      switch (role) {
        case 'student':
          window.location.href = '/dashboard-student';
          break;
        case 'company':
          window.location.href = '/dashboard-company';
          break;
        case 'garant':
          window.location.href = '/dashboard-garant';
          break;
        default:
          window.location.href = '/';
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Prihlásenie zlyhalo';
      setErrors((p) => ({ ...p, message: msg }));
    } finally {
      setProcessing(false);
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
            Prihlásenie
          </h1>

          <form onSubmit={submit} className="mt-6">
            <label className="block mb-4">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Email
              </span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100 dark:placeholder-slate-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && (
                <p className="text-rose-600 text-sm mt-1">{errors.email}</p>
              )}
            </label>

            <label className="block mb-4">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Heslo
              </span>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100 dark:placeholder-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {errors.password && (
                <p className="text-rose-600 text-sm mt-1">{errors.password}</p>
              )}
            </label>

            <label className="flex items-center gap-2 mb-4 text-sm text-green-900 dark:text-green-200">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Zapamätať prihlásenie
            </label>

            <button
              disabled={processing}
              className="w-full rounded-xl px-4 py-2 bg-green-700 text-white hover:shadow disabled:opacity-50 dark:bg-green-600"
            >
              {processing ? 'Prihlasujem…' : 'Prihlásiť sa'}
            </button>

            {errors.message && (
              <div className="mt-3 text-sm text-rose-600">{errors.message}</div>
            )}
          </form>

          <div className="mt-4 text-center text-sm text-green-900 dark:text-green-300">
            <a href="/forgot-password" className="hover:underline">
              Zabudnuté heslo?
            </a>
          </div>

          <p className="text-center text-sm text-green-900 dark:text-green-300 mt-2">
            Nemáš účet?{' '}
            <a href="/register" className="hover:underline">
              Registruj sa
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
