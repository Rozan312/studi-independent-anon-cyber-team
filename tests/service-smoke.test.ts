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

  const testId = randomUUID();
  const userId = randomUUID();
  const slug = `test-room-${testId}`;
  const pathSlug = `test-path-${testId}`;

  let learningPathId: string | null = null;
  let contentPathId: string | null = null;
  const extraPathIds: string[] = [];
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

    await submitQuizAttempt(profile.id, {
      quizId: quiz.id,
      answers
    });

    const leaderboard = await getGlobalLeaderboard(100);
    const row = leaderboard.find((entry) => entry.user?.id === profile.id);
    assert.ok(row);
    assert.equal(row.points, 55);

    // -----------------------------------------------------------------------
    // Content authoring service: ownership, tasks, quiz, option ordering
    // -----------------------------------------------------------------------
    const {
      ContentAccessError,
      addQuizQuestion,
      addRoomTask,
      addRoomToLearningPath,
      createLearningPath,
      getLearningPathForEditor,
      getRoomForEditor,
      listRoomsOutsidePath,
      moveRoomInPath,
      moveRoomTask,
      setRoomPublished,
      updateQuizQuestion,
      updateRoomContent,
      updateRoomMetadata,
      updateRoomTask,
      upsertRoomQuiz
    } = await import("@/lib/services/content-service");
    const { createRoomWithTasks } = await import("@/lib/services/instructor-service");
    const { getQuizByRoomSlug } = await import("@/lib/services/quiz-service");

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

    await updateRoomContent(authorA, { roomId: contentRoom.id, content: "# Walkthrough\n\nMateri uji." });
    await assert.rejects(
      updateRoomContent(authorB, { roomId: contentRoom.id, content: "hijack" }),
      (error: unknown) => error instanceof ContentAccessError
    );
    const editorAsB = await getRoomForEditor(authorB, contentRoom.id);
    assert.equal(editorAsB?.canManage, false);
    await updateRoomContent(adminActor, { roomId: contentRoom.id, content: "# Walkthrough\n\nDiubah admin." });

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
      orderIndex: contentRoom.orderIndex,
      coverImageUrl: ""
    };
    const inOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const upcomingRoom = await updateRoomMetadata(authorA, { ...baseMetadata, availableFrom: inOneDay, availableUntil: "" });
    assert.equal(upcomingRoom.content, "# Walkthrough\n\nDiubah admin.", "metadata update must not wipe material content");
    await assert.rejects(submitTaskAnswer(scheduler.id, { taskId: remainingTask.id, answer: "read" }), /belum dibuka/);

    await updateRoomMetadata(authorA, { ...baseMetadata, availableFrom: "", availableUntil: oneDayAgo });
    await assert.rejects(submitTaskAnswer(scheduler.id, { taskId: remainingTask.id, answer: "read" }), /sudah ditutup/);
    await assert.rejects(
      submitQuizAttempt(scheduler.id, { quizId: publicQuiz.id, answers: learnerAnswers }),
      /sudah ditutup/
    );

    await assert.rejects(
      updateRoomMetadata(authorA, { ...baseMetadata, availableFrom: inOneDay, availableUntil: oneDayAgo }),
      (error: unknown) => error instanceof ZodError
    );

    await updateRoomMetadata(authorA, { ...baseMetadata, availableFrom: "", availableUntil: "" });
    const reopened = await submitTaskAnswer(scheduler.id, { taskId: remainingTask.id, answer: "read" });
    assert.equal(reopened.isCorrect, true);

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
    await assert.rejects(addRoomToLearningPath(authorA, { pathId: secondPath.id, roomId: contentRoom.id }), /sudah berada/);

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

    await prisma.profile.deleteMany({
      where: {
        id: { in: [userId, ...contentProfileIds] }
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
