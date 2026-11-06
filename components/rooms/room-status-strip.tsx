import Link from "next/link";
import { ProgressBar } from "@/components/card";
import { CompletionMark } from "@/components/paper/completion";
import { EntityLogo } from "@/components/paper/entity-logo";
import { StateTag } from "@/components/paper/state-tag";
import { availabilityLabel } from "@/components/rooms/availability-tag";
import { formatNumber, formatShortDate } from "@/lib/format/date";
import type { RoomAvailability } from "@/lib/learning/availability";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-ink-3">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/**
 * Fakta room di baris kedua strip. Di bawah xl labelnya hanya untuk pembaca layar dan nilainya didahului titik
 * tengah ("210 pts · 60 min · Beginner" sudah jelas tanpa label), agar baris ini tetap satu baris di laptop.
 */
function RoomFact({ label, labelVisible = true, children }: { label: string; labelVisible?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <dt className={labelVisible ? "sr-only xl:not-sr-only" : "sr-only"}>{label}</dt>
      <dd className="min-w-0">
        <span aria-hidden="true" className="mr-1.5 xl:hidden">
          ·
        </span>
        {children}
      </dd>
    </div>
  );
}

/**
 * Strip ringkas di bawah judul room, sama di tab Material dan Quiz. Baris atas progres peserta
 * (bar, task, quiz; centang violet bila room lulus), baris bawah fakta room sebagai pasangan label/nilai
 * sebaris dan tautan lab (di ponsel satu baris teks ringkas). Sengaja kecil dan bernada ink agar materi tetap
 * menjadi fokus halaman.
 */
