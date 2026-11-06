import { z } from "zod";
import { CHAPTER_TITLE_MAX } from "@/lib/content/rich-text-config";

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
  acceptedAnswers: z.array(z.string().min(1).max(500)).max(10).default([]),
  hint: z.string().max(1000).optional(),
  points: z.number().int().min(0).max(10000).default(10)
});

/** PATCH /api/rooms: menandai room dimulai dan menghitung ulang progress dengan aturan tunggal. */
export const roomStartSchema = z.object({
  roomId: uuidSchema
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

// Validasi authoring konten: path, materi room, task, quiz, media.

export const slugSchema = z
  .string()
  .min(3)
  .max(180)
  .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens.");

/** URL gambar: kosong berarti null; selain itu harus URL media internal atau http(s). */
export const imageUrlSchema = z
  .union([
    z.literal(""),
    z.string().max(500).regex(/^(\/api\/media\/[0-9a-fA-F-]{36}|https?:\/\/\S+)$/, "Enter a valid image URL.")
  ])
  .optional()
  .transform((value) => (value ? value : null));

export const learningPathSchema = z.object({
  title: z.string().min(3).max(160),
  slug: slugSchema,
  description: z.string().min(20).max(2000),
  category: z.string().min(2).max(80),
  difficulty: z.string().min(2).max(40),
  estimatedHours: z.number().int().min(1).max(500),
  coverImageUrl: imageUrlSchema,
  logoUrl: imageUrlSchema,
  isPublished: z.boolean().default(false)
});

export const updateLearningPathSchema = learningPathSchema.partial().extend({
  pathId: uuidSchema
});

export const publishLearningPathSchema = z.object({
  pathId: uuidSchema,
  isPublished: z.boolean()
});

/** Tanggal jadwal dari form: kosong berarti tidak diatur; string harus ISO atau datetime-local yang valid. */
export const scheduleDateSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/, "Enter a valid date and time.")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date.")
  ])
  .optional()
  .transform((value) => (value ? new Date(value) : null));

/**
 * Form Details room. Jadwal (availableFrom/Until) dan gambar sampul sengaja tidak ada di sini: jadwal disimpan
 * lewat roomScheduleSchema di halaman Schedule & publishing, dan sampul belum punya tempat tampil. Kolom yang
 * tidak dikirim tidak tersentuh, jadi simpan Details tidak pernah mengosongkan keduanya.
 */
export const roomMetadataSchema = roomDraftSchema.extend({
  roomId: uuidSchema,
  logoUrl: imageUrlSchema
});

/** Jadwal buka/tutup room; kosong berarti tanpa batas di sisi itu. */
export const roomScheduleSchema = z
  .object({
    roomId: uuidSchema,
    availableFrom: scheduleDateSchema,
    availableUntil: scheduleDateSchema
  })
  .refine((data) => !data.availableFrom || !data.availableUntil || data.availableUntil > data.availableFrom, {
    message: "The close date must be after the open date.",
    path: ["availableUntil"]
  });

export const publishRoomSchema = z.object({
  roomId: uuidSchema,
  isPublished: z.boolean()
});

/** Bab task: kosong atau tidak dikirim berarti tanpa bab (tampil di bab terakhir). Kepemilikan bab dicek di service. */
const taskChapterSchema = z
  .union([z.literal(""), uuidSchema])
  .nullish()
  .transform((value) => (value ? value : null));

export const addRoomTaskSchema = roomTaskDraftSchema.extend({
  roomId: uuidSchema,
  chapterId: taskChapterSchema
});

export const updateRoomTaskSchema = roomTaskDraftSchema.extend({
  taskId: uuidSchema,
  chapterId: taskChapterSchema
});

export const moveDirectionSchema = z.enum(["up", "down"]);

export const taskReferenceSchema = z.object({
  taskId: uuidSchema
});

export const moveRoomTaskSchema = taskReferenceSchema.extend({
  direction: moveDirectionSchema
});

// Bab materi room. Isi berupa HTML dari editor visual (disanitasi di service) atau Markdown untuk data lama/skrip.

const chapterTitleSchema = z.string().trim().min(1).max(CHAPTER_TITLE_MAX);

export const createRoomChapterSchema = z.object({
  roomId: uuidSchema,
  title: chapterTitleSchema
});

export const updateRoomChapterSchema = z.object({
  chapterId: uuidSchema,
  title: chapterTitleSchema,
  content: z.string().max(200_000, "Material is too long (200,000 characters max)."),
  contentFormat: z.enum(["MARKDOWN", "HTML"]).default("HTML")
});

export const chapterReferenceSchema = z.object({
  chapterId: uuidSchema
});

export const moveRoomChapterSchema = chapterReferenceSchema.extend({
  direction: moveDirectionSchema
});

export const quizUpsertSchema = z.object({
  roomId: uuidSchema,
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(2000),
  passingScore: z.number().int().min(0).max(100)
});

export const quizReferenceSchema = z.object({
  quizId: uuidSchema
});

export const quizOptionInputSchema = z.object({
  label: z.string().min(1).max(300),
  isCorrect: z.boolean().default(false)
});

const quizQuestionBodySchema = z.object({
  question: z.string().min(5).max(1000),
  explanation: z.string().min(5).max(2000),
  options: z
    .array(quizOptionInputSchema)
    .min(2, "Add at least two answer options.")
    .max(6, "Use six answer options or fewer.")
    .refine((options) => options.filter((option) => option.isCorrect).length === 1, {
      message: "Mark exactly one option as the correct answer."
    })
});

export const addQuizQuestionSchema = quizQuestionBodySchema.extend({
  quizId: uuidSchema
});

export const updateQuizQuestionSchema = quizQuestionBodySchema.extend({
  questionId: uuidSchema
});

export const questionReferenceSchema = z.object({
  questionId: uuidSchema
});

export const moveQuizQuestionSchema = questionReferenceSchema.extend({
  direction: moveDirectionSchema
});

// Komposisi learning path: memasukkan room yang sudah ada dan mengurutkan room di dalam path
export const addRoomToPathSchema = z.object({
  pathId: uuidSchema,
  roomId: uuidSchema
});

export const moveRoomInPathSchema = z.object({
  roomId: uuidSchema,
  direction: moveDirectionSchema
});
