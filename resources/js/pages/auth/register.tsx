import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Register() {
  const [type, setType] = useState<'student'|'company'>('student');

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    account_type: 'student',
    phone: '',
    company_name: '',
    company_id: '',
    company_vat: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post('/register');
  }

  function switchType(t: 'student'|'company') {
    setType(t);
    setData('account_type', t);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <Head title="Registrácia"/>
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
<button
  type="button"
  onClick={() => window.history.back()}
  className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
>
  ← Späť
</button>

        <h1 className="text-2xl font-bold text-center text-blue-800">Registrácia</h1>

        {/* prepínač typu účtu */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchType('student')}
            className={`rounded-xl px-4 py-2 border ${type==='student' ? 'border-slate-900 bg-slate-900 text-blue-200' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            Žiak
          </button>
          <button
            type="button"
            onClick={() => switchType('company')}
            className={`rounded-xl px-4 py-2 border ${type==='company' ? 'border-slate-900 bg-slate-900 text-blue-200' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            Firma
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700">Meno / Kontaktná osoba</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              required
            />
            {errors.name && <p className="text-sm text-rose-600 mt-1">{errors.name}</p>}
          </div>

          {/* Firemné polia len pre company */}
          {type === 'company' && (
            <>
              <div>
                <label className="block text-sm text-slate-700">Názov firmy</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                  value={data.company_name}
                  onChange={(e) => setData('company_name', e.target.value)}
                  required
                />
                {errors.company_name && <p className="text-sm text-rose-600 mt-1">{errors.company_name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700">IČO (voliteľné)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                    value={data.company_id}
                    onChange={(e) => setData('company_id', e.target.value)}
                  />
                  {errors.company_id && <p className="text-sm text-rose-600 mt-1">{errors.company_id}</p>}
                </div>
                <div>
                  <label className="block text-sm text-slate-700">IČ DPH (voliteľné)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                    value={data.company_vat}
                    onChange={(e) => setData('company_vat', e.target.value)}
                  />
                  {errors.company_vat && <p className="text-sm text-rose-600 mt-1">{errors.company_vat}</p>}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
              />
              {errors.email && <p className="text-sm text-rose-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm text-slate-700">Telefón (voliteľné)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                value={data.phone}
                onChange={(e) => setData('phone', e.target.value)}
              />
              {errors.phone && <p className="text-sm text-rose-600 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700">Heslo</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                required
              />
              {errors.password && <p className="text-sm text-rose-600 mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm text-slate-700">Potvrdenie hesla</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                required
              />
            </div>
          </div>

          <button
            disabled={processing}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white hover:shadow disabled:opacity-50"
          >
            {processing ? 'Vytváram účet…' : 'Vytvoriť účet'}
          </button>

          <p className="text-center text-sm text-slate-600">
            Máš účet? <Link href="/login" className="text-slate-900 hover:underline">Prihlás sa</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
