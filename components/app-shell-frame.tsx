"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { NightModeToggle } from "@/components/theme/night-mode";
import { logoutAction } from "@/lib/actions/auth-actions";

type NavLink = { href: string; label: string; icon: IconName };
type NavGroup = { label?: string; links: NavLink[] };

type IconName =
  | "dashboard"
  | "paths"
  | "rooms"
  | "progress"
  | "leaderboard"
  | "profile"
  | "instructor"
  | "classes"
  | "pathEdit"
  | "roomEdit"
  | "students"
  | "admin"
  | "users"
  | "platform"
  | "announcements";

const memberGroup: NavGroup = {
  links: [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/learning-paths", label: "Learning paths", icon: "paths" },
    { href: "/rooms", label: "Rooms", icon: "rooms" },
    { href: "/progress", label: "Progress", icon: "progress" },
    { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
    { href: "/profile", label: "Profile", icon: "profile" }
  ]
};

const instructorGroup: NavGroup = {
  label: "Teaching",
  links: [
    { href: "/instructor", label: "Overview", icon: "instructor" },
    { href: "/instructor/paths", label: "Path manager", icon: "pathEdit" },
    { href: "/instructor/rooms", label: "Room manager", icon: "roomEdit" },
    { href: "/instructor/classes", label: "Classes", icon: "classes" },
    { href: "/instructor/students", label: "Members", icon: "students" }
  ]
};

const adminGroup: NavGroup = {
  label: "Admin",
  links: [
    { href: "/admin", label: "Overview", icon: "admin" },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/platform", label: "Platform", icon: "platform" },
    { href: "/admin/announcements", label: "Announcements", icon: "announcements" }
  ]
};

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Member",
  INSTRUCTOR: "Instructor",
  ADMIN: "Admin"
};

const COLLAPSE_KEY = "si-act-sidebar-collapsed";

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <path d="M4 5h6v6H4V5ZM14 5h6v4h-6V5ZM14 13h6v6h-6v-6ZM4 15h6v4H4v-4Z" strokeLinejoin="round" />,
    paths: <path d="M6 18c5.5 0 2.5-12 8-12h4M16 4l2 2-2 2M6 6h3M6 12h6" strokeLinecap="round" strokeLinejoin="round" />,
    rooms: (
      <>
        <path d="M5 7h14v10H5V7Z" strokeLinejoin="round" />
        <path d="M8 10h4M8 13h8M17 7V5M7 7V5" strokeLinecap="round" />
      </>
    ),
    progress: <path d="M5 17V9M12 17V5M19 17v-6M4 20h16" strokeLinecap="round" />,
    leaderboard: <path d="M8 20v-6H5v6h3ZM14 20V8h-4v12h4ZM19 20v-9h-3v9h3Z" strokeLinejoin="round" />,
    profile: (
      <>
        <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" strokeLinejoin="round" />
        <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
      </>
    ),
    instructor: <path d="M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 20c.8-4 3.3-6 7-6s6.2 2 7 6M17 4h4v4" strokeLinecap="round" strokeLinejoin="round" />,
    classes: <path d="M4 7h16M6 7v11h12V7M9 11h6M9 14h4" strokeLinecap="round" strokeLinejoin="round" />,
    pathEdit: <path d="M6 18c5.5 0 2.5-12 8-12h3M14 15l5-5 2 2-5 5h-2v-2Z" strokeLinecap="round" strokeLinejoin="round" />,
    roomEdit: <path d="M5 7h10v10H5V7ZM14 16l5-5 2 2-5 5h-2v-2Z" strokeLinejoin="round" />,
    students: (
      <path
        d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 10a2.5 2.5 0 1 0 0-5M3.5 20c.7-4 2.7-6 5.5-6s4.8 2 5.5 6M14.5 15c2.4.3 4 2 4.6 5"
        strokeLinecap="round"
      />
    ),
    admin: <path d="M12 3.8 19 6.4v5.4c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6.4L12 3.8ZM9.5 12l1.7 1.7 3.5-4" strokeLinecap="round" strokeLinejoin="round" />,
    users: <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.8 20c.7-4 2.8-6 5.7-6 1.6 0 3 .6 4 1.8M17 14v6M14 17h6" strokeLinecap="round" />,
    platform: (
      <>
        <path d="M12 4v5M12 15v5M4 12h5M15 12h5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    announcements: <path d="M5 13h3l8 4V7l-8 4H5v2ZM18 10c1 .7 1 3 0 4" strokeLinecap="round" strokeLinejoin="round" />
  };

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export type ShellMember = {
  name: string;
  username: string;
  serial: string;
};

