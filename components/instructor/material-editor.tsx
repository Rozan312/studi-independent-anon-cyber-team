"use client";

import { useRef, useState } from "react";
import { useFormState } from "react-dom";
import { updateRoomContentAction } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { MarkdownContent } from "@/components/content/markdown-content";
import { ghostButtonClass, idleActionState } from "@/components/instructor/form-styles";

type UploadResponse = {
  data?: { url: string; fileName: string };
  error?: string;
};

const MAX_CONTENT_LENGTH = 60000;

/**
 * Editor materi Markdown untuk walkthrough room. Gambar diunggah ke /api/media dan
 * disisipkan sebagai sintaks Markdown di posisi kursor.
 */
export function MaterialEditor({ roomId, initialContent, disabled = false }: { roomId: string; initialContent: string; disabled?: boolean }) {
  const [state, formAction] = useFormState(updateRoomContentAction, idleActionState);
  const [content, setContent] = useState(initialContent);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function insertAtCursor(snippet: string) {
    const element = textareaRef.current;

    if (!element) {
      setContent((current) => current + snippet);
      return;
    }

    const start = element.selectionStart ?? content.length;
    const end = element.selectionEnd ?? start;
    const next = `${content.slice(0, start)}${snippet}${content.slice(end)}`;
    setContent(next);

    requestAnimationFrame(() => {
      element.focus();
      const position = start + snippet.length;
      element.setSelectionRange(position, position);
    });
  }

  function wrapSelection(before: string, after = before, placeholder = "teks") {
    const element = textareaRef.current;

    if (!element) {
      setContent((current) => `${current}${before}${placeholder}${after}`);
      return;
    }

    const start = element.selectionStart ?? content.length;
    const end = element.selectionEnd ?? start;
    const selected = content.slice(start, end) || placeholder;
    const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
    setContent(next);

    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/media", { method: "POST", body });
      const payload = (await response.json()) as UploadResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Upload gagal.");
      }

      const alt = payload.data.fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ") || "gambar";
      insertAtCursor(`\n![${alt}](${payload.data.url})\n`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload gagal.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const toolbarButtonClass = `${ghostButtonClass} px-2.5 py-1.5`;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="roomId" value={roomId} />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={toolbarButtonClass} disabled={disabled} onClick={() => insertAtCursor("\n## Judul bagian\n\n")}>
          Heading
        </button>
        <button type="button" className={toolbarButtonClass} disabled={disabled} onClick={() => wrapSelection("**")}>
          Bold
        </button>
        <button type="button" className={toolbarButtonClass} disabled={disabled} onClick={() => wrapSelection("`", "`", "perintah")}>
          Kode inline
        </button>
        <button type="button" className={toolbarButtonClass} disabled={disabled} onClick={() => insertAtCursor("\n```bash\n# tulis perintah contoh di sini\n```\n")}>
          Blok kode
        </button>
        <button type="button" className={toolbarButtonClass} disabled={disabled} onClick={() => insertAtCursor("\n- Langkah pertama\n- Langkah kedua\n")}>
          List
        </button>
        <button type="button" className={toolbarButtonClass} disabled={disabled} onClick={() => insertAtCursor("\n> Catatan penting untuk peserta.\n")}>
          Kutipan
        </button>
        <label className={`${toolbarButtonClass} ${disabled || uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
          {uploading ? "Mengunggah..." : "Upload gambar"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={handleUpload}
            disabled={disabled || uploading}
          />
        </label>
        <button type="button" className={`${toolbarButtonClass} ml-auto`} onClick={() => setShowPreview((value) => !value)}>
          {showPreview ? "Sembunyikan preview" : "Tampilkan preview"}
        </button>
      </div>

      {uploadError ? <p className="text-xs text-rose-300">{uploadError}</p> : null}

      <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        <div>
          <textarea
            ref={textareaRef}
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={22}
            disabled={disabled}
            maxLength={MAX_CONTENT_LENGTH}
            placeholder={"# Judul materi\n\nTulis walkthrough, konsep, dan langkah praktik di sini. Gunakan tombol Upload gambar untuk menyisipkan screenshot."}
            className="focus-ring w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 font-mono text-[13px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-1.5 text-[11px] text-slate-500">
            {content.length.toLocaleString("id-ID")} / {MAX_CONTENT_LENGTH.toLocaleString("id-ID")} karakter. Mendukung Markdown: heading, list,
            tabel, blok kode, gambar, dan tautan.
          </p>
        </div>

        {showPreview ? (
          <div className="min-h-[200px] rounded-lg border border-white/[0.08] bg-black/25 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Preview untuk student</p>
            {content.trim() ? (
              <MarkdownContent content={content} />
            ) : (
              <p className="text-sm text-slate-500">Belum ada materi untuk dipreview.</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionMessage state={state} />
        <SubmitButton label="Simpan materi" disabled={disabled} />
      </div>
    </form>
  );
}
