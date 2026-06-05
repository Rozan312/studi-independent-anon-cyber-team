import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.");

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  fullName: z.string().min(2).max(120),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, underscores, and hyphens.")
});

export const localRegisterSchema = z.object({
  password: passwordSchema,
  fullName: z.string().min(2).max(120),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, underscores, and hyphens.")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const localLoginSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, underscores, and hyphens."),
  password: passwordSchema
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  password: passwordSchema
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/),
  avatarUrl: z.string().url().nullable().optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LocalRegisterInput = z.infer<typeof localRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LocalLoginInput = z.infer<typeof localLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
