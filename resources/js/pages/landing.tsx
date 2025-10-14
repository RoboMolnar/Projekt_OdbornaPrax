import React from 'react';
import { Link, Head } from '@inertiajs/react';


export default function Landing(){
return (
<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
<Head title="Welcome" />
<div className="max-w-2xl w-full bg-white/90 border border-slate-200 rounded-2xl shadow-sm p-8">
<h1 className="text-3xl font-extrabold tracking-tight text-blue-800">Portal praxe</h1>
<p className="text-slate-600 mt-2">Vitaj v aplikácii. Pokračuj prihlásením alebo si vytvor účet.</p>
<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
<Link href="/login" className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-slate-900 text-white hover:shadow">Prihlásiť sa</Link>
<Link href="/register" className="inline-flex items-center justify-center rounded-xl px-4 py-2 border border-slate-300 text-slate-900 hover:bg-slate-50">Vytvoriť účet</Link>
</div>
<ul className="mt-6 text-sm text-slate-500 list-disc pl-5">
<li>Prehliadaj verejné informácie bez prihlásenia.</li>
<li>Po prihlásení uvidíš svoj dashboard a dáta.</li>
</ul>
</div>
</div>
);
}