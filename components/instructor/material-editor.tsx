"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { generateJSON, type Editor, type JSONContent } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { updateRoomChapterAction, type MaterialActionState } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { inputClass, labelClass, primaryButtonClass } from "@/components/instructor/form-styles";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { CHAPTER_TITLE_MAX, MAX_RICH_CONTENT_LENGTH } from "@/lib/content/rich-text-config";

const initialState: MaterialActionState = { tone: "idle", message: "" };

const SESSION_ENDED_STATE: MaterialActionState = {
  tone: "error",
  message: "Your session ended. Sign in again in another tab, then save here. Your edits are still on this page."
};

/**
 * Simpan bab. Bila sesi habis, middleware mengalihkan request action ke /login dan Next menyelesaikan action
 * tanpa hasil (undefined), tanpa pindah halaman. Hasil kosong itu dijadikan pesan error agar editor tetap
 * terpasang dan suntingan yang belum tersimpan tidak hilang.
 */
async function saveChapter(state: MaterialActionState, formData: FormData): Promise<MaterialActionState> {
  return (await updateRoomChapterAction(state, formData)) ?? SESSION_ENDED_STATE;
}

const LEAVE_MESSAGE = "You have unsaved changes in this chapter. Leave this page and discard them?";

/** Panjang HTML dihitung ulang setelah jeda mengetik, bukan di setiap ketikan (mahal untuk dokumen panjang). */
const LENGTH_CHECK_DELAY_MS = 600;

/** Struktur dokumen tanpa paragraf kosong di akhir (ditambahkan otomatis oleh editor). */
function documentSignature(html: string, editor: Editor) {
  const json = generateJSON(html || "<p></p>", editor.extensionManager.extensions) as JSONContent;
  const content = [...(json.content ?? [])];
  while (content.length > 0) {
    const last = content[content.length - 1];
    if (last.type === "paragraph" && !(last.content && last.content.length > 0)) content.pop();
    else break;
  }
  return JSON.stringify(content);
}

/**
 * Form satu bab materi: judul bab dan editor visual seperti pengolah kata. Isi dikirim sebagai HTML
 * (contentFormat=HTML) dan disanitasi ulang di server sebelum disimpan.
 *
 * Status "belum disimpan" dibandingkan lewat struktur dokumen ProseMirror (murah) ditambah judul, dan HTML
 * hanya dibentuk saat menyimpan, agar mengetik tetap ringan pada bab panjang.
 */
