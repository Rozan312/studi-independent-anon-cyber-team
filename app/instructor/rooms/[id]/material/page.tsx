import type { Metadata } from "next";
import type { ContentFormat } from "@prisma/client";
import { SectionHeader } from "@/components/card";
import { ChapterList, type ChapterListItem } from "@/components/instructor/chapter-list";
import { panelClass } from "@/components/instructor/form-styles";
import { richHtmlToPlainText, roomMaterialToEditorHtml } from "@/lib/content/rich-text";
import { formatNumber, formatRelativeTime } from "@/lib/format/date";
import { taskChapterId } from "@/lib/learning/chapters";
import { loadRoomEditor } from "../editor-data";

export const metadata: Metadata = { title: "Room material" };
export const dynamic = "force-dynamic";

/** Ringkasan isi bab untuk daftar: kosong, tanpa teks (hanya gambar/garis), atau perkiraan jumlah kata. */
function summarizeChapter(content: string, format: ContentFormat) {
  if (!content.trim()) return { isEmpty: true, summary: "Empty" };

  const text = richHtmlToPlainText(roomMaterialToEditorHtml(content, format));
  const words = text ? text.split(" ").length : 0;
  return { isEmpty: false, summary: words > 0 ? `${formatNumber(words)} ${words === 1 ? "word" : "words"}` : "No text" };
}

export default async function RoomMaterialPage({ params }: { params: { id: string } }) {
  const { room, canManage } = await loadRoomEditor(params.id);
  const now = new Date();

  const taskCounts = new Map<string, number>();
  for (const task of room.tasks) {
    const chapterId = taskChapterId(task.chapterId, room.chapters);
    if (chapterId) taskCounts.set(chapterId, (taskCounts.get(chapterId) ?? 0) + 1);
  }

  const chapters: ChapterListItem[] = room.chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    ...summarizeChapter(chapter.content, chapter.contentFormat),
    editedLabel: `Edited ${formatRelativeTime(chapter.updatedAt, now).replace(/^(Just now|Yesterday)$/, (word) => word.toLowerCase())}`,
    taskCount: taskCounts.get(chapter.id) ?? 0
  }));

  return (
    <section aria-labelledby="room-material-heading" className={panelClass}>
      <SectionHeader
        id="room-material-heading"
        title="Material"
        description="The walkthrough members read one chapter at a time, in this order, with each chapter's tasks below it. Open a chapter to write it with the same formatting members see."
      />
      <ChapterList roomId={room.id} chapters={chapters} disabled={!canManage} />
    </section>
  );
}
