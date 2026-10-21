import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar, SectionHeader } from "@/components/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { getStudentProgress } from "@/lib/services/instructor-service";

export const dynamic = "force-dynamic";

const headCell = "field-label whitespace-nowrap border-b border-line px-3 py-2.5 text-left first:pl-5 last:pr-5";
const bodyCell = "px-3 py-2.5 first:pl-5 last:pr-5";

const PROGRESS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed"
};

type MemberRow = {
  id: string;
  fullName: string;
  username: string;
  roomsDone: number;
  roomsInProgress: number;
  lastActivity: Date;
  latestRoom: string;
  latestStatus: string;
  latestPercentage: number;
};

export default async function InstructorMembersPage() {
  const profile = await requireRole(["INSTRUCTOR"]);
  const now = new Date();

  // Room terbit di dalam path terbit (baca saja): penyebut "Rooms done", dan hanya room ini yang dihitung di pembilangnya,
  // agar room yang sudah ditarik ke draft atau berada di path draft tidak menghasilkan "3 of 2" atau "2 of 0".
  const [progress, publishedRooms] = await Promise.all([
    getStudentProgress(profile.id),
    prisma.room.findMany({ where: { isPublished: true, learningPath: { isPublished: true } }, select: { id: true } })
  ]);
  const publishedRoomIds = new Set(publishedRooms.map((room) => room.id));
  const publishedRoomCount = publishedRoomIds.size;

  // Satu baris per member. Progress sudah terurut dari aktivitas terbaru, jadi baris pertama = aktivitas terakhir.
  const members = new Map<string, MemberRow>();
  for (const row of progress) {
    let member = members.get(row.userId);
    if (!member) {
      member = {
        id: row.userId,
        fullName: row.user.fullName,
        username: row.user.username,
        roomsDone: 0,
        roomsInProgress: 0,
        lastActivity: row.updatedAt,
        latestRoom: row.room.title,
        latestStatus: row.status,
        latestPercentage: row.progressPercentage
      };
      members.set(row.userId, member);
    }
    if (row.status === "COMPLETED") {
      if (publishedRoomIds.has(row.roomId)) member.roomsDone += 1;
    } else if (row.status === "IN_PROGRESS") {
      member.roomsInProgress += 1;
    }
  }
  const memberRows = Array.from(members.values());
  const memberIds = memberRows.map((member) => member.id);

  // Poin (baca saja) untuk kolom Points.
  const pointRows = await prisma.leaderboardPoint.groupBy({
    by: ["userId"],
    where: { userId: { in: memberIds } },
    _sum: { points: true }
  });
  const pointsByMember = new Map(pointRows.map((row) => [row.userId, row._sum.points ?? 0]));
  const roomNoun = (count: number) => (count === 1 ? "room" : "rooms");

  return (
    <AppShell title="Members" subtitle="How far members of your classes are through the published rooms." role={profile.role}>
      <section className="sheet overflow-hidden" aria-labelledby="member-progress-title">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <SectionHeader
            id="member-progress-title"
            title="Member progress"
            description={
              memberRows.length > 0
                ? `${formatNumber(memberRows.length)} ${memberRows.length === 1 ? "member has" : "members have"} opened at least one room. Rooms done counts the ${formatNumber(publishedRoomCount)} published ${roomNoun(publishedRoomCount)} in published learning paths.`
                : undefined
            }
          />
        </div>

        {memberRows.length === 0 ? (
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <EmptyState
              title="No member activity yet"
              message="Members of your classes appear here once they open their first room. Check Classes to see who is assigned to you."
            />
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr>
                  <th className={headCell}>Member</th>
                  <th className={headCell}>Rooms done</th>
                  <th className={`${headCell} text-right`}>In progress</th>
                  <th className={`${headCell} text-right`}>Points</th>
                  <th className={headCell}>Latest room</th>
                  <th className={`${headCell} text-right`}>Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {memberRows.map((member) => {
                  const share = publishedRoomCount > 0 ? (member.roomsDone / publishedRoomCount) * 100 : 0;

                  return (
                    <tr key={member.id} className="hover:bg-well">
                      <td className={bodyCell}>
                        <p className="font-semibold text-ink">{member.fullName}</p>
                        <p className="text-xs text-ink-3">@{member.username}</p>
                      </td>
                      <td className={bodyCell}>
                        <p className="figure text-ink">
                          <span className="font-semibold">{member.roomsDone}</span>
                          <span className="text-ink-3"> of {publishedRoomCount}</span>
                        </p>
                        <ProgressBar
                          value={share}
                          label={`${member.fullName}: ${member.roomsDone} of ${publishedRoomCount} ${roomNoun(publishedRoomCount)} done`}
                          className="mt-1.5 w-32"
                        />
                      </td>
                      <td className={`${bodyCell} figure text-right text-ink-2`}>{member.roomsInProgress}</td>
                      <td className={`${bodyCell} figure text-right font-semibold text-ink`}>{formatNumber(pointsByMember.get(member.id) ?? 0)}</td>
                      <td className={bodyCell}>
                        <p className="max-w-[16rem] truncate text-ink-2">{member.latestRoom}</p>
                        <p className="text-xs text-ink-3">
                          {PROGRESS_LABEL[member.latestStatus] ?? member.latestStatus}
                          {member.latestStatus === "IN_PROGRESS" ? ` · ${member.latestPercentage}%` : ""}
                        </p>
                      </td>
                      <td className={`${bodyCell} whitespace-nowrap text-right text-ink-3`} title={formatShortDate(member.lastActivity)}>
                        {formatRelativeTime(member.lastActivity, now)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