export function MaterialEditor({
  chapterId,
  initialTitle,
  initialHtml,
  legacyMarkdown = false,
  disabled = false
}: {
  chapterId: string;
  initialTitle: string;
  /** HTML awal yang sudah disanitasi server (materi Markdown lama sudah dikonversi). */
  initialHtml: string;
  /** True bila bab ini di database masih berformat Markdown. */
  legacyMarkdown?: boolean;
  disabled?: boolean;
}) {
  const [state, formAction] = useFormState(saveChapter, initialState);
  const [contentDirty, setContentDirty] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [htmlLength, setHtmlLength] = useState(initialHtml.length);
  const [needsFormatUpgrade, setNeedsFormatUpgrade] = useState(legacyMarkdown);
  const [adjustedNotice, setAdjustedNotice] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const baselineDocRef = useRef<ProseMirrorNode | null>(null);
  const submittedDocRef = useRef<ProseMirrorNode | null>(null);
  const submittedHtmlRef = useRef(initialHtml);
  const submittedTitleRef = useRef(initialTitle);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lengthTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();

  const tooLong = htmlLength > MAX_RICH_CONTENT_LENGTH;
  // Spasi di tepi judul dibuang server, jadi tidak dihitung sebagai perubahan.
  const isDirty = contentDirty || title.trim() !== savedTitle;
  // Bab Markdown lama yang belum disunting tidak hilang bila ditinggal (member tetap membaca Markdown-nya),
  // jadi tidak memicu peringatan keluar; statusnya hanya tidak boleh berbunyi "tersimpan".
  const saveStatus = isDirty
    ? { text: "Unsaved changes.", attention: true }
    : needsFormatUpgrade
      ? { text: "Not yet saved in the new format.", attention: true }
      : { text: "All changes saved.", attention: false };

  const refreshDirty = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !baselineDocRef.current) return;
    setContentDirty(!editor.state.doc.eq(baselineDocRef.current));
  }, []);

  useEffect(() => {
    return () => {
      if (lengthTimerRef.current) clearTimeout(lengthTimerRef.current);
    };
  }, []);

  // Setelah simpan berhasil: judul dan dokumen saat dikirim menjadi baseline baru. Bila server membuang format
  // yang tidak didukung, editor diselaraskan agar instruktur melihat persis apa yang dilihat member.
  useEffect(() => {
    if (state?.tone !== "success") return;

    if (typeof state.savedTitle === "string") {
      const stored = state.savedTitle;
      setSavedTitle(stored);
      setTitle((current) => (current === submittedTitleRef.current ? stored : current));
    }

    const editor = editorRef.current;
    if (!editor || editor.isDestroyed) return;

    const stored = state.savedContent;
    const submittedDoc = submittedDocRef.current;
    const unchangedSinceSubmit = submittedDoc ? editor.state.doc.eq(submittedDoc) : false;
    let adjusted = false;

    if (typeof stored === "string" && unchangedSinceSubmit) {
      if (documentSignature(stored, editor) !== documentSignature(submittedHtmlRef.current, editor)) {
        const { from, to } = editor.state.selection;
        editor.chain().setMeta("addToHistory", false).setContent(stored, { emitUpdate: false }).run();
        const size = editor.state.doc.content.size;
        editor.commands.setTextSelection({ from: Math.min(from, size), to: Math.min(to, size) });
        adjusted = true;
      }
    }

    baselineDocRef.current = adjusted || !submittedDoc ? editor.state.doc : submittedDoc;
    setAdjustedNotice(adjusted);
    setNeedsFormatUpgrade(false);
    refreshDirty();
  }, [state, refreshDirty]);

  // Peringatkan sebelum meninggalkan halaman (reload, tutup tab, atau link di dalam aplikasi seperti bab lain).
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    function handleLinkClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (!target || target.closest("[contenteditable='true']")) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      if (!window.confirm(LEAVE_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [isDirty]);

  // Editor menormalisasi HTML awal; dokumen hasil normalisasi itu menjadi baseline.
  const handleReady = useCallback((normalized: string, editor: Editor) => {
    editorRef.current = editor;
    baselineDocRef.current = editor.state.doc;
    submittedHtmlRef.current = normalized;
    setHtmlLength(normalized.length);
    setContentDirty(false);
  }, []);

  const handleChange = useCallback(() => {
    refreshDirty();
    setAdjustedNotice(false);

    if (lengthTimerRef.current) clearTimeout(lengthTimerRef.current);
    lengthTimerRef.current = setTimeout(() => {
      const editor = editorRef.current;
      if (editor && !editor.isDestroyed) setHtmlLength(editor.getHTML().length);
    }, LENGTH_CHECK_DELAY_MS);
  }, [refreshDirty]);

  // HTML dibentuk tepat sebelum React membaca FormData (onSubmit berjalan lebih dulu dari form action).
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const editor = editorRef.current;
    if (!editor || editor.isDestroyed) {
      event.preventDefault();
      return;
    }

    const html = editor.getHTML();
    setHtmlLength(html.length);
    if (html.length > MAX_RICH_CONTENT_LENGTH) {
      event.preventDefault();
      return;
    }

    if (contentInputRef.current) contentInputRef.current.value = html;
    submittedHtmlRef.current = html;
    submittedDocRef.current = editor.state.doc;
    submittedTitleRef.current = title;
  }

  // Ctrl/⌘+S menyimpan seperti di pengolah kata. Kombinasi dengan Shift/Alt dibiarkan untuk pintasan lain
  // (misalnya Ctrl/⌘+Shift+S untuk coret).
  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (!disabled) formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
      <input type="hidden" name="chapterId" value={chapterId} />
      <input type="hidden" name="contentFormat" value="HTML" />
      <input ref={contentInputRef} type="hidden" name="content" defaultValue="" />

      <div>
        <label htmlFor={titleId} className={labelClass}>
          Chapter title
        </label>
        <input
          id={titleId}
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={CHAPTER_TITLE_MAX}
          className={inputClass}
          disabled={disabled}
        />
      </div>

      {needsFormatUpgrade ? (
        <p className="rounded-lg border border-amber/30 bg-amber-soft px-3 py-2 text-sm leading-relaxed text-ink">
          This chapter is still stored in the old Markdown format and was converted automatically for editing. Check the result, then select
          Save chapter to store it in the new editor format.
        </p>
      ) : null}

      <RichTextEditor initialHtml={initialHtml} onChange={handleChange} onReady={handleReady} disabled={disabled} ariaLabel="Chapter material" />

      {tooLong ? (
        <p className="text-sm text-red" role="alert">
          This chapter is too long ({htmlLength.toLocaleString("en-US")} of {MAX_RICH_CONTENT_LENGTH.toLocaleString("en-US")} HTML characters
          allowed). Split it into more chapters or shorten large tables.
        </p>
      ) : null}

      {adjustedNotice ? (
        <p className="rounded-lg border border-line bg-well px-3 py-2 text-sm leading-relaxed text-ink" role="status">
          Some formatting isn&apos;t supported (such as external images or unsafe styles) and was adjusted on save. The editor now shows exactly
          what members see.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <ActionMessage state={state ?? SESSION_ENDED_STATE} />
          <p className="text-xs text-ink-3" aria-live="polite">
            <span className={saveStatus.attention ? "font-semibold text-amber" : undefined}>{saveStatus.text}</span> Press Ctrl/⌘+S to save.
          </p>
        </div>
        <SubmitButton label="Save chapter" pendingLabel="Saving…" className={primaryButtonClass} disabled={disabled || tooLong} />
      </div>
    </form>
  );
}
