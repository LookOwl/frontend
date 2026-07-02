import { createClient } from "@/utils/supabase/client";

const BUCKET = "desarrollo";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Sube una portada al bucket de Supabase Storage y devuelve su URL pública.
 * Solo esa URL se envía luego al backend como cover_url.
 */
export async function uploadCover(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new UploadError("Formato no permitido. Usa JPG, PNG o WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("La imagen supera el máximo de 5 MB.");
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[uploadCover] Supabase Storage error:", error);
    throw new UploadError("No se pudo subir la imagen. Intenta de nuevo.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
