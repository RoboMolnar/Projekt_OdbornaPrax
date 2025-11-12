import { useState, FormEvent } from 'react';
import { api } from '@/shared/apiClient';

type AccType = 'student' | 'company';

type FormShape = {
  name: string;
  email: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  company_name?: string;
  company_id?: string;
  company_vat?: string;
};

export default function Register() {
  const [type, setType] = useState<AccType>('student');
  const isCompany = type === 'company';
  const [data, setData] = useState<FormShape>({ name: '', email: '', phone: '', company_name: '', company_id: '', company_vat: '', first_name: '', last_name: '', phone_number: '' });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getErr = (key: keyof FormShape | string) => errors[key as string];
  function switchType(t: AccType) { setType(t); }

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
    const payload = {
      first_name,
      last_name,
      email: data.email,
      phone_number: data.phone || null,
      ...(isCompany ? { company_name: data.company_name || null, company_id: data.company_id || null, company_vat: data.company_vat || null } : {}),
    };
    try {
      await api.post(url, payload);
      alert('Registrácia prebehla. Skontroluj e-mail s dočasným heslom.');
      setData({ name: '', email: '', phone: '', company_name: '', company_id: '', company_vat: '', first_name: '', last_name: '', phone_number: '' });
    } catch (err: any) {
      const resp = err?.response?.data;
      if (resp && typeof resp === 'object') {
        setErrors(resp.errors || { message: resp.message || 'Registrácia zlyhala' });
      } else {
        setErrors({ message: 'Registrácia zlyhala' });
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex-1 grid place-items-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <button type="button" onClick={() => window.history.back()} className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Späť</button>
          <h1 className="text-2xl font-bold text-center text-blue-800 dark:text-blue-300">Registrácia</h1>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => switchType('student')} className={`rounded-xl px-4 py-2 border transition ${type === 'student' ? 'border-slate-900 bg-slate-900 text-blue-200 dark:border-slate-700 dark:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'}`}>Žiak</button>
            <button type="button" onClick={() => switchType('company')} className={`rounded-xl px-4 py-2 border transition ${type === 'company' ? 'border-slate-900 bg-slate-900 text-blue-200 dark:border-slate-700 dark:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'}`}>Firma</button>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="block text-sm text-slate-700 dark:text-slate-300">Meno a priezvisko</span>
              <input type="text" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/60 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} required />
              {getErr('name') && <p className="text-rose-600 text-sm mt-1">{getErr('name')}</p>}
            </label>
            <label className="block">
              <span className="block text-sm text-slate-700 dark:text-slate-300">Email</span>
              <input type="email" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/60 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} required />
              {getErr('email') && <p className="text-rose-600 text-sm mt-1">{getErr('email')}</p>}
            </label>
            <label className="block">
              <span className="block text-sm text-slate-700 dark:text-slate-300">Telefón</span>
              <input type="tel" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/60 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
            </label>
            {isCompany && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-sm text-slate-700 dark:text-slate-300">Názov firmy</span>
                  <input type="text" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/60 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={data.company_name || ''} onChange={(e) => setData({ ...data, company_name: e.target.value })} />
                </label>
                <label className="block">
                  <span className="block text-sm text-slate-700 dark:text-slate-300">IČO</span>
                  <input type="text" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/60 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={data.company_id || ''} onChange={(e) => setData({ ...data, company_id: e.target.value })} />
                </label>
                <label className="block">
                  <span className="block text-sm text-slate-700 dark:text-slate-300">DIČ</span>
                  <input type="text" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/60 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={data.company_vat || ''} onChange={(e) => setData({ ...data, company_vat: e.target.value })} />
                </label>
              </div>
            )}
            {errors.message && <div className="text-sm text-rose-600">{errors.message}</div>}
            <button disabled={processing} className="w-full rounded-xl px-4 py-2 bg-slate-900 text-white hover:shadow disabled:opacity-50 dark:bg-slate-700">{processing ? 'Odosielam…' : 'Registrovať'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
