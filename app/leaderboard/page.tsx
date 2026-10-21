import { AppShell } from "@/components/app-shell";
import { EmptyState, Figure, SectionHeader } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { formatNumber } from "@/lib/format/date";
import { getGlobalLeaderboard, getUserLeaderboardStanding } from "@/lib/services/leaderboard-service";

export const dynamic = "force-dynamic";

const LEADERBOARD_LIMIT = 50;

export default async function LeaderboardPage() {
  const profile = await requireRole(["STUDENT"]);
  const [leaderboard, standing] = await Promise.all([getGlobalLeaderboard(LEADERBOARD_LIMIT), getUserLeaderboardStanding(profile.id)]);

  const isListed = leaderboard.some((row) => row.user?.id === profile.id);
  // Selisih poin ke anggota terdekat di atas; hanya akurat bila user ada di papan yang dimuat.
  const nextAbove = isListed
    ? leaderboard.filter((row) => row.points > standing.points).reduce<number | null>((min, row) => (min === null || row.points < min ? row.points : min), null)
    : null;
  const pointsToMoveUp = nextAbove !== null ? nextAbove - standing.points : null;

  const rankNote = !standing.rank
    ? "Earn points to rank"
    : pointsToMoveUp !== null
      ? `${formatNumber(pointsToMoveUp)} pts to move up`
      : standing.rank === 1
        ? "Top of the board"
        : undefined;

  return (
    <AppShell title="Leaderboard" subtitle="Ranked by points from correct task answers and passed quizzes." role={profile.role}>
      <section className="sheet overflow-hidden" aria-label="Your standing">
        <div className="grid gap-px bg-line-soft sm:grid-cols-3">
          <Figure className="bg-sheet p-4 sm:p-5" label="Your rank" value={standing.rank ? `#${standing.rank}` : "–"} note={rankNote} />
          <Figure className="bg-sheet p-4 sm:p-5" label="Your points" value={formatNumber(standing.points)} unit="pts" />
          <Figure className="bg-sheet p-4 sm:p-5" label="Members ranked" value={formatNumber(standing.totalRanked)} />
        </div>
      </section>

      <section className="sheet mt-5 p-5 sm:p-6" aria-label="Rankings">
        <SectionHeader
          title="Rankings"
          description={
            leaderboard.length >= LEADERBOARD_LIMIT
              ? `The top ${LEADERBOARD_LIMIT} point totals on the platform.`
              : `${leaderboard.length} ${leaderboard.length === 1 ? "member has" : "members have"} points so far.`
          }
        />
        {leaderboard.length === 0 ? (
          <EmptyState title="No points recorded yet" message="The first correct task answer puts a member on the board." />
        ) : (
          <>
            <div className="-mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="field-label w-20 border-b border-line px-3 py-2.5 pl-5 text-left sm:pl-6">
                      Rank
                    </th>
                    <th scope="col" className="field-label border-b border-line px-3 py-2.5 text-left">
                      Username
                    </th>
                    <th scope="col" className="field-label border-b border-line px-3 py-2.5 text-left">
                      Name
                    </th>
                    <th scope="col" className="field-label border-b border-line px-3 py-2.5 pr-5 text-right sm:pr-6">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {leaderboard.map((row, index) => {
                    const isYou = row.user?.id === profile.id;

                    return (
                      <tr key={row.user?.id ?? `rank-${index}`} className={isYou ? "bg-cyan-soft/60" : "hover:bg-well"} aria-current={isYou ? "true" : undefined}>
                        <td className="figure px-3 py-2.5 pl-5 text-base font-bold text-ink sm:pl-6">{row.rank}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-semibold text-ink">{row.user?.username ?? "unknown"}</span>
                          {isYou ? <span className="ml-1.5 text-ink-3">(you)</span> : null}
                        </td>
                        <td className="px-3 py-2.5 text-ink-2">{row.user?.fullName ?? "–"}</td>
                        <td className="figure whitespace-nowrap px-3 py-2.5 pr-5 text-right font-semibold text-ink sm:pr-6">
                          {formatNumber(row.points)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {standing.rank && !isListed ? (
              <p className="mt-4 text-sm text-ink-2">
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
