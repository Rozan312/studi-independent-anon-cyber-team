/**
 * Data demo untuk screenshot/banner: anggota contoh dengan riwayat belajar yang realistis
 * (jawaban task, attempt quiz, progres room, poin) tersebar di 17 minggu terakhir.
 *
 * Hanya untuk database lokal. Semua profil demo memakai ID tetap berakhiran 5eed000006xx (lihat demoId)
 * dan email <username>@local.dev sehingga bisa dipakai login lokal.
 *
 *   npm run seed:showcase           # buat ulang data demo
 *   npm run seed:showcase:remove    # hapus semua data demo (cascade)
 */
import { LeaderboardSourceType, PrismaClient, ProgressStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

type DemoMember = {
  username: string;
  fullName: string;
  joinedDaysAgo: number;
  /** Room selesai, berurutan. */
  completed: string[];
  /** Room berjalan: jumlah task benar dan apakah quiz sudah dicoba lalu gagal. */
  inProgress?: Array<{ slug: string; correctTasks: number; failedQuiz?: boolean }>;
  /** Hari berturut-turut sampai hari ini yang wajib aktif. */
  streakDays: number;
  /** Peluang hari lain di masa keanggotaan menjadi hari aktif. */
  density: number;
};

const ROOM_ORDER = [
  "introduction-to-http",
  "authentication-concepts",
  "linux-command-line-basics",
  "network-traffic-basics",
  "secure-password-policy",
  "security-monitoring-basics",
  "incident-response-basics",
  "broken-access-control-basics",
  "log-analysis-fundamentals",
  "hypothesis-driven-hunting"
];

const MEMBERS: DemoMember[] = [
  { username: "raka", fullName: "Raka Pratama", joinedDaysAgo: 116, completed: ROOM_ORDER.slice(0, 9), streakDays: 14, density: 0.42 },
  {
    username: "bima",
    fullName: "Bima Saputra",
    joinedDaysAgo: 104,
    completed: ROOM_ORDER.slice(0, 7),
    inProgress: [{ slug: "log-analysis-fundamentals", correctTasks: 1 }],
    streakDays: 5,
    density: 0.36
  },
  {
    // Akun utama untuk screenshot: sedang di tengah dua path, satu quiz perlu diulang.
    username: "nadia",
    fullName: "Nadia Putri",
    joinedDaysAgo: 98,
    completed: ["introduction-to-http", "authentication-concepts", "linux-command-line-basics", "network-traffic-basics", "secure-password-policy", "security-monitoring-basics"],
    inProgress: [
      { slug: "incident-response-basics", correctTasks: 2, failedQuiz: true },
      { slug: "broken-access-control-basics", correctTasks: 1 }
    ],
    streakDays: 7,
    density: 0.4
  },
  {
    username: "sekar",
    fullName: "Sekar Ayu Lestari",
    joinedDaysAgo: 88,
    completed: ROOM_ORDER.slice(0, 5),
    inProgress: [{ slug: "security-monitoring-basics", correctTasks: 1 }],
    streakDays: 3,
    density: 0.3
  },
  { username: "dimas", fullName: "Dimas Hidayat", joinedDaysAgo: 75, completed: ROOM_ORDER.slice(0, 4), streakDays: 2, density: 0.26 },
  {
    username: "intan",
    fullName: "Intan Maharani",
    joinedDaysAgo: 60,
    completed: ROOM_ORDER.slice(0, 3),
    inProgress: [{ slug: "network-traffic-basics", correctTasks: 2, failedQuiz: true }],
    streakDays: 0,
    density: 0.28
  },
  { username: "fajar", fullName: "Fajar Nugroho", joinedDaysAgo: 41, completed: ROOM_ORDER.slice(0, 2), streakDays: 1, density: 0.22 },
  {
    username: "laras",
    fullName: "Laras Wulandari",
    joinedDaysAgo: 19,
    completed: ROOM_ORDER.slice(0, 1),
    inProgress: [{ slug: "authentication-concepts", correctTasks: 1 }],
    streakDays: 4,
    density: 0.3
  }
];

// ID tetap bergaya UUID v4 (8 hex awal dari username agar nomor anggota tidak "0000 · 0000"); akhiran 5eed0000060N menandai demo.
function demoId(index: number) {
  let hash = 0x811c9dc5;
  for (const char of MEMBERS[index].username) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  const head = (hash >>> 0).toString(16).padStart(8, "0");
  return `${head}-5eed-4000-8000-5eed000006${String(index + 1).padStart(2, "0")}`;
}
const DEMO_IDS = MEMBERS.map((_, index) => demoId(index));

// Jawaban salah yang masuk akal, dipakai sebelum jawaban benar.
const NEAR_MISSES: Record<string, string[]> = {
  "2xx": ["200", "3xx"],
  request: ["response", "header"],
  authentication: ["authorization", "login"],
  "multi-factor authentication": ["mfa token", "two-step login"],
  "least privilege": ["sudo", "root access"],
  administrator: ["superuser", "owner"],
  protocol: ["packet", "tcp"],
  port: ["socket", "ip address"],
  hashing: ["encryption", "encoding"],
  "identity verification": ["identification", "password check"],
  triage: ["alerting", "escalation"],
  escalation: ["containment", "ticket"],
  preparation: ["identification", "detection"],
  documentation: ["reporting", "lessons learned"],
  authorization: ["authentication", "session"],
  "server-side authorization": ["client-side check", "hidden fields"],
  timestamp: ["hostname", "user agent"],
  suspicious: ["malicious", "anomaly"],
  hypothesis: ["indicator", "alert"],
  logs: ["alerts", "packets"]
};

/** PRNG deterministik agar data demo sama setiap kali dibuat. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.match(/@([^:/?]+)/)?.[1] ?? "";
  if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
    throw new Error("seed-showcase only runs against a local database (DATABASE_URL host must be localhost).");
  }
}

async function removeDemoData() {
  // Profil dihapus cascade: progres, jawaban, attempt, poin, sesi lab, dan keanggotaan kelas ikut terhapus.
  const { count } = await prisma.profile.deleteMany({ where: { id: { in: DEMO_IDS } } });
  return count;
}

type RoomInfo = Awaited<ReturnType<typeof loadRooms>>[number];

async function loadRooms() {
  return prisma.room.findMany({
    where: { slug: { in: ROOM_ORDER }, isPublished: true },
    select: {
      id: true,
      slug: true,
      points: true,
      tasks: { orderBy: { orderIndex: "asc" }, select: { id: true, points: true, expectedAnswer: true } },
      quiz: { select: { id: true, passingScore: true, _count: { select: { questions: true } } } }
    }
  });
}

/** Skor quiz yang benar-benar mungkin: kelipatan dari jumlah pertanyaan, seperti quiz-service. */
function quizScore(questionCount: number, passingScore: number, pass: boolean) {
  const scores = Array.from({ length: questionCount + 1 }, (_, correct) => Math.round((correct / Math.max(questionCount, 1)) * 100));
  if (pass) return scores.filter((score) => score >= passingScore).pop() ?? 100;
  return scores.filter((score) => score > 0 && score < passingScore).pop() ?? 0;
}

type DemoEvent =
  | { kind: "task"; room: RoomInfo; taskIndex: number; correct: boolean; answer: string }
  | { kind: "quiz"; room: RoomInfo; score: number; passed: boolean };

function eventsForRoom(room: RoomInfo, rand: () => number, plan: { correctTasks: number; quiz: "pass" | "fail" | "none"; retryQuiz: boolean }) {
  const events: DemoEvent[] = [];
  room.tasks.forEach((task, taskIndex) => {
    const expected = task.expectedAnswer ?? "answer";
    const misses = NEAR_MISSES[expected] ?? ["not sure"];
    const wrongCount = rand() < 0.55 ? 0 : rand() < 0.7 ? 1 : 2;
    for (let miss = 0; miss < wrongCount; miss += 1) {
      events.push({ kind: "task", room, taskIndex, correct: false, answer: misses[miss % misses.length] });
    }
    if (taskIndex < plan.correctTasks) events.push({ kind: "task", room, taskIndex, correct: true, answer: expected });
  });

  if (room.quiz && plan.quiz !== "none") {
    const questions = room.quiz._count.questions;
    if (plan.quiz === "fail" || plan.retryQuiz) {
      events.push({ kind: "quiz", room, score: quizScore(questions, room.quiz.passingScore, false), passed: false });
    }
    if (plan.quiz === "pass") {
      const passing = { kind: "quiz" as const, room, score: quizScore(questions, room.quiz.passingScore, true), passed: true };
      events.push(passing);
      // Sebagian anggota mengulang quiz yang sudah lulus untuk review.
      if (rand() < 0.45) events.push({ ...passing });
    }
  }
  return events;
}

/** Hari aktif (offset hari dari hari ini, 0 = hari ini), terlama dulu. */
function activeDayOffsets(member: DemoMember, rand: () => number, eventCount: number) {
  const days = new Set<number>();
  for (let offset = 0; offset < member.streakDays; offset += 1) days.add(offset);
  for (let offset = member.streakDays + 1; offset < member.joinedDaysAgo; offset += 1) {
    // Akhir pekan sedikit lebih ramai, seperti belajar mandiri pada umumnya.
    const weekday = new Date(Date.now() - offset * DAY_MS).getDay();
    const bias = weekday === 0 || weekday === 6 ? 1.35 : 1;
    if (rand() < member.density * bias) days.add(offset);
  }
  // Rata-rata ±1,7 event per hari aktif agar intensitas heatmap bervariasi; hari streak selalu dipertahankan.
  const limit = Math.min(eventCount, Math.max(member.streakDays, Math.round(eventCount / 1.7)));
  const sorted = [...days].sort((a, b) => b - a);
  while (sorted.length > limit) sorted.splice(Math.floor(rand() * (sorted.length - member.streakDays)), 1);
  return sorted;
}

/** Waktu acak pada hari `offset` (jam lokal 08–22), tidak pernah di masa depan. */
function timeOn(offset: number, rand: () => number, now: Date) {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  const latest = offset === 0 ? Math.max(now.getHours() - 1, 0) : 22;
  const hour = Math.min(8 + Math.floor(rand() * 14), latest);
  const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(rand() * 60), Math.floor(rand() * 60));
  return at < now ? at : new Date(now.getTime() - 60_000);
}

