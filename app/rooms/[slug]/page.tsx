import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, StatusPill, ProgressBar } from "@/components/card";
import { TaskSubmitForm } from "@/components/rooms/task-submit-form";
import { requireRole } from "@/lib/auth/guards";
import { getRoomBySlug } from "@/lib/services/room-service";
import { prisma } from "@/lib/db/prisma";
import { getLatestLabSessionForRoom } from "@/lib/services/lab-session-service";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({ params }: { params: { slug: string } }) {
  const profile = await requireRole(["STUDENT"]);
  const room = await getRoomBySlug(params.slug);
  if (!room) notFound();

  // Parallel fetch: submissions for this user in this room and target lab session status
  const [submissions, session] = await Promise.all([
    prisma.userTaskSubmission.findMany({
      where: {
        userId: profile.id,
        task: { roomId: room.id },
        isCorrect: true
      },
      select: { taskId: true }
    }),
    getLatestLabSessionForRoom(profile.id, room.id)
  ]);

  const completedTaskIds = new Set(submissions.map((s) => s.taskId));
  const totalTasks = room.tasks.length;
  const completedTasksCount = room.tasks.filter((t) => completedTaskIds.has(t.id)).length;
  
  // Dynamic progress completion percentage
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasksCount / totalTasks) * 100);

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
      
      {/* Hero Banner Area */}
      <section className="bg-[#1c1f2a]/70 border border-white/[0.08] rounded-xl p-6 md:p-8 relative overflow-hidden mb-6 shadow-lg backdrop-blur-md">
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
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
          
          {/* Navigation tabs */}
          <div className="flex gap-6 border-b border-white/[0.08] mb-4 overflow-x-auto pb-px">
            <button className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors duration-200 whitespace-nowrap">
              Overview
            </button>
            <button className="pb-3 border-b-2 border-primary text-primary font-bold text-sm whitespace-nowrap text-glow">
              Tasks
            </button>
            <button className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors duration-200 whitespace-nowrap">
              Hints
            </button>
            <button className="pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors duration-200 whitespace-nowrap">
              Discussion
            </button>
          </div>

          {/* Learning Objectives Info Box */}
          <div className="bg-[#1c1f2a]/40 border border-white/[0.08] rounded-xl p-5 backdrop-blur-sm shadow-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Learning Objectives</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-slate-400">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                Analyze application flow and authorization layers in safe training scenarios.
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-slate-400">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                Apply defensive mitigation steps using guided educational tasks.
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-slate-400">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                Record progress through quizzes, task checks, and lab session status.
              </li>
            </ul>
          </div>

          {/* Task lists container */}
          <div className="flex flex-col gap-4">
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
                      <span className="px-3 py-2 bg-white/[0.02] border border-white/[0.04] text-[10px] font-mono text-slate-500 rounded flex items-center">
                        Answer Format: {task.answerType}
                      </span>
                    </div>
                    <div className="pl-9">
                      <TaskSubmitForm taskId={task.id} roomSlug={room.slug} answerType={task.answerType} />
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

            <div className="pt-4 border-t border-white/[0.04]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Solved Objectives</span>
                <span className="font-bold text-slate-300">
                  {completedTasksCount} / {totalTasks}
                </span>
              </div>
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
