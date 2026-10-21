import "server-only";

import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  localLoginSchema,
  localRegisterSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput
} from "@/lib/validation/auth";
import { clearLocalSession, createLocalSession } from "@/lib/auth/local-session";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";

/**
 * Error dari Supabase Auth dengan kode aslinya (mis. "invalid_credentials"), agar server action bisa
 * menampilkan pesan yang jelas tanpa mencocokkan teks error.
 */
export class AuthRequestError extends Error {
  readonly code: string | undefined;
  readonly status: number | undefined;

  constructor(error: { message: string; code?: string; status?: number }) {
    super(error.message);
    this.name = "AuthRequestError";
    this.code = error.code;
    this.status = error.status;
  }
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function registerUser(input: RegisterInput & { role?: unknown; username?: string }) {
  if (isLocalAuthEnabled()) {
    const data = localRegisterSchema.parse(input);
    return createLocalSession({
      fullName: data.fullName,
      username: data.username
    });
  }

  const data = registerSchema.parse(input);
  const supabase = createSupabaseServerClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${appUrl()}/dashboard`,
      data: {
        full_name: data.fullName,
        username: data.username
      }
    }
  });

  if (error) throw new AuthRequestError(error);
  if (!authData.user) throw new Error("Registration did not return a Supabase user.");

  await prisma.profile.upsert({
    where: { id: authData.user.id },
    update: {
      email: data.email,
      fullName: data.fullName,
      username: data.username
    },
    create: {
      id: authData.user.id,
      email: data.email,
      fullName: data.fullName,
      username: data.username,
      role: Role.STUDENT
    }
  });

  return authData.user;
}

export async function loginUser(input: LoginInput & { role?: unknown; username?: string }) {
  if (isLocalAuthEnabled()) {
    const data = localLoginSchema.parse(input);
    // Tanpa fullName: login tidak boleh mengganti nama lengkap profil yang sudah ada.
    return createLocalSession({ username: data.username });
  }

  const data = loginSchema.parse(input);
  const supabase = createSupabaseServerClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password
  });

  if (error) throw new AuthRequestError(error);
  return authData.user;
}

export async function logoutUser() {
  if (isLocalAuthEnabled()) {
    clearLocalSession();
    return;
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthRequestError(error);
}

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const data = forgotPasswordSchema.parse(input);

  if (isLocalAuthEnabled()) {
    return data;
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${appUrl()}/reset-password`
  });

  if (error) throw new AuthRequestError(error);
}

export async function resetPassword(input: ResetPasswordInput) {
  const data = resetPasswordSchema.parse(input);

  if (isLocalAuthEnabled()) {
    return data;
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({
    password: data.password
  });

  if (error) throw new AuthRequestError(error);
}
