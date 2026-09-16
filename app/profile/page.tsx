import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getLearningStreak } from "@/lib/services/activity-service";
import { getUserLeaderboardStanding } from "@/lib/services/leaderboard-service";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export default async function ProfilePage() {
  const profile = await requireRole(["STUDENT"]);

  const [standing, streak, progressRows, submissions, attempts, pointsBySource, labSessionCount] = await Promise.all([
    getUserLeaderboardStanding(profile.id),
    getLearningStreak(profile.id),
    prisma.userRoomProgress.findMany({
      where: { userId: profile.id },
      include: { room: { select: { title: true, slug: true, points: true, learningPath: { select: { title: true } } } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.userTaskSubmission.findMany({
      where: { userId: profile.id },
      include: { task: { select: { title: true, points: true, room: { select: { title: true, slug: true } } } } },
      orderBy: { submittedAt: "desc" },
      take: 25
    }),
    prisma.userQuizAttempt.findMany({
      where: { userId: profile.id },
      include: { quiz: { select: { title: true, passingScore: true, room: { select: { title: true, slug: true, points: true } } } } },
      orderBy: { startedAt: "desc" },
      take: 25
    }),
    prisma.leaderboardPoint.groupBy({
      by: ["sourceType"],
      where: { userId: profile.id },
      _sum: { points: true }
    }),
    prisma.labSession.count({ where: { userId: profile.id } })
  ]);

  const completedRooms = progressRows.filter((row) => row.status === "COMPLETED").length;
  const correctSubmissions = submissions.filter((row) => row.isCorrect).length;
  const passedAttempts = attempts.filter((row) => row.passed).length;
  const averageScore = attempts.length > 0 ? Math.round(attempts.reduce((total, row) => total + row.score, 0) / attempts.length) : 0;
  const bestScore = attempts.reduce((best, row) => Math.max(best, row.score), 0);
  const pointsMap = new Map(pointsBySource.map((row) => [row.sourceType, row._sum.points ?? 0]));

  const stats = [
    { label: "Total Poin", value: standing.points.toLocaleString("id-ID"), tone: "primary" as const },
    { label: "Rank Global", value: standing.rank ? `#${standing.rank}` : "-", tone: "warning" as const },
    { label: "Streak", value: `${streak.streakDays} hari`, tone: "success" as const },
    { label: "Room Selesai", value: completedRooms, tone: "success" as const },
    { label: "Task Benar", value: correctSubmissions, tone: "primary" as const },
    { label: "Quiz Lulus", value: `${passedAttempts}/${attempts.length}`, tone: "neutral" as const }
  ];

  return (
    <AppShell title="Profile" subtitle="Identitas akun dan rekam jejak belajar: poin, task, quiz, dan progress room." role={profile.role}>
      {/* Identity */}
      <section className="glass-panel relative overflow-hidden rounded-xl p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-xl font-black text-primary">
              {profile.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-100">{profile.fullName}</h2>
              <p className="text-sm text-slate-400">
                @{profile.username} · {profile.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill tone={profile.role === "ADMIN" ? "warning" : profile.role === "INSTRUCTOR" ? "primary" : "success"}>{profile.role}</StatusPill>
                <span className="text-[11px] text-slate-500">Bergabung {formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 md:text-right">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Poin task</p>
              <p className="text-base font-bold text-slate-100">{pointsMap.get("TASK_COMPLETION") ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Poin quiz</p>
              <p className="text-base font-bold text-slate-100">{pointsMap.get("QUIZ_COMPLETION") ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Penyesuaian</p>
              <p className="text-base font-bold text-slate-100">{pointsMap.get("MANUAL_ADJUSTMENT") ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lab session</p>
              <p className="text-base font-bold text-slate-100">{labSessionCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="min-h-28">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-2xl font-black text-slate-100">{stat.value}</p>
            <div className="mt-2">
              <StatusPill tone={stat.tone}>{stat.tone}</StatusPill>
            </div>
          </Card>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Quiz history */}
        <Card>
          <SectionHeader
            eyebrow="assessment"
            title="Riwayat Quiz"
            action={
              attempts.length > 0 ? (
                <span className="text-xs text-slate-500">
                  Rata-rata {averageScore}% · Terbaik {bestScore}%
                </span>
              ) : undefined
            }
          />
          {attempts.length === 0 ? (
            <p className="rounded-lg border border-white/[0.06] bg-black/20 p-5 text-sm text-slate-400">
              Belum ada quiz yang dikerjakan. Buka room lalu pilih Take Assessment Quiz.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="py-2 pr-4">Quiz</th>
                    <th className="px-4 py-2">Skor</th>
                    <th className="px-4 py-2">Hasil</th>
                    <th className="py-2 pl-4 text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="py-3 pr-4">
                        <Link href={`/rooms/${attempt.quiz.room.slug}/quiz`} className="block font-semibold text-slate-100 hover:text-primary">
                          {attempt.quiz.title}
                        </Link>
                        <span className="block text-[11px] text-slate-500">{attempt.quiz.room.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm font-bold ${attempt.passed ? "text-emerald-300" : "text-rose-300"}`}>{attempt.score}%</span>
                        <span className="block text-[10px] text-slate-500">min {attempt.quiz.passingScore}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={attempt.passed ? "success" : "danger"}>{attempt.passed ? "Lulus" : "Belum"}</StatusPill>
                      </td>
                      <td className="py-3 pl-4 text-right text-xs text-slate-400">{formatDateTime(attempt.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Task history */}
        <Card>
          <SectionHeader eyebrow="practice" title="Riwayat Jawaban Task" action={<span className="text-xs text-slate-500">{submissions.length} terakhir</span>} />
          {submissions.length === 0 ? (
            <p className="rounded-lg border border-white/[0.06] bg-black/20 p-5 text-sm text-slate-400">Belum ada jawaban task yang dikirim.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="py-2 pr-4">Task</th>
                    <th className="px-4 py-2">Jawaban</th>
                    <th className="px-4 py-2">Hasil</th>
                    <th className="py-2 pl-4 text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="py-3 pr-4">
                        <Link href={`/rooms/${submission.task.room.slug}`} className="block font-semibold text-slate-100 hover:text-primary">
                          {submission.task.title}
                        </Link>
                        <span className="block text-[11px] text-slate-500">{submission.task.room.title}</span>
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-3 font-mono text-xs text-slate-300" title={submission.answer}>
                        {submission.answer}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={submission.isCorrect ? "success" : "danger"}>
                          {submission.isCorrect ? `+${submission.task.points} pts` : "Salah"}
                        </StatusPill>
                      </td>
                      <td className="py-3 pl-4 text-right text-xs text-slate-400">{formatDateTime(submission.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Room progress */}
      <Card className="mt-6">
        <SectionHeader
          eyebrow="progress"
          title="Progress Room"
          action={
            <Link href="/progress" className="text-xs font-bold text-primary hover:underline">
              Detail progress
            </Link>
          }
        />
        {progressRows.length === 0 ? (
          <p className="rounded-lg border border-white/[0.06] bg-black/20 p-5 text-sm text-slate-400">
            Belum ada room yang dimulai. Pilih room di halaman{" "}
            <Link href="/rooms" className="font-bold text-primary hover:underline">
              Rooms
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {progressRows.map((row) => (
              <Link key={row.id} href={`/rooms/${row.room.slug}`} className="rounded-lg border border-white/[0.06] bg-black/20 p-4 transition hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{row.room.title}</p>
                    <p className="text-[11px] text-slate-500">{row.room.learningPath.title}</p>
                  </div>
                  <StatusPill tone={row.status === "COMPLETED" ? "success" : row.status === "IN_PROGRESS" ? "warning" : "neutral"}>{row.status}</StatusPill>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{row.progressPercentage}%</span>
                  <span>{row.completedAt ? `Selesai ${formatDateTime(row.completedAt)}` : `Update ${formatDateTime(row.updatedAt)}`}</span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={row.progressPercentage} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
