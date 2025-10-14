import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword() {
  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({ email: '' });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post('/forgot-password'); // Fortify endpoint, pošle reset link na email
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <Head title="Zabudnuté heslo" />
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
<button
  type="button"
  onClick={() => window.history.back()}
  className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
>
  ← Späť
</button>

        <h1 className="text-2xl font-bold text-center text-blue-800">Zabudnuté heslo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Zadaj email a pošleme ti odkaz na obnovenie hesla.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/60"
              value={data.email}
              onChange={e => setData('email', e.target.value)}
              required
            />
            {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
          </div>

          <button
            disabled={processing}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white hover:shadow disabled:opacity-50"
          >
            {processing ? 'Posielam…' : 'Poslať reset link'}
          </button>

          {recentlySuccessful && (
            <p className="text-sm text-emerald-600">Ak účet existuje, poslal sa odkaz na email.</p>
          )}
        </form>
      </div>
    </div>
  );
}
