"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { logoutAction } from "@/lib/actions/auth-actions";
import { StatusPill } from "@/components/card";

const studentLinks = [
  ["/dashboard", "Dashboard", "dashboard"],
  ["/learning-paths", "Learning Paths", "paths"],
  ["/rooms", "Rooms", "rooms"],
  ["/progress", "Progress", "progress"],
  ["/leaderboard", "Leaderboard", "leaderboard"],
  ["/profile", "Profile", "profile"]
];

const instructorLinks = [
  ["/instructor", "Instructor Dashboard", "instructor"],
  ["/instructor/classes", "Classes", "classes"],
  ["/instructor/paths", "Learning Path Manager", "pathEdit"],
  ["/instructor/rooms", "Instructor Rooms", "roomEdit"],
  ["/instructor/students", "Students Progress", "students"]
];

const adminLinks = [
  ["/admin", "Admin Overview", "admin"],
  ["/admin/users", "Users Management", "users"],
  ["/admin/platform", "Platform Telemetry", "platform"],
  ["/admin/announcements", "Announcements Bulletins", "announcements"]
];

function NavIcon({ name }: { name: string }) {
  const common = "stroke-current";

  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M4 5h6v6H4V5ZM14 5h6v4h-6V5ZM14 13h6v6h-6v-6ZM4 15h6v4H4v-4Z" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "paths":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M6 18c5.5 0 2.5-12 8-12h4M16 4l2 2-2 2M6 6h3M6 12h6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "rooms":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M5 7h14v10H5V7Z" strokeWidth="1.8" strokeLinejoin="round" />
          <path className={common} d="M8 10h4M8 13h8M17 7V5M7 7V5" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "progress":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M5 17V9M12 17V5M19 17v-6" strokeWidth="1.8" strokeLinecap="round" />
          <path className={common} d="M4 19h16" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "leaderboard":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M8 20v-6H5v6h3ZM14 20V8h-4v12h4ZM19 20v-9h-3v9h3Z" strokeWidth="1.8" strokeLinejoin="round" />
          <path className={common} d="M12 4l.7 1.5 1.6.2-1.1 1.1.3 1.6L12 7.6l-1.5.8.3-1.6-1.1-1.1 1.6-.2L12 4Z" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" strokeWidth="1.8" strokeLinejoin="round" />
          <path className={common} d="M5 20a7 7 0 0 1 14 0" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "pathEdit":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M6 18c5.5 0 2.5-12 8-12h3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path className={common} d="m14 15 5-5 2 2-5 5h-2v-2Z" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "instructor":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 20c.8-4 3.3-6 7-6s6.2 2 7 6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path className={common} d="M17 4h4v4" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "classes":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M4 7h16M6 7v11h12V7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path className={common} d="M9 11h6M9 14h4" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "roomEdit":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M5 7h10v10H5V7Z" strokeWidth="1.8" strokeLinejoin="round" />
          <path className={common} d="m14 16 5-5 2 2-5 5h-2v-2Z" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "students":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 10a2.5 2.5 0 1 0 0-5" strokeWidth="1.8" strokeLinecap="round" />
          <path className={common} d="M3.5 20c.7-4 2.7-6 5.5-6s4.8 2 5.5 6M14.5 15c2.4.3 4 2 4.6 5" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M12 3.8 19 6.4v5.4c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6.4L12 3.8Z" strokeWidth="1.8" strokeLinejoin="round" />
          <path className={common} d="m9.5 12 1.7 1.7 3.5-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.8 20c.7-4 2.8-6 5.7-6 1.6 0 3 .6 4 1.8" strokeWidth="1.8" strokeLinecap="round" />
          <path className={common} d="M17 14v6M14 17h6" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "platform":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M12 4v5M12 15v5M4 12h5M15 12h5" strokeWidth="1.8" strokeLinecap="round" />
          <circle className={common} cx="12" cy="12" r="3" strokeWidth="1.8" />
        </svg>
      );
    case "announcements":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path className={common} d="M5 13h3l8 4V7l-8 4H5v2Z" strokeWidth="1.8" strokeLinejoin="round" />
          <path className={common} d="M18 10c1 .7 1 3 0 4" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return <span className="h-1.5 w-1.5 rounded-full bg-current" />;
  }
}

