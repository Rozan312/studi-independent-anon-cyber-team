"use client";

import { useRef, useState } from "react";
import { ghostButtonClass, inputClass, labelClass } from "@/components/instructor/form-styles";

type UploadResponse = {
  data?: { url: string };
  error?: string;
};

/**
 * Field URL gambar dengan tombol upload. Upload dikirim ke POST /api/media dan
 * URL hasilnya diisikan ke input teks bernama `name`, sehingga form induk
 * cukup membaca satu field string.
 */
export function ImageUploadField({
  name = "coverImageUrl",
  label = "Gambar cover",
  initialValue,
  disabled = false
}: {
  name?: string;
  label?: string;
  initialValue?: string | null;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/media", { method: "POST", body });
      const payload = (await response.json()) as UploadResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Upload gagal.");
      }

      setValue(payload.data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload gagal.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className={labelClass}>
        {label}
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="/api/media/... atau https://"
          className={inputClass}
          disabled={disabled}
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className={`${ghostButtonClass} ${disabled || uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
          {uploading ? "Mengunggah..." : "Upload gambar"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
        </label>
        {value ? (
          <button type="button" onClick={() => setValue("")} className={ghostButtonClass} disabled={disabled}>
            Hapus gambar
          </button>
        ) : null}
        <span className="text-[11px] text-slate-500">PNG, JPEG, GIF, atau WebP. Maksimal 5 MB.</span>
      </div>

      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}

      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Preview cover" className="mt-3 h-36 w-full rounded-lg border border-white/[0.08] object-cover" />
      ) : null}
    </div>
  );
}
