import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Module from "node:module";
import { AnswerType, Role } from "@prisma/client";

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

    console.log("service-smoke.test.ts passed");
  } finally {
    if (learningPathId) {
      await prisma.learningPath.deleteMany({
        where: {
          id: learningPathId
        }
      });
    }

    await prisma.profile.deleteMany({
      where: {
        id: userId
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