export function AppShell({
  children,
  title,
  subtitle,
  role
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  role?: string;
}) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const links = [
    ...studentLinks,
    ...(role === "INSTRUCTOR" || role === "ADMIN" ? instructorLinks : []),
    ...(role === "ADMIN" ? adminLinks : [])
  ];
  const activeHref = links
    .map(([href]) => href)
    .filter((href) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.length - a.length)[0];

  useEffect(() => {
    setIsSidebarCollapsed(localStorage.getItem("si-act-sidebar-collapsed") === "true");
  }, []);

  // Tutup drawer mobile setiap kali route berubah.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Kunci scroll halaman dan dukung tombol Escape saat drawer terbuka.
  useEffect(() => {
    if (!isMobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileNavOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen]);

  function toggleSidebar() {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("si-act-sidebar-collapsed", String(next));
      return next;
    });
  }

  function closeMobileNav() {
    setIsMobileNavOpen(false);
  }

  function renderNavLinks(collapsed: boolean, onNavigate?: () => void) {
    return links.map(([href, label, marker]) => {
      const isActive = href === activeHref;
      return (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          aria-current={isActive ? "page" : undefined}
          className={`group flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 ${
            isActive
              ? "border-primary-container/30 bg-primary-container/10 text-primary glow-active font-semibold"
              : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-white/[0.03] hover:text-slate-100"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-black transition-colors ${
                isActive ? "border-primary/30 bg-primary-container/10 text-primary" : "border-slate-800 bg-black/20 text-slate-500 group-hover:text-slate-300"
              }`}
            >
              <NavIcon name={marker} />
            </span>
            <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 overflow-hidden opacity-0" : "w-40 opacity-100"}`}>{label}</span>
          </div>
          <span className={`h-1.5 w-1.5 rounded-full transition-all ${isActive ? "scale-125 bg-primary" : "bg-transparent group-hover:bg-slate-700"}`} />
        </Link>
      );
    });
  }

  return (
    <div className="cyber-grid min-h-screen bg-background">
      {/* Sidebar navigation */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-30 hidden border-r border-slate-800 bg-[#0c0f17]/95 backdrop-blur-xl transition-[width,padding] duration-300 ease-out lg:flex lg:flex-col ${
          isSidebarCollapsed ? "w-20 p-3" : "w-72 p-5"
        }`}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          className={`absolute -right-5 bottom-28 z-40 hidden h-10 items-center justify-center gap-1.5 rounded-full border border-primary/35 bg-[#111827] px-3 text-xs font-black text-primary shadow-[0_0_20px_rgba(77,142,255,0.22),0_12px_28px_rgba(0,0,0,0.4)] ring-1 ring-white/10 transition-all duration-300 hover:-right-6 hover:border-primary/70 hover:bg-primary-container/15 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 lg:flex ${
            isSidebarCollapsed ? "w-10 px-0" : "min-w-[5.75rem]"
          }`}
        >
          <span aria-hidden="true">{isSidebarCollapsed ? ">" : "<"}</span>
          <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "w-0 overflow-hidden opacity-0" : "w-10 opacity-100"}`}>
            Hide
          </span>
        </button>

        {/* Brand Header */}
        <div className={`mb-6 flex items-center gap-3 ${isSidebarCollapsed ? "justify-center" : ""}`}>
          <Link href="/dashboard" className={`flex min-w-0 items-center gap-3 ${isSidebarCollapsed ? "justify-center" : ""}`}>
          <BrandMark collapsed={isSidebarCollapsed} />
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? "w-0 opacity-0" : "w-40 opacity-100"}`}>
            <span className="block text-sm font-bold tracking-tight text-glow text-primary font-headline-xl">Anon Cyber Team</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Controlled Intelligence</span>
          </div>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-grow space-y-1 overflow-y-auto pr-1" aria-label="Navigasi utama">
          {renderNavLinks(isSidebarCollapsed)}
        </nav>

        {/* Action / Logout */}
        <div className="mt-auto pt-4 border-t border-slate-800/60">
          <form action={logoutAction}>
            <button
              title={isSidebarCollapsed ? "Logout Session" : undefined}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-white/[0.02] py-2 px-3 text-xs font-semibold text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
              type="submit"
            >
              <span className="text-xs font-black">LO</span>
              <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "w-0 overflow-hidden opacity-0" : "w-28 opacity-100"}`}>
                Logout Session
              </span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-out ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        {/* Header toolbar */}
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#0a0e17]/80 px-4 py-4 backdrop-blur-xl sm:px-6">
          {/* Mobile top bar: brand + menu button (sidebar desktop tersembunyi di bawah lg) */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
              <BrandMark collapsed />
              <span className="truncate text-sm font-bold tracking-tight text-primary">Anon Cyber Team</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Buka menu navigasi"
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-navigation"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-primary/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path className="stroke-current" d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Menu
            </button>
          </div>

          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <StatusPill tone={role === "ADMIN" ? "warning" : role === "INSTRUCTOR" ? "primary" : "success"}>
                  {role ?? "PUBLIC_ACCESS"}
                </StatusPill>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Security Learning Node</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-50 font-headline-xl">{title}</h1>
              {subtitle ? <p className="mt-1 max-w-2xl text-xs text-slate-400">{subtitle}</p> : null}
            </div>

            {/* Quick search & status banner */}
            <div className="flex items-center gap-3">
              <div className="hidden min-w-72 items-center gap-2 rounded-lg border border-slate-800 bg-black/35 px-3 py-2 text-xs text-slate-500 md:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                <span>Search modules, tasks, telemetry...</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_12px_rgba(78,222,163,0.06)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Console Operational
              </div>
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-grow mx-auto w-full max-w-7xl p-4 sm:p-6 transition-all duration-300">{children}</div>
      </main>

      {/* Mobile navigation drawer */}
      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button type="button" aria-label="Tutup menu" onClick={closeMobileNav} className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm" />
          <aside
            id="mobile-navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-slate-800 bg-[#0c0f17] p-5 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <Link href="/dashboard" onClick={closeMobileNav} className="flex min-w-0 items-center gap-3">
                <BrandMark />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-bold tracking-tight text-primary">Anon Cyber Team</span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Controlled Intelligence</span>
                </div>
              </Link>
              <button
                type="button"
                onClick={closeMobileNav}
                aria-label="Tutup menu"
                className="rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                Tutup
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <StatusPill tone={role === "ADMIN" ? "warning" : role === "INSTRUCTOR" ? "primary" : "success"}>{role ?? "PUBLIC_ACCESS"}</StatusPill>
            </div>

            <nav className="flex-grow space-y-1 overflow-y-auto pr-1" aria-label="Navigasi mobile">
              {renderNavLinks(false, closeMobileNav)}
            </nav>

            <div className="mt-auto border-t border-slate-800/60 pt-4">
              <form action={logoutAction}>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-white/[0.02] px-3 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
                  type="submit"
                >
                  Logout Session
                </button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
