import { FormEvent, useState } from 'react';
import { api } from '@/shared/apiClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/api/password/forgot', { email });
      setSuccess(
        'Poslali sme vám dočasné heslo. Skontrolujte si vašu emailovú schránku'
      );
    } catch (err: any) {
      const resp = err?.response?.data;
      if (resp?.errors?.email?.[0]) {
        setError(resp.errors.email[0]);
      } else if (resp?.message) {
        setError(resp.message);
      } else {
        setError('Odoslanie e-mailu zlyhalo.');
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
            Zabudnuté heslo
          </h1>

          <p className="mt-2 text-sm text-center text-green-800 dark:text-green-200">
            Zadajte e-mail, ku ktorému chcete obnoviť heslo.
          </p>

          <form onSubmit={submit} className="mt-6">
            <label className="block mb-4">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Email
              </span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <button
              disabled={busy}
              className="w-full rounded-xl px-4 py-2 bg-green-700 text-white hover:shadow disabled:opacity-50 dark:bg-green-600"
            >
              {busy ? 'Odosielam…' : 'Poslať dočasné heslo'}
            </button>

            {error && (
              <div className="mt-3 text-sm text-rose-600">{error}</div>
            )}

            {success && (
              <div className="mt-3 text-sm text-green-700 dark:text-green-300">
                {success}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
