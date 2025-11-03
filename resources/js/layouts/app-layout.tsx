import * as React from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";
import type { User } from "@/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { UserMenuContent } from "@/components/user-menu-content";
import { LayoutDashboard } from "lucide-react";

type Crumb = { title: string; href?: string };

export default function AppLayout({
  title, breadcrumbs, children,
}: { title?: string; breadcrumbs?: Crumb[]; children: React.ReactNode; }) {
  const page = usePage<{ auth?: { user?: User } }>();
  const { auth } = page.props;
  const url = page.url;

  const norm = (u: string) => (u.split("?")[0].replace(/\/+$/, "") || "/");
  const isCurrent = (href: string) => norm(url) === norm(href);

  const refreshIfCurrent = (e: React.MouseEvent, href: string) => {
    if (isCurrent(href)) {
      e.preventDefault();
      router.visit(href, { replace: true, preserveState: false, preserveScroll: true });
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {title && <Head title={title} />}

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col justify-between border-r bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-800">
        <div className="p-4">
          <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-slate-100"
                onClick={(e) => refreshIfCurrent(e, "/")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 font-bold text-white">OP</div>
            <span className="font-semibold">Portál praxe</span>
          </Link>

          <div className="mt-6 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Platforma</div>

          <nav className="mt-2 space-y-1">
            <Link href="/dashboard-garant" onClick={(e) => refreshIfCurrent(e, "/dashboard-garant")}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 transition ${
                    isCurrent("/dashboard-garant")
                      ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard garanta</span>
            </Link>

            <Link href="/dashboard-student" onClick={(e) => refreshIfCurrent(e, "/dashboard-student")}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 transition ${
                    isCurrent("/dashboard-student")
                      ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard študenta</span>
            </Link>

            <Link href="/dashboard-company" onClick={(e) => refreshIfCurrent(e, "/dashboard-company")}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 transition ${
                    isCurrent("/dashboard-company")
                      ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard firmy</span>
            </Link>
          </nav>
        </div>

        <div className="border-t p-3 border-slate-200 dark:border-slate-800">
          {auth?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 rounded-lg px-2 text-left
                             text-slate-800 hover:bg-slate-100
                             dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full
                                  bg-slate-200 text-slate-900
                                  dark:bg-slate-700 dark:text-white">
                    {auth.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{auth.user.name}</div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start" side="top"
                className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <UserMenuContent user={auth.user} />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center justify-between">
              <Link href="/login" className="text-sm hover:underline">Prihlásiť</Link>
              <Link href="/register" className="text-sm hover:underline">Registrovať</Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Header s breadcrumbs + ThemeToggle (⬇️ tu je prepínač) */}
        <header className="w-full border-b bg-white/80 backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {breadcrumbs?.map((b, i) => {
                const raw = b.href ?? norm(url);
                const href = norm(raw) === "/dashboard" ? norm(url) : raw;
                return (
                  <span key={i}>
                    {i > 0 && <span className="mx-1.5">/</span>}
                    {href ? (
                      <Link className="hover:underline" href={href} onClick={(e) => refreshIfCurrent(e, href)}>
                        {b.title}
                      </Link>
                    ) : (<span>{b.title}</span>)}
                  </span>
                );
              })}
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
