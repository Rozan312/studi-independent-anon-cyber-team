import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ProgressBar } from "@/components/card";
import { bodyCellClass, headCellClass, listPanelClass, panelHeadClass, panelTitleClass, tableRowClass } from "@/components/instructor/form-styles";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatNumber, formatRelativeTime, formatShortDate } from "@/lib/format/date";
import { getStudentProgress } from "@/lib/services/instructor-service";

export const metadata: Metadata = { title: "Members" };
export const dynamic = "force-dynamic";

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

  // Room terbit di dalam path terbit: penyebut "Rooms completed", dan hanya room ini yang dihitung di pembilangnya,
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

  const pointRows = await prisma.leaderboardPoint.groupBy({
    by: ["userId"],
    where: { userId: { in: memberIds } },
    _sum: { points: true }
  });
  const pointsByMember = new Map(pointRows.map((row) => [row.userId, row._sum.points ?? 0]));
  const roomNoun = (count: number) => (count === 1 ? "room" : "rooms");

  return (
    <AppShell title="Members" subtitle="How far members of your classes are through the published rooms." role={profile.role}>
      <section className={listPanelClass} aria-labelledby="member-progress-title">
        <div className={panelHeadClass}>
          <div className="min-w-0">
            <h2 id="member-progress-title" className={panelTitleClass}>
              Member progress
            </h2>
            {memberRows.length > 0 ? (
              <p className="mt-0.5 max-w-3xl text-sm text-ink-2">
                {formatNumber(memberRows.length)} {memberRows.length === 1 ? "member has" : "members have"} opened at least one room. Rooms completed
                counts the {formatNumber(publishedRoomCount)} published {roomNoun(publishedRoomCount)} in published learning paths.
              </p>
            ) : null}
          </div>
        </div>

        {memberRows.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              title="No member activity yet"
              message="Members of your classes appear here once they open their first room. Check Classes to see who is assigned to you."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr>
                  <th scope="col" className={headCellClass}>
                    Member
                  </th>
                  <th scope="col" className={headCellClass}>
                    Rooms completed
                  </th>
                  <th scope="col" className={`${headCellClass} text-right`}>
                    In progress
                  </th>
                  <th scope="col" className={`${headCellClass} text-right`}>
                    Points
                  </th>
                  <th scope="col" className={headCellClass}>
                    Latest room
                  </th>
                  <th scope="col" className={`${headCellClass} text-right`}>
                    Last activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {memberRows.map((member) => {
                  const share = publishedRoomCount > 0 ? (member.roomsDone / publishedRoomCount) * 100 : 0;

                  return (
                    <tr key={member.id} className={tableRowClass}>
                      <td className={bodyCellClass}>
                        <p className="font-display font-semibold text-ink">{member.fullName}</p>
                        <p className="text-xs text-ink-3">@{member.username}</p>
                      </td>
                      <td className={bodyCellClass}>
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
                      <td className={`${bodyCellClass} figure text-right text-ink-2`}>{member.roomsInProgress}</td>
                      <td className={`${bodyCellClass} figure text-right font-semibold text-ink`}>{formatNumber(pointsByMember.get(member.id) ?? 0)}</td>
                      <td className={bodyCellClass}>
                        <p className="max-w-[16rem] truncate text-ink-2">{member.latestRoom}</p>
                        <p className="text-xs text-ink-3">
                          {PROGRESS_LABEL[member.latestStatus] ?? member.latestStatus}
                          {member.latestStatus === "IN_PROGRESS" ? ` · ${member.latestPercentage}%` : ""}
                        </p>
                      </td>
                      <td className={`${bodyCellClass} whitespace-nowrap text-right text-ink-3`} title={formatShortDate(member.lastActivity)}>
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
