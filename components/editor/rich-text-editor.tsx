"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import ImageExtension from "@tiptap/extension-image";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { isPureImagePaste, normalizePastedHtml } from "@/lib/content/paste-normalize";
import { altFromFileName, isUploadableImage, uploadImageFile } from "@/lib/content/upload-image";

export type RichTextEditorProps = {
  /** HTML awal yang sudah disanitasi server. */
  initialHtml: string;
  /** Dipanggil setiap isi dokumen berubah. Ambil HTML lewat editor saat dibutuhkan (mahal untuk dokumen panjang). */
  onChange: () => void;
  /** Dipanggil sekali setelah editor siap, dengan HTML hasil normalisasi editor dan instance editor. */
  onReady?: (html: string, editor: Editor) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
};

function imageFilesFrom(transfer: DataTransfer | null) {
  if (!transfer) return [];
  return Array.from(transfer.files ?? []).filter(isUploadableImage);
}

/** Jumlah kata dan karakter; dirender hanya saat editor sudah ada agar langsung terisi. */
function EditorStats({ editor }: { editor: Editor }) {
  const counts = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      words: current.storage.characterCount.words() as number,
      characters: current.storage.characterCount.characters() as number
    })
  });

  return (
    <span>
      {counts.words.toLocaleString("id-ID")} kata · {counts.characters.toLocaleString("id-ID")} karakter
    </span>
  );
}

/**
 * Editor visual (WYSIWYG) berbasis TipTap untuk materi room. Output berupa HTML yang
 * kemudian disanitasi ulang oleh server sebelum disimpan dan sebelum ditampilkan.
 */
export function RichTextEditor({
  initialHtml,
  onChange,
  onReady,
  disabled = false,
  placeholder = "Mulai menulis materi. Gunakan toolbar di atas untuk format teks, gambar, dan tabel.",
  ariaLabel = "Editor materi"
}: RichTextEditorProps) {
  const [uploadStatus, setUploadStatus] = useState<{ tone: "info" | "error"; message: string } | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onChangeRef.current = onChange;
    onReadyRef.current = onReady;
  }, [onChange, onReady]);

  /**
   * Unggah gambar lalu sisipkan. Posisi drop dipetakan mengikuti perubahan dokumen selama upload
   * berlangsung, sehingga gambar tetap mendarat di tempat yang dimaksud walau instruktur terus mengetik.
   */
  async function uploadAndInsert(files: File[], position?: number) {
    const current = editorRef.current;
    if (!current || files.length === 0) return;

    type Mappable = { mapping: { map: (pos: number) => number } };
    let insertAt = position;
    // Petakan posisi melalui transaksi utama dan transaksi tambahan dari plugin (appendTransaction).
    const trackPosition = ({ transaction, appendedTransactions }: { transaction: Mappable; appendedTransactions?: Mappable[] }) => {
      if (typeof insertAt !== "number") return;
      for (const tr of [transaction, ...(appendedTransactions ?? [])]) insertAt = tr.mapping.map(insertAt);
    };
    current.on("transaction", trackPosition);

    setUploadStatus({ tone: "info", message: files.length > 1 ? `Mengunggah ${files.length} gambar...` : "Mengunggah gambar..." });

    try {
      for (const file of files) {
        const uploaded = await uploadImageFile(file);
        const live = editorRef.current;
        if (!live || live.isDestroyed) return;

        const node = { type: "image", attrs: { src: uploaded.url, alt: altFromFileName(uploaded.fileName) } };

        if (typeof insertAt === "number") {
          const safePosition = Math.min(Math.max(insertAt, 0), live.state.doc.content.size);
          live.chain().insertContentAt(safePosition, node).run();
          insertAt = undefined;
        } else {
          live.chain().focus().insertContent(node).run();
        }
      }
      setUploadStatus(null);
    } catch (error) {
      setUploadStatus({ tone: "error", message: error instanceof Error ? error.message : "Upload gambar gagal." });
    } finally {
      current.off("transaction", trackPosition);
    }
  }

  const uploadRef = useRef(uploadAndInsert);
  uploadRef.current = uploadAndInsert;

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    // Pintasan Markdown hanya untuk struktur blok (daftar, judul, kutipan, kode, garis). Aturan untuk tanda
    // inline (*, _, ==, ~~) dimatikan karena memakan karakter pada perintah dan kode yang ditempel atau diketik.
    enableInputRules: ["bulletList", "orderedList", "taskItem", "heading", "blockquote", "codeBlock", "horizontalRule"],
    enablePasteRules: ["link"],
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          // Hanya URL eksplisit yang otomatis jadi link; nama file (exploit.py) dan domain contoh (malware.ru) tidak.
          shouldAutoLink: (url) => /^https?:\/\//i.test(url),
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" }
        }
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
      Subscript,
      Superscript,
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
        resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 80, minHeight: 40 }
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "prose-cyber rich-editor-content",
        "aria-label": ariaLabel,
        "aria-multiline": "true",
        spellcheck: "true"
      },
      transformPastedHTML: (html) => normalizePastedHtml(html),
      handlePaste: (_view, event) => {
        const files = imageFilesFrom(event.clipboardData);
        // Office menyertakan bitmap pratinjau di samping HTML: tempel HTML-nya, bukan gambarnya.
        if (files.length === 0 || !isPureImagePaste(event.clipboardData)) return false;
        event.preventDefault();
        void uploadRef.current(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = imageFilesFrom(event.dataTransfer);
        if (files.length === 0) return false;
        event.preventDefault();
        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
        void uploadRef.current(files, coordinates?.pos);
        return true;
      }
    },
    onCreate: ({ editor: created }) => {
      editorRef.current = created;
      // Jalankan plugin normalisasi (misalnya paragraf penutup otomatis) sebelum mengambil baseline,
      // agar klik pertama di editor tidak dianggap sebagai perubahan.
      created.view.dispatch(created.state.tr.setMeta("addToHistory", false));
      onReadyRef.current?.(created.getHTML(), created);
    },
    onUpdate: () => {
      onChangeRef.current();
    },
    onDestroy: () => {
      editorRef.current = null;
    }
  });

  useEffect(() => {
    if (editor && editor.isEditable === disabled) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  return (
    <div className={`rich-editor rounded-xl border border-slate-800 bg-slate-950 ${disabled ? "opacity-70" : ""}`}>
      {editor ? (
        <EditorToolbar editor={editor} disabled={disabled} onPickImages={(files) => uploadAndInsert(files)} />
      ) : (
        <div className="h-[92px] rounded-t-xl border-b border-slate-800 bg-[#0d121d]" aria-hidden="true" />
      )}

      {uploadStatus ? (
        <div
          role={uploadStatus.tone === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 border-b px-4 py-2 text-xs ${
            uploadStatus.tone === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : "border-primary/30 bg-primary/10 text-blue-100"
          }`}
        >
          <span>{uploadStatus.message}</span>
          {uploadStatus.tone === "error" ? (
            <button type="button" onClick={() => setUploadStatus(null)} className="font-bold text-rose-100 hover:underline">
              Tutup
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[60vh] min-h-[320px] overflow-y-auto sm:max-h-[70vh] sm:min-h-[380px]">
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="p-4 text-sm text-slate-500" aria-live="polite">
            Memuat editor...
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t border-slate-800 bg-[#0d121d] px-4 py-2 text-[11px] text-slate-500">
        {editor ? <EditorStats editor={editor} /> : <span>{" "}</span>}
        <span>Tempel atau seret gambar langsung ke editor untuk mengunggah.</span>
      </div>
    </div>
  );
}
