import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api } from '@/shared/apiClient';

type User = { id: number; email: string; name: string; role: string } | null;

export default function AppLayoutSpa({ title, breadcrumbs, children }: { title?: string; breadcrumbs?: { title: string; href?: string }[]; children: React.ReactNode; }) {
  const [user, setUser] = useState<User>(null);
  const loc = useLocation();

  useEffect(() => { if (title) document.title = title; }, [title]);
  useEffect(() => { api.get('/api/user').then(r => setUser(r.data)).catch(() => setUser(null)); }, []);

  const norm = (u: string) => (u.split('?')[0].replace(/\/+$/, '') || '/');
  const isCurrent = (href: string) => norm(loc.pathname) === norm(href);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <aside className="hidden md:flex w-64 flex-col justify-between border-r bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-800">
        <div className="p-4">
          <Link to="/" className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 font-bold text-white">OP</div>
            <span className="font-semibold">Portál praxe</span>
          </Link>
          <div className="mt-6 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Platforma</div>
          <nav className="mt-2 space-y-1">
            <Link to="/dashboard-garant" className={`flex items-center gap-2 rounded-md px-3 py-2 transition ${isCurrent('/dashboard-garant') ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}>Dashboard garanta</Link>
            <Link to="/dashboard-student" className={`flex items-center gap-2 rounded-md px-3 py-2 transition ${isCurrent('/dashboard-student') ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}>Dashboard študenta</Link>
            <Link to="/dashboard-company" className={`flex items-center gap-2 rounded-md px-3 py-2 transition ${isCurrent('/dashboard-company') ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}>Dashboard firmy</Link>
          </nav>
        </div>
        <div className="border-t p-3 border-slate-200 dark:border-slate-800">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 rounded-lg px-2 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white">
                    {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{user.name}</div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="p-2 text-sm">Prihlásený</div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center justify-between">
              <Link to="/login" className="text-sm hover:underline">Prihlásiť</Link>
              <Link to="/register" className="text-sm hover:underline">Registrovať</Link>
            </div>
          )}
        </div>
      </aside>
      <div className="flex-1">
        <header className="w-full border-b bg-white/80 backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {breadcrumbs?.map((b, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1.5">/</span>}
                  {b.href ? <Link className="hover:underline" to={b.href}>{b.title}</Link> : <span>{b.title}</span>}
                </span>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

