import Link from "next/link";
import Image from "next/image";
import { AnnouncementAudience } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { listPublishedLearningPaths, getLearningPathProgressForCurrentUser } from "@/lib/services/learning-path-service";
import { getGlobalLeaderboard } from "@/lib/services/leaderboard-service";

export const dynamic = "force-dynamic";

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export default async function DashboardPage() {
  const profile = await requireRole(["STUDENT"]);
  
  // Parallel fetch operations
  const [
    paths,
    progressRows,
    leaderboard,
    announcements,
    taskSubmissions,
    allCompletedRooms,
    pathsWithRooms,
    recentSubmissions,
    recentProgress
  ] = await Promise.all([
    listPublishedLearningPaths(),
    prisma.userRoomProgress.findMany({
      where: { userId: profile.id },
      include: { room: { include: { learningPath: true } } },
      orderBy: { updatedAt: "desc" },
      take: 4
    }),
    getGlobalLeaderboard(5),
    prisma.announcement.findMany({
      where: {
        isPublished: true,
        audience: { in: [AnnouncementAudience.ALL, profile.role as AnnouncementAudience] }
      },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.userTaskSubmission.count({ where: { userId: profile.id, isCorrect: true } }),
    prisma.userRoomProgress.findMany({
      where: { userId: profile.id, status: "COMPLETED" },
      select: { roomId: true }
    }),
    prisma.learningPath.findMany({
      where: { isPublished: true },
      include: { rooms: { where: { isPublished: true } } }
    }),
    prisma.userTaskSubmission.findMany({
      where: { userId: profile.id, isCorrect: true },
      include: { task: { include: { room: true } } },
      orderBy: { submittedAt: "desc" },
      take: 3
    }),
    prisma.userRoomProgress.findMany({
      where: { userId: profile.id },
      include: { room: true },
      orderBy: { updatedAt: "desc" },
      take: 3
    })
  ]);

  const completedRoomsCount = allCompletedRooms.length;
  const activeRoom = progressRows[0];
  const activeProgress = activeRoom?.progressPercentage ?? 0;
  const totalPoints = leaderboard.find((row) => row.user?.id === profile.id)?.points ?? 0;

  // Calculate dynamic completed paths
  const completedRoomIds = new Set(allCompletedRooms.map((r) => r.roomId));
  const completedPathsCount = pathsWithRooms.filter((p) => {
    if (p.rooms.length === 0) return false;
    return p.rooms.every((r) => completedRoomIds.has(r.id));
  }).length;

  // Retrieve details for the active path timeline
  const activePathSlug = activeRoom?.room?.learningPath?.slug;
  const activePathDetails = activePathSlug ? await getLearningPathProgressForCurrentUser(profile.id, activePathSlug) : null;

  // Build dynamic activities log
  const activities = [
    ...recentSubmissions.map((s) => ({
      id: `sub-${s.id}`,
      text: `Completed task ${s.task.title}`,
      date: s.submittedAt,
      marker: "TS",
      color: "text-primary"
    })),
    ...recentProgress.map((p) => ({
      id: `prog-${p.id}`,
      text: p.status === "COMPLETED" ? `Completed room ${p.room.title}` : `Started room ${p.room.title}`,
      date: p.updatedAt,
      marker: p.status === "COMPLETED" ? "OK" : "GO",
      color: p.status === "COMPLETED" ? "text-emerald-400" : "text-blue-400"
    }))
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3);

  // Fallback covers in case paths don't have custom ones
  const pathCovers = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuARwHd_wAvPfPttoRNcaJz5MFzvSAKVdeNy7iu_dhupcYgueRro3o6g-O6GywKbBpJbv7pRG1EnrgT4DsidupWTwHPzs7ainVNwEQldb2egMVd__OaZJ2AfE2bXdG2iOGgX_VljmKaHTgD937Fk6IXFbAQQjCSw3ZHGfcA-mvKecyWchggxlnuTsZV0EMcXQj6L0p3FHTVG2yO6JA2zevZOMeP_Pl5LyABbEwn9XSkhRGMooPXyasVEwIe8YKUgjiZkaiG4kqyGsLWz",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDitxxK8Sajo65Q5AE_pM4GLJj8HEPd-WoV3O-WmBblZaO2JXesL4ASspTRt98phemlDiO57vaOSOzy7Nkn3LOJYjkihR3RYUwRjEt8saBvwXjAEcwwdB1ijc3OKUbzOgiOpulD6-rFhiUdyhd2w3Tz6X1-gnJ_YemGd3LYKt5CTEhMavur_Sys5D7C_Bk4W30is0AVEXSL1NMbYW88M8FZnDHiymU7wMS-7sbOh0Bh7L9sSQWyJSK9kpWECHMx1IBP9mUwJteFboX4",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAKq6REjGBwLoX5dGhcmURfQWhYwi54vk1jxwqTl0J8oIrCimr7SeT74fozpBJDcG2pVruGpNJZo9PwKdHK7G0YMTb1pPNgLQq_-ZtJT00SjMNYufDZetb8KXQzHgCq-3FiWPP88zUyHuEHUU_JLncy_Q1e1h_hA4j7wu4SnLALR69QF2KdyKmngWzRyy4wZVC_M3-4FYO5mSWovH6NfSWsPhFoLqoqup-xnJZ6g3OZA4_Q6HwGuV3p5bcD9SRK76gwoEY4kpAwcTe-"
  ];

  return (
    <AppShell
      title={`Welcome back, ${profile.fullName}`}
      subtitle="Track learning progress, continue safe labs, and review platform announcements."
      role={profile.role}
    >
      {/* Welcome Area */}
      <section className="relative rounded-xl border border-white/[0.08] bg-[#1c1f2a]/70 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 glass-panel overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-100">
            Welcome back, <span className="text-primary text-glow">{profile.fullName.split(" ")[0]}</span>.
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Your network intrusion metrics are improving. Keep learning inside approved rooms. Lab sessions are placeholders until orchestration is connected.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <div className="px-5 py-3 rounded-lg bg-[#262a35] border border-blue-500/30 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(78,222,163,0.75)]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</p>
              <p className="text-sm font-bold text-primary">Online &amp; Shielded</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row (Bento Grid Style) */}
      <section className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-5 flex flex-col hover:border-blue-500/40 transition-colors duration-300 shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Rooms</span>
          </div>
          <h3 className="text-3xl font-semibold text-slate-50 tracking-tight mb-1">{completedRoomsCount}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Rooms</p>
        </div>
        {/* Stat Card 2 */}
        <div className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-5 flex flex-col hover:border-emerald-500/40 transition-colors duration-300 shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Streak</span>
          </div>
          <h3 className="text-3xl font-semibold text-slate-50 tracking-tight mb-1">12<span className="text-sm font-normal text-slate-400 ml-1">days</span></h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Streak</p>
        </div>
        {/* Stat Card 3 */}
        <div className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-5 flex flex-col hover:border-purple-500/40 transition-colors duration-300 shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">Points</span>
          </div>
          <h3 className="text-3xl font-semibold text-slate-50 tracking-tight mb-1">{totalPoints}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Points</p>
        </div>
        {/* Stat Card 4 */}
        <div className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-5 flex flex-col hover:border-blue-500/40 transition-colors duration-300 shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Rank</span>
          </div>
          <h3 className="text-3xl font-semibold text-slate-50 tracking-tight mb-1">{totalPoints > 1000 ? "Top 5%" : "Top 20%"}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Rank</p>
        </div>
        {/* Stat Card 5 */}
        <div className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-5 flex flex-col hover:border-blue-500/40 transition-colors duration-300 shadow-lg backdrop-blur-md col-span-2 md:col-span-1 lg:col-span-1">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Paths</span>
          </div>
          <h3 className="text-3xl font-semibold text-slate-50 tracking-tight mb-1">{completedPathsCount}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Paths</p>
        </div>
      </section>

      {/* Main Content Grid Layout */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left/Main Column (Takes up 2 cols on xl screens) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Continue Learning Section */}
          <section className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-6 glass-panel relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Continue Learning
            </h3>
            {activeRoom ? (
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-primary border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
                      {activeRoom.room.category}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {activeRoom.room.learningPath.title}
                    </span>
                  </div>
                  <h4 className="text-xl font-semibold text-slate-50 mb-2">{activeRoom.room.title}</h4>
                  <p className="text-sm text-slate-400 mb-5 line-clamp-2 max-w-xl">
                    {activeRoom.room.description}
                  </p>
                  {/* Progress Bar */}
                  <div className="w-full max-w-md">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-primary font-bold">{activeProgress}%</span>
                    </div>
                    <ProgressBar value={activeProgress} />
                  </div>
                </div>
                <Link
                  href={`/rooms/${activeRoom.room.slug}`}
                  className="shrink-0 bg-primary-container hover:bg-blue-600 text-white text-sm px-5 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-blue-500/20"
                >
                  Resume Room
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-white/[0.04] bg-black/20 p-4 text-center py-8">
                <p className="font-semibold text-slate-300">Start your first cyber room</p>
                <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
                  Pick one of our curated learning paths below to start mastering cybersecurity concepts.
                </p>
              </div>
            )}
          </section>

          {/* Recommended Paths Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Recommended Paths
              </h3>
              <Link href="/learning-paths" className="text-xs font-bold text-primary hover:text-blue-400 transition-colors uppercase tracking-wider">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paths.slice(0, 4).map((path, index) => (
                <Link
                  key={path.id}
                  href={`/learning-paths/${path.slug}`}
                  className="block bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] overflow-hidden hover:border-blue-500/40 transition-all duration-300 group hover:-translate-y-1 shadow-lg"
                >
                  <div className="h-32 bg-[#0f131d] relative overflow-hidden">
                    <Image
                      alt={path.title}
                      className="object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-75"
                      src={pathCovers[index % pathCovers.length]}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c1f2a] to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-0.5 rounded bg-black/60 border border-white/[0.08] text-[9px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md">
                        {path.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="text-base font-semibold text-slate-100 mb-1 group-hover:text-primary transition-colors duration-200">
                      {path.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[32px] mb-4">
                      {path.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-white/[0.04]">
                      <span>{path.estimatedHours} hours</span>
                      <span>{path._count.rooms} modules</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right/Sidebar Column */}
        <div className="space-y-6">
          {/* Active Learning Path Timeline */}
          {activePathDetails ? (
            <div className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-5 shadow-lg backdrop-blur-md">
              <h3 className="text-base font-semibold text-slate-100 mb-1 leading-tight">
                {activePathDetails.path.title}
              </h3>
              <p className="text-xs text-slate-400 mb-4">{activePathDetails.percentage}% complete</p>
              <div className="relative pl-6 border-l-2 border-white/[0.08] space-y-6 mt-4 ml-2">
                {activePathDetails.path.rooms.map((room, idx) => {
                  const isCompleted = completedRoomIds.has(room.id);
                  const isRoomActive = activeRoom?.roomId === room.id;
                  
                  return (
                    <div key={room.id} className="relative">
                      {/* Connection Line */}
                      {idx > 0 && (
                        <div className={`absolute -left-[26px] bottom-[100%] w-0.5 h-full ${isCompleted || isRoomActive ? "bg-primary/40" : "bg-white/[0.04]"}`} />
                      )}
                      
                      {/* Node Indicator */}
                      <div
                        className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-[#1c1f2a] z-10 ${
                          isCompleted
                            ? "bg-emerald-400"
                            : isRoomActive
                            ? "bg-primary glow-active animate-pulse"
                            : "bg-slate-700"
                        }`}
                      />
                      
                      <Link href={`/rooms/${room.slug}`} className="group block">
                        <p className={`text-xs font-semibold group-hover:text-primary transition-colors ${isRoomActive ? "text-primary font-bold" : "text-slate-200"}`}>
                          {room.title}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">
                          {isCompleted ? "Completed" : isRoomActive ? `In Progress (${activeProgress}%)` : "Locked"}
                        </p>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-5 shadow-lg backdrop-blur-md">
              <h3 className="text-base font-semibold text-slate-100 mb-2">No Active Curricula</h3>
              <p className="text-xs text-slate-400">
                You are not currently enrolled in a learning path. Start one in the main curriulum list to track sequential progress.
              </p>
            </div>
          )}

          {/* Dynamic Activity Log */}
          <div className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-5 shadow-lg backdrop-blur-md">
            <h3 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Activity Log
            </h3>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#262a35] border border-white/[0.04] flex items-center justify-center shrink-0">
                      <span className={`text-[10px] font-black ${act.color}`}>{act.marker}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-200 leading-normal">{act.text}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{formatRelativeTime(act.date)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">No recent system activities found.</p>
              )}
            </div>
          </div>

          {/* Top Operators List */}
          <div className="bg-[#1c1f2a]/70 rounded-xl border border-white/[0.08] p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-100">Top Operators</h3>
              <Link href="/leaderboard" className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                View
              </Link>
            </div>
            <div className="space-y-3">
              {leaderboard.slice(0, 3).map((row, idx) => {
                const colors = ["bg-yellow-500", "bg-slate-400", "bg-amber-600"];
                const isCurrentUser = row.user?.id === profile.id;
                
                return (
                  <div
                    key={row.rank}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isCurrentUser ? "bg-primary/5 border-primary/30" : "bg-[#262a35]/40 border-white/[0.04]"
                    } relative overflow-hidden`}
                  >
                    {idx < 3 && <div className={`absolute left-0 top-0 w-0.5 h-full ${colors[idx]}`} />}
                    <div className="flex items-center gap-3 ml-2">
                      <span className="text-[11px] font-bold text-slate-500 w-4 text-center">{row.rank}</span>
                      <div className="w-6 h-6 rounded bg-[#262a35] border border-white/[0.08] flex items-center justify-center text-[9px] font-bold text-slate-300 uppercase">
                        {(row.user?.username ?? "OP").substring(0, 2)}
                      </div>
                      <span className={`text-xs font-medium leading-none ${isCurrentUser ? "text-primary font-bold" : "text-slate-300"}`}>
                        {row.user?.username ?? "unknown"}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary mr-1">{row.points} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
