import { useState, FormEvent } from 'react';
import { api } from '@/shared/apiClient';

type AccType = 'student' | 'company';

type FormShape = {
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  ico?: string;
  dic?: string;
};

type ErrorsShape = Record<string, string[]>;

export default function Register() {
  const [type, setType] = useState<AccType>('student');
  const isCompany = type === 'company';

  const [data, setData] = useState<FormShape>({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    ico: '',
    dic: '',
  });

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<ErrorsShape>({});

  const getErr = (key: string) => errors[key]?.[0];

  function switchType(t: AccType) {
    setType(t);
    setErrors({});
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

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const { first_name, last_name } = splitName(data.name);
    const url = isCompany ? '/api/register/company' : '/api/register/student';

    const payload: any = {
      first_name,
      last_name,
      email: data.email,
      phone_number: data.phone || null,
    };

    if (isCompany) {
      payload.company_name = data.company_name || null;
      payload.ico = data.ico || null;
      payload.dic = data.dic || null;
    }

    try {
      await api.post(url, payload);
      alert('Registrácia prebehla. Skontroluj e-mail s dočasným heslom.');
      setData({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        ico: '',
        dic: '',
      });
    } catch (err: any) {
      const resp = err?.response?.data;
      if (resp && typeof resp === 'object') {
        setErrors(resp.errors || { message: [resp.message || 'Registrácia zlyhala'] });
      } else {
        setErrors({ message: ['Registrácia zlyhala'] });
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-green-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex-1 grid place-items-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-green-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-green-800">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-green-300 px-3 py-2 text-green-800 hover:bg-green-50 dark:border-green-600 dark:text-green-100 dark:hover:bg-green-900"
          >
            Späť
          </button>

          <h1 className="text-2xl font-bold text-center text-green-700 dark:text-green-300">
            Registrácia
          </h1>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => switchType('student')}
              className={`rounded-xl px-4 py-2 border transition ${
                type === 'student'
                  ? 'border-green-700 bg-green-700 text-green-100 dark:border-green-600 dark:bg-green-600'
                  : 'border-green-300 bg-white text-green-800 hover:bg-green-50 dark:border-green-600 dark:bg-slate-900 dark:text-green-100 dark:hover:bg-slate-800'
              }`}
            >
              Žiak
            </button>
            <button
              type="button"
              onClick={() => switchType('company')}
              className={`rounded-xl px-4 py-2 border transition ${
                type === 'company'
                  ? 'border-green-700 bg-green-700 text-green-100 dark:border-green-600 dark:bg-green-600'
                  : 'border-green-300 bg-white text-green-800 hover:bg-green-50 dark:border-green-600 dark:bg-slate-900 dark:text-green-100 dark:hover:bg-slate-800'
              }`}
            >
              Firma
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {/* Meno a priezvisko */}
            <label className="block">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Meno a priezvisko <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
              />
              {getErr('first_name') && (
                <p className="text-rose-600 text-sm mt-1">{getErr('first_name')}</p>
              )}
              {getErr('last_name') && (
                <p className="text-rose-600 text-sm mt-1">{getErr('last_name')}</p>
              )}
            </label>

            {/* Email */}
            <label className="block">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Email <span className="text-red-600">*</span>
              </span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
              />
              {getErr('email') && (
                <p className="text-rose-600 text-sm mt-1">{getErr('email')}</p>
              )}
            </label>

            {/* Telefón */}
            <label className="block">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Telefón {isCompany && <span className="text-red-600">*</span>}
              </span>
              <input
                type="tel"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                required={isCompany}
              />
              {isCompany && getErr('phone_number') && (
                <p className="text-rose-600 text-sm mt-1">{getErr('phone_number')}</p>
              )}
            </label>

            {/* Polia len pre firmu */}
            {isCompany && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-sm text-green-900 dark:text-green-200">
                    Názov firmy
                  </span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                    value={data.company_name || ''}
                    onChange={(e) =>
                      setData({ ...data, company_name: e.target.value })
                    }
                  />
                  {getErr('company_name') && (
                    <p className="text-rose-600 text-sm mt-1">
                      {getErr('company_name')}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="block text-sm text-green-900 dark:text-green-200">
                    IČO <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                    value={data.ico || ''}
                    onChange={(e) => setData({ ...data, ico: e.target.value })}
                    required
                  />
                  {getErr('ico') && (
                    <p className="text-rose-600 text-sm mt-1">{getErr('ico')}</p>
                  )}
                </label>

                <label className="block">
                  <span className="block text-sm text-green-900 dark:text-green-200">
                    DIČ <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                    value={data.dic || ''}
                    onChange={(e) => setData({ ...data, dic: e.target.value })}
                    required
                  />
                  {getErr('dic') && (
                    <p className="text-rose-600 text-sm mt-1">{getErr('dic')}</p>
                  )}
                </label>
              </div>
            )}

            {getErr('message') && (
              <div className="text-sm text-rose-600">{getErr('message')}</div>
            )}

            <button
              disabled={processing}
              className="w-full rounded-xl px-4 py-2 bg-green-700 text-white hover:shadow disabled:opacity-50 dark:bg-green-600"
            >
              {processing ? 'Odosielam…' : 'Registrovať'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
