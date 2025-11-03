import * as React from "react";
import { Head, Link } from "@inertiajs/react";

type Crumb = { title: string; href?: string };

export default function AppLayout({
  title,
  breadcrumbs,
  children,
}: {
  title?: string;
  breadcrumbs?: Crumb[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {title && <Head title={title} />}

      {/* Top bar */}
      <header className="w-full border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold">Portál praxe</Link>
          <nav className="text-sm text-slate-600">
            {breadcrumbs?.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1.5">/</span>}
                {b.href ? (
                  <Link className="hover:underline" href={b.href}>{b.title}</Link>
                ) : (
                  <span>{b.title}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
