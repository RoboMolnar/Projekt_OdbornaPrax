import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/shared/apiClient';

type User = { id: number; email: string; name: string; role: string } | null;

export default function AppLayoutSpa({
  title,
  breadcrumbs,
  children,
}: {
  title?: string;
  breadcrumbs?: { title: string; href?: string }[];
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    api
      .get('/api/user')
      .then(r => setUser(r.data))
      .catch(() => setUser(null));
  }, []);

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      window.location.href = '/';
    }
  };

  const goToChangePassword = () => {
    navigate('/change-password');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* HEADER */}
      <header className="w-full border-b bg-white/80 backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 gap-4">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                OP
              </div>
              <span className="hidden sm:block">Portál praxe</span>
            </Link>

            <div className="text-sm text-slate-600 dark:text-slate-400 hidden md:block">
              {breadcrumbs?.map((b, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1.5">/</span>}
                  {b.href ? (
                    <Link className="hover:underline" to={b.href}>
                      {b.title}
                    </Link>
                  ) : (
                    <span>{b.title}</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white">
                      {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium leading-tight">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>

                  <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={goToChangePassword}
                  >
                    Zmeniť heslo
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600"
                    onClick={logout}
                  >
                    Odhlásiť sa
                  </Button>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Prihlásiť</Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline">Registrovať</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
