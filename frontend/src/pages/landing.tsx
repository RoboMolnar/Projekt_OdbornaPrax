import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  useEffect(() => { document.title = 'Portál praxe'; }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-green-50 to-green-100 text-slate-900">

      {/* NAVBAR */}
      <header className="w-full bg-white/70 backdrop-blur border-b border-green-200">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-green-700">
            Portál <span className="text-green-600">praxe</span>
          </Link>

          <div className="flex items-center gap-8">
            <div className="flex gap-3">
              <Link
                to="/login"
                className="rounded-xl border border-green-400 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition"
              >
                Prihlásiť sa
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition"
              >
                Registrácia
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <main className="text-center px-6 py-20">
        <h1 className="text-5xl font-extrabold tracking-tight text-green-700">
          Vitaj v aplikácii{' '}
          <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
            Portál praxe
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-green-800">
          Spravuj svoju odbornú prax jednoducho, prehľadne a efektívne.
        </p>
      </main>

      {/* SEKCIA – ODBORNÁ PRAX */}
      <section
        id="odborna-prax"
        className="max-w-5xl mx-auto px-6 py-12 rounded-3xl bg-white shadow-sm border border-green-200"
      >
        <h2 className="text-2xl font-bold mb-6 text-green-700">
          Informácie o predmete Odborná prax
        </h2>

        <div className="grid md:grid-cols-2 gap-8 text-sm">
          <div className="space-y-2 text-green-800">
            <p><span className="font-semibold">Škola:</span> UKF Nitra</p>
            <p><span className="font-semibold">Fakulta:</span> FPVaI</p>
            <p><span className="font-semibold">Predmet:</span> Odborná prax</p>
            <p><span className="font-semibold">Kredity:</span> 5 </p>
            <p><span className="font-semibold">Rozsah:</span> min. 150 hodín</p>
          </div>

          <div className="space-y-2 text-green-800">
            <p className="font-semibold">Hlavné výstupy:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>prepojenie teórie s praxou v IT sektore</li>
              <li>získanie pracovných návykov a skúseností</li>
              <li>tímová spolupráca a komunikácia</li>
              <li>prezentácia výsledkov praxe</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto w-full border-t border-green-300 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:justify-between gap-6 text-sm">
          
          <div>
            <h3 className="text-base font-semibold mb-1 text-green-700">
              O nás
            </h3>
            <p className="max-w-md text-green-900">
              Portál praxe pomáha študentom jednoducho evidovať a dokumentovať svoju odbornú prax.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-1 text-green-700">
              Kontakt
            </h3>
            <p>Tel.: +421 900 000 000</p>
            <p>E-mail: d.halovnik@ukf.sk</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
