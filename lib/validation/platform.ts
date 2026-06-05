import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const roomProgressSchema = z.object({
  roomId: uuidSchema,
  progressPercentage: z.number().int().min(0).max(100)
});

export const taskSubmissionSchema = z.object({
  taskId: uuidSchema,
  answer: z.string().min(1).max(2000)
});

export const quizAttemptSchema = z.object({
  quizId: uuidSchema,
  answers: z.record(uuidSchema)
});

export const roomDraftSchema = z.object({
  learningPathId: uuidSchema,
  title: z.string().min(3).max(160),
  slug: z
    .string()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(20).max(2000),
  category: z.string().min(2).max(80),
  difficulty: z.string().min(2).max(40),
  estimatedMinutes: z.number().int().min(5).max(600),
  points: z.number().int().min(0).max(10000),
  orderIndex: z.number().int().min(0).max(10000)
});

export const updateRoomDraftSchema = roomDraftSchema.partial().extend({
  roomId: uuidSchema
});

export const roomTaskDraftSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(2000),
  expectedAnswer: z.string().min(1).max(500).optional(),
  points: z.number().int().min(0).max(10000).default(10)
});

export const roomBuilderSchema = roomDraftSchema.extend({
  isPublished: z.boolean().default(false),
  tasks: z.array(roomTaskDraftSchema).min(1).max(5)
});

export const updateUserRoleSchema = z.object({
  userId: uuidSchema,
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"])
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(160),
  content: z.string().min(10).max(4000),
  audience: z.enum(["ALL", "STUDENT", "INSTRUCTOR", "ADMIN"]),
  isPublished: z.boolean().default(false)
});

export const updateAnnouncementSchema = announcementSchema.partial().extend({
  announcementId: uuidSchema
});

export const labSessionCreateSchema = z.object({
  roomId: uuidSchema
});

export const labSessionStatusSchema = z.object({
  sessionId: uuidSchema,
  status: z.enum(["READY", "STARTING", "RUNNING", "STOPPED", "EXPIRED", "ERROR"]).optional(),
  vpnStatus: z.enum(["DISCONNECTED", "CONNECTING", "CONNECTED"]).optional(),
  machineStatus: z.enum(["OFFLINE", "STARTING", "ONLINE", "STOPPING"]).optional(),
  targetIp: z.string().ip().nullable().optional()
});
