"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  HIGHLIGHT_COLOR_OPTIONS,
  TEXT_COLOR_OPTIONS,
  normalizeColor,
  normalizeCssValue,
  normalizeLinkHref
} from "@/lib/content/rich-text-config";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/content/upload-image";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BulletListIcon,
  ClearFormatIcon,
  CodeBlockIcon,
  CodeIcon,
  HighlightIcon,
  HorizontalRuleIcon,
  ImageIcon,
  IndentIcon,
  LinkIcon,
  OrderedListIcon,
  OutdentIcon,
  QuoteIcon,
  RedoIcon,
  TableIcon,
  TaskListIcon,
  TextColorIcon,
  UndoIcon
} from "@/components/editor/editor-icons";

const BLOCK_STYLES = [
  { value: "paragraph", label: "Teks normal" },
  { value: "h1", label: "Judul 1" },
  { value: "h2", label: "Judul 2" },
  { value: "h3", label: "Judul 3" },
  { value: "h4", label: "Judul 4" }
] as const;

type BlockStyle = (typeof BLOCK_STYLES)[number]["value"];

const ALIGNMENTS = [
  { value: "left", label: "Rata kiri", shortcut: "Ctrl/⌘+Shift+L", Icon: AlignLeftIcon },
  { value: "center", label: "Rata tengah", shortcut: "Ctrl/⌘+Shift+E", Icon: AlignCenterIcon },
  { value: "right", label: "Rata kanan", shortcut: "Ctrl/⌘+Shift+R", Icon: AlignRightIcon },
  { value: "justify", label: "Rata kiri-kanan", shortcut: "Ctrl/⌘+Shift+J", Icon: AlignJustifyIcon }
] as const;

const selectClass =
  "h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs font-semibold text-slate-200 outline-none transition hover:border-slate-500 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Tombol toolbar. `active` hanya diisi untuk tombol toggle (dibacakan sebagai "pressed");
 * `expanded` dipakai tombol pembuka popover; `highlighted` hanya efek visual.
 */
