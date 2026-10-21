import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, StatusPill, ProgressBar } from "@/components/card";
import { TaskSubmitForm } from "@/components/rooms/task-submit-form";
import { requireRole } from "@/lib/auth/guards";
import { getRoomBySlug } from "@/lib/services/room-service";
import { prisma } from "@/lib/db/prisma";
import { getLatestLabSessionForRoom } from "@/lib/services/lab-session-service";
import { getAnswerFormat } from "@/lib/learning/answer-format";
import { HINT_UNLOCK_AFTER_WRONG_ATTEMPTS, isHintUnlocked } from "@/lib/learning/hints";
import { getRoomCompletionSnapshot } from "@/lib/services/progress-service";
import { getWrongAttemptCounts } from "@/lib/services/task-service";
import { RoomMaterial } from "@/components/content/room-material";
import { PageNotice } from "@/components/ui/page-notice";
import { hasRoleAccess } from "@/lib/auth/rbac";
import { describeAvailability, formatScheduleDate, getRoomAvailability } from "@/lib/learning/availability";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const room = await getRoomBySlug(params.slug);
  if (!room) notFound();

  const availability = getRoomAvailability(room);
  const canPreviewClosedRoom = hasRoleAccess(profile.role, ["INSTRUCTOR"]);

  // Peserta hanya melihat ringkasan dan jadwal saat room belum dibuka atau sudah ditutup.
  if (!availability.isOpen && !canPreviewClosedRoom) {
    const isUpcoming = availability.state === "upcoming";

    return (
      <AppShell title={room.title} subtitle={room.description} role={profile.role}>
        <PageNotice
          tone={isUpcoming ? "info" : "warning"}
          title={isUpcoming ? "Room belum dibuka" : "Room sudah ditutup"}
          message={
            isUpcoming
              ? `Room ini dijadwalkan dibuka pada ${formatScheduleDate(availability.opensAt as Date)}. Materi, task, dan quiz akan tersedia setelah waktu tersebut.`
              : `Room ini ditutup sejak ${formatScheduleDate(availability.closesAt as Date)}. Jawaban baru tidak lagi diterima; progress yang sudah tercatat tetap tersimpan.`
          }
          className="mb-6"
        />

        <section className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#1c1f2a]/70 p-6 shadow-lg backdrop-blur-md md:p-8">
          {room.coverImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={room.coverImageUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1c1f2a] via-[#1c1f2a]/80 to-transparent" />
            </>
          ) : null}
          <div className="relative z-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusPill tone="primary">{room.category}</StatusPill>
              <StatusPill tone="neutral">{room.difficulty}</StatusPill>
              <StatusPill tone={isUpcoming ? "warning" : "danger"}>{describeAvailability(availability)}</StatusPill>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">{room.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">{room.description}</p>
            <dl className="mt-6 grid gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-lg border border-white/[0.06] bg-black/25 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Dibuka</dt>
                <dd className="mt-1 font-semibold text-slate-200">{availability.opensAt ? formatScheduleDate(availability.opensAt) : "Sejak dipublish"}</dd>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-black/25 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Ditutup</dt>
                <dd className="mt-1 font-semibold text-slate-200">{availability.closesAt ? formatScheduleDate(availability.closesAt) : "Tidak dibatasi"}</dd>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-black/25 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Isi room</dt>
                <dd className="mt-1 font-semibold text-slate-200">
                  {room.tasks.length} task{room.quiz ? " · 1 quiz" : ""} · {room.points} pts
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/learning-paths/${room.learningPath.slug}`} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-blue-300">
                Kembali ke learning path
              </Link>
              <Link href="/rooms" className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.05]">
                Lihat room lain
              </Link>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  // Parallel fetch: correct submissions, wrong-attempt counts (for hints), completion snapshot, lab status
  const [submissions, wrongAttemptsByTask, snapshot, session] = await Promise.all([
    prisma.userTaskSubmission.findMany({
      where: {
        userId: profile.id,
        task: { roomId: room.id },
        isCorrect: true
      },
      select: { taskId: true }
    }),
    getWrongAttemptCounts(profile.id, room.id),
    getRoomCompletionSnapshot(profile.id, room.id),
    getLatestLabSessionForRoom(profile.id, room.id)
  ]);

  const completedTaskIds = new Set(submissions.map((s) => s.taskId));
  const totalTasks = room.tasks.length;
  const completedTasksCount = room.tasks.filter((t) => completedTaskIds.has(t.id)).length;

  // Satu aturan penyelesaian untuk seluruh aplikasi: semua task benar + quiz lulus (jika ada).
  const completionPercentage = snapshot.percentage;

  // Map tasks linearly: Completed -> First incomplete is Active -> Rest are Locked
  let foundActive = false;
  const tasksWithStatus = room.tasks.map((task) => {
    const isCompleted = completedTaskIds.has(task.id);
    let status: "completed" | "active" | "locked" = "locked";
    
    if (isCompleted) {
      status = "completed";
    } else if (!foundActive) {
      status = "active";
      foundActive = true;
    } else {
      status = "locked";
    }
    
    return { ...task, status };
  });

  const isBeginner = room.difficulty === "Beginner";
  const isMedium = room.difficulty === "Medium" || room.difficulty === "Intermediate";
  let difficultyTone: "success" | "primary" | "warning" = "primary";
  if (isBeginner) difficultyTone = "success";
  else if (isMedium) difficultyTone = "warning";

  return (
    <AppShell title={room.title} subtitle={room.description} role={profile.role}>
      {!availability.isOpen ? (
        <PageNotice
          tone="warning"
          title="Preview instruktur"
          message={`${describeAvailability(availability)}. Student belum bisa membuka room ini; Anda melihatnya karena memiliki role instruktur atau admin.`}
          className="mb-6"
        />
      ) : null}

      {/* Hero Banner Area */}
      <section className="bg-[#1c1f2a]/70 border border-white/[0.08] rounded-xl p-6 md:p-8 relative overflow-hidden mb-6 shadow-lg backdrop-blur-md">
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        {room.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={room.coverImageUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1c1f2a] via-[#1c1f2a]/80 to-transparent" />
          </>
        ) : null}

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-[#262a35] border border-white/[0.08] rounded-full text-xs text-slate-200 flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {room.category}
            </span>
            <span className="px-3 py-1 bg-[#262a35] border border-white/[0.08] rounded-full text-xs text-slate-200 flex items-center gap-1.5 shadow-sm">
              <StatusPill tone={difficultyTone}>{room.difficulty}</StatusPill>
            </span>
            <span className="px-3 py-1 bg-[#262a35] border border-white/[0.08] rounded-full text-xs text-slate-200 flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              Est. {Math.round(room.estimatedMinutes / 60 * 10) / 10} hrs
            </span>
            {availability.isScheduled ? (
              <span className="px-3 py-1 bg-[#262a35] border border-white/[0.08] rounded-full text-xs text-slate-200 flex items-center gap-1.5 shadow-sm">
                <StatusPill tone={availability.state === "open" ? "primary" : availability.state === "upcoming" ? "warning" : "danger"}>
                  {describeAvailability(availability)}
                </StatusPill>
              </span>
            ) : null}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-100 mb-2">
            {room.title}
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-3xl leading-relaxed">
            {room.description}
          </p>
        </div>
      </section>

      {/* Multi-Column Panel Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left main objectives column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section navigation */}
          <nav className="flex gap-6 border-b border-white/[0.08] mb-4 overflow-x-auto pb-px" aria-label="Bagian room">
            <a href="#materi" className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600 text-sm font-semibold transition-colors duration-200 whitespace-nowrap">
              Materi
            </a>
            <a href="#tasks" className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600 text-sm font-semibold transition-colors duration-200 whitespace-nowrap">
              Tasks ({completedTasksCount}/{totalTasks})
            </a>
            {room.quiz ? (
              <a href="#quiz" className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600 text-sm font-semibold transition-colors duration-200 whitespace-nowrap">
                Quiz
              </a>
            ) : null}
          </nav>

          {/* Material / walkthrough */}
          <section id="materi" className="scroll-mt-28 bg-[#1c1f2a]/40 border border-white/[0.08] rounded-xl p-5 md:p-6 backdrop-blur-sm shadow-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Materi &amp; Walkthrough</h3>
            <RoomMaterial
              content={room.content}
              format={room.contentFormat}
              fallback={
                <p className="rounded-lg border border-dashed border-white/[0.08] bg-black/20 p-4 text-sm text-slate-400">
                  Materi untuk room ini belum ditambahkan oleh instruktur. Kerjakan task di bawah berdasarkan instruksi pada setiap task.
                </p>
              }
            />
          </section>

          {/* Task lists container */}
          <div id="tasks" className="flex flex-col gap-4 scroll-mt-28">
            {tasksWithStatus.map((task) => {
              const isCompleted = task.status === "completed";
              const isActive = task.status === "active";
              const isLocked = task.status === "locked";

              if (isCompleted) {
                return (
                  <div
                    key={task.id}
                    className="bg-[#1c1f2a]/50 border border-white/[0.08] rounded-xl p-5 opacity-75 hover:opacity-100 transition-opacity duration-200 flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-400 line-through decoration-slate-600">
                          {task.orderIndex}. {task.title}
                        </h4>
                      </div>
                    </div>
                    <StatusPill tone="success">Completed</StatusPill>
                  </div>
                );
              }

              if (isActive) {
                return (
                  <div
                    key={task.id}
                    className="bg-[#161B22]/90 border-2 border-primary rounded-xl p-5 glow-active shadow-lg transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center relative">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        </div>
                        <h4 className="text-sm md:text-base font-bold text-primary text-glow">
                          Task {task.orderIndex}: {task.title}
                        </h4>
                      </div>
                      <StatusPill tone="primary">Active</StatusPill>
                    </div>
                    <p className="text-xs md:text-sm text-slate-300 mb-5 leading-relaxed pl-9">
                      {task.description}
                    </p>
                    <div className="pl-9 flex flex-wrap gap-3">
                      <Link
                        href={`/rooms/${room.slug}/lab`}
                        className="px-4 py-2 bg-[#262a35] hover:bg-[#313540] text-slate-200 text-xs font-semibold rounded border border-white/[0.08] transition-colors duration-200 flex items-center gap-1.5 shadow-sm"
                      >
                        Go to Lab Workspace
                      </Link>
                      <span
                        title={getAnswerFormat(task.answerType).hint}
                        className="px-3 py-2 bg-white/[0.02] border border-white/[0.04] text-[10px] font-mono text-slate-500 rounded flex items-center"
                      >
                        Format jawaban: {getAnswerFormat(task.answerType).label}
                      </span>
                    </div>
                    <div className="pl-9">
                      <TaskSubmitForm
                        taskId={task.id}
                        roomSlug={room.slug}
                        answerType={task.answerType}
                        hasHint={Boolean(task.hint)}
                        hint={task.hint && isHintUnlocked(wrongAttemptsByTask[task.id] ?? 0) ? task.hint : null}
                        wrongAttempts={wrongAttemptsByTask[task.id] ?? 0}
                        hintUnlockAfter={HINT_UNLOCK_AFTER_WRONG_ATTEMPTS}
                      />
                    </div>
                  </div>
                );
              }

              // Locked state
              return (
                <div
                  key={task.id}
                  className="bg-[#1c1f2a]/20 border border-white/[0.04] rounded-xl p-5 opacity-50 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full border border-white/[0.08] flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500">
                        {task.orderIndex}. {task.title}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Locked</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Environment control panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Target Environment Box */}
          <div className="bg-[#161B22]/90 border border-white/[0.08] rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-400" />
            <h3 className="text-base font-semibold text-slate-100 mb-4">Lab Environment</h3>
            
            <div className="bg-black/40 p-3 rounded-lg border border-white/[0.04] flex items-center justify-between mb-5">
              <span className="text-xs text-slate-400 font-medium">Target IP</span>
              <span className="text-xs font-bold text-primary font-mono tracking-wider">
                {session?.targetIp ?? "10.10.x.x"}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/rooms/${room.slug}/lab`}
                className="w-full py-3 bg-primary-container hover:bg-blue-600 text-white text-xs font-bold rounded shadow-[0_0_15px_rgba(77,142,255,0.15)] transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                Start / Open Lab
              </Link>
              
              {room.quiz ? (
                <Link
                  id="quiz"
                  href={`/rooms/${room.slug}/quiz`}
                  className="w-full py-2.5 bg-transparent border border-white/[0.08] hover:border-primary/40 hover:bg-primary-container/5 text-slate-300 hover:text-white text-xs font-semibold rounded transition-all duration-300 flex items-center justify-center gap-1.5"
                >
                  Take Assessment Quiz
                </Link>
              ) : null}
            </div>
          </div>

          {/* User Progress Stats Card */}
          <div className="bg-[#1c1f2a]/70 border border-white/[0.08] rounded-xl p-5 shadow-md backdrop-blur-sm">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Your Progress</h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-slate-400 font-medium">Completion Ratio</span>
                <span className="text-xl font-bold text-primary text-glow">{completionPercentage}%</span>
              </div>
              <ProgressBar value={completionPercentage} />
            </div>

            <div className="space-y-2 pt-4 border-t border-white/[0.04]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Task benar</span>
                <span className="font-bold text-slate-300">
                  {completedTasksCount} / {totalTasks}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Quiz</span>
                <span className={`font-bold ${snapshot.hasQuiz ? (snapshot.quizPassed ? "text-emerald-300" : "text-slate-300") : "text-slate-500"}`}>
                  {snapshot.hasQuiz ? (snapshot.quizPassed ? "Lulus" : "Belum lulus") : "Tidak ada"}
                </span>
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-slate-500">
                Room selesai saat semua task benar{snapshot.hasQuiz ? " dan quiz lulus" : ""}.
              </p>
            </div>
          </div>

          {/* Quick Metrics Info */}
          <div className="bg-[#1c1f2a]/70 border border-white/[0.08] rounded-xl p-5 shadow-md backdrop-blur-sm grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/[0.04] bg-black/20 p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Value</p>
              <p className="mt-1 text-base font-bold text-primary">{room.points} pts</p>
            </div>
            <div className="rounded-lg border border-white/[0.04] bg-black/20 p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Estimated Time</p>
              <p className="mt-1 text-base font-bold text-slate-300">{room.estimatedMinutes} min</p>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
