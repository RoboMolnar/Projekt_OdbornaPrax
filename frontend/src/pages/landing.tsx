import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  useEffect(() => { document.title = 'Welcome'; }, []);
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-slate-100">
      <main className="text-center px-6 py-20">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Vitaj v aplikácii{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-sky-400">Portál praxe</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">
          Spravuj svoju odbornú prax jednoducho, prehľadne a efektívne.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link to="/login" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Prihlásiť sa</Link>
          <Link to="/register" className="rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition">Registrácia</Link>
        </div>
      </main>
    </div>
  );
}
