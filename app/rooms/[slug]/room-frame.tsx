import { AppShell } from "@/components/app-shell";
import { RoomStatusStrip } from "@/components/rooms/room-status-strip";
import { RoomTabs, type RoomTab } from "@/components/rooms/room-tabs";
import { PageNotice } from "@/components/ui/page-notice";
import { describeAvailability } from "@/lib/learning/availability";
import type { OpenMemberRoomView } from "./room-view";

/**
 * Kerangka bersama tab room member: judul room, catatan preview instruktur, strip progres dan fakta,
 * lalu tab Material / Quiz (hanya bila room punya quiz) di atas isi tab.
 */
export function RoomFrame({
  view,
  active,
  previewMessage,
  children
}: {
  view: OpenMemberRoomView;
  active: RoomTab;
  /** Kalimat setelah status jadwal pada catatan preview; bawaannya menjelaskan kenapa staf bisa melihat room ini. */
  previewMessage?: string;
  children: React.ReactNode;
}) {
  const { room, availability, snapshot } = view;

  return (
    <AppShell title={room.title} subtitle={room.description} role={view.profile.role}>
      {view.isPreview ? (
        <PageNotice
          tone="warning"
          title="Instructor preview"
          message={`${describeAvailability(availability)}. ${
            previewMessage ?? "Members can't open this room right now; you can see it because you have the instructor or admin role."
          }`}
          className="mb-6"
        />
      ) : null}

      <RoomStatusStrip
        slug={room.slug}
        roomTitle={room.title}
        percentage={snapshot.percentage}
        isComplete={snapshot.isComplete}
        completedAt={view.completedAt}
        freshCompletion={view.freshCompletion}
        solvedTasks={view.solvedTasks}
        totalTasks={view.totalTasks}
        openTasksHref={view.openTasksHref}
        quiz={room.quiz ? { passed: snapshot.quizPassed, passingScore: room.quiz.passingScore } : null}
        points={view.points}
        estimatedMinutes={room.estimatedMinutes}
        difficulty={room.difficulty}
        learningPath={room.learningPath}
        availability={availability}
      />

      <RoomTabs slug={room.slug} active={active} hasQuiz={Boolean(room.quiz)} />

      {children}
    </AppShell>
  );
}
