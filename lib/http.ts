import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { userMessage } from "@/lib/errors";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function jsonError(error: unknown, status = 400) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Validation failed.", details: error.flatten() }, { status: 422 });
  }

  // userMessage melempar ulang redirect() dari Next.js dan menyembunyikan pesan error internal.
  return NextResponse.json({ error: userMessage(error, "Unexpected error.") }, { status });
}
