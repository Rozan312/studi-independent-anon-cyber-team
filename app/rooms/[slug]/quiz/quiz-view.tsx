"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionMessage, type ActionMessageState } from "@/components/ui/action-message";
import { EmptyState, Figure, ProgressBar, SectionHeader, StatusPill } from "@/components/card";
import { CompletionMark } from "@/components/paper/completion";

interface Option {
  id: string;
  label: string;
  questionId: string;
}

interface Question {
  id: string;
  question: string;
  orderIndex: number;
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  room: {
    title: string;
    points: number;
  };
  questions: Question[];
}

type ReviewItem = {
  questionId: string;
  orderIndex: number;
  question: string;
  explanation: string;
  selectedLabel: string | null;
  correctLabel: string | null;
  isCorrect: boolean;
};

type AttemptResult = {
  score: number;
  passed: boolean;
  review: ReviewItem[];
  correctCount: number;
  totalQuestions: number;
  progressPercentage: number | null;
  roomCompleted: boolean;
};

const emptyNotice: ActionMessageState = {
  tone: "idle",
  message: ""
};

const SUBMIT_FAILED_MESSAGE = "Couldn't submit the quiz. Check your connection and try again.";
const SESSION_ENDED_MESSAGE = "Your session ended. Sign in again in another tab, then submit here. Your answers are still on this page.";

