import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar, StatusPill } from "@/components/card";
import { CompletionList, type CompletionEntry } from "@/components/paper/completion";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { sortByDifficulty } from "@/lib/learning/difficulty";
import { ACTIVITY_CALENDAR_WEEKS_WIDE, getLearningActivity } from "@/lib/services/activity-service";
import { getUserLeaderboardStanding } from "@/lib/services/leaderboard-service";
import { EntityLogo } from "@/components/paper/entity-logo";
import { ActivityHeatmap, WEEKDAYS } from "@/components/paper/activity-heatmap";

export const metadata: Metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

/** Daftar "Completed" dan tabel attempt memuat maksimal 100 attempt terbaru; angka ringkasan memakai agregat. */
const ATTEMPT_LIMIT = 100;

/** Jendela yang dipakai getLearningActivity (lib/services/activity-service.ts) untuk menghitung hari aktif. */
const ACTIVITY_WINDOW_DAYS = 120;

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

type CompletionRow = CompletionEntry & { at: Date };

/** Kepala panel bergaris: judul, keterangan pendek, aksi di kanan; isi panel di bawahnya rata ke tepi. */
function PanelHeader({ id, title, description, action }: { id: string; title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 pb-3 pt-4 sm:px-6">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-bold text-ink">
          {title}
        </h2>
        {description ? <p className="mt-0.5 max-w-2xl text-sm text-ink-3">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Satu pasangan label/nilai sebaris di dalam <dl>; catatan kecil menempel setelah nilai. */
function InlineStat({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <dt className="text-ink-3">{label}</dt>
      <dd className="figure font-semibold text-ink">
        {value}
        {note ? <span className="ml-1.5 font-normal text-ink-3">{note}</span> : null}
      </dd>
    </div>
  );
}

const thClass = "field-label border-b border-line px-3 py-2.5";

/** Attempt dari quiz yang sudah dihapus menaut ke halaman room-nya, karena halaman quiz room itu tidak ada lagi. */
function attemptHref(attempt: { quiz: object | null; room: { slug: string } | null }) {
  if (!attempt.room) return "/rooms";
  return attempt.quiz ? `/rooms/${attempt.room.slug}/quiz` : `/rooms/${attempt.room.slug}`;
}

export default async function ProgressPage() {
  const profile = await requireRole(["STUDENT"]);
  const now = new Date();

  const [rows, standing, activity, quizAttempts, publishedPathRows, attemptTotal, passedQuizGroups] = await Promise.all([
    prisma.userRoomProgress.findMany({
      where: { userId: profile.id },
      include: { room: true },
      orderBy: { updatedAt: "desc" }
    }),
    getUserLeaderboardStanding(profile.id),
    // Kalender lebar 26 minggu: heatmap menjadi fokus halaman ini (Profile tetap 17 minggu).
    getLearningActivity(profile.id, now, ACTIVITY_CALENDAR_WEEKS_WIDE),
    prisma.userQuizAttempt.findMany({
      where: { userId: profile.id, completedAt: { not: null } },
      // Room dibaca lewat roomId attempt agar attempt dari quiz yang sudah dihapus (quiz null) tetap tampil.
      select: {
        id: true,
        quizId: true,
        quizTitle: true,
        score: true,
        passed: true,
        completedAt: true,
        quiz: { select: { passingScore: true } },
        room: { select: { title: true, slug: true } }
      },
      orderBy: { completedAt: "desc" },
      take: ATTEMPT_LIMIT
    }),
    prisma.learningPath.findMany({
      where: { isPublished: true },
      select: { id: true, slug: true, title: true, difficulty: true, logoUrl: true, rooms: { where: { isPublished: true }, select: { id: true } } }
    }),
    // Agregat seluruh riwayat agar angka tidak terpotong oleh batas 100 attempt di atas.
    prisma.userQuizAttempt.count({ where: { userId: profile.id, completedAt: { not: null } } }),
    // Quiz lulus dihitung per room, termasuk quiz yang sudah dihapus (sama dengan dasbor dan Profile).
    prisma.userQuizAttempt.groupBy({
      by: ["roomId"],
      where: { userId: profile.id, passed: true, roomId: { not: null } }
    })
  ]);

  // Beginner → Intermediate → Advanced, lalu judul (urutan abjad menaruh "Advanced" lebih dulu).
  const publishedPaths = sortByDifficulty(publishedPathRows);

  const { calendar } = activity;
  const thisWeek = calendar.weeks[calendar.weeks.length - 1]?.reduce((sum, day) => sum + day.count, 0) ?? 0;

  const completedRows = rows.filter((row) => row.status === "COMPLETED");
  const inProgressRows = rows.filter((row) => row.status === "IN_PROGRESS");
  const completedRoomIds = new Set(completedRows.map((row) => row.roomId));
  const passedAttempts = quizAttempts.filter((attempt) => attempt.passed);
  // Room yang quiz-nya pernah lulus, dari seluruh riwayat (sama dengan halaman Profile).
  const quizzesPassed = passedQuizGroups.length;
  const attemptsCapped = attemptTotal > quizAttempts.length;
  // Pembilang dan penyebut memakai himpunan yang sama: room terbit di path yang terbit.
  const publishedRoomIds = new Set(publishedPaths.flatMap((path) => path.rooms.map((room) => room.id)));
  const publishedRoomTotal = publishedRoomIds.size;
  const completedPublishedRooms = completedRows.filter((row) => publishedRoomIds.has(row.roomId)).length;

  // Riwayat selesai: room lulus (centang) dan quiz lulus (skor), terbaru dulu.
  const completions: CompletionRow[] = [
    ...completedRows.map((row) => {
      const at = row.completedAt ?? row.updatedAt;
      return { id: `room-${row.id}`, at, kind: "room" as const, title: row.room.title, date: formatShortDate(at) };
    }),
    ...passedAttempts.map((attempt) => {
      const at = attempt.completedAt as Date;
      return {
        id: `quiz-${attempt.id}`,
        at,
        kind: "quiz-pass" as const,
        title: attempt.room?.title ?? attempt.quizTitle,
        score: attempt.score,
        date: formatShortDate(at)
      };
    })
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const pathRows = publishedPaths
    .map((path) => {
      const total = path.rooms.length;
      const done = path.rooms.filter((room) => completedRoomIds.has(room.id)).length;
      return { path, total, done };
    })
    // Path yang sedang berjalan di atas, lalu yang sudah selesai, lalu yang belum dimulai (sort stabil: urutan kesulitan tetap).
    .sort((a, b) => {
      const rank = (row: { total: number; done: number }) => (row.done > 0 && row.done < row.total ? 0 : row.total > 0 && row.done === row.total ? 1 : 2);
      return rank(a) - rank(b);
    });

  return (
    <AppShell title="Progress" subtitle="Every room you've passed, every quiz score, and where each path stands." role={profile.role}>
      <div className="flex flex-col gap-5">
        {/* Ringkasan satu baris di bawah judul: pasangan label/nilai sebaris, bukan strip angka besar
            (strip angka hanya ada di dasbor). Ditarik sedikit ke atas agar terbaca sebagai bagian kepala halaman. */}
        <section className="-mt-2" aria-label="Your numbers">
          <dl className="flex flex-wrap gap-x-7 gap-y-2 text-sm">
            <InlineStat
              label="Points"
              value={`${formatNumber(standing.points)} pts`}
              note={standing.rank ? `· rank #${standing.rank}` : "· earn points to rank"}
            />
            <InlineStat label="Rooms completed" value={formatNumber(completedPublishedRooms)} note={`of ${formatNumber(publishedRoomTotal)} published`} />
            <InlineStat
              label="Quizzes passed"
              value={formatNumber(quizzesPassed)}
              note={attemptTotal === 0 ? "· no attempts yet" : `in ${plural(attemptTotal, "attempt")}`}
            />
            <InlineStat
              label="Streak"
              value={plural(activity.streakDays, "day")}
              note={`· ${plural(activity.windowActiveDays, "active day")} in the last ${ACTIVITY_WINDOW_DAYS} days`}
            />
          </dl>
        </section>

        {/* Heatmap lebar (26 minggu, sel besar) adalah fokus halaman: selebar panel tanpa kolom samping, di tengah bila
            panel lebih lebar dari kisinya. Tiga angka aktivitas menjadi satu baris label/nilai di kaki panel. */}
        <section className="sheet overflow-hidden" aria-labelledby="activity-title">
          <PanelHeader id="activity-title" title="Activity" description="Task answers and quiz attempts per day." />
          <div className="flex justify-center p-5 sm:p-6">
            <ActivityHeatmap calendar={calendar} size="lg" className="min-w-0 max-w-full" />
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 border-t border-line px-5 py-3.5 text-sm sm:px-6">
            <InlineStat label="Longest streak" value={plural(calendar.longestStreak, "day")} />
            <InlineStat label="This week" value={plural(thisWeek, "activity", "activities")} />
            <InlineStat label="Busiest day" value={calendar.busiestWeekday === null ? "–" : WEEKDAYS[calendar.busiestWeekday]} />
          </dl>
        </section>

        <section className="sheet overflow-hidden" aria-labelledby="completed-title">
          <PanelHeader
            id="completed-title"
            title="Completed"
            description={
              attemptsCapped
                ? `Every passed room, plus the quizzes passed in your latest ${ATTEMPT_LIMIT} attempts, most recent first.`
                : "Every passed room and quiz, most recent first."
            }
          />
          {completions.length > 0 ? (
            // -mb-px menyembunyikan garis baris terakhir di bawah tepi panel, jadi tidak ada garis ganda.
            <div className="-mb-px px-5 sm:px-6">
              <CompletionList entries={completions} />
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <EmptyState
                title="Nothing completed yet"
                message="Passed rooms and quizzes show up here."
                action={
                  <Link href="/learning-paths" className="text-link text-sm">
                    Choose a learning path
                  </Link>
                }
              />
            </div>
          )}
        </section>

        {/* Room berjalan dan tabel attempt ditumpuk selebar penuh: dipasang berdampingan, panjang keduanya jarang seimbang. */}
        {inProgressRows.length > 0 ? (
          <section className="sheet overflow-hidden" aria-labelledby="in-progress-title">
            <PanelHeader id="in-progress-title" title="Rooms in progress" />
            <ul className="divide-y divide-line">
              {inProgressRows.map((row) => (
                <li key={row.id}>
                  <Link href={`/rooms/${row.room.slug}`} className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-well focus-visible:outline-offset-[-2px] sm:px-6">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-semibold text-ink transition-colors group-hover:text-cyan-ink">{row.room.title}</span>
                      <span className="mt-0.5 block text-sm text-ink-3">
                        {row.room.difficulty} · {formatRelativeTime(row.updatedAt, now)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {/* Bilah hanya visual; persentasenya tertulis di sebelahnya. */}
                      <span aria-hidden="true">
                        <ProgressBar value={row.progressPercentage} label={`${row.room.title} progress`} className="w-16 sm:w-32" />
                      </span>
                      <span className="figure w-9 text-right text-xs font-semibold text-ink-2">{row.progressPercentage}%</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="sheet min-w-0 overflow-hidden" aria-labelledby="attempts-title">
          <PanelHeader
            id="attempts-title"
            title="Quiz attempts"
            description={`${attemptsCapped ? `Your latest ${quizAttempts.length} of ${plural(attemptTotal, "attempt")}. ` : ""}Pass mark is set per quiz by its instructor.`}
          />
          {quizAttempts.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState title="No quiz attempts yet" message="Finish a room's tasks, then take its quiz to see your scores here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Di bawah sm kolom Date disembunyikan dan tanggalnya pindah ke sel pertama, agar Result tetap terlihat tanpa gulir. */}
              <table className="w-full text-sm sm:min-w-[520px]">
                <thead>
                  <tr>
                    <th scope="col" className={`${thClass} pl-5 text-left sm:pl-6`}>
                      Room
                    </th>
                    <th scope="col" className={`${thClass} text-right`}>
                      Score
                    </th>
                    <th scope="col" className={`${thClass} pr-5 text-left sm:pr-3`}>
                      Result
                    </th>
                    <th scope="col" className={`${thClass} hidden pr-5 text-right sm:table-cell sm:pr-6`}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {quizAttempts.map((attempt) => (
                    <tr key={attempt.id} className="group transition-colors hover:bg-well">
                      <td className="px-3 py-2.5 pl-5 sm:pl-6">
                        <Link
                          href={attemptHref(attempt)}
                          className="tap-target font-display font-semibold text-ink transition-colors group-hover:text-cyan-ink"
                        >
                          {attempt.room?.title ?? attempt.quizTitle}
                        </Link>
                        <span className="block text-xs text-ink-3 sm:hidden">{formatShortDate(attempt.completedAt as Date)}</span>
                      </td>
                      <td className="figure px-3 py-2.5 text-right">
                        <span className="font-semibold text-ink">{attempt.score}%</span>
                        <span className="block whitespace-nowrap text-xs text-ink-3">
                          {attempt.quiz ? `pass ${attempt.quiz.passingScore}%` : "quiz removed"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 pr-5 sm:pr-3">
                        <StatusPill tone={attempt.passed ? "success" : "danger"}>{attempt.passed ? "Passed" : "Retry"}</StatusPill>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2.5 pr-5 text-right text-ink-2 sm:table-cell sm:pr-6">
                        {formatShortDate(attempt.completedAt as Date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="sheet overflow-hidden" aria-labelledby="paths-title">
          <PanelHeader
            id="paths-title"
            title="Learning paths"
            action={
              <Link href="/learning-paths" className="text-link text-sm">
                All paths
              </Link>
            }
          />
          {pathRows.length > 0 ? (
            <ul className="divide-y divide-line">
              {pathRows.map(({ path, total, done }) => {
                const complete = total > 0 && done === total;
                return (
                  <li key={path.id}>
                    <Link href={`/learning-paths/${path.slug}`} className="group flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-well focus-visible:outline-offset-[-2px] sm:px-6">
                      <EntityLogo name={path.title} src={path.logoUrl} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display font-semibold text-ink transition-colors group-hover:text-cyan-ink">{path.title}</span>
                        <span className="mt-0.5 block text-sm text-ink-3">
                          {total === 0 ? "No rooms yet" : `${done} of ${total} ${total === 1 ? "room" : "rooms"}`} · {path.difficulty}
                        </span>
                      </span>
                      {complete ? (
                        <StatusPill tone="done">Complete</StatusPill>
                      ) : total > 0 ? (
                        // Bilah hanya visual (jumlah room tertulis di teks); disembunyikan di ponsel agar judul tidak terpotong.
                        <span className="hidden w-32 shrink-0 sm:block" aria-hidden="true">
                          <ProgressBar value={(done / total) * 100} label={`${path.title} progress`} />
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-5 sm:p-6">
              <EmptyState title="No learning paths yet" message="Published paths will appear here." />
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
