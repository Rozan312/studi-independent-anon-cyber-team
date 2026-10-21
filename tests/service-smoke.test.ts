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
    await assert.rejects(submitTaskAnswer(scheduler.id, { taskId: remainingTask.id, answer: "read" }), /opens on/);

    await updateRoomMetadata(authorA, { ...baseMetadata, availableFrom: "", availableUntil: oneDayAgo });
    await assert.rejects(submitTaskAnswer(scheduler.id, { taskId: remainingTask.id, answer: "read" }), /closed on/);
    await assert.rejects(
      submitQuizAttempt(scheduler.id, { quizId: publicQuiz.id, answers: learnerAnswers }),
      /closed on/
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

    const savedHtml = await updateRoomContent(authorA, {
      roomId: contentRoom.id,
      contentFormat: "HTML",
      content: '<p><strong>Halo</strong> <span style="color: #4ade80">dunia</span></p><script>alert(1)</script><img src=x onerror=alert(1)>'
    });
    assert.equal(savedHtml.contentFormat, "HTML");
    assert.equal(savedHtml.content.includes("<script"), false);
    assert.equal(savedHtml.content.includes("onerror"), false);
    assert.ok(savedHtml.content.includes("<strong>Halo</strong>"));
    assert.ok(savedHtml.content.includes("#4ade80"), "stored material keeps instructor colours as written");
    assert.ok(
      renderRoomMaterialHtml(savedHtml.content, savedHtml.contentFormat).includes("color:#257144"),
      "a legacy dark-theme colour renders as its readable counterpart"
    );

    const emptied = await updateRoomContent(authorA, { roomId: contentRoom.id, contentFormat: "HTML", content: "<p></p>" });
    assert.equal(emptied.content, "", "an empty editor must be stored as empty content");

    await assert.rejects(
      updateRoomContent(authorB, { roomId: contentRoom.id, contentFormat: "HTML", content: "<p>x</p>" }),
      (error: unknown) => error instanceof ContentAccessError
    );

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
