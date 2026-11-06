import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Module from "node:module";
import { AnswerType, Role } from "@prisma/client";
import { ZodError } from "zod";

type ModuleWithLoad = typeof Module & {
  _load: (request: string, parent?: unknown, isMain?: boolean) => unknown;
};

const moduleWithLoad = Module as ModuleWithLoad;
const originalLoad = moduleWithLoad._load;
moduleWithLoad._load = function patchedLoad(request: string, parent?: unknown, isMain?: boolean) {
  if (request === "server-only") return {};
  // Sesi lokal memasang cookie lewat next/headers; di luar request Next.js cukup penampung kosong.
  if (request === "next/headers") {
    return { cookies: () => ({ get: () => undefined, set: () => undefined }) };
  }
  return originalLoad.call(this, request, parent, isMain);
};

async function main() {
  const { hasRoleAccess, getRequiredRolesForPath } = await import("@/lib/auth/rbac");
  const { prisma } = await import("@/lib/db/prisma");
  const { getGlobalLeaderboard } = await import("@/lib/services/leaderboard-service");
  const { submitQuizAttempt } = await import("@/lib/services/quiz-service");
  const { submitTaskAnswer } = await import("@/lib/services/task-service");

  assert.equal(hasRoleAccess("ADMIN", ["STUDENT"]), true);
  assert.equal(hasRoleAccess("INSTRUCTOR", ["ADMIN"]), false);
  assert.deepEqual(getRequiredRolesForPath("/admin/users"), ["ADMIN"]);
  assert.deepEqual(getRequiredRolesForPath("/instructor/rooms"), ["INSTRUCTOR"]);
  assert.deepEqual(getRequiredRolesForPath("/rooms/example"), ["STUDENT"]);

  // Pola petunjuk jawaban: huruf/angka menjadi "*", spasi dan tanda baca tetap, spasi berlebih dirapikan.
  const { answerPattern } = await import("@/lib/learning/answer-pattern");
  assert.equal(answerPattern("false positive"), "***** ********");
  assert.equal(answerPattern("ACT{flag_1}"), "***{****_*}");
  assert.equal(answerPattern("2xx"), "***");
  assert.equal(answerPattern("server-side authorization"), "******-**** *************");
  assert.equal(answerPattern("10.0.0.15"), "**.*.*.**");
  assert.equal(answerPattern("  least \t  privilege\n"), "***** *********", "edges are trimmed and inner whitespace collapses");
  assert.equal(answerPattern("café"), "****");
  assert.equal(answerPattern("café"), "****", "a letter and its combining accent count as one character");
  assert.equal(answerPattern("Ünïcödé 日本"), "******* **");
  for (const empty of ["", "   ", null, undefined]) {
    assert.equal(answerPattern(empty), null, `no pattern for ${JSON.stringify(empty)}`);
  }

  // Bab tampil task dan urutan buka per bab (tanpa database).
  const { chapterTaskStatuses, taskChapterHref, taskChapterId } = await import("@/lib/learning/chapters");
  const sampleChapters = [{ id: "ch-1" }, { id: "ch-2" }];
  assert.equal(taskChapterId("ch-1", sampleChapters), "ch-1");
  assert.equal(taskChapterId(null, sampleChapters), "ch-2", "a task without a chapter shows under the last chapter");
  assert.equal(taskChapterId("deleted", sampleChapters), "ch-2", "a task whose chapter is gone shows under the last chapter");
  assert.equal(taskChapterId("ch-1", []), null);
  assert.equal(taskChapterHref("web", "ch-1", sampleChapters), "/rooms/web?chapter=1#tasks");
  assert.equal(taskChapterHref("web", null, sampleChapters), "/rooms/web?chapter=2#tasks");
  assert.equal(taskChapterHref("web", null, []), "/rooms/web#tasks", "a room without chapters shows its tasks on the material page");
  const sampleTasks = [
    { id: "a", chapterId: "ch-1" },
    { id: "b", chapterId: "ch-1" },
    { id: "c", chapterId: "ch-2" },
    { id: "d", chapterId: null }
  ];
  assert.deepEqual(Object.fromEntries(chapterTaskStatuses(sampleTasks, sampleChapters, new Set())), {
    a: "active",
    b: "locked",
    c: "active",
    d: "locked"
  });
  assert.deepEqual(
    Object.fromEntries(chapterTaskStatuses(sampleTasks, sampleChapters, new Set(["a", "d"]))),
    { a: "completed", b: "active", c: "active", d: "completed" },
    "unlocking is per chapter: an open task in one chapter does not lock another chapter"
  );

  const testId = randomUUID();
  const userId = randomUUID();
  const slug = `test-room-${testId}`;
  const pathSlug = `test-path-${testId}`;

  let learningPathId: string | null = null;
  let contentPathId: string | null = null;
  const extraPathIds: string[] = [];
  const localProfileIds: string[] = [];
  const contentProfileIds: string[] = [];

  try {
    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email: `test-${testId}@local.dev`,
        fullName: "Service Test Learner",
        username: `test_${testId.replace(/-/g, "_").slice(0, 18)}`,
        role: Role.STUDENT
      }
    });

    const learningPath = await prisma.learningPath.create({
      data: {
        title: "Service Test Path",
        slug: pathSlug,
        description: "Temporary safe learning path for service integration testing.",
        category: "Testing",
        difficulty: "Beginner",
        estimatedHours: 1,
        isPublished: true,
        rooms: {
          create: {
            title: "Service Test Room",
            slug,
            description: "Temporary safe room for validating task, quiz, progress, and leaderboard behavior.",
            category: "Testing",
            difficulty: "Beginner",
            estimatedMinutes: 15,
            points: 40,
            orderIndex: 9999,
            isPublished: true,
            tasks: {
              create: [
                {
                  title: "Identify the safest access-control principle",
                  description: "Choose the defensive principle that limits unnecessary access.",
                  orderIndex: 1,
                  answerType: AnswerType.TEXT,
                  expectedAnswer: "least privilege",
                  points: 15
                }
              ]
            }
          }
        }
      },
      include: {
        rooms: {
          include: {
            tasks: true
          }
        }
      }
    });

    learningPathId = learningPath.id;
    const room = learningPath.rooms[0];
    const task = room.tasks[0];

    const wrongSubmission = await submitTaskAnswer(profile.id, {
      taskId: task.id,
      answer: "allow all"
    });
    assert.equal(wrongSubmission.isCorrect, false);

    const correctSubmission = await submitTaskAnswer(profile.id, {
      taskId: task.id,
      answer: "Least Privilege"
    });
    assert.equal(correctSubmission.isCorrect, true);

    const progressAfterTask = await prisma.userRoomProgress.findUniqueOrThrow({
      where: {
        userId_roomId: {
          userId: profile.id,
          roomId: room.id
        }
      }
    });
    assert.equal(progressAfterTask.progressPercentage, 100);
    assert.equal(progressAfterTask.status, "COMPLETED");

    const quiz = await prisma.quiz.create({
      data: {
        roomId: room.id,
        title: "Service Test Quiz",
        description: "Safe concept check for integration testing.",
        passingScore: 50,
        questions: {
          create: [
            {
              question: "Which principle minimizes unnecessary access?",
              explanation: "Least privilege limits access to what is required.",
              orderIndex: 1,
              options: {
                create: [
                  { label: "Least privilege", isCorrect: true },
                  { label: "Unlimited access", isCorrect: false }
                ]
              }
            },
            {
              question: "What should training labs avoid?",
              explanation: "Training labs should avoid unsafe operational detail.",
              orderIndex: 2,
              options: {
                create: [
                  { label: "Safe defensive explanations", isCorrect: false },
                  { label: "Unsafe operational detail", isCorrect: true }
                ]
              }
            }
          ]
        }
      },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: {
            orderIndex: "asc"
          }
        }
      }
    });

    const answers = Object.fromEntries(
      quiz.questions.map((question) => [question.id, question.options.find((option) => option.isCorrect)!.id])
    );
    const attempt = await submitQuizAttempt(profile.id, {
      quizId: quiz.id,
      answers
    });
    assert.equal(attempt.score, 100);
    assert.equal(attempt.passed, true);
    assert.equal(attempt.roomId, room.id, "a new attempt keeps its room for history");
    assert.equal(attempt.quizTitle, "Service Test Quiz");

    await submitQuizAttempt(profile.id, {
      quizId: quiz.id,
      answers
    });

    const leaderboard = await getGlobalLeaderboard(100);
    const row = leaderboard.find((entry) => entry.user?.id === profile.id);
    assert.ok(row);
    assert.equal(row.points, 55);

    // Kolom materi lama Room tidak pernah ikut terkirim lewat path (GET /api/learning-paths?slug=…).
    const { getLearningPathBySlug, getLearningPathProgressForCurrentUser } = await import("@/lib/services/learning-path-service");
    const publicPath = await getLearningPathBySlug(pathSlug);
    assert.ok(publicPath?.rooms[0]);
    assert.equal("content" in publicPath.rooms[0], false, "a path's rooms carry no legacy material");
    assert.equal("contentFormat" in publicPath.rooms[0], false);
    const pathProgress = await getLearningPathProgressForCurrentUser(profile.id, pathSlug);
    assert.ok(pathProgress?.path.rooms[0]);
    assert.equal("content" in pathProgress.path.rooms[0], false, "path progress carries no legacy material");
    assert.equal(pathProgress.completedRooms, 1);

    // Judul tab halaman materi: room tanpa bab memakai judul room saja.
    const { publishedRoomMaterialTitle } = await import("@/lib/services/page-title-service");
    assert.equal(await publishedRoomMaterialTitle(slug, "2"), "Service Test Room");

    // Bab seed: bab pembuka yang hanya mengulang judul room menjadi "Introduction"; satu bab saja tidak diganti.
    const { splitSeedMaterialIntoChapters } = await import("../prisma/seed-content");
    assert.deepEqual(
      splitSeedMaterialIntoChapters("# Seed Room\n\nPembuka.\n\n## Detail\n\nIsi.", "Seed Room").map((chapter) => chapter.title),
      ["Introduction", "Detail"]
    );
    assert.deepEqual(
      splitSeedMaterialIntoChapters("Tanpa heading.\n\n## Detail\n\nIsi.", "Seed Room").map((chapter) => chapter.title),
      ["Introduction", "Detail"]
    );
    assert.deepEqual(
      splitSeedMaterialIntoChapters("# Pembuka Lain\n\nTeks.\n\n## Detail\n\nIsi.", "Seed Room").map((chapter) => chapter.title),
      ["Pembuka Lain", "Detail"]
    );
    assert.deepEqual(splitSeedMaterialIntoChapters("# Seed Room\n\nSemua materi.", "Seed Room").map((chapter) => chapter.title), ["Seed Room"]);

    // -----------------------------------------------------------------------
    // Content authoring service: ownership, tasks, quiz, option ordering
    // -----------------------------------------------------------------------
    const {
      ContentAccessError,
      addQuizQuestion,
      addRoomTask,
      addRoomToLearningPath,
      createLearningPath,
      createRoomChapter,
      deleteRoomChapter,
      deleteRoomQuiz,
      deleteRoomTask,
      getLearningPathForEditor,
      getRoomForEditor,
      listRoomsForManagement,
      listRoomsOutsidePath,
      moveRoomChapter,
      moveRoomInPath,
      moveRoomTask,
      setRoomPublished,
      updateQuizQuestion,
      updateRoomChapter,
      updateRoomMetadata,
      updateRoomSchedule,
      updateRoomTask,
      upsertRoomQuiz
    } = await import("@/lib/services/content-service");
    const { createRoomWithTasks } = await import("@/lib/services/instructor-service");
    const { getQuizByRoomSlug } = await import("@/lib/services/quiz-service");
    const { getRoomBySlug, getRoomChapterForReader, getRoomForMemberApi, getRoomTasks } = await import("@/lib/services/room-service");

    const makeProfile = async (role: Role, label: string) => {
      const id = randomUUID();
      contentProfileIds.push(id);
      return prisma.profile.create({
        data: {
          id,
          email: `content-${label}-${testId}@local.dev`,
          fullName: `Content ${label}`,
          username: `c${label}_${testId.replace(/-/g, "").slice(0, 12)}`,
          role
        }
      });
    };

    const authorA = await makeProfile(Role.INSTRUCTOR, "a");
    const authorB = await makeProfile(Role.INSTRUCTOR, "b");
    const adminActor = await makeProfile(Role.ADMIN, "adm");

    const contentPath = await createLearningPath(authorA, {
      title: "Authoring Test Path",
      slug: `authoring-path-${testId}`,
      description: "Temporary learning path created by the content-service smoke test.",
      category: "Testing",
      difficulty: "Beginner",
      estimatedHours: 2,
      coverImageUrl: "",
      isPublished: false
    });
    contentPathId = contentPath.id;
    assert.equal(contentPath.createdById, authorA.id);
    assert.equal(contentPath.coverImageUrl, null);

    const contentRoom = await createRoomWithTasks(
      {
        learningPathId: contentPath.id,
        title: "Authoring Test Room",
        slug: `authoring-room-${testId}`,
        description: "Temporary room for validating authoring flows end to end.",
        category: "Testing",
        difficulty: "Beginner",
        estimatedMinutes: 20,
        points: 30,
        orderIndex: 1,
        isPublished: false,
        tasks: [{ title: "First safe task", description: "Read the walkthrough carefully.", expectedAnswer: "read", points: 5 }]
      },
      authorA.id
    );
    assert.equal(contentRoom.createdById, authorA.id);

    const { task: secondTask } = await addRoomTask(authorA, {
      roomId: contentRoom.id,
      title: "Second safe task",
      description: "Identify the defensive principle described.",
      expectedAnswer: "defense in depth",
      points: 10
    });
    assert.equal(secondTask.orderIndex, 2);

    await moveRoomTask(authorA, { taskId: secondTask.id, direction: "up" });
    const editorAfterMove = await getRoomForEditor(authorA, contentRoom.id);
    assert.ok(editorAfterMove);
    assert.deepEqual(
      editorAfterMove.room.tasks.map((task) => task.orderIndex),
      [1, 2]
    );
    assert.equal(editorAfterMove.room.tasks[0].id, secondTask.id);

    // Materi room berupa bab: bab baru di akhir, hak kelola mengikuti room, admin boleh menyunting.
    const roomBeforeChapter = await prisma.room.findUniqueOrThrow({ where: { id: contentRoom.id }, select: { updatedAt: true } });
    const introChapter = await createRoomChapter(authorA, { roomId: contentRoom.id, title: "  Walkthrough  " });
    assert.equal(introChapter.title, "Walkthrough", "chapter titles are trimmed");
    assert.equal(introChapter.orderIndex, 0);
    assert.equal(introChapter.content, "");
    assert.equal(introChapter.contentFormat, "HTML");
    assert.equal(introChapter.room.slug, contentRoom.slug);
    const roomAfterChapter = await prisma.room.findUniqueOrThrow({ where: { id: contentRoom.id }, select: { updatedAt: true } });
    assert.ok(roomAfterChapter.updatedAt > roomBeforeChapter.updatedAt, "a chapter change counts as a room edit");

    await updateRoomChapter(authorA, { chapterId: introChapter.id, title: "Walkthrough", contentFormat: "MARKDOWN", content: "# Walkthrough\n\nMateri uji." });
    await assert.rejects(
      createRoomChapter(authorB, { roomId: contentRoom.id, title: "Hijack" }),
      (error: unknown) => error instanceof ContentAccessError
    );
    await assert.rejects(
      updateRoomChapter(authorB, { chapterId: introChapter.id, title: "Hijack", content: "hijack" }),
      (error: unknown) => error instanceof ContentAccessError
    );
    await assert.rejects(createRoomChapter(authorA, { roomId: contentRoom.id, title: "   " }), (error: unknown) => error instanceof ZodError);
    await assert.rejects(createRoomChapter(authorA, { roomId: contentRoom.id, title: "x".repeat(161) }), (error: unknown) => error instanceof ZodError);
    const editorAsB = await getRoomForEditor(authorB, contentRoom.id);
    assert.equal(editorAsB?.canManage, false);
    const adminEdit = await updateRoomChapter(adminActor, {
      chapterId: introChapter.id,
      title: "Walkthrough",
      contentFormat: "MARKDOWN",
      content: "# Walkthrough\n\nDiubah admin."
    });
    assert.equal(adminEdit.content, "# Walkthrough\n\nDiubah admin.");
    assert.equal(adminEdit.contentFormat, "MARKDOWN");

    const { quiz: contentQuiz } = await upsertRoomQuiz(authorA, {
      roomId: contentRoom.id,
      title: "Authoring Quiz",
      description: "Concept check created through the authoring service.",
      passingScore: 50
    });

    await assert.rejects(
      addQuizQuestion(authorA, {
        quizId: contentQuiz.id,
        question: "Invalid: two correct options?",
        explanation: "Validation should reject this.",
        options: [
          { label: "A", isCorrect: true },
          { label: "B", isCorrect: true }
        ]
      }),
      (error: unknown) => error instanceof ZodError
    );

    const { question: contentQuestion } = await addQuizQuestion(authorA, {
      quizId: contentQuiz.id,
      question: "Which principle limits access to only what is needed?",
      explanation: "Least privilege minimises unnecessary access.",
      options: [
        { label: "Least privilege", isCorrect: true },
        { label: "Full access", isCorrect: false }
      ]
    });

    await updateQuizQuestion(authorA, {
      questionId: contentQuestion.id,
      question: "Which principle limits access to only what is needed?",
      explanation: "Least privilege minimises unnecessary access.",
      options: [
        { label: "Full access", isCorrect: false },
        { label: "Least privilege", isCorrect: true },
        { label: "Shared accounts", isCorrect: false }
      ]
    });

    await setRoomPublished(authorA, { roomId: contentRoom.id, isPublished: true });
    const publicQuiz = await getQuizByRoomSlug(contentRoom.slug);
    assert.ok(publicQuiz);
    assert.equal(publicQuiz.questions.length, 1);
    assert.deepEqual(
      publicQuiz.questions[0].options.map((option) => option.label),
      ["Full access", "Least privilege", "Shared accounts"]
    );
    assert.deepEqual(
      publicQuiz.questions[0].options.map((option) => option.orderIndex),
      [1, 2, 3]
    );
    assert.equal("isCorrect" in publicQuiz.questions[0].options[0], false);

    // -----------------------------------------------------------------------
    // Single completion rule, hints, accepted answers, quiz review
    // -----------------------------------------------------------------------
    const learner = await makeProfile(Role.STUDENT, "learner");
    const learnerAnswers = Object.fromEntries(
      publicQuiz.questions.map((question) => [question.id, question.options.find((option) => option.label === "Least privilege")!.id])
    );
    const learnerAttempt = await submitQuizAttempt(learner.id, { quizId: publicQuiz.id, answers: learnerAnswers });
    assert.equal(learnerAttempt.passed, true);
    assert.equal(learnerAttempt.review.length, 1);
    assert.equal(learnerAttempt.review[0].isCorrect, true);
    assert.equal(learnerAttempt.review[0].correctLabel, "Least privilege");
    assert.equal(learnerAttempt.review[0].selectedLabel, "Least privilege");
    // 2 tasks + 1 quiz = 3 units; only the quiz unit is done so far.
    assert.equal(learnerAttempt.progressPercentage, 33);
    assert.equal(learnerAttempt.roomCompleted, false);

    await updateRoomTask(authorA, {
      taskId: secondTask.id,
      title: "Second safe task",
      description: "Identify the defensive principle described.",
      expectedAnswer: "defense in depth",
      acceptedAnswers: ["defence in depth"],
      hint: "Pikirkan pertahanan berlapis.",
      points: 10
    });

    const firstWrong = await submitTaskAnswer(learner.id, { taskId: secondTask.id, answer: "firewall" });
    assert.equal(firstWrong.isCorrect, false);
    assert.equal(firstWrong.wrongAttempts, 1);
    assert.equal(firstWrong.hasHint, true);
    assert.equal(firstWrong.hintUnlocked, false);

    const secondWrong = await submitTaskAnswer(learner.id, { taskId: secondTask.id, answer: "antivirus" });
    assert.equal(secondWrong.wrongAttempts, 2);
    assert.equal(secondWrong.hintUnlocked, true);

    const alternative = await submitTaskAnswer(learner.id, { taskId: secondTask.id, answer: "  Defence   in depth " });
    assert.equal(alternative.isCorrect, true);
    assert.equal(alternative.progressPercentage, 67);

    const remainingTask = editorAfterMove.room.tasks.find((task) => task.id !== secondTask.id);
    assert.ok(remainingTask);
    const finalAnswer = await submitTaskAnswer(learner.id, { taskId: remainingTask.id, answer: "READ" });
    assert.equal(finalAnswer.isCorrect, true);
    assert.equal(finalAnswer.progressPercentage, 100);

    const learnerProgress = await prisma.userRoomProgress.findUniqueOrThrow({
      where: { userId_roomId: { userId: learner.id, roomId: contentRoom.id } }
    });
    assert.equal(learnerProgress.status, "COMPLETED");
    assert.ok(learnerProgress.completedAt);

    // -----------------------------------------------------------------------
    // Availability window: upcoming/closed rooms reject work; metadata keeps content
    // -----------------------------------------------------------------------
    const scheduler = await makeProfile(Role.STUDENT, "sched");
    const baseMetadata = {
      roomId: contentRoom.id,
      learningPathId: contentRoom.learningPathId,
      title: contentRoom.title,
      slug: contentRoom.slug,
      description: contentRoom.description,
      category: contentRoom.category,
      difficulty: contentRoom.difficulty,
      estimatedMinutes: contentRoom.estimatedMinutes,
      points: contentRoom.points,
      orderIndex: contentRoom.orderIndex
    };
    const inOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Logo room: URL media internal tersimpan, string kosong menghapusnya, URL tidak valid ditolak.
    const logoUrl = `/api/media/${randomUUID()}`;
    const withLogo = await updateRoomMetadata(authorA, { ...baseMetadata, logoUrl });
    assert.equal(withLogo.logoUrl, logoUrl, "an uploaded room logo is stored");
    const withoutLogo = await updateRoomMetadata(authorA, { ...baseMetadata, logoUrl: "" });
    assert.equal(withoutLogo.logoUrl, null, "clearing the logo falls back to the name initials");
    await assert.rejects(
      updateRoomMetadata(authorA, { ...baseMetadata, logoUrl: "javascript:alert(1)" }),
      (error: unknown) => error instanceof ZodError
    );

    // Jadwal disimpan terpisah dari Details: simpan Details tidak menyentuh jadwal maupun sampul lama.
    await prisma.room.update({ where: { id: contentRoom.id }, data: { coverImageUrl: logoUrl } });
    await updateRoomSchedule(authorA, { roomId: contentRoom.id, availableFrom: inOneDay, availableUntil: "" });
    await assert.rejects(updateRoomSchedule(authorB, { roomId: contentRoom.id, availableFrom: "", availableUntil: "" }), (error: unknown) => error instanceof ContentAccessError);
    const detailsSaved = await updateRoomMetadata(authorA, { ...baseMetadata, logoUrl: "", availableFrom: "", availableUntil: "", coverImageUrl: "" });
    assert.equal(detailsSaved.availableFrom?.toISOString(), inOneDay, "saving Details keeps the schedule");
    assert.equal(detailsSaved.coverImageUrl, logoUrl, "saving Details keeps the stored cover image");
    const chaptersAfterMetadata = await prisma.roomChapter.findMany({ where: { roomId: contentRoom.id }, select: { content: true } });
    assert.deepEqual(
      chaptersAfterMetadata.map((chapter) => chapter.content),
      ["# Walkthrough\n\nDiubah admin."],
      "metadata update must not wipe chapter material"
    );
    await assert.rejects(submitTaskAnswer(scheduler.id, { taskId: remainingTask.id, answer: "read" }), /opens on/);

    // GET /api/rooms?slug=…: tanpa hint; room yang belum dibuka hanya ringkasan jadwal untuk member.
    const upcomingForMember = await getRoomForMemberApi(contentRoom.slug, "STUDENT");
    assert.ok(upcomingForMember);
    assert.equal(upcomingForMember.availability.state, "upcoming");
    assert.equal("tasks" in upcomingForMember, false, "an upcoming room hides its tasks from members");
    assert.equal("chapters" in upcomingForMember, false, "an upcoming room hides its chapters from members");
    assert.equal("content" in upcomingForMember, false);
    const upcomingForInstructor = await getRoomForMemberApi(contentRoom.slug, "INSTRUCTOR");
    assert.ok(upcomingForInstructor && "tasks" in upcomingForInstructor);
    assert.ok(upcomingForInstructor.tasks.length > 0);
    assert.ok(
      upcomingForInstructor.tasks.every((entry) => !("hint" in entry)),
      "task hints are never part of the room API"
    );
    assert.equal(upcomingForInstructor.tasks.find((entry) => entry.id === secondTask.id)?.hasHint, true);

    // GET /api/rooms?roomId=…: aturan jadwal yang sama; member mendapat daftar kosong untuk room yang belum dibuka.
    assert.deepEqual(await getRoomTasks(contentRoom.id, "STUDENT"), [], "an upcoming room lists no tasks to members by id either");
    const upcomingTasksForInstructor = await getRoomTasks(contentRoom.id, "INSTRUCTOR");
    assert.ok(upcomingTasksForInstructor && upcomingTasksForInstructor.length > 0, "instructors still preview the tasks");
    assert.ok(
      upcomingTasksForInstructor.every((entry) => !("expectedAnswer" in entry) && !("acceptedAnswers" in entry) && !("hint" in entry)),
      "the task list by id carries no answers or hints"
    );
    assert.equal(await getRoomTasks("not-a-uuid", "STUDENT"), null);
    assert.equal(await getRoomTasks(randomUUID(), "STUDENT"), null);

    await updateRoomSchedule(authorA, { roomId: contentRoom.id, availableFrom: "", availableUntil: oneDayAgo });
    await assert.rejects(submitTaskAnswer(scheduler.id, { taskId: remainingTask.id, answer: "read" }), /closed on/);
    await assert.rejects(
      submitQuizAttempt(scheduler.id, { quizId: publicQuiz.id, answers: learnerAnswers }),
      /closed on/
    );

    await assert.rejects(
      updateRoomSchedule(authorA, { roomId: contentRoom.id, availableFrom: inOneDay, availableUntil: oneDayAgo }),
      (error: unknown) => error instanceof ZodError
    );

    await updateRoomSchedule(authorA, { roomId: contentRoom.id, availableFrom: "", availableUntil: "" });
    const reopened = await submitTaskAnswer(scheduler.id, { taskId: remainingTask.id, answer: "read" });
    assert.equal(reopened.isCorrect, true);
    const openForMember = await getRoomForMemberApi(contentRoom.slug, "STUDENT");
    assert.ok(openForMember && "tasks" in openForMember);
    assert.ok(openForMember.tasks.every((entry) => !("hint" in entry)), "an open room's API has no hints either");
    assert.deepEqual(
      (await getRoomTasks(contentRoom.id, "STUDENT"))?.map((entry) => entry.id),
      openForMember.tasks.map((entry) => entry.id),
      "an open room lists its tasks by id in the same order"
    );

    // -----------------------------------------------------------------------
    // Path composition: add an existing room to another path and reorder
    // -----------------------------------------------------------------------
    const secondPath = await createLearningPath(authorA, {
      title: "Authoring Test Path B",
      slug: `authoring-path-b-${testId}`,
      description: "Second temporary path used to verify moving rooms between paths.",
      category: "Testing",
      difficulty: "Beginner",
      estimatedHours: 1,
      coverImageUrl: "",
      isPublished: true
    });
    extraPathIds.push(secondPath.id);

    await assert.rejects(
      addRoomToLearningPath(authorB, { pathId: secondPath.id, roomId: contentRoom.id }),
      (error: unknown) => error instanceof ContentAccessError
    );

    const moved = await addRoomToLearningPath(authorA, { pathId: secondPath.id, roomId: contentRoom.id });
    assert.equal(moved.room.learningPathId, secondPath.id);
    assert.equal(moved.room.orderIndex, 1);
    assert.equal(moved.previousPathSlug, contentPath.slug);
    await assert.rejects(addRoomToLearningPath(authorA, { pathId: secondPath.id, roomId: contentRoom.id }), /already in that path/);

    const extraRoom = await createRoomWithTasks(
      {
        learningPathId: secondPath.id,
        title: "Authoring Test Room B",
        slug: `authoring-room-b-${testId}`,
        description: "Second temporary room used to verify ordering inside a path.",
        category: "Testing",
        difficulty: "Beginner",
        estimatedMinutes: 10,
        points: 10,
        orderIndex: 9,
        isPublished: false,
        tasks: [{ title: "Read the notes", description: "Read the walkthrough notes carefully.", expectedAnswer: "notes", points: 5 }]
      },
      authorA.id
    );
    assert.equal(await getRoomTasks(extraRoom.id, "STUDENT"), null, "a draft room's tasks are not served by id");

    await moveRoomInPath(authorA, { roomId: extraRoom.id, direction: "up" });
    const secondPathEditor = await getLearningPathForEditor(authorA, secondPath.id);
    assert.ok(secondPathEditor);
    assert.deepEqual(
      secondPathEditor.path.rooms.map((room) => room.id),
      [extraRoom.id, contentRoom.id]
    );
    assert.deepEqual(
      secondPathEditor.path.rooms.map((room) => room.orderIndex),
      [1, 2]
    );

    const outside = await listRoomsOutsidePath(secondPath.id);
    assert.equal(outside.some((room) => room.id === extraRoom.id), false);

    // -----------------------------------------------------------------------
    // Rich text material: sanitization, Markdown conversion, HTML storage
    // -----------------------------------------------------------------------
    const { sanitizeRichHtml, markdownToHtml, renderRoomMaterialHtml, roomMaterialToEditorHtml, isRichHtmlEmpty, prepareRichHtmlForStorage } = await import(
      "@/lib/content/rich-text"
    );

    const formatted =
      '<h2 style="text-align: center">Judul</h2><p><strong>B</strong> <em>I</em> <u>U</u> <s>S</s> <sup>2</sup><sub>2</sub> ' +
      '<span style="font-family: Georgia, serif; font-size: 24px; color: #f87171">gaya</span> ' +
      '<mark data-color="rgba(250, 204, 21, 0.35)" style="background-color: rgba(250, 204, 21, 0.35); color: inherit">stabilo</mark></p>' +
      '<ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div><p>ok</p></div></li></ul>' +
      '<table style="min-width: 75px"><colgroup><col style="min-width: 25px"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>H</p></th></tr></tbody></table>' +
      '<img src="/api/media/a5e06387-ed12-4c47-8359-e16c904fa4a6" alt="g">';
    const cleanFormatted = sanitizeRichHtml(formatted);
    for (const fragment of [
      "text-align:center",
      "<u>U</u>",
      "<s>S</s>",
      "<sup>2</sup>",
      "<sub>2</sub>",
      "font-family:Georgia, serif",
      "font-size:24px",
      "color:#f87171",
      'data-color="rgba(250, 204, 21, 0.35)"',
      'data-type="taskList"',
      'data-checked="true"',
      'disabled="disabled"',
      "<th",
      'src="/api/media/a5e06387-ed12-4c47-8359-e16c904fa4a6"'
    ]) {
      assert.ok(cleanFormatted.includes(fragment), `sanitizer must keep editor formatting: ${fragment}`);
    }

    const hostile = sanitizeRichHtml(
      '<script>alert(1)</script><img src=x onerror=alert(1)><img src="javascript:alert(1)"><img src="data:image/png;base64,AAA">' +
        '<img src="http://insecure.test/a.png"><a href="javascript:alert(1)">j</a><a href="//evil.test">p</a>' +
        '<iframe src="https://x.test"></iframe><svg onload=alert(1)></svg><p onclick="x" style="background:url(javascript:alert(1))">p</p>' +
        '<span style="font-size: 9999px; color: expression(alert(1))">big</span><style>body{}</style><input type="text">' +
        '<mark data-color="red;background:url(x)">m</mark>'
    );
    for (const forbidden of ["<script", "onerror", "javascript:", "data:image", "http://insecure", "//evil", "<iframe", "<svg", "onclick", "url(", "9999px", "expression", "<style", 'type="text"', "red;background"]) {
      assert.equal(hostile.toLowerCase().includes(forbidden), false, `sanitizer must strip: ${forbidden}`);
    }

    const converted = markdownToHtml("# Judul\n\n**tebal** dan `kode`\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n<script>alert(1)</script>");
    assert.ok(converted.includes("<h1>Judul</h1>"));
    assert.ok(converted.includes("<strong>tebal</strong>"));
    assert.ok(converted.includes("<table>"));
    assert.equal(converted.includes("<script"), false);
    assert.equal(isRichHtmlEmpty("<p></p><p> </p>"), true);
    assert.equal(isRichHtmlEmpty('<p><img src="/api/media/a5e06387-ed12-4c47-8359-e16c904fa4a6"></p>'), false);

    const savedHtml = await updateRoomChapter(authorA, {
      chapterId: introChapter.id,
      title: "Walkthrough",
      contentFormat: "HTML",
      content: '<p><strong>Halo</strong> <span style="color: #4ade80">dunia</span></p><script>alert(1)</script><img src=x onerror=alert(1)>'
    });
    assert.equal(savedHtml.contentFormat, "HTML");
    assert.equal(savedHtml.room.id, contentRoom.id);
    assert.equal(savedHtml.content.includes("<script"), false);
    assert.equal(savedHtml.content.includes("onerror"), false);
    assert.ok(savedHtml.content.includes("<strong>Halo</strong>"));
    assert.ok(savedHtml.content.includes("#4ade80"), "stored material keeps instructor colours as written");
    assert.ok(
      renderRoomMaterialHtml(savedHtml.content, savedHtml.contentFormat).includes("color:#257144"),
      "a legacy dark-theme colour renders as its readable counterpart"
    );

    const emptied = await updateRoomChapter(authorA, { chapterId: introChapter.id, title: "Walkthrough", contentFormat: "HTML", content: "<p></p>" });
    assert.equal(emptied.content, "", "an empty editor must be stored as empty content");
    const listedRoom = (await listRoomsForManagement()).find((entry) => entry.id === contentRoom.id);
    assert.equal(listedRoom?._count.chapters, 0, "a room whose only chapter is empty has no material yet");

    await assert.rejects(
      updateRoomChapter(authorB, { chapterId: introChapter.id, title: "Walkthrough", contentFormat: "HTML", content: "<p>x</p>" }),
      (error: unknown) => error instanceof ContentAccessError
    );

    // -----------------------------------------------------------------------
    // Room chapters: append order, rename, move, delete + renumber, reader access
    // -----------------------------------------------------------------------
    const requestChapter = await createRoomChapter(authorA, { roomId: contentRoom.id, title: "Request basics" });
    const statusChapter = await createRoomChapter(authorA, { roomId: contentRoom.id, title: "Status codes" });
    assert.deepEqual([requestChapter.orderIndex, statusChapter.orderIndex], [1, 2], "new chapters are appended at the end");

    const renamed = await updateRoomChapter(authorA, {
      chapterId: requestChapter.id,
      title: "Requests and responses",
      contentFormat: "HTML",
      content: "<p>Isi bab dua.</p>"
    });
    assert.equal(renamed.title, "Requests and responses");
    assert.equal(renamed.content, "<p>Isi bab dua.</p>");

    const chapterOrder = async () => {
      const editor = await getRoomForEditor(authorA, contentRoom.id);
      assert.ok(editor);
      return editor.room.chapters.map((chapter) => [chapter.id, chapter.orderIndex]);
    };
    const chapterEditTimes = async () =>
      Object.fromEntries(
        (await prisma.roomChapter.findMany({ where: { roomId: contentRoom.id }, select: { id: true, updatedAt: true } })).map((chapter) => [
          chapter.id,
          chapter.updatedAt.getTime()
        ])
      );
    const editTimesBeforeMove = await chapterEditTimes();
    await moveRoomChapter(authorA, { chapterId: statusChapter.id, direction: "up" });
    await moveRoomChapter(authorA, { chapterId: introChapter.id, direction: "up" });
    assert.deepEqual(await chapterEditTimes(), editTimesBeforeMove, "moving chapters does not change their edit time");
    assert.deepEqual(
      await chapterOrder(),
      [
        [introChapter.id, 0],
        [statusChapter.id, 1],
        [requestChapter.id, 2]
      ],
      "moving swaps neighbours; moving the first chapter up changes nothing"
    );

    await assert.rejects(
      moveRoomChapter(authorB, { chapterId: statusChapter.id, direction: "down" }),
      (error: unknown) => error instanceof ContentAccessError
    );
    await assert.rejects(deleteRoomChapter(authorB, { chapterId: statusChapter.id }), (error: unknown) => error instanceof ContentAccessError);

    // Pembaca: daftar bab tanpa isi; isi diambil per bab dan hanya untuk bab milik room terbit itu.
    const publicRoom = await getRoomBySlug(contentRoom.slug);
    assert.ok(publicRoom);
    assert.deepEqual(
      publicRoom.chapters.map((chapter) => chapter.title),
      ["Walkthrough", "Status codes", "Requests and responses"]
    );
    assert.equal("content" in publicRoom.chapters[0], false, "the chapter list carries no material");
    assert.equal("content" in publicRoom, false, "the legacy room material is not read");
    const readerChapter = await getRoomChapterForReader(contentRoom.id, requestChapter.id);
    assert.deepEqual(readerChapter, { id: requestChapter.id, title: "Requests and responses", content: "<p>Isi bab dua.</p>", contentFormat: "HTML" });

    const draftRoomChapter = await createRoomChapter(authorA, { roomId: extraRoom.id, title: "Draft room chapter" });
    assert.equal(draftRoomChapter.orderIndex, 0, "chapter order is per room");
    assert.equal(await getRoomChapterForReader(contentRoom.id, draftRoomChapter.id), null, "a chapter from another room is not served");
    assert.equal(await getRoomChapterForReader(extraRoom.id, draftRoomChapter.id), null, "chapters of a draft room are not served");
    assert.equal(await getRoomChapterForReader(contentRoom.id, "not-a-uuid"), null);

    // Task per bab: bab harus milik room yang sama; kosong berarti tanpa bab (tampil di bab terakhir).
    // Urutan bab sekarang: Walkthrough (0), Status codes (1), Requests and responses (2, terakhir).
    const firstTaskInput = { title: "First safe task", description: "Read the walkthrough carefully.", expectedAnswer: "read", points: 5 };
    const secondTaskInput = {
      title: "Second safe task",
      description: "Identify the defensive principle described.",
      expectedAnswer: "defense in depth",
      acceptedAnswers: ["defence in depth"],
      hint: "Pikirkan pertahanan berlapis.",
      points: 10
    };
    const statusTaskInput = { title: "Read the status line", description: "Name the status code family for success.", expectedAnswer: "2xx", points: 5 };
    const { task: statusTask } = await addRoomTask(authorA, { roomId: contentRoom.id, chapterId: statusChapter.id, ...statusTaskInput });
    assert.equal(statusTask.chapterId, statusChapter.id);
    assert.equal(statusTask.orderIndex, 3, "a new task goes to the end of the room order");
    const { task: looseTask } = await addRoomTask(authorA, {
      roomId: contentRoom.id,
      chapterId: "",
      title: "Loose task",
      description: "A task saved without a chapter.",
      expectedAnswer: "ACT{flag_1}",
      points: 5
    });
    assert.equal(looseTask.chapterId, null, "an empty chapter choice is stored as no chapter");
    await assert.rejects(
      addRoomTask(authorA, { roomId: contentRoom.id, chapterId: draftRoomChapter.id, ...statusTaskInput }),
      /isn't part of this room/,
      "a chapter from another room is rejected"
    );
    await assert.rejects(
      updateRoomTask(authorA, { taskId: statusTask.id, chapterId: draftRoomChapter.id, ...statusTaskInput }),
      /isn't part of this room/
    );
    await assert.rejects(
      addRoomTask(authorA, { roomId: contentRoom.id, chapterId: "not-a-uuid", ...statusTaskInput }),
      (error: unknown) => error instanceof ZodError
    );
    await assert.rejects(
      addRoomTask(authorB, { roomId: contentRoom.id, chapterId: statusChapter.id, ...statusTaskInput }),
      (error: unknown) => error instanceof ContentAccessError
    );

    const taskOrder = async () =>
      (await prisma.roomTask.findMany({ where: { roomId: contentRoom.id }, orderBy: { orderIndex: "asc" }, select: { id: true, chapterId: true, orderIndex: true } })).map(
        (task) => [task.id, task.chapterId, task.orderIndex]
      );
    const firstTaskId = remainingTask.id;
    assert.deepEqual(await taskOrder(), [
      [secondTask.id, null, 1],
      [firstTaskId, null, 2],
      [statusTask.id, statusChapter.id, 3],
      [looseTask.id, null, 4]
    ]);

    // Naik/turun hanya di dalam bab tampil: task lepas bertukar dengan task terdekat di bab terakhir, bukan dengan
    // task bab Status codes di antaranya; task satu-satunya di babnya tidak berpindah.
    await moveRoomTask(authorA, { taskId: looseTask.id, direction: "up" });
    await moveRoomTask(authorA, { taskId: statusTask.id, direction: "up" });
    assert.deepEqual(await taskOrder(), [
      [secondTask.id, null, 1],
      [looseTask.id, null, 2],
      [statusTask.id, statusChapter.id, 3],
      [firstTaskId, null, 4]
    ]);

    // Menyimpan task dengan bab terakhir yang ditulis eksplisit tidak memindahkan urutannya (bab tampilnya sama).
    const pinnedLast = await updateRoomTask(authorA, { taskId: firstTaskId, chapterId: requestChapter.id, ...firstTaskInput });
    assert.equal(pinnedLast.task.chapterId, requestChapter.id);
    assert.equal(pinnedLast.task.orderIndex, 4);
    // Pindah ke bab lain: task menjadi task terakhir di bab tujuan.
    const movedToIntro = await updateRoomTask(authorA, { taskId: secondTask.id, chapterId: introChapter.id, ...secondTaskInput });
    assert.equal(movedToIntro.task.chapterId, introChapter.id);
    assert.deepEqual(await taskOrder(), [
      [looseTask.id, null, 1],
      [statusTask.id, statusChapter.id, 2],
      [firstTaskId, requestChapter.id, 3],
      [secondTask.id, introChapter.id, 4]
    ]);
    // Field chapterId yang tidak dikirim juga berarti tanpa bab.
    const unpinned = await updateRoomTask(authorA, { taskId: firstTaskId, ...firstTaskInput });
    assert.equal(unpinned.task.chapterId, null);
    assert.equal(unpinned.task.orderIndex, 3, "no chapter and the last chapter are the same place, so the order stays");

    // Pembaca: setiap task membawa bab dan pola petunjuk, tanpa jawaban.
    const readerRoom = await getRoomBySlug(contentRoom.slug);
    assert.ok(readerRoom);
    for (const task of readerRoom.tasks) {
      assert.equal("expectedAnswer" in task, false, "the reader never receives the expected answer");
      assert.equal("acceptedAnswers" in task, false, "the reader never receives other accepted answers");
    }
    const readerTask = (id: string) => readerRoom.tasks.find((task) => task.id === id);
    assert.equal(readerTask(statusTask.id)?.answerPattern, "***");
    assert.equal(readerTask(statusTask.id)?.chapterId, statusChapter.id);
    assert.equal(readerTask(looseTask.id)?.answerPattern, "***{****_*}");
    assert.equal(readerTask(secondTask.id)?.answerPattern, "******* ** *****");
    const readerApi = await getRoomForMemberApi(contentRoom.slug, "STUDENT");
    assert.ok(readerApi && "tasks" in readerApi);
    assert.ok(
      readerApi.tasks.every((task) => !("expectedAnswer" in task) && !("acceptedAnswers" in task) && !("hint" in task)),
      "the room API carries no answers or hints"
    );
    assert.equal(JSON.stringify(readerApi).includes("defense in depth"), false);

    await deleteRoomChapter(authorA, { chapterId: statusChapter.id });
    const orphaned = await prisma.roomTask.findUniqueOrThrow({ where: { id: statusTask.id }, select: { chapterId: true } });
    assert.equal(orphaned.chapterId, null, "deleting a chapter keeps its tasks, now without a chapter (shown under the last chapter)");
    assert.deepEqual(
      await chapterOrder(),
      [
        [introChapter.id, 0],
        [requestChapter.id, 1]
      ],
      "deleting renumbers the remaining chapters"
    );
    const remainingEditTimes = Object.fromEntries(Object.entries(editTimesBeforeMove).filter(([id]) => id !== statusChapter.id));
    assert.deepEqual(await chapterEditTimes(), remainingEditTimes, "deleting a chapter does not change the others' edit time");
    await assert.rejects(
      updateRoomChapter(authorA, { chapterId: statusChapter.id, title: "Gone", content: "" }),
      /Chapter not found/
    );

    // -----------------------------------------------------------------------
    // Optional quiz: removing it keeps attempt history and recalculates progress
    // -----------------------------------------------------------------------
    const { getRoomCompletionSnapshot } = await import("@/lib/services/progress-service");
    const { getLearningActivity } = await import("@/lib/services/activity-service");

    const quizRoom = await createRoomWithTasks(
      {
        learningPathId: secondPath.id,
        title: "Quiz Removal Room",
        slug: `quiz-removal-room-${testId}`,
        description: "Temporary room whose quiz the instructor removes during the test.",
        category: "Testing",
        difficulty: "Beginner",
        estimatedMinutes: 10,
        points: 30,
        orderIndex: 3,
        isPublished: true,
        tasks: [{ title: "Name the principle", description: "Name the principle that limits access.", expectedAnswer: "least privilege", points: 5 }]
      },
      authorA.id
    );
    const quizRoomTask = await prisma.roomTask.findFirstOrThrow({ where: { roomId: quizRoom.id } });
    const { quiz: removableQuiz } = await upsertRoomQuiz(authorA, {
      roomId: quizRoom.id,
      title: "Removal Quiz",
      description: "A quiz that the instructor removes later.",
      passingScore: 50
    });
    const { question: removableQuestion } = await addQuizQuestion(authorA, {
      quizId: removableQuiz.id,
      question: "Which principle limits access to what is needed?",
      explanation: "Least privilege grants only the access a task needs.",
      options: [
        { label: "Least privilege", isCorrect: true },
        { label: "Shared admin", isCorrect: false }
      ]
    });
    const removableOptions = await prisma.quizOption.findMany({ where: { questionId: removableQuestion.id } });
    const passAnswers = { [removableQuestion.id]: removableOptions.find((option) => option.isCorrect)!.id };
    const failAnswers = { [removableQuestion.id]: removableOptions.find((option) => !option.isCorrect)!.id };

    const taskOnly = await makeProfile(Role.STUDENT, "qa"); // task benar, quiz gagal
    const quizOnly = await makeProfile(Role.STUDENT, "qb"); // quiz lulus, task belum
    const finisher = await makeProfile(Role.STUDENT, "qc"); // task benar, quiz lulus dua kali

    await submitTaskAnswer(taskOnly.id, { taskId: quizRoomTask.id, answer: "least privilege" });
    await submitQuizAttempt(taskOnly.id, { quizId: removableQuiz.id, answers: failAnswers });
    await submitQuizAttempt(quizOnly.id, { quizId: removableQuiz.id, answers: passAnswers });
    await submitTaskAnswer(finisher.id, { taskId: quizRoomTask.id, answer: "least privilege" });
    await submitQuizAttempt(finisher.id, { quizId: removableQuiz.id, answers: passAnswers });
    await submitQuizAttempt(finisher.id, { quizId: removableQuiz.id, answers: passAnswers });

    const progressOf = (userId: string) => prisma.userRoomProgress.findUniqueOrThrow({ where: { userId_roomId: { userId, roomId: quizRoom.id } } });
    assert.equal((await progressOf(taskOnly.id)).status, "IN_PROGRESS");
    assert.equal((await progressOf(quizOnly.id)).progressPercentage, 50);
    const finisherBefore = await progressOf(finisher.id);
    assert.equal(finisherBefore.status, "COMPLETED");
    const quizPointsOf = async (userId: string) =>
      (await prisma.leaderboardPoint.aggregate({ where: { userId, sourceType: "QUIZ_COMPLETION" }, _sum: { points: true } }))._sum.points ?? 0;
    const quizOnlyPointsBefore = await quizPointsOf(quizOnly.id);
    assert.equal(quizOnlyPointsBefore, 30);

    // Judul terakhir quiz yang tersimpan di riwayat, walau attempt dibuat saat judulnya masih lama.
    await upsertRoomQuiz(authorA, { roomId: quizRoom.id, title: "Removal Quiz v2", description: "A quiz that the instructor removes later.", passingScore: 50 });

    await assert.rejects(deleteRoomQuiz(authorB, { quizId: removableQuiz.id }), (error: unknown) => error instanceof ContentAccessError);
    await assert.rejects(deleteRoomQuiz(authorA, { quizId: "not-a-uuid" }), (error: unknown) => error instanceof ZodError);
    const removal = await deleteRoomQuiz(adminActor, { quizId: removableQuiz.id });
    assert.equal(removal.roomId, quizRoom.id);
    assert.equal(removal.room.slug, quizRoom.slug, "the result names the room for revalidation");
    assert.equal(removal.recalculatedProgress, 3);
    await assert.rejects(deleteRoomQuiz(adminActor, { quizId: removableQuiz.id }), /Quiz not found/);

    assert.equal(await prisma.quiz.findUnique({ where: { id: removableQuiz.id } }), null);
    assert.equal(await prisma.quizQuestion.count({ where: { quizId: removableQuiz.id } }), 0, "questions go with the quiz");
    const keptAttempts = await prisma.userQuizAttempt.findMany({ where: { roomId: quizRoom.id } });
    assert.equal(keptAttempts.length, 4, "every attempt survives the removal");
    assert.ok(keptAttempts.every((entry) => entry.quizId === null && entry.quizTitle === "Removal Quiz v2"));

    // Tanpa quiz, semua task benar berarti room selesai; yang hanya lulus quiz kini 0%. Tanggal selesai lama tetap.
    const taskOnlyAfter = await progressOf(taskOnly.id);
    assert.equal(taskOnlyAfter.status, "COMPLETED", "a member with every task solved completes the room once the quiz is gone");
    assert.equal(taskOnlyAfter.progressPercentage, 100);
    assert.ok(taskOnlyAfter.completedAt);
    const quizOnlyAfter = await progressOf(quizOnly.id);
    assert.equal(quizOnlyAfter.status, "IN_PROGRESS");
    assert.equal(quizOnlyAfter.progressPercentage, 0);
    const finisherAfter = await progressOf(finisher.id);
    assert.equal(finisherAfter.status, "COMPLETED");
    assert.equal(finisherAfter.completedAt?.getTime(), finisherBefore.completedAt?.getTime());
    assert.equal(await quizPointsOf(quizOnly.id), quizOnlyPointsBefore, "points already awarded stay");
    const snapshotAfter = await getRoomCompletionSnapshot(taskOnly.id, quizRoom.id);
    assert.equal(snapshotAfter.hasQuiz, false);
    assert.equal((await getRoomBySlug(quizRoom.slug))?.quiz, null);

    // Riwayat: kueri halaman Dashboard/Progress/Profile tetap terbaca lewat room attempt, dan quiz lulus dihitung per room.
    const passedRooms = (userId: string) =>
      prisma.userQuizAttempt.groupBy({ by: ["roomId"], where: { userId, passed: true, roomId: { not: null } } });
    assert.equal((await passedRooms(finisher.id)).length, 1, "passing the same quiz twice counts once");
    assert.equal((await passedRooms(quizOnly.id)).length, 1, "a removed quiz still counts as passed");
    assert.equal((await passedRooms(taskOnly.id)).length, 0);
    const historyRows = await prisma.userQuizAttempt.findMany({
      where: { userId: finisher.id },
      select: { quizTitle: true, quiz: { select: { title: true } }, room: { select: { title: true, slug: true } } }
    });
    assert.ok(historyRows.every((entry) => entry.quiz === null && entry.room?.slug === quizRoom.slug && entry.quizTitle === "Removal Quiz v2"));
    const finisherActivity = await getLearningActivity(finisher.id);
    assert.equal(finisherActivity.calendar.total, 3, "the activity calendar still counts attempts of a removed quiz");

    // Quiz boleh ditambahkan lagi; attempt lama tidak dihitung untuk quiz baru. Membuat quiz menghitung ulang progress
    // semua peserta yang sudah mulai, jadi yang sudah COMPLETED kembali IN_PROGRESS sampai lulus quiz baru.
    const fresh = await upsertRoomQuiz(authorA, { roomId: quizRoom.id, title: "Fresh Quiz", description: "A new quiz after the removal.", passingScore: 50 });
    assert.equal(fresh.created, true);
    assert.equal(fresh.recalculatedProgress, 3, "creating a quiz recalculates every member who started the room");
    const snapshotWithNewQuiz = await getRoomCompletionSnapshot(quizOnly.id, quizRoom.id);
    assert.equal(snapshotWithNewQuiz.hasQuiz, true);
    assert.equal(snapshotWithNewQuiz.quizPassed, false);
    for (const member of [taskOnly, finisher]) {
      const reopenedProgress = await progressOf(member.id);
      assert.equal(reopenedProgress.status, "IN_PROGRESS", "a new quiz reopens a completed room until it is passed");
      assert.equal(reopenedProgress.progressPercentage, 50);
      assert.equal(reopenedProgress.completedAt, null);
    }
    assert.equal((await progressOf(quizOnly.id)).progressPercentage, 0);
    const freshSaved = await upsertRoomQuiz(authorA, { roomId: quizRoom.id, title: "Fresh Quiz", description: "A new quiz after the removal.", passingScore: 60 });
    assert.equal(freshSaved.quiz.id, fresh.quiz.id);
    assert.equal(freshSaved.created, false);
    assert.equal(freshSaved.recalculatedProgress, 0, "saving an existing quiz's settings recalculates nothing");

    // Poin quiz dibayar sekali per peserta per room: lulus quiz pengganti tidak membayar lagi.
    const { question: freshQuestion } = await addQuizQuestion(authorA, {
      quizId: fresh.quiz.id,
      question: "Which principle limits access to what is needed?",
      explanation: "Least privilege grants only the access a task needs.",
      options: [
        { label: "Least privilege", isCorrect: true },
        { label: "Shared admin", isCorrect: false }
      ]
    });
    const freshOptions = await prisma.quizOption.findMany({ where: { questionId: freshQuestion.id } });
    const freshPass = { [freshQuestion.id]: freshOptions.find((option) => option.isCorrect)!.id };
    await submitQuizAttempt(quizOnly.id, { quizId: fresh.quiz.id, answers: freshPass });
    assert.equal(await quizPointsOf(quizOnly.id), 30, "passing a replacement quiz does not pay the room's quiz points again");
    await submitQuizAttempt(taskOnly.id, { quizId: fresh.quiz.id, answers: freshPass });
    await submitQuizAttempt(taskOnly.id, { quizId: fresh.quiz.id, answers: freshPass });
    assert.equal(await quizPointsOf(taskOnly.id), 30, "a member who never passed a quiz in this room earns the points once");
    const finisherReturn = await submitQuizAttempt(finisher.id, { quizId: fresh.quiz.id, answers: freshPass });
    assert.equal(finisherReturn.roomCompleted, true, "passing the new quiz completes the room again");
    assert.equal(await quizPointsOf(finisher.id), 30);

    // Room yang hanya punya quiz: quiz tidak boleh dihapus, karena tanpa unit progress COMPLETED akan menjadi 0%
    // dan tidak ada peserta yang bisa menyelesaikan room itu lagi.
    const soleQuizRoom = await createRoomWithTasks(
      {
        learningPathId: secondPath.id,
        title: "Quiz Only Room",
        slug: `quiz-only-room-${testId}`,
        description: "Temporary room whose only unit is its quiz.",
        category: "Testing",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        points: 10,
        orderIndex: 4,
        isPublished: true,
        tasks: [{ title: "Temporary task", description: "Removed before the quiz is added.", expectedAnswer: "gone", points: 5 }]
      },
      authorA.id
    );
    await deleteRoomTask(authorA, { taskId: soleQuizRoom.tasks[0].id });
    const { quiz: soleQuiz } = await upsertRoomQuiz(authorA, {
      roomId: soleQuizRoom.id,
      title: "Sole Quiz",
      description: "The only unit of this room.",
      passingScore: 50
    });
    const { question: soleQuestion } = await addQuizQuestion(authorA, {
      quizId: soleQuiz.id,
      question: "Which principle limits access to what is needed?",
      explanation: "Least privilege grants only the access a task needs.",
      options: [
        { label: "Least privilege", isCorrect: true },
        { label: "Shared admin", isCorrect: false }
      ]
    });
    const soleOptions = await prisma.quizOption.findMany({ where: { questionId: soleQuestion.id } });
    const soleResult = await submitQuizAttempt(quizOnly.id, {
      quizId: soleQuiz.id,
      answers: { [soleQuestion.id]: soleOptions.find((option) => option.isCorrect)!.id }
    });
    assert.equal(soleResult.roomCompleted, true);
    const soleProgress = () =>
      prisma.userRoomProgress.findUniqueOrThrow({ where: { userId_roomId: { userId: quizOnly.id, roomId: soleQuizRoom.id } } });
    const soleBefore = await soleProgress();
    await assert.rejects(
      deleteRoomQuiz(authorA, { quizId: soleQuiz.id }),
      /Add at least one task before removing the quiz\. Without tasks or a quiz, members can't complete this room\./
    );
    assert.ok(await prisma.quiz.findUnique({ where: { id: soleQuiz.id } }), "the quiz of a room without tasks stays");
    const soleAfter = await soleProgress();
    assert.equal(soleAfter.status, "COMPLETED");
    assert.equal(soleAfter.progressPercentage, 100);
    assert.ok(soleBefore.completedAt);
    assert.equal(soleAfter.completedAt?.getTime(), soleBefore.completedAt.getTime(), "the completion date is kept");

    // Legacy Markdown fidelity and display parity
    const legacy = markdownToHtml(
      "Payload a <script>x</script> b\n\n##### Kecil\n\n| a | b |\n|:-:|--:|\n| 1 | 2 |\n\n- [x] selesai\n- [ ] belum\n\n" +
        "![s](/api/media/a5e06387-ed12-4c47-8359-e16c904fa4a6)\n\n![luar](http://example.test/a.png)\n\n```bash\nls -la\n```"
    );
    assert.ok(legacy.includes("&lt;script&gt;"), "raw HTML in Markdown must stay visible as text");
    assert.equal(legacy.includes("<script"), false);
    assert.ok(legacy.includes("<h4>Kecil</h4>"), "h5/h6 map to h4");
    assert.ok(legacy.includes('style="text-align:center"'), "GFM column alignment is kept");
    assert.ok(legacy.includes('<ul data-type="taskList">') && legacy.includes('data-checked="true"'), "GFM task lists map to TipTap markup");
    assert.equal(/<p>\s*<img/.test(legacy), false, "image-only paragraphs are unwrapped");
    assert.ok(legacy.includes('href="http://example.test/a.png"'), "unsupported images become links instead of disappearing");
    assert.ok(legacy.includes("ls -la</code>"), "code blocks lose the trailing newline");

    const stored = prepareRichHtmlForStorage('<p><span style="font-size: 14pt">pt</span> a    b</p><p>baris<br></p><p></p><p></p>');
    assert.ok(stored.includes("font-size:19px"), "pt font sizes convert to px");
    assert.ok(stored.includes("a    b"), "runs of spaces survive as non-breaking spaces");
    assert.equal(/<p><\/p>$/.test(stored), false, "trailing empty paragraphs are not stored");
    const displayed = renderRoomMaterialHtml(stored, "HTML");
    assert.ok(displayed.includes("<br /><br /></p>"), "a trailing hard break stays visible for students");
    assert.ok(
      renderRoomMaterialHtml('<table><tbody><tr><td><p>c</p></td></tr></tbody></table>', "HTML").includes('<div class="table-scroll"><table')
    );
    assert.ok(
      sanitizeRichHtml('<img src="/api/media/a5e06387-ed12-4c47-8359-e16c904fa4a6" alt="x" width="258" height="130">').includes('width="258" height="130"'),
      "resized image dimensions survive sanitization"
    );

    // Colour readability on light paper: guard at edit-load and render time (stored content untouched)
    const { HIGHLIGHT_COLOR_OPTIONS, TEXT_COLOR_OPTIONS, compositeOver, contrastRatio, parseCssColor, readableBackgroundColor, readableTextColor } =
      await import("@/lib/content/rich-text-config");
    type Rgba = [number, number, number, number];
    // Token values from app/globals.css, written out here so the check does not trust the module's own constants.
    const sheetRgba: Rgba = [252, 253, 253, 1];
    const paperRgba: Rgba = [243, 247, 248, 1];
    const wellRgba: Rgba = [236, 243, 245, 1];
    const defaultMarkRgba: Rgba = [250, 204, 21, 0.42]; // `.prose-cyber mark` without a colour
    const themeInks: Array<{ label: string; rgba: Rgba }> = [
      { label: "ink (headings, table headers)", rgba: [16, 22, 31, 1] },
      { label: "body ink", rgba: [29, 41, 51, 1] },
      { label: "quote ink (ink-2)", rgba: [58, 71, 80, 1] },
      { label: "link (cyan-ink)", rgba: [0, 108, 138, 1] }
    ];
    const parseOrFail = (value: string): Rgba => {
      const parsed = parseCssColor(value);
      assert.ok(parsed, `colour must parse: ${value}`);
      return parsed;
    };

    // Every surface coloured material text can sit on: the sheet, the paper, the well (quotes, table headers,
    // inline code), and every palette highlight plus the default <mark> yellow, laid on the sheet and on the well.
    const textSurfaces: Array<{ label: string; rgba: Rgba }> = [
      { label: "sheet", rgba: sheetRgba },
      { label: "paper", rgba: paperRgba },
      { label: "well", rgba: wellRgba },
      ...[...HIGHLIGHT_COLOR_OPTIONS.map((option) => ({ label: option.label, rgba: parseOrFail(option.value) })), { label: "default", rgba: defaultMarkRgba }].flatMap(
        (highlight) =>
          [
            { base: "sheet", rgba: sheetRgba },
            { base: "well", rgba: wellRgba }
          ].map((base) => ({ label: `${highlight.label} highlight on the ${base.base}`, rgba: compositeOver(highlight.rgba, base.rgba) }))
      )
    ];
    const worstContrast = (value: string | Rgba) => {
      const color = typeof value === "string" ? parseOrFail(value) : value;
      return Math.min(...textSurfaces.map((surface) => contrastRatio(compositeOver(color, surface.rgba), surface.rgba)));
    };

    // Palette verification (standalone Node script, 21 Oct 2026): 11 text colours x 21 surfaces all reach 4.5:1.
    // Worst pairs: Green, Orange and Teal on the Purple highlight inside a quote 4.52; Cyan/links 4.53; Red and Pink 4.55;
    // Gray and Gold 4.57; Blue 4.79; Brown 5.62; Purple 5.83. Theme inks on any highlight: quote ink 7.24, body ink 11.23.
    // The text colours were darkened slightly and the highlight alphas lowered (0.35 to 0.17-0.3, yellow 0.4) to get there.
    assert.equal(textSurfaces.length, 21);
    for (const option of TEXT_COLOR_OPTIONS) {
      for (const surface of textSurfaces) {
        const ratio = contrastRatio(compositeOver(parseOrFail(option.value), surface.rgba), surface.rgba);
        assert.ok(ratio >= 4.5, `text colour ${option.label} is readable on the ${surface.label} (${ratio.toFixed(2)}:1)`);
      }
      assert.equal(readableTextColor(option.value), option.value, `the guard keeps palette colour ${option.label} as chosen`);
    }
    for (const ink of themeInks) {
      assert.ok(worstContrast(ink.rgba) >= 4.5, `${ink.label} stays readable on every highlight`);
    }
    for (const option of HIGHLIGHT_COLOR_OPTIONS) {
      assert.equal(readableBackgroundColor(option.value), option.value, `the guard keeps the ${option.label} highlight as chosen`);
    }

    const legacyColors =
      '<p><span style="color: #f87171">a</span> <span style="color: rgb(74, 222, 128); font-size: 18px">b</span> <span style="color: #F8FAFC">c</span></p>';
    const legacyInEditor = roomMaterialToEditorHtml(legacyColors, "HTML");
    assert.ok(legacyInEditor.includes('<span style="color:#ba2d28">a</span>'), "legacy red maps to the new red");
    assert.ok(legacyInEditor.includes('<span style="color:#257144;font-size:18px">b</span>'), "legacy colours map in rgb() spelling too");
    assert.ok(legacyInEditor.includes("<span>c</span>"), "legacy white falls back to the default ink");
    assert.equal(renderRoomMaterialHtml(legacyColors, "HTML"), legacyInEditor, "students see the same colours as the editor");
    assert.ok(sanitizeRichHtml(legacyColors).includes("color:#f87171"), "the storage sanitizer does not rewrite colours");

    // The first light-paper palette lands exactly on the current palette, so the toolbar still recognises it.
    const earlierLightPalette = ["#5c6a72", "#c4302a", "#ae500b", "#8a6400", "#267345", "#0e7878", "#006c8a", "#2f5fa8", "#5a3db0", "#b0306e", "#7a4a22"];
    earlierLightPalette.forEach((value, index) => {
      assert.equal(readableTextColor(value), TEXT_COLOR_OPTIONS[index].value, `earlier palette colour ${value} maps onto ${TEXT_COLOR_OPTIONS[index].label}`);
    });

    const lightInEditor = roomMaterialToEditorHtml('<p><span style="color: #a5f3fc">light</span></p>', "HTML");
    const darkened = /color:(#[0-9a-f]{6})/.exec(lightInEditor)?.[1] ?? "";
    assert.ok(darkened && darkened !== "#a5f3fc", "an arbitrary light text colour is darkened");
    assert.ok(worstContrast(darkened) >= 4.5, "the darkened colour reaches 4.5:1 on the sheet, the well, and every highlight");
    const [lightR, lightG, lightB] = parseOrFail("#a5f3fc");
    const [darkR, darkG, darkB] = parseOrFail(darkened);
    assert.ok(lightB > lightG && lightG > lightR && darkB >= darkG && darkG > darkR, "darkening keeps the hue");
    assert.equal(roomMaterialToEditorHtml(lightInEditor, "HTML"), lightInEditor, "the guard is idempotent");

    // Pasted light colours (VS Code, web snippets) and a colour that reached 4.5:1 only on the sheet before.
    for (const pasted of ["#ffff00", "#9cdcfe", "#ff9900", "#d4d4d4", "#787800"]) {
      const guarded = readableTextColor(pasted);
      assert.ok(guarded && guarded !== pasted, `light colour ${pasted} is darkened`);
      assert.ok(worstContrast(guarded) >= 4.5, `darkened ${pasted} (${guarded}) is readable on the well and on every highlight`);
    }

    const readableColors = '<p><span style="color: rgb(29, 78, 216)">blue</span> <span style="color:#57656c">gray</span></p>';
    assert.equal(roomMaterialToEditorHtml(readableColors, "HTML"), sanitizeRichHtml(readableColors), "readable colours stay exactly as written");

    const guardedBackgrounds = roomMaterialToEditorHtml(
      '<p><span style="color: #c4302a; background-color: #1e293b">chip</span> ' +
        '<mark data-color="#111827" style="background-color: #111827; color: inherit">dark</mark> ' +
        '<mark data-color="rgba(250, 204, 21, 0.35)" style="background-color: rgba(250, 204, 21, 0.35); color: inherit">old</mark> ' +
        '<mark data-color="rgba(96, 165, 250, 0.3)" style="background-color: rgba(96, 165, 250, 0.3); color: inherit">old blue</mark> ' +
        '<mark data-color="rgba(248, 113, 113, 0.35)" style="background-color: rgba(248, 113, 113, 0.35); color: inherit">earlier red</mark> ' +
        '<mark data-color="#ffa500" style="background-color: #ffa500; color: inherit">mid</mark> ' +
        '<mark data-color="#ffff00" style="background-color: #ffff00; color: inherit">bright</mark></p>' +
        '<pre><code>&lt;span style="color:#fff"&gt;</code></pre>',
      "HTML"
    );
    assert.ok(guardedBackgrounds.includes('<span style="color:#ba2d28">chip</span>'), "a dark span background is dropped");
    assert.ok(guardedBackgrounds.includes('<mark style="color:inherit">dark</mark>'), "a dark highlight falls back to the default highlight");
    assert.ok(guardedBackgrounds.includes('data-color="rgba(250, 204, 21, 0.4)"'), "legacy highlights map to the new palette");
    assert.ok(guardedBackgrounds.includes('data-color="rgba(96, 165, 250, 0.2)"'), "legacy highlights that are too dark now map to the lighter palette");
    assert.ok(guardedBackgrounds.includes('data-color="rgba(248, 113, 113, 0.17)"'), "earlier light-paper highlights map to the lighter palette");
    assert.ok(
      guardedBackgrounds.includes('<mark style="color:inherit">mid</mark>'),
      "a highlight darker than the palette falls back to the default, so coloured text on it stays readable"
    );
    assert.ok(guardedBackgrounds.includes('data-color="#ffff00"'), "light highlights stay as chosen");
    assert.ok(guardedBackgrounds.includes('&lt;span style="color:#fff"&gt;'), "code samples that mention styles are untouched");

    // -----------------------------------------------------------------------
    // Login lokal tidak menimpa nama lengkap profil yang sudah ada
    // -----------------------------------------------------------------------
    const previousAuthMode = process.env.AUTH_MODE;
    process.env.AUTH_MODE = "local";
    const { loginUser, registerUser } = await import("@/lib/services/auth-service");
    const localUsername = `localname${testId.replace(/-/g, "").slice(0, 8)}`;
    const freshUsername = `localfresh${testId.replace(/-/g, "").slice(0, 8)}`;
    try {
      const registered = await registerUser({
        username: localUsername,
        fullName: "Rozan Sanura Albary",
        password: "password123"
      } as Parameters<typeof registerUser>[0]);
      localProfileIds.push(registered.id);

      await loginUser({ username: localUsername, password: "password123" } as Parameters<typeof loginUser>[0]);
      const afterLogin = await prisma.profile.findUniqueOrThrow({ where: { id: registered.id } });
      assert.equal(afterLogin.fullName, "Rozan Sanura Albary", "signing in keeps the full name set at registration");

      const fresh = await loginUser({ username: freshUsername, password: "password123" } as Parameters<typeof loginUser>[0]);
      localProfileIds.push(fresh.id);
      const freshProfile = await prisma.profile.findUniqueOrThrow({ where: { id: fresh.id } });
      assert.equal(freshProfile.fullName, freshUsername, "a profile created by signing in starts with the username as its name");
    } finally {
      if (previousAuthMode === undefined) delete process.env.AUTH_MODE;
      else process.env.AUTH_MODE = previousAuthMode;
    }

    console.log("service-smoke.test.ts passed");
  } finally {
    if (learningPathId) {
      await prisma.learningPath.deleteMany({
        where: {
          id: learningPathId
        }
      });
    }

    if (contentPathId) {
      await prisma.learningPath.deleteMany({ where: { id: contentPathId } });
    }

    // Path tambahan (uji pemindahan room) ikut dihapus beserta room di dalamnya agar tidak menumpuk di database dev.
    if (extraPathIds.length > 0) {
      await prisma.learningPath.deleteMany({ where: { id: { in: extraPathIds } } });
    }

    await prisma.profile.deleteMany({
      where: {
        id: { in: [userId, ...contentProfileIds, ...localProfileIds] }
      }
    });

    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  const { prisma } = await import("@/lib/db/prisma");
  await prisma.$disconnect();
  console.error(error);
  process.exit(1);
});
