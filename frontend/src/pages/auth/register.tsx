import { useState, FormEvent } from 'react';
import { api } from '@/shared/apiClient';

type AccType = 'student' | 'company';

type StudyType = '' | 'AI22m' | 'AI22b';

type FormShape = {
  // Študent
  student_first_name: string;
  student_last_name: string;
  student_email: string; // musí byť @student.ukf.sk
  alt_email: string;
  student_phone: string;
  student_street: string;
  student_city: string;
  student_zip: string;
  student_country: string;
  study_type: StudyType;

  // Firma
  company_name: string;
  company_street: string;
  company_city: string;
  company_zip: string;
  company_country: string;

  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string;
  contact_position: string;

  ico: string;
  dic: string;
};

type ErrorsShape = Record<string, string[]>;

const STUDENT_DOMAIN = '@student.ukf.sk';

export default function Register() {
  const [type, setType] = useState<AccType>('student');
  const isCompany = type === 'company';

  const [data, setData] = useState<FormShape>({
    student_first_name: '',
    student_last_name: '',
    student_email: '',
    alt_email: '',
    student_phone: '',
    student_street: '',
    student_city: '',
    student_zip: '',
    student_country: '',
    study_type: '',

    company_name: '',
    company_street: '',
    company_city: '',
    company_zip: '',
    company_country: '',

    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_phone: '',
    contact_position: '',

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

  function isValidStudentEmail(email: string) {
    const e = (email || '').trim().toLowerCase();
    return e.endsWith(STUDENT_DOMAIN) && e.length > STUDENT_DOMAIN.length;
  }

  const cleanPhone = (s: string) => (s || '').replace(/\s+/g, '').trim();
  const cleanZip = (s: string) => (s || '').replace(/\s+/g, '').trim();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    const url = isCompany ? '/api/register/company' : '/api/register/student';

    // ✅ FE validácia študentského mailu
    if (!isCompany) {
      if (!isValidStudentEmail(data.student_email)) {
        setErrors({
          email: [`Študentský e-mail musí končiť na ${STUDENT_DOMAIN}`],
        });
        setProcessing(false);
        return;
      }
    }

    const payload: any = {};

    if (isCompany) {
      payload.first_name = data.contact_first_name;
      payload.last_name = data.contact_last_name;
      payload.email = data.contact_email;

      // UI môže mať medzery, do payloadu ide čisté
      payload.phone_number = cleanPhone(data.contact_phone);

      // ✅ NOVÉ: pozícia kontaktnej osoby
      payload.position = (data.contact_position || '').trim();

      payload.company_name = data.company_name;
      payload.ico = (data.ico || '').trim();
      payload.dic = (data.dic || '').trim();

      // adresa firmy
      payload.street = data.company_street;
      payload.city = data.company_city;

      // UI môže mať medzeru, do payloadu ide čisté (811 01 -> 81101)
      payload.zip = cleanZip(data.company_zip);

      payload.country = data.company_country;
    } else {
      payload.first_name = data.student_first_name;
      payload.last_name = data.student_last_name;
      payload.email = data.student_email;

      // UI môže mať medzery, do payloadu ide čisté
      payload.phone_number = cleanPhone(data.student_phone);

      payload.alternative_email = data.alt_email || null;

      // adresa študenta
      payload.street = data.student_street;
      payload.city = data.student_city;

      // UI môže mať medzeru, do payloadu ide čisté
      payload.zip = cleanZip(data.student_zip);

      payload.country = data.student_country;

      // ✅ odbor do study_type
      payload.study_type = data.study_type;
    }

    try {
      await api.post(url, payload);
      alert('Registrácia prebehla. Skontroluj e-mail s dočasným heslom.');

      setData({
        student_first_name: '',
        student_last_name: '',
        student_email: '',
        alt_email: '',
        student_phone: '',
        student_street: '',
        student_city: '',
        student_zip: '',
        student_country: '',
        study_type: '',

        company_name: '',
        company_street: '',
        company_city: '',
        company_zip: '',
        company_country: '',

        contact_first_name: '',
        contact_last_name: '',
        contact_email: '',
        contact_phone: '',
        contact_position: '',

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
            {/* ✅ ŠTUDENT / FIRMA - meno + priezvisko (pre firmu: kontaktná osoba) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm text-green-900 dark:text-green-200">
                  {isCompany ? 'Meno kontaktnej osoby' : 'Meno'} <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                  value={isCompany ? data.contact_first_name : data.student_first_name}
                  onChange={(e) =>
                    setData({
                      ...data,
                      ...(isCompany
                        ? { contact_first_name: e.target.value }
                        : { student_first_name: e.target.value }),
                    })
                  }
                  required
                  maxLength={255}
                />
                {getErr('first_name') && <p className="text-rose-600 text-sm mt-1">{getErr('first_name')}</p>}
              </label>

              <label className="block">
                <span className="block text-sm text-green-900 dark:text-green-200">
                  {isCompany ? 'Priezvisko kontaktnej osoby' : 'Priezvisko'} <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                  value={isCompany ? data.contact_last_name : data.student_last_name}
                  onChange={(e) =>
                    setData({
                      ...data,
                      ...(isCompany
                        ? { contact_last_name: e.target.value }
                        : { student_last_name: e.target.value }),
                    })
                  }
                  required
                  maxLength={255}
                />
                {getErr('last_name') && <p className="text-rose-600 text-sm mt-1">{getErr('last_name')}</p>}
              </label>
            </div>

            {/* ✅ Pozícia kontaktnej osoby – len pre firmu */}
            {isCompany && (
              <label className="block">
                <span className="block text-sm text-green-900 dark:text-green-200">
                  Pozícia kontaktnej osoby (napr. CEO, konateľ) <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                  value={data.contact_position}
                  onChange={(e) => setData({ ...data, contact_position: e.target.value })}
                  required
                  maxLength={255}
                />
                {getErr('position') && <p className="text-rose-600 text-sm mt-1">{getErr('position')}</p>}
              </label>
            )}

            {/* ✅ Email (študent: študentský email, firma: kontaktný email) */}
            <label className="block">
              <span className="block text-sm text-green-900 dark:text-green-200">
                {isCompany ? 'Email kontaktnej osoby' : 'Študentský email'} <span className="text-red-600">*</span>
              </span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                value={isCompany ? data.contact_email : data.student_email}
                onChange={(e) =>
                  setData({
                    ...data,
                    ...(isCompany
                      ? { contact_email: e.target.value }
                      : { student_email: e.target.value }),
                  })
                }
                required
                maxLength={255}
                pattern={isCompany ? undefined : `^[^@\\s]+@student\\.ukf\\.sk$`}
                title={isCompany ? undefined : `Musí končiť na ${STUDENT_DOMAIN}`}
              />
              {getErr('email') && <p className="text-rose-600 text-sm mt-1">{getErr('email')}</p>}
            </label>

            {/* ✅ Alternatívny email - len študent */}
            {!isCompany && (
              <label className="block">
                <span className="block text-sm text-green-900 dark:text-green-200">
                  Alternatívny email
                </span>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                  value={data.alt_email}
                  onChange={(e) => setData({ ...data, alt_email: e.target.value })}
                  maxLength={255}
                />
                {getErr('alternative_email') && (
                  <p className="text-rose-600 text-sm mt-1">{getErr('alternative_email')}</p>
                )}
              </label>
            )}

            {/* ✅ Telefón (študent aj kontaktná osoba firmy) */}
            <label className="block">
              <span className="block text-sm text-green-900 dark:text-green-200">
                Telefón <span className="text-red-600">*</span>
              </span>
              <input
                type="tel"
                className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                value={isCompany ? data.contact_phone : data.student_phone}
                onChange={(e) =>
                  setData({
                    ...data,
                    ...(isCompany
                      ? { contact_phone: e.target.value }
                      : { student_phone: e.target.value }),
                  })
                }
                required
                inputMode="tel"
                pattern="\+?[0-9 ]{9,20}"
                maxLength={20}
                title="Zadaj telefón len ako čísla, voliteľne s + (napr. +421901234567)."
              />
              {getErr('phone_number') && <p className="text-rose-600 text-sm mt-1">{getErr('phone_number')}</p>}
            </label>

            {/* ✅ Adresa (študent aj firma) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm text-green-900 dark:text-green-200">
                  Ulica a číslo <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                  value={isCompany ? data.company_street : data.student_street}
                  onChange={(e) =>
                    setData({
                      ...data,
                      ...(isCompany
                        ? { company_street: e.target.value }
                        : { student_street: e.target.value }),
                    })
                  }
                  required
                  maxLength={255}
                />
                {getErr('street') && <p className="text-rose-600 text-sm mt-1">{getErr('street')}</p>}
              </label>

              <label className="block">
                <span className="block text-sm text-green-900 dark:text-green-200">
                  Mesto <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                  value={isCompany ? data.company_city : data.student_city}
                  onChange={(e) =>
                    setData({
                      ...data,
                      ...(isCompany
                        ? { company_city: e.target.value }
                        : { student_city: e.target.value }),
                    })
                  }
                  required
                  maxLength={255}
                />
                {getErr('city') && <p className="text-rose-600 text-sm mt-1">{getErr('city')}</p>}
              </label>

              <label className="block">
                <span className="block text-sm text-green-900 dark:text-green-200">
                  PSČ <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                  value={isCompany ? data.company_zip : data.student_zip}
                  onChange={(e) =>
                    setData({
                      ...data,
                      ...(isCompany
                        ? { company_zip: e.target.value }
                        : { student_zip: e.target.value }),
                    })
                  }
                  required
                  inputMode="numeric"
                  pattern="\d{3}\s*\d{2}"
                  maxLength={7}
                  title="PSČ vo formáte 81101 alebo 811 01."
                />
                {getErr('zip') && <p className="text-rose-600 text-sm mt-1">{getErr('zip')}</p>}
              </label>

              <label className="block">
                <span className="block text-sm text-green-900 dark:text-green-200">
                  Štát <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                  value={isCompany ? data.company_country : data.student_country}
                  onChange={(e) =>
                    setData({
                      ...data,
                      ...(isCompany
                        ? { company_country: e.target.value }
                        : { student_country: e.target.value }),
                    })
                  }
                  required
                  maxLength={100}
                />
                {getErr('country') && <p className="text-rose-600 text-sm mt-1">{getErr('country')}</p>}
              </label>
            </div>

            {/* ✅ Študijný odbor – len študent */}
            {!isCompany && (
              <label className="block">
                <span className="block text-sm text-green-900 dark:text-green-200">
                  Študijný odbor <span className="text-red-600">*</span>
                </span>
                <select
                  className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                  value={data.study_type}
                  onChange={(e) => setData({ ...data, study_type: e.target.value as StudyType })}
                  required
                >
                  <option value="">Vyber</option>
                  <option value="AI22m">AI22m</option>
                  <option value="AI22b">AI22b</option>
                </select>
                {getErr('study_type') && (
                  <p className="text-rose-600 text-sm mt-1">{getErr('study_type')}</p>
                )}
              </label>
            )}

            {/* ✅ Polia len pre firmu */}
            {isCompany && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-sm text-green-900 dark:text-green-200">
                    Názov firmy <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                    value={data.company_name}
                    onChange={(e) => setData({ ...data, company_name: e.target.value })}
                    required
                    maxLength={255}
                  />
                  {getErr('company_name') && (
                    <p className="text-rose-600 text-sm mt-1">{getErr('company_name')}</p>
                  )}
                </label>

                <label className="block">
                  <span className="block text-sm text-green-900 dark:text-green-200">
                    IČO <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                    value={data.ico}
                    onChange={(e) => setData({ ...data, ico: e.target.value })}
                    required
                    inputMode="numeric"
                    pattern="\d{8}"
                    maxLength={8}
                    title="IČO má 8 číslic."
                  />
                  {getErr('ico') && <p className="text-rose-600 text-sm mt-1">{getErr('ico')}</p>}
                </label>

                <label className="block">
                  <span className="block text-sm text-green-900 dark:text-green-200">
                    DIČ <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400/60 dark:bg-slate-800 dark:border-green-700 dark:text-slate-100"
                    value={data.dic}
                    onChange={(e) => setData({ ...data, dic: e.target.value })}
                    required
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    title="DIČ má zvyčajne 10 číslic."
                  />
                  {getErr('dic') && <p className="text-rose-600 text-sm mt-1">{getErr('dic')}</p>}
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