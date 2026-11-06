"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SiteFooter } from "@/components/site-footer";
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

/** Cookie status rail desktop ("1" diciutkan, "0" terbuka); dibaca server di components/app-shell.tsx dengan nama yang sama. */
const RAIL_COOKIE = "act-rail-collapsed";
/** Kunci localStorage lama; hanya dibaca sekali untuk dipindahkan ke cookie. */
const LEGACY_COLLAPSE_KEY = "si-act-sidebar-collapsed";

// Setelah hydrate pertama, frame yang dipasang ulang saat pindah halaman membaca cookie langsung, karena payload
// halaman dari cache router Next bisa membawa nilai cookie yang lama.
let shellHydrated = false;

function readRailCookie(): boolean | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)act-rail-collapsed=([01])(?:;|$)/);
    return match ? match[1] === "1" : null;
  } catch {
    return null;
  }
}

function writeRailCookie(collapsed: boolean) {
  try {
    document.cookie = `${RAIL_COOKIE}=${collapsed ? "1" : "0"}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Cookie diblokir: rail tetap berganti untuk halaman ini saja.
  }
}

/** Tooltip nama menu di rail yang diciutkan; posisinya fixed agar tidak terpotong daftar menu yang bisa digulir. */
type RailTip = { label: string; group?: string; top: number; left: number; instant: boolean };

function tipAnchor(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLElement>("[data-rail-tip]") : null;
}

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

/** Poin dan peringkat anggota untuk pil di bar atas (hanya untuk member). */
export type ShellStats = { points: number; rank: number | null };

export function AppShellFrame({
  children,
  title,
  subtitle,
  actions,
  role,
  member,
  stats,
  initialCollapsed = false
}: {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  role?: string | null;
  member?: ShellMember | null;
  stats?: ShellStats | null;
  /** Status rail dari cookie, dibaca di server agar HTML awal sudah sesuai dan tidak berubah setelah hydrate. */
  initialCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => (shellHydrated ? readRailCookie() ?? initialCollapsed : initialCollapsed));
  // Transisi lebar, padding, dan pudar label baru dipasang saat rail benar-benar diciutkan/dibuka di halaman ini,
  // sehingga halaman yang baru dimuat atau dibuka lewat navigasi langsung tampil dalam keadaan akhirnya.
  const [railMotion, setRailMotion] = useState(false);
  const [tip, setTip] = useState<RailTip | null>(null);
  const railRef = useRef<HTMLElement>(null);
  const tipAnchorRef = useRef<HTMLElement | null>(null);
  const tipHiddenAtRef = useRef(0);
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
  // Breadcrumb bar atas: grup menu ("Learn" untuk menu anggota) dan nama menu yang aktif.
  const activeGroup = groups.find((group) => group.links.some((link) => link.href === activeHref));
  const activeGroupLabel = activeGroup?.label ?? "Learn";
  const activeLabel = activeGroup?.links.find((link) => link.href === activeHref)?.label;

  // Preferensi lama tersimpan di localStorage dan baru terbaca setelah mount (penyebab rail melompat). Bila cookie belum
  // ada, pindahkan sekali ke cookie (rail boleh beranimasi kali ini saja); setelah itu localStorage tidak dibaca lagi.
  useEffect(() => {
    shellHydrated = true;
    if (readRailCookie() !== null) return;
    let legacyCollapsed = false;
    try {
      legacyCollapsed = localStorage.getItem(LEGACY_COLLAPSE_KEY) === "true";
      localStorage.removeItem(LEGACY_COLLAPSE_KEY);
    } catch {
      // Penyimpanan lokal tidak tersedia (mode privat): pakai rail terbuka.
    }
    writeRailCookie(legacyCollapsed);
    if (legacyCollapsed) {
      setRailMotion(true);
      setCollapsed(true);
    }
  }, []);

  const hideTip = useCallback(() => {
    if (!tipAnchorRef.current) return;
    tipAnchorRef.current = null;
    tipHiddenAtRef.current = performance.now();
    setTip(null);
  }, []);

  function showTip(anchor: HTMLElement) {
    const rail = railRef.current;
    const label = anchor.dataset.railTip;
    if (!rail || !label) return;
    const box = anchor.getBoundingClientRect();
    // Jarak 14 px dari tepi rail (atau dari tombol tepi yang menonjol keluar), di tengah tinggi item.
    const left = Math.max(rail.getBoundingClientRect().right, box.right) + 14;
    // Berpindah langsung dari satu item ke item lain tidak memudar ulang.
    const instant = tipAnchorRef.current !== null || performance.now() - tipHiddenAtRef.current < 150;
    tipAnchorRef.current = anchor;
    setTip({ label, group: anchor.dataset.railTipGroup, top: box.top + box.height / 2, left, instant });
  }

  // Tooltip mengikuti posisi saat muncul; gulir, ubah ukuran, atau Escape menutupnya.
  const tipOpen = tip !== null;
  useEffect(() => {
    if (!tipOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") hideTip();
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", hideTip, true);
    window.addEventListener("resize", hideTip);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", hideTip, true);
      window.removeEventListener("resize", hideTip);
    };
  }, [tipOpen, hideTip]);

  // Rail yang menetap di layout (editor room) tidak dipasang ulang saat pindah halaman; tutup tooltip-nya.
  useEffect(() => {
    hideTip();
  }, [pathname, hideTip]);

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
    const next = !collapsed;
    hideTip();
    setRailMotion(true);
    setCollapsed(next);
    writeRailCookie(next);
  }

  const railEase = "duration-300 ease-out motion-reduce:transition-none";
  const widthMotion = railMotion ? `transition-[width] ${railEase}` : "";
  const paddingMotion = railMotion ? `transition-[padding] ${railEase}` : "";
  const fadeMotion = railMotion ? "transition-opacity duration-200 motion-reduce:transition-none" : "";
  // Item rail selalu memudarkan warna saat disorot; padding hanya ikut beranimasi setelah rail di-toggle.
  const itemMotion = `${railMotion ? "transition-[padding,background-color,color]" : "transition-colors"} ${railEase}`;

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
                className={`field-label mb-1.5 whitespace-nowrap px-3 ${fadeMotion} ${isCollapsed ? "opacity-0" : "opacity-100 delay-100"}`}
              >
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-0.5" aria-labelledby={groupId}>
              {group.links.map((link) => {
                const active = link.href === activeHref;
                // Di rail yang diciutkan hanya ikon terlihat: beri nama lengkap agar "Overview" Teaching dan Admin bisa dibedakan.
                // Tooltip menampilkan grup dan nama menu seperti breadcrumb bar atas ("Teaching / Overview").
                const collapsedName = group.label ? `${group.label} ${link.label.toLowerCase()}` : link.label;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      aria-label={isCollapsed ? collapsedName : undefined}
                      data-rail-tip={isCollapsed ? link.label : undefined}
                      data-rail-tip-group={isCollapsed ? group.label : undefined}
                      className={`flex min-h-10 items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg text-[0.9375rem] ${itemMotion} lg:min-h-9 coarse:!min-h-11 ${
                        isCollapsed ? "px-[17px]" : "px-3"
                      } ${
                        active
                          ? "bg-cyan-soft font-semibold text-cyan-ink ring-1 ring-inset ring-cyan-ink/30"
                          : "text-ink-2 hover:bg-well/70 hover:text-ink"
                      }`}
                    >
                      <span className={active ? "text-cyan-ink" : "text-ink-3"}>
                        <NavIcon name={link.icon} />
                      </span>
                      <span
                        className={`truncate ${fadeMotion} ${isCollapsed ? "opacity-0" : "opacity-100 delay-100"}`}
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
            className={`grid ${railMotion ? `transition-[grid-template-rows,opacity] ${railEase}` : ""} ${isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
            aria-hidden={isCollapsed || undefined}
          >
            <div className="overflow-hidden">
              <Link
                href="/profile"
                onClick={onNavigate}
                tabIndex={isCollapsed ? -1 : undefined}
                className="mb-2 block whitespace-nowrap rounded-lg border border-line bg-paper/60 px-3 py-2.5 transition-colors hover:border-cyan-ink/50"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-display text-sm font-semibold text-ink">{member.name}</span>
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
            aria-label={isCollapsed ? "Sign out" : undefined}
            data-rail-tip={isCollapsed ? "Sign out" : undefined}
            className={`flex min-h-10 w-full items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg text-sm text-ink-2 ${itemMotion} hover:bg-sheet/60 hover:text-ink coarse:min-h-11 ${
              isCollapsed ? "px-[17px]" : "px-3"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={`${fadeMotion} ${isCollapsed ? "opacity-0" : "opacity-100 delay-100"}`} aria-hidden={isCollapsed || undefined}>
              Sign out
            </span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Rail desktop dengan satu-satunya gradasi. Landmark header (banner); di layar kecil perannya
          dipegang bar atas, dan hanya satu dari keduanya yang tampil. */}
      <header
        ref={railRef}
        id="app-rail"
        className={`rail-surface fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line lg:flex ${widthMotion} ${collapsed ? "w-[76px]" : "w-64"}`}
        // Tooltip hanya untuk mouse/pena dan fokus keyboard; item tanpa data-rail-tip (rail terbuka) diabaikan.
        onPointerOver={(event) => {
          if (event.pointerType === "touch") return;
          const anchor = tipAnchor(event.target);
          if (anchor && anchor !== tipAnchorRef.current) showTip(anchor);
        }}
        onPointerOut={(event) => {
          const from = tipAnchor(event.target);
          if (from && from === tipAnchorRef.current && tipAnchor(event.relatedTarget) !== from) hideTip();
        }}
        onFocus={(event) => {
          const anchor = tipAnchor(event.target);
          if (anchor?.matches(":focus-visible")) showTip(anchor);
        }}
        onBlur={hideTip}
      >
        <Link
          href="/dashboard"
          aria-label="Anon Cyber Team, go to dashboard"
          className={`flex items-center gap-3 overflow-hidden whitespace-nowrap pb-5 pt-5 ${paddingMotion} ${collapsed ? "px-[19px]" : "px-5"}`}
        >
          <BrandMark size={38} />
          <span className={`font-display text-base font-bold leading-tight tracking-[-0.01em] text-ink ${fadeMotion} ${collapsed ? "opacity-0" : "opacity-100 delay-100"}`} aria-hidden={collapsed || undefined}>
            Anon Cyber Team
          </span>
        </Link>

        {/* Tombol tepi: menumpang garis kanan rail sejajar logo, terlihat di kedua keadaan. Rail tanpa overflow,
            jadi tombol tidak terpotong; bagian yang menonjol hanya menutup padding kiri bar atas, bukan isi. */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="app-rail"
          data-rail-tip={collapsed ? "Expand sidebar" : undefined}
          className="rail-edge-toggle absolute -right-3.5 top-[26px] flex h-[26px] w-[26px] items-center justify-center rounded-md border border-line-strong bg-sheet text-ink-2 transition-colors duration-150 ease-out hover:border-cyan-ink/60 hover:text-cyan-ink focus-visible:border-cyan-ink/60 focus-visible:text-cyan-ink"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-3.5 w-3.5 ${railMotion ? "transition-transform duration-300 ease-out motion-reduce:transition-none" : ""} ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M11.5 6.5 6 12l5.5 5.5M18 6.5 12.5 12l5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {renderNav(collapsed, "Main navigation")}

        <ThemeToggle variant="rail" collapsed={collapsed} />

        {renderMemberCard(collapsed)}
      </header>

      {/* Tooltip rail diciutkan: lapisan mengambang di luar rail (lift), dekoratif karena item sudah punya aria-label. */}
      {tip ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed z-40 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-line-strong bg-sheet px-2.5 py-1 font-display text-[0.8125rem] font-semibold leading-5 text-ink shadow-lift lg:block ${
            tip.instant ? "" : "rail-tip-enter"
          }`}
          style={{ top: tip.top, left: tip.left }}
        >
          {tip.group ? (
            <>
              <span className="font-medium text-ink-3">{tip.group}</span>
              <span className="px-1 text-line-strong">/</span>
            </>
          ) : null}
          {tip.label}
        </div>
      ) : null}

      {/* Bar atas mobile. */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5 coarse:min-h-11" aria-label="Anon Cyber Team, go to dashboard">
          <BrandMark size={32} />
          <span className="truncate text-sm font-bold text-ink">Anon Cyber Team</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
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
      </header>

      <main className={`${paddingMotion} ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        {/* Bar atas desktop: posisi di menu (grup / halaman) dan poin anggota, menempel saat halaman digulir. */}
        <div className="sticky top-0 z-20 hidden h-14 items-center justify-between gap-4 border-b border-line bg-paper px-10 lg:flex">
          <p className="min-w-0 truncate text-sm text-ink-3">
            {activeGroupLabel}
            <span className="px-1.5 text-line-strong" aria-hidden="true">
              /
            </span>
            <span className="font-semibold text-ink">{activeLabel ?? title}</span>
          </p>
          {stats ? (
            <Link
              href="/leaderboard"
              className="figure shrink-0 rounded-lg border border-line-strong px-3 py-1.5 text-sm font-semibold text-ink-2 transition-colors hover:border-cyan-ink/60"
            >
              <span className="text-cyan-ink">{stats.points.toLocaleString("en-US")}</span> pts
              {stats.rank ? <span> · Rank #{stats.rank}</span> : null}
            </Link>
          ) : null}
        </div>
        {/* Konten halaman masuk dengan fade halus setiap pindah menu (frame dipasang ulang per halaman). */}
        <div className="page-enter mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">
          <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-ink [text-wrap:balance] lg:text-[2rem]">{title}</h1>
              {subtitle ? <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-ink-2">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>

      <div className={`${paddingMotion} ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <SiteFooter className="mx-auto w-full max-w-[1240px] px-4 pb-8 sm:px-6 lg:px-10" />
      </div>

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
          className={`rail-surface absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] flex-col border-r border-line shadow-lift transition-transform motion-reduce:transition-none duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
          <ThemeToggle variant="rail" />
          {renderMemberCard(false, closeDrawer)}
        </aside>
      </div>
    </div>
  );
}
