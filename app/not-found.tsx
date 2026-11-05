import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/auth-frame";

export const metadata: Metadata = { title: "Page not found" };

/** 404 untuk seluruh aplikasi: alamat salah, atau room/path yang belum terbit, diganti, atau dihapus. */
export default function NotFound() {
  return (
    <AuthFrame
      title="Page not found"
      description="Nothing lives at this address. The room or path may be unpublished, renamed, or removed."
    >
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className="btn-primary">
          Go to your dashboard
        </Link>
        <Link href="/learning-paths" className="btn-secondary">
          Browse learning paths
        </Link>
      </div>
    </AuthFrame>
  );
}