function ToolButton({
  label,
  shortcut,
  active,
  expanded,
  highlighted,
  disabled = false,
  onClick,
  children
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  expanded?: boolean;
  highlighted?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const isOn = highlighted ?? active ?? false;

  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={expanded === undefined ? active : undefined}
      aria-expanded={expanded}
      aria-haspopup={expanded === undefined ? undefined : "dialog"}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-35 ${
        isOn ? "bg-primary/20 text-blue-100 ring-1 ring-primary/50" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 hidden h-6 w-px bg-slate-700/80 sm:inline-block" aria-hidden="true" />;
}

/** Panel kecil di bawah tombol; tertutup saat klik di luar atau menekan Escape. */
function ToolbarPopover({
  label,
  shortcut,
  active = false,
  disabled = false,
  buttonContent,
  children,
  open,
  onOpenChange,
  align = "left"
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  buttonContent: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "left" | "right";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [shiftX, setShiftX] = useState(0);

  // Geser panel secara horizontal agar selalu muat di layar (penting di ponsel).
  useLayoutEffect(() => {
    if (!open) {
      setShiftX(0);
      return;
    }

    const panel = panelRef.current;
    if (!panel) return;

    panel.style.transform = "none";
    const rect = panel.getBoundingClientRect();
    panel.style.transform = "";

    const margin = 8;
    let delta = 0;
    if (rect.left < margin) delta = margin - rect.left;
    else if (rect.right > window.innerWidth - margin) delta = window.innerWidth - margin - rect.right;
    setShiftX(delta);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) onOpenChange(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const focusWasInside = containerRef.current?.contains(document.activeElement) ?? false;
      onOpenChange(false);
      // Kembalikan fokus ke tombol pembuka agar pengguna keyboard tidak kehilangan posisi.
      if (focusWasInside) containerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={containerRef} className="relative">
      <ToolButton
        label={label}
        shortcut={shortcut}
        expanded={open}
        highlighted={active || open}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
      >
        <span className="inline-flex items-center gap-0.5">
          {buttonContent}
          <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </ToolButton>
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          style={shiftX ? { transform: `translateX(${shiftX}px)` } : undefined}
          className={`absolute top-full z-30 mt-1.5 w-64 max-w-[calc(100vw-1rem)] rounded-lg border border-slate-700 bg-[#111827] p-3 shadow-2xl shadow-black/50 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ColorGrid({
  options,
  current,
  onPick,
  resetLabel,
  onReset,
  swatchKind
}: {
  options: { label: string; value: string }[];
  current: string;
  onPick: (value: string) => void;
  resetLabel: string;
  onReset: () => void;
  swatchKind: "text" | "highlight";
}) {
  const normalizedCurrent = normalizeColor(current);

  return (
    <div>
      <div className="grid grid-cols-6 gap-1.5">
        {options.map((option) => {
          const selected = normalizedCurrent !== "" && normalizeColor(option.value) === normalizedCurrent;
          return (
            <button
              key={option.value}
              type="button"
              title={option.label}
              aria-label={option.label}
              aria-pressed={selected}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(option.value)}
              className={`flex h-8 items-center justify-center rounded-md border text-xs font-black transition ${
                selected ? "border-primary ring-2 ring-primary/50" : "border-slate-700 hover:border-slate-400"
              }`}
              style={swatchKind === "text" ? { color: option.value, backgroundColor: "#0b0f19" } : { backgroundColor: option.value, color: "#f8fafc" }}
            >
              A
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onReset}
        className="mt-2 w-full rounded-md border border-slate-700 px-2 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06]"
      >
        {resetLabel}
      </button>
    </div>
  );
}

function getBlockStyle(editor: Editor): BlockStyle {
  for (const level of [1, 2, 3, 4] as const) {
    if (editor.isActive("heading", { level })) return `h${level}` as BlockStyle;
  }
  return "paragraph";
}

export function EditorToolbar({
  editor,
  disabled = false,
  onPickImages
}: {
  editor: Editor;
  disabled?: boolean;
  onPickImages: (files: File[]) => void | Promise<void>;
}) {
  const [openMenu, setOpenMenu] = useState<"color" | "highlight" | "link" | "more" | "table" | null>(null);
  const [linkDraft, setLinkDraft] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const textStyle = current.getAttributes("textStyle") as { color?: string; fontFamily?: string; fontSize?: string };
      const highlight = current.getAttributes("highlight") as { color?: string };
      const inTaskList = current.isActive("taskList");
      const listItemType = inTaskList ? "taskItem" : "listItem";

      return {
        blockStyle: getBlockStyle(current),
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        strike: current.isActive("strike"),
        code: current.isActive("code"),
        superscript: current.isActive("superscript"),
        subscript: current.isActive("subscript"),
        link: current.isActive("link"),
        linkHref: (current.getAttributes("link").href as string | undefined) ?? "",
        color: textStyle.color ?? "",
        fontFamily: textStyle.fontFamily ?? "",
        fontSize: textStyle.fontSize ?? "",
        highlight: current.isActive("highlight"),
        highlightColor: highlight.color ?? "",
        align: (ALIGNMENTS.find((alignment) => current.isActive({ textAlign: alignment.value }))?.value ?? "left") as string,
        bulletList: current.isActive("bulletList"),
        orderedList: current.isActive("orderedList"),
        taskList: inTaskList,
        blockquote: current.isActive("blockquote"),
        codeBlock: current.isActive("codeBlock"),
        table: current.isActive("table"),
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
        canIndent: current.can().sinkListItem(listItemType),
        canOutdent: current.can().liftListItem(listItemType),
        listItemType,
        canMergeCells: current.can().mergeCells(),
        canSplitCell: current.can().splitCell()
      };
    }
  });

  const chain = () => editor.chain().focus();
  const isOff = disabled || !editor.isEditable;

  const fontFamilyValue =
    FONT_FAMILY_OPTIONS.find((option) => normalizeCssValue(option.value) === normalizeCssValue(state.fontFamily))?.value ??
    (state.fontFamily ? "__custom" : "");
  const fontSizeValue = FONT_SIZE_OPTIONS.find((option) => option.value === state.fontSize)?.value ?? (state.fontSize ? "__custom" : "");

  function setBlockStyle(value: BlockStyle) {
    if (value === "paragraph") {
      chain().setParagraph().run();
      return;
    }
    const level = Number(value.slice(1)) as 1 | 2 | 3 | 4;
    chain().setHeading({ level }).run();
  }

  function openLinkMenu(open: boolean) {
    setOpenMenu(open ? "link" : null);
    if (open) {
      setLinkDraft(state.linkHref);
      setLinkError(null);
    }
  }

  function applyLink() {
    const href = normalizeLinkHref(linkDraft);
    if (!href) {
      setLinkError("Gunakan alamat https://, mailto:, atau path internal seperti /rooms/...");
      return;
    }

    if (editor.state.selection.empty && !state.link) {
      chain()
        .insertContent({ type: "text", text: linkDraft.trim(), marks: [{ type: "link", attrs: { href } }] })
        // Link bersifat inklusif (autolink); lepas mark agar teks yang diketik berikutnya bukan bagian link.
        .unsetMark("link")
        .run();
    } else {
      chain().extendMarkRange("link").setLink({ href }).run();
    }

    setOpenMenu(null);
  }

  function removeLink() {
    chain().extendMarkRange("link").unsetLink().run();
    setOpenMenu(null);
  }

  type ToolbarAction = {
    key: string;
    label: string;
    shortcut?: string;
    active?: boolean;
    disabled?: boolean;
    run: () => void;
    content: React.ReactNode;
  };

  const scriptActions: ToolbarAction[] = [
    {
      key: "superscript",
      label: "Superskrip",
      shortcut: "Ctrl/⌘+.",
      active: state.superscript,
      run: () => chain().toggleSuperscript().run(),
      content: (
        <span className="text-xs">
          x<sup className="text-[9px]">2</sup>
        </span>
      )
    },
    {
      key: "subscript",
      label: "Subskrip",
      shortcut: "Ctrl/⌘+,",
      active: state.subscript,
      run: () => chain().toggleSubscript().run(),
      content: (
        <span className="text-xs">
          x<sub className="text-[9px]">2</sub>
        </span>
      )
    },
    { key: "code", label: "Kode inline", shortcut: "Ctrl/⌘+E", active: state.code, run: () => chain().toggleCode().run(), content: <CodeIcon /> }
  ];

  const indentActions: ToolbarAction[] = [
    {
      key: "indent",
      label: "Tambah indentasi",
      shortcut: "Tab",
      disabled: !state.canIndent,
      run: () => chain().sinkListItem(state.listItemType).run(),
      content: <IndentIcon />
    },
    {
      key: "outdent",
      label: "Kurangi indentasi",
      shortcut: "Shift+Tab",
      disabled: !state.canOutdent,
      run: () => chain().liftListItem(state.listItemType).run(),
      content: <OutdentIcon />
    }
  ];

  const blockActions: ToolbarAction[] = [
    { key: "blockquote", label: "Kutipan", shortcut: "Ctrl/⌘+Shift+B", active: state.blockquote, run: () => chain().toggleBlockquote().run(), content: <QuoteIcon /> },
    { key: "codeBlock", label: "Blok kode", shortcut: "Ctrl/⌘+Alt+C", active: state.codeBlock, run: () => chain().toggleCodeBlock().run(), content: <CodeBlockIcon /> },
    { key: "hr", label: "Garis pemisah", run: () => chain().setHorizontalRule().run(), content: <HorizontalRuleIcon /> }
  ];

  function renderActions(actions: ToolbarAction[], afterRun?: () => void) {
    return actions.map((action) => (
      <ToolButton
        key={action.key}
        label={action.label}
        shortcut={action.shortcut}
        active={action.active}
        disabled={isOff || action.disabled}
        onClick={() => {
          action.run();
          afterRun?.();
        }}
      >
        {action.content}
      </ToolButton>
    ));
  }

  return (
    <div className="rounded-t-xl border-b border-slate-800 bg-[#0d121d] px-2 py-1.5" role="group" aria-label="Format materi">
      <div className="flex flex-wrap items-center gap-1">
        <ToolButton label="Urungkan" shortcut="Ctrl/⌘+Z" disabled={isOff || !state.canUndo} onClick={() => chain().undo().run()}>
          <UndoIcon />
        </ToolButton>
        <ToolButton label="Ulangi" shortcut="Ctrl/⌘+Shift+Z" disabled={isOff || !state.canRedo} onClick={() => chain().redo().run()}>
          <RedoIcon />
        </ToolButton>

        <Divider />

        <label className="sr-only" htmlFor="editor-block-style">
          Gaya paragraf
        </label>
        <select
          id="editor-block-style"
          className={`${selectClass} w-[7.5rem]`}
          value={state.blockStyle}
          disabled={isOff}
          title="Gaya paragraf"
          onChange={(event) => setBlockStyle(event.target.value as BlockStyle)}
        >
          {BLOCK_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="editor-font-family">
          Jenis font
        </label>
        <select
          id="editor-font-family"
          className={`${selectClass} w-[8.5rem]`}
          value={fontFamilyValue}
          disabled={isOff}
          title="Jenis font"
          onChange={(event) => {
            const value = event.target.value;
            if (!value) chain().unsetFontFamily().run();
            else if (value !== "__custom") chain().setFontFamily(value).run();
          }}
        >
          {fontFamilyValue === "__custom" ? <option value="__custom">Font lain</option> : null}
          {FONT_FAMILY_OPTIONS.map((option) => (
            <option key={option.label} value={option.value} style={option.value ? { fontFamily: option.value } : undefined}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="editor-font-size">
          Ukuran font
        </label>
        <select
          id="editor-font-size"
          className={`${selectClass} w-[5.25rem]`}
          value={fontSizeValue}
          disabled={isOff}
          title="Ukuran font"
          onChange={(event) => {
            const value = event.target.value;
            if (!value) chain().unsetFontSize().run();
            else if (value !== "__custom") chain().setFontSize(value).run();
          }}
        >
          {fontSizeValue === "__custom" ? <option value="__custom">{state.fontSize}</option> : null}
          {FONT_SIZE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.value ? `${option.label} px` : "Ukuran"}
            </option>
          ))}
        </select>

        <Divider />

        <ToolButton label="Tebal" shortcut="Ctrl/⌘+B" active={state.bold} disabled={isOff} onClick={() => chain().toggleBold().run()}>
          <span className="font-black">B</span>
        </ToolButton>
        <ToolButton label="Miring" shortcut="Ctrl/⌘+I" active={state.italic} disabled={isOff} onClick={() => chain().toggleItalic().run()}>
          <span className="font-serif text-base italic">I</span>
        </ToolButton>
        <ToolButton label="Garis bawah" shortcut="Ctrl/⌘+U" active={state.underline} disabled={isOff} onClick={() => chain().toggleUnderline().run()}>
          <span className="underline underline-offset-2">U</span>
        </ToolButton>
        <ToolButton label="Coret" shortcut="Ctrl/⌘+Shift+S" active={state.strike} disabled={isOff} onClick={() => chain().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolButton>
        <div className="hidden sm:contents">{renderActions(scriptActions)}</div>

        <Divider />

        <ToolbarPopover
          label="Warna teks"
          disabled={isOff}
          open={openMenu === "color"}
          onOpenChange={(open) => setOpenMenu(open ? "color" : null)}
          buttonContent={<TextColorIcon color={state.color || undefined} />}
        >
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Warna teks</p>
          <ColorGrid
            options={TEXT_COLOR_OPTIONS}
            current={state.color}
            swatchKind="text"
            resetLabel="Warna bawaan"
            onPick={(value) => {
              chain().setColor(value).run();
              setOpenMenu(null);
            }}
            onReset={() => {
              chain().unsetColor().run();
              setOpenMenu(null);
            }}
          />
        </ToolbarPopover>

        <ToolbarPopover
          label="Stabilo"
          active={state.highlight}
          disabled={isOff}
          open={openMenu === "highlight"}
          onOpenChange={(open) => setOpenMenu(open ? "highlight" : null)}
          buttonContent={<HighlightIcon color={state.highlightColor || undefined} />}
        >
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Warna stabilo</p>
          <ColorGrid
            options={HIGHLIGHT_COLOR_OPTIONS}
            current={state.highlightColor}
            swatchKind="highlight"
            resetLabel="Hapus stabilo"
            onPick={(value) => {
              chain().setHighlight({ color: value }).run();
              setOpenMenu(null);
            }}
            onReset={() => {
              chain().unsetHighlight().run();
              setOpenMenu(null);
            }}
          />
        </ToolbarPopover>

        <ToolButton label="Hapus format" disabled={isOff} onClick={() => chain().unsetAllMarks().clearNodes().run()}>
          <ClearFormatIcon />
        </ToolButton>

        <Divider />

        {ALIGNMENTS.map(({ value, label, shortcut, Icon }) => (
          <ToolButton
            key={value}
            label={label}
            shortcut={shortcut}
            active={state.align === value}
            disabled={isOff}
            onClick={() => chain().setTextAlign(value).run()}
          >
            <Icon />
          </ToolButton>
        ))}

        <Divider />

        <ToolButton label="Daftar berpoin" shortcut="Ctrl/⌘+Shift+8" active={state.bulletList} disabled={isOff} onClick={() => chain().toggleBulletList().run()}>
          <BulletListIcon />
        </ToolButton>
        <ToolButton label="Daftar bernomor" shortcut="Ctrl/⌘+Shift+7" active={state.orderedList} disabled={isOff} onClick={() => chain().toggleOrderedList().run()}>
          <OrderedListIcon />
        </ToolButton>
        <ToolButton label="Daftar centang" shortcut="Ctrl/⌘+Shift+9" active={state.taskList} disabled={isOff} onClick={() => chain().toggleTaskList().run()}>
          <TaskListIcon />
        </ToolButton>
        <div className="hidden sm:contents">
          {renderActions(indentActions)}
          <Divider />
          {renderActions(blockActions)}
        </div>

        {/* Di layar sempit, perintah yang jarang dipakai dikumpulkan di satu menu agar toolbar ringkas. */}
        <div className="sm:hidden">
          <ToolbarPopover
            label="Format lainnya"
            disabled={isOff}
            open={openMenu === "more"}
            onOpenChange={(open) => setOpenMenu(open ? "more" : null)}
            buttonContent={<span className="px-0.5 text-xs font-bold">Lainnya</span>}
          >
            <div className="grid grid-cols-4 gap-1">
              {renderActions([...scriptActions, ...indentActions, ...blockActions], () => setOpenMenu(null))}
            </div>
          </ToolbarPopover>
        </div>

        <ToolbarPopover
          label="Link"
          active={state.link}
          disabled={isOff}
          open={openMenu === "link"}
          onOpenChange={openLinkMenu}
          align="right"
          buttonContent={<LinkIcon />}
        >
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400" htmlFor="editor-link-input">
              Alamat link
            </label>
            <input
              id="editor-link-input"
              autoFocus
              value={linkDraft}
              onChange={(event) => {
                setLinkDraft(event.target.value);
                setLinkError(null);
              }}
              onKeyDown={(event) => {
                // Cegah Enter mengirim form materi induk.
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
              }}
              placeholder="https://contoh.com atau /rooms/..."
              className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-primary"
            />
            {linkError ? <p className="mt-1.5 text-[11px] text-rose-300">{linkError}</p> : null}
            <p className="mt-1.5 text-[11px] text-slate-500">
              {editor.state.selection.empty && !state.link ? "Tanpa teks terpilih, alamat akan disisipkan sebagai teks link." : "Link diterapkan ke teks yang dipilih."}
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={applyLink} className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-bold text-slate-950 hover:bg-blue-300">
                Terapkan
              </button>
              {state.link ? (
                <button
                  type="button"
                  onClick={removeLink}
                  className="rounded-md border border-rose-500/40 px-2 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/10"
                >
                  Hapus link
                </button>
              ) : null}
            </div>
          </div>
        </ToolbarPopover>

        <ToolButton label="Sisipkan gambar" disabled={isOff} onClick={() => fileInputRef.current?.click()}>
          <ImageIcon />
        </ToolButton>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length > 0) void onPickImages(files);
          }}
        />

        <ToolButton
          label="Sisipkan tabel 3x3"
          disabled={isOff || state.table}
          onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon />
        </ToolButton>

        {/* Pengaturan tabel sebagai menu agar isi editor tidak bergeser saat kursor masuk/keluar tabel. */}
        <ToolbarPopover
          label="Atur tabel"
          active={state.table}
          disabled={isOff || !state.table}
          open={openMenu === "table"}
          onOpenChange={(open) => setOpenMenu(open ? "table" : null)}
          align="right"
          buttonContent={<span className="px-0.5 text-xs font-bold">Tabel</span>}
        >
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Atur tabel</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { label: "Baris di atas", run: () => chain().addRowBefore().run() },
              { label: "Baris di bawah", run: () => chain().addRowAfter().run() },
              { label: "Kolom kiri", run: () => chain().addColumnBefore().run() },
              { label: "Kolom kanan", run: () => chain().addColumnAfter().run() },
              { label: "Gabung sel", run: () => chain().mergeCells().run(), disabled: !state.canMergeCells },
              { label: "Pisah sel", run: () => chain().splitCell().run(), disabled: !state.canSplitCell },
              { label: "Baris judul", run: () => chain().toggleHeaderRow().run() },
              { label: "Hapus baris", run: () => chain().deleteRow().run(), danger: true },
              { label: "Hapus kolom", run: () => chain().deleteColumn().run(), danger: true },
              { label: "Hapus tabel", run: () => chain().deleteTable().run(), danger: true, close: true }
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={isOff || !state.table || action.disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  action.run();
                  if (action.close) setOpenMenu(null);
                }}
                className={`rounded-md border px-2 py-1.5 text-left font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                  action.danger ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10" : "border-slate-700 text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </ToolbarPopover>
      </div>
    </div>
  );
}
