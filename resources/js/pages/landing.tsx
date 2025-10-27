import React from 'react';
import { Link, Head } from '@inertiajs/react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 relative">
      <Head title="Welcome" />

      {/* NAVBAR */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-500 grid place-items-center text-xl font-black text-white">
            OP
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Portál praxe</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Prihlásiť sa
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition"
          >
            Registrácia
          </Link>
        </div>
      </header>

      {/* STRED STRÁNKY */}
      <main className="flex flex-col items-center justify-center text-center px-6 py-40">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Vitaj v aplikácii{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            Portál praxe
          </span>
        </h1>

        {/* ✅ Pridaný popis */}
        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          Spravuj svoju odbornú prax jednoducho, prehľadne a efektívne. 
        </p>
      </main>

      {/* FOOTER */}
      <footer className="absolute bottom-0 w-full border-t border-slate-200 bg-white/70 text-center text-xs text-slate-500 py-4">
        © {new Date().getFullYear()} Portál praxe. Všetky práva vyhradené.
      </footer>
    </div>
  );
}
