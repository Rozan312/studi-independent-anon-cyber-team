import { redirect } from "next/navigation";
import { loadMemberRoom } from "../room-view";

export const dynamic = "force-dynamic";

/**
 * Halaman Tasks lama. Task kini tampil di bawah bab materinya, jadi alamat ini (tautan lama, riwayat profil)
 * diarahkan ke bab yang memuat task terbuka pertama. Peserta di luar jadwal room diarahkan ke halaman room,
 * yang menampilkan jadwalnya.
 */
export default async function RoomTasksPage({ params }: { params: { slug: string } }) {
  const view = await loadMemberRoom(params.slug);
  redirect(view.access === "schedule" ? `/rooms/${view.room.slug}` : view.tasksHref);
}
