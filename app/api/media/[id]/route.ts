import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { readMediaAssetFile } from "@/lib/services/media-service";

const UUID_PATTERN = /^[0-9a-fA-F-]{36}$/;

/**
 * Menyajikan berkas media untuk user yang sudah login. Gambar hanya dipakai di
 * dalam konten pembelajaran, sehingga akses anonim tidak diperlukan.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!UUID_PATTERN.test(params.id)) {
    return NextResponse.json({ error: "Invalid media ID." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  try {
    const result = await readMediaAssetFile(params.id);
    if (!result) {
      return NextResponse.json({ error: "Media not found." }, { status: 404 });
    }

    return new NextResponse(result.body, {
      status: 200,
      headers: {
        "Content-Type": result.asset.mimeType,
        "Content-Length": String(result.body.length),
        "Content-Disposition": `inline; filename="${result.asset.fileName}"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "The media file is missing from storage." }, { status: 404 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500 });
  }
}
