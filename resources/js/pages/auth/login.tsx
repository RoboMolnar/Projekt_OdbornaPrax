import React from 'react';
import { Link, Head, useForm } from '@inertiajs/react';


export default function Login(){
const { data, setData, post, processing, errors, reset } = useForm({
email: '',
password: '',
remember: false,
});


function submit(e: React.FormEvent){
e.preventDefault();
post('/login', {
onFinish: () => reset('password'),
});
}


return (
<div className="min-h-screen bg-slate-50 grid place-items-center p-6">
<Head title="Prihlásenie" />
<div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
<h1 className="text-2xl font-bold text-center text-blue-800">Prihlásenie</h1>
<form onSubmit={submit} className="mt-6">
<label className="block mb-4">
<span className="block text-sm text-slate-700">Email</span>
<input
type="email"
className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/60 text-black"
value={data.email}
onChange={e=>setData('email', e.target.value)}
required
/>
{errors.email && <p className="text-rose-600 text-sm mt-1">{errors.email}</p>}
</label>


<label className="block mb-4">
<span className="block text-sm text-slate-700">Heslo</span>
<input
type="password"
className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400/60 text-black"
value={data.password}
onChange={e=>setData('password', e.target.value)}
required
/>
{errors.password && <p className="text-rose-600 text-sm mt-1">{errors.password}</p>}
</label>


<label className="flex items-center gap-2 mb-4 text-sm text-slate-700">
<input type="checkbox" checked={data.remember} onChange={e=>setData('remember', e.target.checked)} />
Zapamätať prihlásenie
</label>


<button disabled={processing} className="w-full rounded-xl px-4 py-2 bg-slate-900 text-white hover:shadow disabled:opacity-50">
{processing ? 'Prihlasujem…' : 'Prihlásiť sa'}
</button>
</form>
<div className="mt-4 text-center text-sm text-slate-600">
<Link href="/forgot-password" className="text-slate-900 hover:underline">Zabudnuté heslo?</Link>
</div>
<p className="text-center text-sm text-slate-600 mt-2">
Nemáš účet? <Link href="/register" className="text-slate-900 hover:underline">Registruj sa</Link>
</p>
</div>
</div>
);
}