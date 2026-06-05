import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { listPublishedRooms } from "@/lib/services/room-service";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const profile = await requireRole(["STUDENT"]);
  const rooms = await listPublishedRooms();

  // Premium, high-contrast, cybersecurity category backgrounds
  const coverImages = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuARwHd_wAvPfPttoRNcaJz5MFzvSAKVdeNy7iu_dhupcYgueRro3o6g-O6GywKbBpJbv7pRG1EnrgT4DsidupWTwHPzs7ainVNwEQldb2egMVd__OaZJ2AfE2bXdG2iOGgX_VljmKaHTgD937Fk6IXFbAQQjCSw3ZHGfcA-mvKecyWchggxlnuTsZV0EMcXQj6L0p3FHTVG2yO6JA2zevZOMeP_Pl5LyABbEwn9XSkhRGMooPXyasVEwIe8YKUgjiZkaiG4kqyGsLWz",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDitxxK8Sajo65Q5AE_pM4GLJj8HEPd-WoV3O-WmBblZaO2JXesL4ASspTRt98phemlDiO57vaOSOzy7Nkn3LOJYjkihR3RYUwRjEt8saBvwXjAEcwwdB1ijc3OKUbzOgiOpulD6-rFhiUdyhd2w3Tz6X1-gnJ_YemGd3LYKt5CTEhMavur_Sys5D7C_Bk4W30is0AVEXSL1NMbYW88M8FZnDHiymU7wMS-7sbOh0Bh7L9sSQWyJSK9kpWECHMx1IBP9mUwJteFboX4",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAKq6REjGBwLoX5dGhcmURfQWhYwi54vk1jxwqTl0J8oIrCimr7SeT74fozpBJDcG2pVruGpNJZo9PwKdHK7G0YMTb1pPNgLQq_-ZtJT00SjMNYufDZetb8KXQzHgCq-3FiWPP88zUyHuEHUU_JLncy_Q1e1h_hA4j7wu4SnLALR69QF2KdyKmngWzRyy4wZVC_M3-4FYO5mSWovH6NfSWsPhFoLqoqup-xnJZ6g3OZA4_Q6HwGuV3p5bcD9SRK76gwoEY4kpAwcTe-"
  ];

  return (
    <AppShell title="Rooms" subtitle="Safe operational environments with hands-on labs and objective assessments." role={profile.role}>
      <Card className="p-6">
        <SectionHeader eyebrow="Training Rooms" title="Available modules" />
        
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room, index) => {
            const isBeginner = room.difficulty === "Beginner";
            const isMedium = room.difficulty === "Medium" || room.difficulty === "Intermediate";
            
            let difficultyTone: "success" | "primary" | "warning" = "primary";
            if (isBeginner) difficultyTone = "success";
            else if (isMedium) difficultyTone = "warning";

            return (
              <Link
                key={room.id}
                href={`/rooms/${room.slug}`}
                className="group block bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] overflow-hidden hover:border-blue-500/40 transition-all duration-300 group hover:-translate-y-1 shadow-lg backdrop-blur-md"
              >
                {/* Visual Cover Banner */}
                <div className="h-36 bg-[#0f131d] relative overflow-hidden">
                  <Image
                    alt={room.title}
                    className="object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-75"
                    src={coverImages[index % coverImages.length]}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c1f2a] to-transparent" />
                  
                  {/* Category capsule */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/60 border border-white/[0.08] text-[9px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md">
                      {room.category}
                    </span>
                  </div>

                  {/* Difficulty card bubble */}
                  <div className="absolute top-3 right-3">
                    <StatusPill tone={difficultyTone}>{room.difficulty}</StatusPill>
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-50 group-hover:text-primary transition-colors duration-250 leading-tight">
                      {room.title}
                    </h2>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {room.description}
                    </p>
                  </div>

                  <div className="mt-4">
                    {/* Path name info */}
                    <div className="mb-4 text-[10px] text-slate-500 font-medium tracking-wide flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {room.learningPath.title}
                    </div>

                    {/* Operational Stats row */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg border border-white/[0.04] bg-black/30 py-2.5">
                        <p className="font-bold text-slate-50">{room._count.tasks}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">tasks</p>
                      </div>
                      <div className="rounded-lg border border-white/[0.04] bg-black/30 py-2.5">
                        <p className="font-bold text-slate-50">{room.estimatedMinutes}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">min</p>
                      </div>
                      <div className="rounded-lg border border-white/[0.04] bg-black/30 py-2.5">
                        <p className="font-bold text-primary">{room.points}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">pts</p>
                      </div>
                    </div>

                    {/* Open Room Button action */}
                    <div className="mt-4 w-full rounded-lg border border-white/[0.08] group-hover:border-primary/40 bg-white/[0.02] group-hover:bg-primary-container/10 py-2.5 text-center text-xs font-semibold text-slate-300 group-hover:text-white transition-all duration-300 shadow-md">
                      Open Room
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}
