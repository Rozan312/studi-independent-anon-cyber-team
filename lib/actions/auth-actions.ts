"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { AuthRequestError, logoutUser, loginUser, registerUser, requestPasswordReset, resetPassword } from "@/lib/services/auth-service";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";
import { resolveNextPath } from "@/lib/auth/safe-redirect";
import { zodErrorMessage, type FieldLabels } from "@/lib/actions/form-errors";

/** Hasil aksi auth untuk useFormState: null saat belum ada hasil, atau pesan yang ditampilkan form lewat AuthNotice. */
export type AuthActionState = {
  tone: "error" | "info" | "success";
  message: string;
} | null;

type AuthFlow = "login" | "register" | "forgot" | "reset";

const AUTH_FIELDS: FieldLabels = {
  fields: {
    email: "Email",
    password: "Password",
    fullName: "Full name",
    username: "Username"
  }
};

const FALLBACK_MESSAGE: Record<AuthFlow, string> = {
  login: "We couldn't sign you in just now. Try again in a moment.",
  register: "We couldn't create your account just now. Try again in a moment.",
  forgot: "We couldn't send the reset link just now. Try again in a moment.",
  reset: "We couldn't save your new password just now. Try again in a moment."
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Nama pengguna, email, dan nama lengkap dirapikan dari spasi di tepi; password dikirim apa adanya. */
function trimmedValue(formData: FormData, key: string) {
  return formValue(formData, key).trim();
}

/** Pesan Supabase Auth berdasarkan kodenya; null bila kodenya tidak dikenali. */
function supabaseMessage(error: AuthRequestError, flow: AuthFlow): string | null {
  if (error.status === 429 || error.code?.startsWith("over_")) {
    return "Too many attempts in a short time. Wait a minute, then try again.";
  }

  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match. Check them and try again, or reset your password.";
    case "email_not_confirmed":
      return "Confirm your email address first: open the link we sent you, then sign in.";
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Sign in instead, or reset your password.";
    case "weak_password":
      return "That password is too easy to guess. Choose a longer one that mixes letters, numbers, and symbols.";
    case "same_password":
      return "Your new password must be different from your current one.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "New sign-ups are turned off right now. Ask an admin to create your account.";
    case "email_address_invalid":
    case "email_address_not_authorized":
      return "We can't send email to that address. Check it, or use a different one.";
    case "user_banned":
      return "This account is suspended. Contact an admin if you think this is a mistake.";
    case "session_not_found":
    case "session_expired":
    case "reauthentication_needed":
    case "otp_expired":
    case "flow_state_expired":
      return flow === "reset"
        ? "Your reset link has expired. Request a new one from Forgot password."
        : "Your session has expired. Sign in again.";
    default:
      // Versi Supabase lama tidak mengirim kode untuk login gagal.
      if (/invalid login credentials/i.test(error.message)) {
        return "That email and password don't match. Check them and try again, or reset your password.";
      }
      return null;
  }
}

/** Mengubah error dari layanan auth menjadi kalimat yang bisa ditindaklanjuti pengguna, tanpa membocorkan detail teknis. */
function authFailure(error: unknown, flow: AuthFlow): AuthActionState {
  if (error instanceof ZodError) {
    return { tone: "error", message: zodErrorMessage(error, AUTH_FIELDS, FALLBACK_MESSAGE[flow]) };
  }

  if (error instanceof AuthRequestError) {
    const message = supabaseMessage(error, flow);
    if (message) return { tone: "error", message };
  }

  // Username unik di tabel profile (pendaftaran mode Supabase).
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = String((error.meta as { target?: unknown } | undefined)?.target ?? "");
    return {
      tone: "error",
      message: target.includes("username")
        ? "That username is already taken. Choose another one."
        : "An account with these details already exists. Sign in instead."
    };
  }

  console.error(`[auth] ${flow} failed`, error);
  return { tone: "error", message: FALLBACK_MESSAGE[flow] };
}

export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    await registerUser({
      email: trimmedValue(formData, "email"),
      password: formValue(formData, "password"),
      fullName: trimmedValue(formData, "fullName"),
      username: trimmedValue(formData, "username")
    });
  } catch (error) {
    return authFailure(error, "register");
  }

  redirect(isLocalAuthEnabled() ? resolveNextPath(formValue(formData, "next")) : "/login?registered=1");
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    await loginUser({
      email: trimmedValue(formData, "email"),
      username: trimmedValue(formData, "username"),
      password: formValue(formData, "password")
    });
  } catch (error) {
    return authFailure(error, "login");
  }

  // `next` diisi middleware saat user belum login mengakses halaman terproteksi.
  // Nilainya divalidasi agar hanya path relatif internal yang dipakai.
  redirect(resolveNextPath(formValue(formData, "next")));
}

export async function logoutAction() {
  await logoutUser();
  redirect("/login");
}

export async function forgotPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    await requestPasswordReset({
      email: trimmedValue(formData, "email")
    });
  } catch (error) {
    return authFailure(error, "forgot");
  }

  redirect("/login?reset=sent");
}

export async function resetPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    await resetPassword({
      password: formValue(formData, "password")
    });
  } catch (error) {
    return authFailure(error, "reset");
  }

  redirect("/login?password=updated");
}
