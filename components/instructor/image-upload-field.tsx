"use client";

import { useId, useRef, useState } from "react";
import { ActionMessage } from "@/components/ui/action-message";
import { helpClass, inputClass, labelClass } from "@/components/instructor/form-styles";

type UploadResponse = {
  data?: { url: string };
  error?: string;
};

const UPLOAD_FALLBACK_ERROR = "Upload failed. Try a PNG, JPEG, GIF, or WebP under the size limit.";

/**
 * Field URL gambar dengan tombol upload dan area seret-lepas. Upload dikirim ke POST /api/media dan
 * URL hasilnya diisikan ke input teks bernama `name`, sehingga form induk
 * cukup membaca satu field string.
 */
export function ImageUploadField({
  name = "coverImageUrl",
  label = "Cover image",
  help,
  initialValue,
  disabled = false
}: {
  name?: string;
  label?: string;
  /** Teks bantuan singkat di bawah label. */
  help?: string;
  initialValue?: string | null;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const labelId = `${uid}-label`;
  const helpId = `${uid}-help`;
  const urlId = `${uid}-url`;
  const inactive = disabled || uploading;

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/media", { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as UploadResponse | null;

      if (!response.ok || !payload?.data) {
        setError(payload?.error ?? UPLOAD_FALLBACK_ERROR);
        return;
      }

      setValue(payload.data.url);
    } catch {
      setError(UPLOAD_FALLBACK_ERROR);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
  }

  // Seret-lepas: selalu cegah default agar browser tidak membuka gambar dan membuang isi form.
  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!inactive) setDragging(true);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (inactive) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div role="group" aria-labelledby={labelId}>
      <p id={labelId} className={labelClass}>
        {label}
      </p>
      {help ? (
        <p id={helpId} className={helpClass}>
          {help}
        </p>
      ) : null}

      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-1.5 rounded-lg border border-dashed p-3 transition-colors ${
          dragging ? "border-ink-3 bg-well" : "border-line-strong bg-paper"
        } ${disabled ? "opacity-60" : ""}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={`${label} preview`} className="h-36 w-full rounded-md border border-line bg-well object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-2 py-5 text-center">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="m4 17.5 4.8-4.6a1.2 1.2 0 0 1 1.7 0l2.7 2.6M13 15.2l2-1.9a1.2 1.2 0 0 1 1.7 0l3.3 3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-ink-2">{uploading ? "Uploading image…" : "Drop an image here, or choose a file."}</p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary btn-sm"
            disabled={inactive}
            aria-busy={uploading || undefined}
          >
            {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
          </button>
          {value ? (
            <button type="button" onClick={() => setValue("")} className="btn-ghost btn-sm" disabled={inactive}>
              Remove image
            </button>
          ) : null}
          <span className="text-xs text-ink-3">PNG, JPEG, GIF, or WebP. Max 5 MB.</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={inactive}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>

      <label htmlFor={urlId} className="mt-3 block text-sm font-medium text-ink-2">
        Image URL
      </label>
      <input
        id={urlId}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="/api/media/… or https://"
        className={inputClass}
        disabled={disabled}
        aria-describedby={help ? helpId : undefined}
      />

      {error ? (
        <div className="mt-2">
          <ActionMessage state={{ tone: "error", message: error }} />
        </div>
      ) : null}
    </div>
  );
}