async function createMember(member: DemoMember, index: number, rooms: Map<string, RoomInfo>, now: Date) {
  const rand = random(0x5eed + index * 7919);
  const id = demoId(index);

  const events: DemoEvent[] = [];
  for (const slug of member.completed) {
    const room = rooms.get(slug);
    if (!room) continue;
    events.push(...eventsForRoom(room, rand, { correctTasks: room.tasks.length, quiz: "pass", retryQuiz: rand() < 0.25 }));
  }
  for (const item of member.inProgress ?? []) {
    const room = rooms.get(item.slug);
    if (!room) continue;
    events.push(...eventsForRoom(room, rand, { correctTasks: item.correctTasks, quiz: item.failedQuiz ? "fail" : "none", retryQuiz: false }));
  }

  // Bagi event berurutan ke hari aktif; sisa event menumpuk di hari-hari sibuk secara acak.
  const days = activeDayOffsets(member, rand, events.length);
  const perDay = days.map(() => 1);
  for (let extra = events.length - days.length; extra > 0; extra -= 1) perDay[Math.floor(rand() * perDay.length)] += 1;

  const timed: Array<DemoEvent & { at: Date }> = [];
  let cursor = 0;
  days.forEach((offset, dayIndex) => {
    const times = Array.from({ length: perDay[dayIndex] }, () => timeOn(offset, rand, now)).sort((a, b) => a.getTime() - b.getTime());
    for (const at of times) timed.push({ ...events[cursor++], at });
  });

  await prisma.profile.create({
    data: {
      id,
      email: `${member.username}@local.dev`,
      username: member.username,
      fullName: member.fullName,
      role: Role.STUDENT,
      createdAt: new Date(now.getTime() - member.joinedDaysAgo * DAY_MS)
    }
  });

  const awarded = new Set<string>();
  const points: Array<{ userId: string; points: number; sourceType: LeaderboardSourceType; sourceId: string; createdAt: Date }> = [];
  const roomState = new Map<string, { room: RoomInfo; correct: Set<number>; quizPassed: boolean; startedAt: Date; lastAt: Date }>();

  for (const event of timed) {
    const state = roomState.get(event.room.id) ?? { room: event.room, correct: new Set<number>(), quizPassed: false, startedAt: event.at, lastAt: event.at };
    state.lastAt = event.at;
    roomState.set(event.room.id, state);

    if (event.kind === "task") {
      const task = event.room.tasks[event.taskIndex];
      await prisma.userTaskSubmission.create({
        data: { userId: id, taskId: task.id, answer: event.answer, isCorrect: event.correct, submittedAt: event.at, createdAt: event.at }
      });
      if (event.correct) {
        state.correct.add(event.taskIndex);
        if (!awarded.has(task.id)) {
          awarded.add(task.id);
          points.push({ userId: id, points: task.points, sourceType: LeaderboardSourceType.TASK_COMPLETION, sourceId: task.id, createdAt: event.at });
        }
      }
    } else if (event.room.quiz) {
      const quiz = event.room.quiz;
      await prisma.userQuizAttempt.create({
        data: { userId: id, quizId: quiz.id, score: event.score, passed: event.passed, startedAt: event.at, completedAt: event.at, createdAt: event.at }
      });
      if (event.passed) {
        state.quizPassed = true;
        if (!awarded.has(quiz.id)) {
          awarded.add(quiz.id);
          points.push({ userId: id, points: event.room.points, sourceType: LeaderboardSourceType.QUIZ_COMPLETION, sourceId: quiz.id, createdAt: event.at });
        }
      }
    }
  }

  if (points.length > 0) await prisma.leaderboardPoint.createMany({ data: points });

  // Aturan progres sama dengan lib/services/progress-service.ts (task benar + quiz lulus).
  for (const state of roomState.values()) {
    const totalUnits = state.room.tasks.length + (state.room.quiz ? 1 : 0);
    const doneUnits = state.correct.size + (state.room.quiz && state.quizPassed ? 1 : 0);
    const complete = totalUnits > 0 && doneUnits >= totalUnits;
    await prisma.userRoomProgress.create({
      data: {
        userId: id,
        roomId: state.room.id,
        status: complete ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
        progressPercentage: complete ? 100 : Math.min(Math.round((doneUnits / Math.max(totalUnits, 1)) * 100), 99),
        startedAt: state.startedAt,
        completedAt: complete ? state.lastAt : null,
        createdAt: state.startedAt,
        updatedAt: state.lastAt
      }
    });
  }

  return { username: member.username, activities: timed.length, activeDays: days.length, points: points.reduce((sum, row) => sum + row.points, 0) };
}

