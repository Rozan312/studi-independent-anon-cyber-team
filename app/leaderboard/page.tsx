import type { Metadata } from "next";
import { Fragment } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { formatNumber } from "@/lib/format/date";
import { getGlobalLeaderboard, getUserLeaderboardStanding } from "@/lib/services/leaderboard-service";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

const LEADERBOARD_LIMIT = 50;

const thClass = "field-label border-b border-line px-3 py-2.5";

export default async function LeaderboardPage() {
  const profile = await requireRole(["STUDENT"]);
  const [leaderboard, standing] = await Promise.all([getGlobalLeaderboard(LEADERBOARD_LIMIT), getUserLeaderboardStanding(profile.id)]);

  const isListed = leaderboard.some((row) => row.user?.id === profile.id);
  // Selisih poin ke anggota terdekat di atas; hanya akurat bila user ada di papan yang dimuat.
  const nextAbove = isListed
    ? leaderboard.filter((row) => row.points > standing.points).reduce<number | null>((min, row) => (min === null || row.points < min ? row.points : min), null)
    : null;
  const pointsToMoveUp = nextAbove !== null ? nextAbove - standing.points : null;

  const rankNote =
    pointsToMoveUp !== null ? `${formatNumber(pointsToMoveUp)} pts to move up` : standing.rank === 1 ? "Top of the board" : null;

  // Posisi member sebagai satu baris di atas tabel (bukan strip angka besar); barisnya sendiri tetap disorot di tabel.
  const standingParts = standing.rank
    ? [`You're #${standing.rank} of ${formatNumber(standing.totalRanked)}`, `${formatNumber(standing.points)} pts`, ...(rankNote ? [rankNote] : [])]
    : [
        "You're not ranked yet",
        ...(standing.totalRanked > 0 ? [`${formatNumber(standing.totalRanked)} ${standing.totalRanked === 1 ? "member" : "members"} ranked`] : []),
        "Earn points to rank"
      ];

  return (
    <AppShell title="Leaderboard" subtitle="Ranked by points from correct task answers and passed quizzes." role={profile.role}>
      <section className="sheet overflow-hidden" aria-labelledby="rankings-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 pb-3 pt-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="rankings-title" className="text-base font-bold text-ink">
              Rankings
            </h2>
            <p className="figure mt-0.5 text-sm text-ink-2">
              {standingParts.map((part, index) => (
                <Fragment key={part}>
                  {index > 0 ? <span className="text-ink-3"> · </span> : null}
                  {index === 0 ? <span className="font-semibold text-ink">{part}</span> : part}
                </Fragment>
              ))}
            </p>
          </div>
          {/* Hanya saat papan terpotong: berapa anggota yang tidak termuat di tabel. */}
          {standing.totalRanked > leaderboard.length ? (
            <span className="figure shrink-0 text-xs text-ink-3">
              Top {formatNumber(leaderboard.length)} of {formatNumber(standing.totalRanked)}
            </span>
          ) : null}
        </div>
        {leaderboard.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState title="No points recorded yet" message="The first correct task answer puts a member on the board." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              {/* Di bawah sm kolom Name disembunyikan dan nama pindah ke bawah username, agar kolom Points tetap terlihat di ponsel. */}
              <table className="w-full text-sm sm:min-w-[480px]">
                <thead>
                  <tr>
                    <th scope="col" className={`${thClass} w-20 pl-5 text-left sm:pl-6`}>
                      Rank
                    </th>
                    <th scope="col" className={`${thClass} text-left`}>
                      Username
                    </th>
                    <th scope="col" className={`${thClass} hidden text-left sm:table-cell`}>
                      Name
                    </th>
                    <th scope="col" className={`${thClass} pr-5 text-right sm:pr-6`}>
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {leaderboard.map((row, index) => {
                    const isYou = row.user?.id === profile.id;

                    // Baris member sendiri: wash dan teks cyan, plus garis cyan di atas dan bawah (! mengalahkan lebar dan warna
                    // dari divide-y; pada border-collapse garis bawah baris ini menang atas garis atas baris berikutnya).
                    return (
                      <tr
                        key={row.user?.id ?? `rank-${index}`}
                        className={isYou ? "!border-b !border-cyan-ink/35 bg-cyan-soft text-cyan-ink last:!border-b-0" : "transition-colors hover:bg-well"}
                        aria-current={isYou ? "true" : undefined}
                      >
                        <td className={`figure px-3 py-2.5 pl-5 text-base font-bold sm:pl-6 ${isYou ? "" : "text-ink-3"}`}>{row.rank}</td>
                        <td className="px-3 py-2.5">
                          <span className={`font-display font-semibold ${isYou ? "" : "text-ink"}`}>{row.user?.username ?? "unknown"}</span>
                          {isYou ? <span className="ml-1.5">(you)</span> : null}
                          {row.user?.fullName ? <span className={`block text-xs sm:hidden ${isYou ? "" : "text-ink-3"}`}>{row.user.fullName}</span> : null}
                        </td>
                        <td className={`hidden px-3 py-2.5 sm:table-cell ${isYou ? "" : "text-ink-2"}`}>{row.user?.fullName ?? "–"}</td>
                        <td className={`figure whitespace-nowrap px-3 py-2.5 pr-5 text-right font-semibold sm:pr-6 ${isYou ? "" : "text-ink"}`}>
                          {formatNumber(row.points)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {standing.rank && !isListed ? (
              <p className="border-t border-line px-5 py-3.5 text-sm text-ink-2 sm:px-6">
                {/* Rank memakai competition ranking: anggota yang seri di batas daftar bisa punya rank <= batas tetapi tidak termuat. */}
                {standing.rank > LEADERBOARD_LIMIT
                  ? `You're #${standing.rank} with ${formatNumber(standing.points)} pts, outside the top ${LEADERBOARD_LIMIT}.`
                  : `You share #${standing.rank} with ${formatNumber(standing.points)} pts. The list shows the first ${LEADERBOARD_LIMIT} members, so not everyone tied at that rank fits.`}
              </p>
            ) : null}
          </>
        )}
      </section>
    </AppShell>
  );
}
