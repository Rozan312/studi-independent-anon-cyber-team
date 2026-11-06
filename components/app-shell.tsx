import { cookies } from "next/headers";
import { getCurrentProfile } from "@/lib/auth/guards";
import { AppShellFrame, type ShellMember, type ShellStats } from "@/components/app-shell-frame";
import { memberSerial } from "@/lib/format/member";
import { getUserLeaderboardStanding } from "@/lib/services/leaderboard-service";

/** Ditulis AppShellFrame saat rail desktop diciutkan/dibuka (nama sama dengan RAIL_COOKIE di app-shell-frame.tsx). */
const RAIL_COOKIE = "act-rail-collapsed";

/**
 * Kerangka halaman yang sudah login: rail navigasi, kartu anggota, dan judul halaman.
 * Komponen server: data anggota diambil sekali di sini agar halaman tidak perlu meneruskannya.
 */
export async function AppShell({
  children,
  title,
  subtitle,
  actions,
  role
}: {
  children: React.ReactNode;
  /** Judul halaman; boleh berisi elemen (misalnya nama anggota bercyan di sapaan dasbor). */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Tombol/aksi di kanan judul halaman. */
  actions?: React.ReactNode;
  role?: string;
}) {
  const profile = await getCurrentProfile();
  const member: ShellMember | null = profile
    ? { name: profile.fullName, username: profile.username, serial: memberSerial(profile.id) }
    : null;
  // Pil poin di bar atas hanya untuk member; instruktur dan admin tidak mengumpulkan poin.
  const standing = profile?.role === "STUDENT" ? await getUserLeaderboardStanding(profile.id) : null;
  const stats: ShellStats | null = standing ? { points: standing.points, rank: standing.rank } : null;
  // Rail dirender di server dalam keadaan akhirnya (diciutkan atau terbuka), jadi tidak berganti setelah hydrate.
  const initialCollapsed = cookies().get(RAIL_COOKIE)?.value === "1";

  return (
    <AppShellFrame
      title={title}
      subtitle={subtitle}
      actions={actions}
      role={role ?? profile?.role ?? null}
      member={member}
      stats={stats}
      initialCollapsed={initialCollapsed}
    >
      {children}
    </AppShellFrame>
  );
}
