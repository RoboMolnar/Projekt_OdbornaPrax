import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

type AccType = 'student' | 'company';

type FormShape = {
  name: string;
  email: string;
  phone: string;

  // server-validations (neposielame priamo, ale TS ich musí poznať, lebo môžu prísť v errors)
  first_name?: string;
  last_name?: string;
  phone_number?: string;

  // company-only UI polia (ak ich backend nepotrebuje, ignoruje)
  company_name?: string;
  company_id?: string;
  company_vat?: string;
};

export default function Register() {
  const [type, setType] = useState<AccType>('student');
  const isCompany = type === 'company';

  const { data, setData, post, processing, errors, transform, reset } = useForm<FormShape>({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    company_id: '',
    company_vat: '',
    first_name: '',
    last_name: '',
    phone_number: '',
  });

  const getErr = (key: keyof FormShape | string) =>
    (errors as Record<string, string>)[key as string];

  function switchType(t: AccType) {
    setType(t);
  }

  function splitName(full: string) {
    const trimmed = (full || '').trim().replace(/\s+/g, ' ');
    if (!trimmed) return { first_name: '', last_name: '' };
    const parts = trimmed.split(' ');
    if (parts.length === 1) return { first_name: parts[0], last_name: '' };
    const first_name = parts.shift() as string;
    const last_name = parts.join(' ');
    return { first_name, last_name };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const { first_name, last_name } = splitName(data.name);

    const url = isCompany ? '/register/company' : '/register/student';

    transform(() => ({
      first_name,
      last_name,
      email: data.email,
      phone_number: data.phone || null,
      ...(isCompany
        ? {
            // ak backend niečo z tohto používa, ostáva tu; inak sa ignoruje
            company_name: data.company_name || null,
            company_id: data.company_id || null,
            company_vat: data.company_vat || null,
          }
        : {}),
    }));

    post(url, {
      onSuccess: () => {
        reset();
        alert('Registrácia prebehla. Skontroluj e-mail s dočasným heslom.');
      },
    });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <Head title="Registrácia" />
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
        >
          ← Späť
        </button>

        <h1 className="text-2xl font-bold text-center text-blue-800">Registrácia</h1>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchType('student')}
            className={`rounded-xl px-4 py-2 border ${
              type === 'student'
                ? 'border-slate-900 bg-slate-900 text-blue-200'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Žiak
          </button>
          <button
            type="button"
            onClick={() => switchType('company')}
            className={`rounded-xl px-4 py-2 border ${
              type === 'company'
                ? 'border-slate-900 bg-slate-900 text-blue-200'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
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
            {getErr('first_name') && (
              <p className="text-sm text-rose-600 mt-1">{getErr('first_name')}</p>
            )}
            {getErr('last_name') && (
              <p className="text-sm text-rose-600 mt-1">{getErr('last_name')}</p>
            )}
            {getErr('name') && <p className="text-sm text-rose-600 mt-1">{getErr('name')}</p>}
          </div>

          {isCompany && (
            <>
              <div>
                <label className="block text-sm text-slate-700">Názov firmy</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                  value={data.company_name}
                  onChange={(e) => setData('company_name', e.target.value)}
                  required
                />
                {getErr('company_name') && (
                  <p className="text-sm text-rose-600 mt-1">{getErr('company_name')}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700">IČO (voliteľné)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                    value={data.company_id}
                    onChange={(e) => setData('company_id', e.target.value)}
                  />
                  {getErr('company_id') && (
                    <p className="text-sm text-rose-600 mt-1">{getErr('company_id')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-slate-700">IČ DPH (voliteľné)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                    value={data.company_vat}
                    onChange={(e) => setData('company_vat', e.target.value)}
                  />
                  {getErr('company_vat') && (
                    <p className="text-sm text-rose-600 mt-1">{getErr('company_vat')}</p>
                  )}
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
              {getErr('email') && <p className="text-sm text-rose-600 mt-1">{getErr('email')}</p>}
            </div>
            <div>
              <label className="block text-sm text-slate-700">Telefón (voliteľné)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                value={data.phone}
                onChange={(e) => setData('phone', e.target.value)}
              />
              {getErr('phone_number') && (
                <p className="text-sm text-rose-600 mt-1">{getErr('phone_number')}</p>
              )}
              {getErr('phone') && (
                <p className="text-sm text-rose-600 mt-1">{getErr('phone')}</p>
              )}
            </div>
          </div>

          <button
            disabled={processing}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white hover:shadow disabled:opacity-50"
          >
            {processing ? 'Vytváram účet…' : 'Vytvoriť účet'}
          </button>

          <p className="text-center text-sm text-slate-600">
            Máš účet?{' '}
            <Link href="/login" className="text-slate-900 hover:underline">
              Prihlás sa
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