export function AppShellFrame({
  children,
  title,
  subtitle,
  actions,
  role,
  member
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  role?: string | null;
  member?: ShellMember | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const drawerRootRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);

  const groups: NavGroup[] = [
    memberGroup,
    ...(role === "INSTRUCTOR" || role === "ADMIN" ? [instructorGroup] : []),
    ...(role === "ADMIN" ? [adminGroup] : [])
  ];

  const activeHref = groups
    .flatMap((group) => group.links.map((link) => link.href))
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "true");
    } catch {
      // Penyimpanan lokal tidak tersedia (mode privat): pakai rail terbuka.
    }
  }, []);

  // Drawer tertutup tidak boleh bisa difokus atau dibaca walau tetap terpasang untuk animasi.
  useEffect(() => {
    if (drawerRootRef.current) drawerRootRef.current.inert = !drawerOpen;
  }, [drawerOpen]);

  // Tutup drawer mobile setiap kali route berubah (fokus pindah ke halaman baru, bukan ke tombol Menu).
  useEffect(() => {
    restoreFocusRef.current = false;
    setDrawerOpen(false);
  }, [pathname]);

  function closeDrawer() {
    restoreFocusRef.current = true;
    setDrawerOpen(false);
  }

  // Saat drawer terbuka: fokus masuk ke dialog, Tab berputar di dalamnya, Escape menutup, scroll halaman dikunci.
  // Bila layar melebar sampai rail desktop muncul, drawer ditutup agar kunci scroll tidak tertinggal.
  useEffect(() => {
    if (!drawerOpen) {
      if (restoreFocusRef.current) menuButtonRef.current?.focus();
      restoreFocusRef.current = false;
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!drawerRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }

    const desktop = window.matchMedia("(min-width: 1024px)");
    function handleBreakpoint(event: MediaQueryListEvent) {
      if (event.matches) setDrawerOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", handleBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", handleBreakpoint);
    };
  }, [drawerOpen]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // Abaikan: preferensi hanya kenyamanan.
      }
      return next;
    });
  }

  function renderNav(isCollapsed: boolean, ariaLabel: string, onNavigate?: () => void) {
    const idPrefix = isCollapsed ? "rail-collapsed" : onNavigate ? "rail-mobile" : "rail";
    return (
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4" aria-label={ariaLabel}>
        {groups.map((group, groupIndex) => {
          const groupId = group.label ? `${idPrefix}-${group.label.toLowerCase()}` : undefined;
          return (
          <div key={group.label ?? "member"} className={groupIndex > 0 ? "mt-4" : ""}>
            {group.label ? (
              // Label grup memudar saat rail diciutkan; tingginya tetap agar ikon tidak melompat.
              <p
                id={groupId}
                className={`field-label mb-1.5 whitespace-nowrap px-3 transition-opacity motion-reduce:transition-none duration-200 ${isCollapsed ? "opacity-0" : "opacity-100 delay-100"}`}
              >
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-0.5" aria-labelledby={groupId}>
              {group.links.map((link) => {
                const active = link.href === activeHref;
                // Di rail yang diciutkan hanya ikon terlihat: beri nama lengkap agar "Overview" Teaching dan Admin bisa dibedakan.
                const collapsedName = group.label ? `${group.label} ${link.label.toLowerCase()}` : link.label;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      title={isCollapsed ? collapsedName : undefined}
                      aria-label={isCollapsed ? collapsedName : undefined}
                      className={`flex min-h-10 items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg text-[0.9375rem] transition-[padding,background-color,color] motion-reduce:transition-none duration-300 ease-out lg:min-h-9 ${
                        isCollapsed ? "px-[17px]" : "px-3"
                      } ${
                        active
                          ? "bg-sheet font-semibold text-ink shadow-sheet ring-1 ring-line"
                          : "text-ink-2 hover:bg-sheet/60 hover:text-ink"
                      }`}
                    >
                      <span className={active ? "text-cyan-ink" : "text-ink-3"}>
                        <NavIcon name={link.icon} />
                      </span>
                      <span
                        className={`truncate transition-opacity motion-reduce:transition-none duration-200 ${isCollapsed ? "opacity-0" : "opacity-100 delay-100"}`}
                        aria-hidden={isCollapsed || undefined}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}
      </nav>
    );
  }

  function renderMemberCard(isCollapsed: boolean, onNavigate?: () => void) {
    return (
      <div className="border-t border-line/80 px-3 pb-4 pt-3">
        {member ? (
          // Kartu anggota menyusut halus saat rail diciutkan (grid 1fr -> 0fr), lalu tidak bisa difokus.
          <div
            className={`grid transition-[grid-template-rows,opacity] motion-reduce:transition-none duration-300 ease-out ${isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
            aria-hidden={isCollapsed || undefined}
          >
            <div className="overflow-hidden">
              <Link
                href="/profile"
                onClick={onNavigate}
                tabIndex={isCollapsed ? -1 : undefined}
                className="mb-2 block whitespace-nowrap rounded-lg border border-line bg-sheet/80 px-3 py-2.5 transition-colors hover:border-line-strong"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{member.name}</span>
                  <span className="field-label shrink-0">{ROLE_LABEL[role ?? ""] ?? "Member"}</span>
                </span>
                <span className="serial mt-1 block">{member.serial}</span>
              </Link>
            </div>
          </div>
        ) : null}
        <form action={logoutAction}>
          <button
            type="submit"
            title={isCollapsed ? "Sign out" : undefined}
            aria-label={isCollapsed ? "Sign out" : undefined}
            className={`flex min-h-10 w-full items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg text-sm text-ink-2 transition-[padding,background-color,color] motion-reduce:transition-none duration-300 ease-out hover:bg-sheet/60 hover:text-ink ${
              isCollapsed ? "px-[17px]" : "px-3"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={`transition-opacity motion-reduce:transition-none duration-200 ${isCollapsed ? "opacity-0" : "opacity-100 delay-100"}`} aria-hidden={isCollapsed || undefined}>
              Sign out
            </span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Rail desktop: gradasi iris dengan grid titik halus. */}
      <aside
        className={`digital-surface fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line transition-[width] motion-reduce:transition-none duration-300 ease-out lg:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <Link
          href="/dashboard"
          aria-label="Anon Cyber Team, go to dashboard"
          className={`flex items-center gap-3 overflow-hidden whitespace-nowrap pb-5 pt-5 transition-[padding] motion-reduce:transition-none duration-300 ease-out ${collapsed ? "px-[19px]" : "px-5"}`}
        >
          <BrandMark size={38} />
          <span className={`text-[0.9375rem] font-bold leading-tight tracking-[-0.01em] text-ink transition-opacity motion-reduce:transition-none duration-200 ${collapsed ? "opacity-0" : "opacity-100 delay-100"}`} aria-hidden={collapsed || undefined}>
            Anon Cyber Team
          </span>
        </Link>

        {renderNav(collapsed, "Main navigation")}

        <NightModeToggle variant="rail" collapsed={collapsed} />

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`mx-3 mb-1 flex min-h-9 items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg text-sm text-ink-3 transition-[padding,background-color,color] motion-reduce:transition-none duration-300 ease-out hover:bg-sheet/60 hover:text-ink ${
            collapsed ? "px-[17px]" : "px-3"
          }`}
        >
          <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] transition-transform motion-reduce:transition-none duration-300 ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M15 6l-6 6 6 6M5 5v14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={`transition-opacity motion-reduce:transition-none duration-200 ${collapsed ? "opacity-0" : "opacity-100 delay-100"}`} aria-hidden={collapsed || undefined}>
            Collapse
          </span>
        </button>

        {renderMemberCard(collapsed)}
      </aside>

      {/* Bar atas mobile. */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5" aria-label="Anon Cyber Team, go to dashboard">
          <BrandMark size={32} />
          <span className="truncate text-sm font-bold text-ink">Anon Cyber Team</span>
        </Link>
        <div className="flex items-center gap-2">
          <NightModeToggle variant="icon" />
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-navigation"
            className="btn-secondary btn-sm"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
            Menu
          </button>
        </div>
      </div>

      <main className={`transition-[padding] motion-reduce:transition-none duration-300 ease-out ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        {/* Konten halaman masuk dengan fade halus setiap pindah menu (frame dipasang ulang per halaman). */}
        <div className="page-enter mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-9">
          <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.018em] text-ink [text-wrap:balance] lg:text-[2rem]">{title}</h1>
              {subtitle ? <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-ink-2">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>

      {/* Drawer mobile selalu terpasang agar bisa meluncur masuk/keluar; saat tertutup tidak terlihat dan inert. */}
      <div
        ref={drawerRootRef}
        className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? "visible" : "invisible"}`}
        style={{ transition: drawerOpen ? "visibility 0s" : "visibility 0s linear 300ms" }}
        role={drawerOpen ? "dialog" : undefined}
        aria-modal={drawerOpen ? true : undefined}
        aria-label={drawerOpen ? "Navigation menu" : undefined}
        aria-hidden={drawerOpen ? undefined : true}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={closeDrawer}
          className={`absolute inset-0 h-full w-full bg-[rgb(var(--scrim)/0.35)] transition-opacity motion-reduce:transition-none duration-300 ease-out ${drawerOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          ref={drawerRef}
          id="mobile-navigation"
          className={`digital-surface absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] flex-col border-r border-line shadow-lift transition-transform motion-reduce:transition-none duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-4">
            <span className="flex items-center gap-2.5">
              <BrandMark size={34} />
              <span className="text-sm font-bold text-ink">Anon Cyber Team</span>
            </span>
            <button ref={closeButtonRef} type="button" onClick={closeDrawer} className="btn-ghost btn-sm">
              Close
            </button>
          </div>
          {renderNav(false, "Mobile navigation", closeDrawer)}
          <NightModeToggle variant="rail" />
          {renderMemberCard(false, closeDrawer)}
        </aside>
      </div>
    </div>
  );
}
