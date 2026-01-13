import React from "react";
import { Link, Head, useForm } from "@inertiajs/react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Login() {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post("/login", { onFinish: () => reset("password") });
  }

  return (
    <div className="min-h-screen flex flex-col
      bg-slate-50 text-slate-900
      dark:bg-slate-900 dark:text-slate-100">
      <Head title="Prihlásenie" />

      {/* HEADER s togglom */}
      <header className="w-full border-b bg-white/80 backdrop-blur
                         dark:bg-slate-900/80 dark:border-slate-800">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white font-bold grid place-items-center">OP</div>
            <span className="font-semibold">Portál praxe</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* FORM */}
      <div className="flex-1 grid place-items-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm
                        dark:bg-slate-900 dark:border-slate-800">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100
                       dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Späť
          </button>

          <h1 className="text-2xl font-bold text-center text-blue-800 dark:text-blue-300">Prihlásenie</h1>

          <form onSubmit={submit} className="mt-6">
            <label className="block mb-4">
              <span className="block text-sm text-slate-700 dark:text-slate-300">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-slate-400/60
                           dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                required
              />
              {errors.email && <p className="text-rose-600 text-sm mt-1">{errors.email}</p>}
            </label>

            <label className="block mb-4">
              <span className="block text-sm text-slate-700 dark:text-slate-300">Heslo</span>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-slate-400/60
                           dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                required
              />
              {errors.password && <p className="text-rose-600 text-sm mt-1">{errors.password}</p>}
            </label>

            <label className="flex items-center gap-2 mb-4 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(e) => setData("remember", e.target.checked)}
              />
              Zapamätať prihlásenie
            </label>

            <button
              disabled={processing}
              className="w-full rounded-xl px-4 py-2 bg-slate-900 text-white hover:shadow disabled:opacity-50
                         dark:bg-slate-700"
            >
              {processing ? "Prihlasujem…" : "Prihlásiť sa"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            <Link href="/forgot-password" className="text-slate-900 dark:text-slate-100 hover:underline">
              Zabudnuté heslo?
            </Link>
          </div>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">
            Nemáš účet?{" "}
            <Link href="/register" className="text-slate-900 dark:text-slate-100 hover:underline">
              Registruj sa
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
