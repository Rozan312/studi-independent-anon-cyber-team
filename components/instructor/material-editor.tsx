"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { generateJSON, type Editor, type JSONContent } from "@tiptap/core";
import { updateRoomContentAction, type MaterialActionState } from "@/lib/actions/content-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { MAX_RICH_CONTENT_LENGTH } from "@/lib/content/rich-text-config";

const initialState: MaterialActionState = { tone: "idle", message: "" };

const LEAVE_MESSAGE = "Ada perubahan materi yang belum disimpan. Tinggalkan halaman ini dan buang perubahan?";

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
  const [html, setHtml] = useState(initialHtml);
  const [savedHtml, setSavedHtml] = useState(initialHtml);
  const [needsFormatUpgrade, setNeedsFormatUpgrade] = useState(legacyMarkdown);
  const [adjustedNotice, setAdjustedNotice] = useState(false);
  const submittedHtmlRef = useRef(initialHtml);
  const htmlRef = useRef(initialHtml);
  const editorRef = useRef<Editor | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isDirty = html !== savedHtml;
  const tooLong = html.length > MAX_RICH_CONTENT_LENGTH;

  useEffect(() => {
    htmlRef.current = html;
  }, [html]);

  // Setelah simpan berhasil: jadikan isi yang tersimpan sebagai baseline. Bila server membuang format
  // yang tidak didukung, editor diselaraskan agar instruktur melihat persis apa yang dilihat student.
  useEffect(() => {
    if (state.tone !== "success") return;

    const submitted = submittedHtmlRef.current;
    const editor = editorRef.current;
    const stored = state.savedContent;
    let baseline = submitted;
    let adjusted = false;

    if (editor && !editor.isDestroyed && typeof stored === "string" && htmlRef.current === submitted) {
      if (documentSignature(stored, editor) !== documentSignature(submitted, editor)) {
        const { from, to } = editor.state.selection;
        editor.chain().setMeta("addToHistory", false).setContent(stored, { emitUpdate: false }).run();
        const size = editor.state.doc.content.size;
        editor.commands.setTextSelection({ from: Math.min(from, size), to: Math.min(to, size) });
        baseline = editor.getHTML();
        adjusted = true;
        setHtml(baseline);
      }
    }

    setSavedHtml(baseline);
    submittedHtmlRef.current = baseline;
    setAdjustedNotice(adjusted);
    setNeedsFormatUpgrade(false);
  }, [state]);

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

  // Editor menormalisasi HTML awal; jadikan hasil normalisasi itu baseline agar tidak dianggap berubah.
  const handleReady = useCallback((normalized: string, editor: Editor) => {
    editorRef.current = editor;
    setHtml(normalized);
    setSavedHtml(normalized);
    submittedHtmlRef.current = normalized;
  }, []);

  const handleChange = useCallback((next: string) => {
    setHtml(next);
    setAdjustedNotice(false);
  }, []);

  // Ctrl/⌘+S menyimpan seperti di pengolah kata. Kombinasi dengan Shift/Alt dibiarkan untuk pintasan lain
  // (misalnya Ctrl/⌘+Shift+S untuk coret).
  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (!disabled && !tooLong) formRef.current?.requestSubmit();
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => {
        submittedHtmlRef.current = html;
      }}
      onKeyDown={handleKeyDown}
      className="space-y-4"
    >
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="contentFormat" value="HTML" />
      <input type="hidden" name="content" value={html} />

      {needsFormatUpgrade ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
          Materi ini masih tersimpan dalam format Markdown lama dan sudah dikonversi otomatis untuk diedit. Periksa hasilnya, lalu klik Simpan
          materi agar tersimpan dalam format editor baru.
        </p>
      ) : null}

      <RichTextEditor initialHtml={initialHtml} onChange={handleChange} onReady={handleReady} disabled={disabled} />

      {tooLong ? (
        <p className="text-xs text-rose-300" role="alert">
          Materi terlalu panjang ({html.length.toLocaleString("id-ID")} dari maksimal {MAX_RICH_CONTENT_LENGTH.toLocaleString("id-ID")} karakter HTML).
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