export default function QuizView({ quiz, slug }: { quiz: Quiz; slug: string }) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<ActionMessageState>(emptyNotice);
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  // Fokus ke judul pertanyaan hanya setelah aksi pengguna (pindah pertanyaan, coba lagi), bukan saat halaman dimuat.
  const focusQuestionAfterRender = useRef(false);

  // Hasil menggantikan tombol Submit yang sedang difokus: pindahkan fokus ke judul hasil agar pembaca layar langsung membacanya.
  useEffect(() => {
    if (attemptResult) resultHeadingRef.current?.focus();
  }, [attemptResult]);

  // Pertanyaan berganti (Next/Previous/navigator/Try again): tombol yang difokus bisa hilang atau nonaktif,
  // jadi fokus dipindah ke judul pertanyaan baru, yang juga mengumumkan "Question N of M".
  useEffect(() => {
    if (attemptResult || !focusQuestionAfterRender.current) return;
    focusQuestionAfterRender.current = false;
    questionHeadingRef.current?.focus();
  }, [currentQuestionIndex, attemptResult]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const answeredPercent = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

  function selectOption(questionId: string, optionId: string) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId
    }));
    setNotice(emptyNotice);
  }

  function goToQuestion(index: number) {
    if (index === currentQuestionIndex) {
      questionHeadingRef.current?.focus();
      return;
    }
    focusQuestionAfterRender.current = true;
    setCurrentQuestionIndex(index);
  }

  function moveToNextIncomplete() {
    const nextIncompleteIndex = quiz.questions.findIndex((question) => !answers[question.id]);
    if (nextIncompleteIndex >= 0) goToQuestion(nextIncompleteIndex);
  }

  function retryQuiz() {
    focusQuestionAfterRender.current = true;
    setAttemptResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setNotice(emptyNotice);
  }

  async function handleSubmit() {
    if (answeredCount < totalQuestions) {
      setNotice({
        tone: "error",
        message: "Answer every question before you submit the quiz."
      });
      moveToNextIncomplete();
      return;
    }

    setIsSubmitting(true);
    setNotice(emptyNotice);

    try {
      const response = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          quizId: quiz.id,
          answers
        })
      });

      // Sesi habis: route memanggil redirect("/login") dan fetch mengikuti redirect itu, sehingga yang
      // kembali adalah HTML halaman login (status 200), bukan JSON. Jangan tampilkan error parse mentah.
      if (response.status === 401 || (response.redirected && new URL(response.url).pathname === "/login")) {
        setNotice({ tone: "error", message: SESSION_ENDED_MESSAGE });
        return;
      }

      const isJson = (response.headers.get("content-type") ?? "").includes("application/json");
      const payload = isJson ? await response.json() : null;

      if (!response.ok || !payload?.data) {
        // Pesan dari server (misalnya jadwal room) sudah ditulis untuk member; selain itu pakai pesan umum.
        const serverMessage = typeof payload?.error === "string" && payload.error.trim() ? payload.error : null;
        setNotice({ tone: "error", message: serverMessage ?? SUBMIT_FAILED_MESSAGE });
        return;
      }

      setAttemptResult({
        score: payload.data.score,
        passed: payload.data.passed,
        review: Array.isArray(payload.data.review) ? payload.data.review : [],
        correctCount: payload.data.correctCount ?? 0,
        totalQuestions: payload.data.totalQuestions ?? quiz.questions.length,
        progressPercentage: typeof payload.data.progressPercentage === "number" ? payload.data.progressPercentage : null,
        roomCompleted: Boolean(payload.data.roomCompleted)
      });
      router.refresh();
    } catch {
      // Gagal jaringan atau respons rusak: pesan mentah (misalnya "Failed to fetch") tidak membantu member.
      setNotice({ tone: "error", message: SUBMIT_FAILED_MESSAGE });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (attemptResult) {
    const passed = attemptResult.passed;
    const showProgress = attemptResult.progressPercentage !== null;

    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <section className="sheet" aria-labelledby="quiz-result-title">
          <div className="flex flex-col items-center gap-6 p-5 text-center sm:flex-row sm:items-center sm:p-7 sm:text-left">
            {/* Lulus: cukup angka skornya. Belum lulus: ikon retry, skornya disebut di teks. */}
            <CompletionMark kind={passed ? "quiz-pass" : "quiz-retry"} score={attemptResult.score} size="lg" className="sm:ml-1" />
            <div className="min-w-0 flex-1">
              <h2
                id="quiz-result-title"
                ref={resultHeadingRef}
                tabIndex={-1}
                className="text-2xl font-bold leading-tight tracking-[-0.015em] text-ink [text-wrap:balance] focus:outline-none"
              >
                {passed ? "You passed this quiz" : "Not passed yet"}
              </h2>
              <p className="mt-1.5 text-ink-2">
                {passed
                  ? `You scored ${attemptResult.score}%, and the passing score is ${quiz.passingScore}%.${
                      quiz.room.points > 0 ? ` The ${quiz.room.points}-point quiz bonus is added to your leaderboard total the first time you pass.` : ""
                    }`
                  : `You scored ${attemptResult.score}%, and you need ${quiz.passingScore}% to pass. Read the review below, then try again.`}
              </p>
              {showProgress ? (
                <p className="mt-2 text-sm text-ink-3">
                  {attemptResult.roomCompleted
                    ? "This room is now complete."
                    : `Room progress is now ${attemptResult.progressPercentage}%. The room is complete once every task is answered correctly and the quiz is passed.`}
                </p>
              ) : null}

              {/* Satu langkah berikutnya berwarna cyan: kembali ke room bila lulus, coba lagi bila belum. */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {passed ? (
                  <Link href={`/rooms/${slug}`} className="btn-primary min-h-11 px-5">
                    Back to room
                  </Link>
                ) : null}
                <button type="button" onClick={retryQuiz} className={`${passed ? "btn-secondary" : "btn-primary"} min-h-11 px-5`}>
                  Try again
                </button>
                {!passed ? (
                  <Link href={`/rooms/${slug}`} className="text-link text-sm">
                    Back to room
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className={`grid border-t border-line-soft ${showProgress ? "grid-cols-3" : "grid-cols-2"}`}>
            <Figure
              className="border-r border-line-soft p-4"
              label="Correct"
              value={attemptResult.correctCount}
              unit={`of ${attemptResult.totalQuestions}`}
            />
            <Figure className={`p-4 ${showProgress ? "border-r border-line-soft" : ""}`} label="Passing score" value={`${quiz.passingScore}%`} />
            {showProgress ? <Figure className="p-4" label="Room progress" value={`${attemptResult.progressPercentage}%`} /> : null}
          </div>
        </section>

        {attemptResult.review.length > 0 ? (
          <section className="sheet p-5 sm:p-6" aria-label="Question review">
            <SectionHeader
              title="Question review"
              description="Compare your answer with the correct one and read the explanation before you try again."
            />

            <ol className="divide-y divide-line-soft">
              {attemptResult.review.map((item, index) => (
                <li key={item.questionId} className="flex gap-3.5 py-5 first:pt-1 last:pb-0">
                  <span className="figure w-7 shrink-0 text-lg font-bold leading-snug text-ink-3" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                      <h3 className="min-w-0 flex-1 font-semibold leading-snug text-ink">
                        <span className="sr-only">Question {index + 1}: </span>
                        {item.question}
                      </h3>
                      <StatusPill tone={item.isCorrect ? "success" : "danger"}>{item.isCorrect ? "Correct" : "Wrong"}</StatusPill>
                    </div>

                    <dl className={`mt-3 grid gap-2 text-sm ${item.isCorrect ? "" : "sm:grid-cols-2"}`}>
                      <div
                        className={`rounded-lg border px-3 py-2.5 ${
                          item.isCorrect ? "border-green/30 bg-green-soft" : "border-red/30 bg-red-soft"
                        }`}
                      >
                        <dt className="field-label">Your answer</dt>
                        <dd className="mt-1 flex items-start gap-1.5 font-medium text-ink">
                          <svg
                            viewBox="0 0 16 16"
                            className={`mt-0.5 h-4 w-4 shrink-0 ${item.isCorrect ? "text-green" : "text-red"}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                          >
                            {item.isCorrect ? (
                              <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                            ) : (
                              <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" strokeLinecap="round" />
                            )}
                          </svg>
                          <span className="min-w-0">{item.selectedLabel ?? "Not answered"}</span>
                        </dd>
                      </div>
                      {!item.isCorrect ? (
                        <div className="rounded-lg border border-line bg-sheet px-3 py-2.5">
                          <dt className="field-label">Correct answer</dt>
                          <dd className="mt-1 font-medium text-green">{item.correctLabel ?? "–"}</dd>
                        </div>
                      ) : null}
                    </dl>

                    {item.explanation ? (
                      <p className="mt-3 text-sm leading-relaxed text-ink-2">
                        <span className="font-semibold text-ink">Explanation: </span>
                        {item.explanation}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    );
  }

  // Quiz tanpa pertanyaan: tampilkan keadaan kosong alih-alih error render.
  if (!currentQuestion) {
    return (
      <section className="sheet p-5 sm:p-6" aria-label="Quiz questions">
        <EmptyState
          title="This quiz has no questions yet"
          message="The instructor hasn't added questions to this quiz. Check back later or return to the room."
          action={
            <Link href={`/rooms/${slug}`} className="btn-secondary">
              Back to room
            </Link>
          }
        />
      </section>
    );
  }

  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const currentAnswered = Boolean(answers[currentQuestion.id]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="sheet p-5 sm:p-6" aria-labelledby="quiz-question-title">
        <div className="flex items-start gap-4">
          <p className="figure min-w-[3.25rem] shrink-0 pt-0.5 text-[1.75rem] font-bold leading-none text-ink" aria-hidden="true">
            {currentQuestionIndex + 1}
            <span className="ml-0.5 text-sm font-semibold text-ink-3">/{totalQuestions}</span>
          </p>
          <h2
            id="quiz-question-title"
            ref={questionHeadingRef}
            tabIndex={-1}
            className="min-w-0 flex-1 text-xl font-bold leading-snug tracking-[-0.01em] text-ink [text-wrap:pretty] focus:outline-none"
          >
            <span className="sr-only">
              Question {currentQuestionIndex + 1} of {totalQuestions}:{" "}
            </span>
            {currentQuestion.question}
          </h2>
        </div>

        <fieldset className="mt-5">
          <legend className="sr-only">Answer options</legend>
          <div className="space-y-2.5">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.id;

              return (
                <label
                  key={option.id}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-[0.9375rem] leading-relaxed transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cyan-ink ${
                    isSelected ? "border-cyan-ink/60 bg-cyan-soft/50 text-ink" : "border-line bg-sheet text-ink-2 hover:border-line-strong hover:bg-well hover:text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name={`quiz-question-${currentQuestion.id}`}
                    value={option.id}
                    checked={isSelected}
                    onChange={() => selectOption(currentQuestion.id, option.id)}
                    className="mt-[0.3rem] h-4 w-4 shrink-0 cursor-pointer accent-[rgb(var(--ink))] focus-visible:outline-none"
                  />
                  <span className="min-w-0">{option.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 space-y-4 border-t border-line-soft pt-5">
          <ActionMessage state={notice} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="btn-secondary"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M13 8H3M7 4 3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Previous
            </button>

            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
              <p className="text-sm text-ink-3" aria-live="polite">
                Answered{" "}
                <span className="figure font-semibold text-ink-2">
                  {answeredCount} of {totalQuestions}
                </span>
              </p>
              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={() => goToQuestion(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                  disabled={!currentAnswered}
                  className="btn-primary"
                >
                  Next question
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || answeredCount < totalQuestions}
                  aria-busy={isSubmitting || undefined}
                  className="btn-primary"
                >
                  {isSubmitting ? "Scoring…" : "Submit quiz"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <aside className="sheet self-start p-5" aria-labelledby="quiz-navigator-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="quiz-navigator-title" className="font-semibold text-ink">
            Questions
          </h2>
          <p className="figure text-sm text-ink-3">{answeredPercent}% answered</p>
        </div>
        <ProgressBar value={answeredPercent} tone="ink" label="Questions answered" className="mt-3" />

        <ol className="mt-4 grid grid-cols-5 gap-2">
          {quiz.questions.map((question, index) => {
            const isCurrent = index === currentQuestionIndex;
            const isAnswered = Boolean(answers[question.id]);

            return (
              <li key={question.id}>
                <button
                  type="button"
                  onClick={() => goToQuestion(index)}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Question ${index + 1}, ${isAnswered ? "answered" : "not answered"}`}
                  className={`figure flex h-10 w-full items-center justify-center rounded-md text-sm font-semibold transition-colors ${
                    isCurrent
                      ? "border-[1.5px] border-cyan-ink/70 bg-sheet text-ink"
                      : isAnswered
                        ? "border border-line-strong bg-well text-ink hover:border-ink-3"
                        : "border border-dashed border-line-strong bg-sheet text-ink-3 hover:bg-well hover:text-ink"
                  }`}
                >
                  {index + 1}
                </button>
              </li>
            );
          })}
        </ol>

        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          Solid squares are answered, dashed ones are still open. Submit unlocks once every question has an answer.
        </p>
      </aside>
    </div>
  );
}
