import { getCurrentProfile } from "@/lib/auth/guards";
import { AppShellFrame, type ShellMember } from "@/components/app-shell-frame";
import { memberSerial } from "@/lib/format/member";

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
  title: string;
  subtitle?: React.ReactNode;
  /** Tombol/aksi di kanan judul halaman. */
  actions?: React.ReactNode;
  role?: string;
}) {
  const profile = await getCurrentProfile();
  const member: ShellMember | null = profile
    ? { name: profile.fullName, username: profile.username, serial: memberSerial(profile.id) }
    : null;

  return (
    <AppShellFrame title={title} subtitle={subtitle} actions={actions} role={role ?? profile?.role ?? null} member={member}>
      {children}
    </AppShellFrame>
  );
}