async function main() {
  assertLocalDatabase();
  const removed = await removeDemoData();

  if (process.argv.includes("--remove")) {
    console.log(`Removed ${removed} demo member(s).`);
    return;
  }

  const rooms = new Map((await loadRooms()).map((room) => [room.slug, room]));
  const missing = ROOM_ORDER.filter((slug) => !rooms.has(slug));
  if (missing.length > 0) console.warn(`Skipping rooms that are missing or unpublished: ${missing.join(", ")}`);

  // Bentrok username/email dengan akun lokal yang sudah ada akan menggagalkan create; cek lebih dulu.
  const taken = await prisma.profile.findMany({
    where: { OR: MEMBERS.flatMap((member) => [{ username: member.username }, { email: `${member.username}@local.dev` }]) },
    select: { username: true }
  });
  if (taken.length > 0) throw new Error(`Usernames already in use by non-demo profiles: ${taken.map((row) => row.username).join(", ")}`);

  const now = new Date();
  for (const [index, member] of MEMBERS.entries()) {
    const summary = await createMember(member, index, rooms, now);
    console.log(`${summary.username.padEnd(6)} ${String(summary.points).padStart(5)} pts · ${summary.activities} activities on ${summary.activeDays} days`);
  }
  console.log(`Created ${MEMBERS.length} demo members. Remove them with: npm run seed:showcase:remove`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
