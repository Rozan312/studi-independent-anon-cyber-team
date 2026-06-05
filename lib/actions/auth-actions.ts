"use server";

import { redirect } from "next/navigation";
import { logoutUser, loginUser, registerUser, requestPasswordReset, resetPassword } from "@/lib/services/auth-service";
import { isLocalAuthEnabled } from "@/lib/auth/local-session-core";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function registerAction(formData: FormData) {
  await registerUser({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    fullName: formValue(formData, "fullName"),
    username: formValue(formData, "username")
  });

  redirect(isLocalAuthEnabled() ? "/dashboard" : "/login?registered=1");
}

export async function loginAction(formData: FormData) {
  await loginUser({
    email: formValue(formData, "email"),
    username: formValue(formData, "username"),
    password: formValue(formData, "password")
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await logoutUser();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  await requestPasswordReset({
    email: formValue(formData, "email")
  });

  redirect("/login?reset=sent");
}

export async function resetPasswordAction(formData: FormData) {
  await resetPassword({
    password: formValue(formData, "password")
  });

  redirect("/login?password=updated");
}
