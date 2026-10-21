"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { generateJSON, type Editor, type JSONContent } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { updateRoomContentAction, type MaterialActionState } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { MAX_RICH_CONTENT_LENGTH } from "@/lib/content/rich-text-config";

const initialState: MaterialActionState = { tone: "idle", message: "" };

const LEAVE_MESSAGE = "Ada perubahan materi yang belum disimpan. Tinggalkan halaman ini dan buang perubahan?";

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
 * Form materi room dengan editor visual seperti pengolah kata. Isi dikirim sebagai HTML
 * (contentFormat=HTML) dan disanitasi ulang di server sebelum disimpan.
 *
 * Status "belum disimpan" dibandingkan lewat struktur dokumen ProseMirror (murah), dan HTML
 * hanya dibentuk saat menyimpan, agar mengetik tetap ringan pada materi panjang.
 */
export function MaterialEditor({
  roomId,
  initialHtml,
  legacyMarkdown = false,
  disabled = false
}: {
  roomId: string;
  /** HTML awal yang sudah disanitasi server (materi Markdown lama sudah dikonversi). */
  initialHtml: string;
  /** True bila materi di database masih berformat Markdown. */
  legacyMarkdown?: boolean;
  disabled?: boolean;
}) {
  const [state, formAction] = useFormState(updateRoomContentAction, initialState);
  const [isDirty, setIsDirty] = useState(false);
  const [htmlLength, setHtmlLength] = useState(initialHtml.length);
  const [needsFormatUpgrade, setNeedsFormatUpgrade] = useState(legacyMarkdown);
  const [adjustedNotice, setAdjustedNotice] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const baselineDocRef = useRef<ProseMirrorNode | null>(null);
  const submittedDocRef = useRef<ProseMirrorNode | null>(null);
  const submittedHtmlRef = useRef(initialHtml);
  const contentInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lengthTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tooLong = htmlLength > MAX_RICH_CONTENT_LENGTH;

  const refreshDirty = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !baselineDocRef.current) return;
    setIsDirty(!editor.state.doc.eq(baselineDocRef.current));
  }, []);

  useEffect(() => {
    return () => {
      if (lengthTimerRef.current) clearTimeout(lengthTimerRef.current);
    };
  }, []);

  // Setelah simpan berhasil: dokumen saat dikirim menjadi baseline baru. Bila server membuang format
  // yang tidak didukung, editor diselaraskan agar instruktur melihat persis apa yang dilihat student.
  useEffect(() => {
    if (state.tone !== "success") return;

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

  // Peringatkan sebelum meninggalkan halaman (reload, tutup tab, atau link di dalam aplikasi).
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
    setIsDirty(false);
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
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="contentFormat" value="HTML" />
      <input ref={contentInputRef} type="hidden" name="content" defaultValue="" />

      {needsFormatUpgrade ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
          Materi ini masih tersimpan dalam format Markdown lama dan sudah dikonversi otomatis untuk diedit. Periksa hasilnya, lalu klik Simpan
          materi agar tersimpan dalam format editor baru.
        </p>
      ) : null}

      <RichTextEditor initialHtml={initialHtml} onChange={handleChange} onReady={handleReady} disabled={disabled} />

      {tooLong ? (
        <p className="text-xs text-rose-300" role="alert">
          Materi terlalu panjang ({htmlLength.toLocaleString("id-ID")} dari maksimal {MAX_RICH_CONTENT_LENGTH.toLocaleString("id-ID")} karakter HTML).
          Pecah menjadi beberapa room atau kurangi tabel besar.
        </p>
      ) : null}

      {adjustedNotice ? (
        <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs leading-relaxed text-blue-100" role="status">
          Sebagian format tidak didukung (misalnya gambar dari luar atau gaya yang tidak aman) dan disesuaikan saat disimpan. Editor kini
          menampilkan versi yang dilihat student.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <ActionMessage state={state} />
          <p className={`text-[11px] ${isDirty ? "text-amber-300" : "text-slate-500"}`} aria-live="polite">
            {isDirty ? "Ada perubahan yang belum disimpan." : "Semua perubahan sudah disimpan."} Tekan Ctrl/⌘+S untuk menyimpan.
          </p>
        </div>
        <SubmitButton label="Simpan materi" disabled={disabled || tooLong} />
      </div>
    </form>
  );
}