export function RoomStatusStrip({
  slug,
  roomTitle,
  percentage,
  isComplete,
  completedAt,
  freshCompletion,
  solvedTasks,
  totalTasks,
  openTasksHref,
  quiz,
  points,
  estimatedMinutes,
  difficulty,
  learningPath,
  availability
}: {
  slug: string;
  roomTitle: string;
  percentage: number;
  isComplete: boolean;
  completedAt: Date | null;
  freshCompletion: boolean;
  solvedTasks: number;
  totalTasks: number;
  /** Bab yang memuat task terbuka pertama (#tasks); null bila semua task sudah benar. */
  openTasksHref: string | null;
  /** null bila room tidak punya quiz. */
  quiz: { passed: boolean; passingScore: number } | null;
  points: { total: number; quizBonus: number };
  estimatedMinutes: number;
  difficulty: string;
  learningPath: { slug: string; title: string; logoUrl: string | null };
  /** Jadwal room; label Opens/Closes/Closed hanya tampil bila relevan. */
  availability: RoomAvailability;
}) {
  const schedule = availabilityLabel(availability);

  return (
    <section className="sheet mb-5" aria-labelledby="room-status-title">
      <h2 id="room-status-title" className="sr-only">
        Your progress
      </h2>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3.5 sm:px-6">
        {/* Room lulus: centang violet di depan bar; digambar sekali bila baru saja lulus. */}
        <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:min-w-[16rem] sm:max-w-sm sm:flex-1">
          {isComplete ? <CompletionMark kind="room" fresh={freshCompletion} /> : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <p className="min-w-0 font-display font-semibold text-ink">
                {isComplete ? "Room passed" : "Progress"}
                {completedAt ? <span className="figure font-normal text-ink-3"> · {formatShortDate(completedAt)}</span> : null}
              </p>
              <p className="figure font-semibold text-ink">
                {percentage}
                <span className="text-ink-2">%</span>
              </p>
            </div>
            <ProgressBar className="mt-1.5" value={percentage} tone={isComplete ? "violet" : "cyan"} label={`${roomTitle} progress`} />
          </div>
        </div>

        {/* Room tanpa task atau tanpa quiz tidak menyebut bagian yang tidak ada. Task tidak punya tab sendiri lagi,
            jadi hitungannya menautkan bab task terbuka pertama. */}
        {totalTasks > 0 || quiz ? (
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm sm:gap-x-6">
            {totalTasks > 0 ? (
              <Fact label="Tasks">
                {openTasksHref ? (
                  <Link
                    href={openTasksHref}
                    className="tap-target figure font-semibold text-ink underline decoration-line-strong underline-offset-[3px] transition-colors hover:text-cyan-ink hover:decoration-cyan-ink"
                  >
                    {solvedTasks} of {totalTasks} solved
                    <span className="sr-only">, go to the next open task</span>
                  </Link>
                ) : (
                  <span className="figure font-semibold text-ink">
                    {solvedTasks} of {totalTasks} solved
                  </span>
                )}
              </Fact>
            ) : null}
            {quiz ? (
              <Fact label="Quiz">
                {quiz.passed ? (
                  <StateTag tone="green" icon="check">
                    Passed
                  </StateTag>
                ) : (
                  <span className="font-semibold text-ink">
                    Not passed yet
                    {/* Di ponsel nilai lulus disembunyikan agar Tasks dan Quiz muat sebaris; halaman quiz menyebutnya. */}
                    <span className="figure hidden font-normal text-ink-3 sm:inline"> · pass at {quiz.passingScore}%</span>
                  </span>
                )}
              </Fact>
            ) : null}
          </dl>
        ) : null}
      </div>

      {/* Fakta room sebagai satu daftar datar agar setiap fakta membungkus sendiri-sendiri, dengan Lab di ujung kanan.
          Mulai xl berupa pasangan label/nilai; di bawah xl nilai saja dipisah titik tengah (path · poin · menit · tingkat),
          dan di ponsel menjadi satu baris teks ink-3 kecil tanpa logo path, supaya strip tidak memakan layar pertama.
          Labelnya tetap dibacakan pembaca layar. */}
      <div className="flex items-center gap-3 border-t border-line px-5 py-2 sm:gap-6 sm:px-6 sm:py-2.5">
        <dl className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.8125rem] leading-5 text-ink-3 sm:text-sm xl:gap-x-6 xl:gap-y-2">
          <div className="min-w-0 max-w-full">
            <dt className="sr-only">Learning path</dt>
            <dd>
              <Link href={`/learning-paths/${learningPath.slug}`} className="tap-target group flex min-w-0 items-center gap-2.5 rounded-lg">
                <span className="hidden sm:block">
                  <EntityLogo name={learningPath.title} src={learningPath.logoUrl} size="sm" />
                </span>
                <span className="min-w-0 truncate font-display font-semibold text-ink-2 transition-colors group-hover:text-cyan-ink sm:text-ink">
                  {learningPath.title}
                </span>
              </Link>
            </dd>
          </div>
          <RoomFact label="Points">
            <span className="figure sm:font-semibold sm:text-ink">{formatNumber(points.total)} pts</span>
            {/* Rincian bonus hanya di layar lebar; di bawah xl baris fakta harus tetap pendek. */}
            {points.quizBonus > 0 ? <span className="figure hidden xl:inline"> · incl. {formatNumber(points.quizBonus)} quiz bonus</span> : null}
          </RoomFact>
          <RoomFact label="Time">
            <span className="figure sm:font-semibold sm:text-ink">{estimatedMinutes} min</span>
          </RoomFact>
          <RoomFact label="Difficulty">
            <span className="break-words sm:font-display sm:font-semibold sm:text-ink">{difficulty}</span>
          </RoomFact>
          {schedule ? (
            <RoomFact label="Schedule" labelVisible={false}>
              <StateTag tone={schedule.tone}>{schedule.text}</StateTag>
            </RoomFact>
          ) : null}
        </dl>
        {/* Lab belum terhubung ke VM/VPN; halaman lab menjelaskan rencananya dan catatan sesi placeholder. */}
        <Link href={`/rooms/${slug}/lab`} className="btn-secondary btn-sm shrink-0">
          Lab
          <span className="sr-only sm:not-sr-only sm:font-normal sm:text-ink-3">Not connected</span>
        </Link>
      </div>
    </section>
  );
}
