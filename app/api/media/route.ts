import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/guards";
import { hasRoleAccess } from "@/lib/auth/rbac";
import { jsonError, jsonOk } from "@/lib/http";
import { listMediaAssets, storeImageUpload } from "@/lib/services/media-service";

/**
 * Upload dan daftar media milik instruktur/admin.
 * Mengembalikan JSON 401/403 alih-alih redirect karena dipanggil lewat fetch().
 */
async function requireUploader() {
  const profile = await getCurrentProfile();
  if (!profile) return { error: NextResponse.json({ error: "Login diperlukan." }, { status: 401 }) };
  if (!hasRoleAccess(profile.role, ["INSTRUCTOR"])) {
    return { error: NextResponse.json({ error: "Hanya instruktur atau admin yang dapat mengunggah media." }, { status: 403 }) };
  }
  return { profile };
}

export async function GET() {
  const auth = await requireUploader();
  if (auth.error) return auth.error;

  try {
    return jsonOk(await listMediaAssets(auth.profile.id));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireUploader();
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || typeof (file as Blob).arrayBuffer !== "function") {
      return NextResponse.json({ error: "Field 'file' wajib berisi berkas gambar." }, { status: 400 });
    }

    const upload = file as File;
    const { asset, url } = await storeImageUpload(auth.profile.id, {
      name: upload.name || "upload",
      size: upload.size,
      arrayBuffer: () => upload.arrayBuffer()
    });

    return jsonOk(
      {
        id: asset.id,
        url,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
