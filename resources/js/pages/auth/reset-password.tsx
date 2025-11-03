import { Head, useForm } from '@inertiajs/react';

type Props = { token: string; email?: string };

export default function ResetPassword({ token, email = '' }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    token,
    email,
    password: '',
    password_confirmation: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post('/reset-password'); // Fortify endpoint
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <Head title="Obnovenie hesla" />
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-center">Obnovenie hesla</h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              value={data.email}
              onChange={e => setData('email', e.target.value)}
              required
            />
            {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-700">Nové heslo</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              value={data.password}
              onChange={e => setData('password', e.target.value)}
              required
            />
            {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-700">Potvrdenie hesla</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              value={data.password_confirmation}
              onChange={e => setData('password_confirmation', e.target.value)}
              required
            />
          </div>

          <button
            disabled={processing}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white hover:shadow disabled:opacity-50"
          >
            {processing ? 'Ukladám…' : 'Nastaviť heslo'}
          </button>
        </form>
      </div>
    </div>
  );
}
