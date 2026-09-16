"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionMessage, type ActionMessageState } from "@/components/ui/action-message";
import { ProgressBar, StatusPill } from "@/components/card";

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

export default function QuizView({ quiz, slug }: { quiz: Quiz; slug: string }) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<ActionMessageState>(emptyNotice);
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const answeredPercent = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

  const currentProgress = useMemo(() => {
    return totalQuestions === 0 ? 0 : Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  }, [currentQuestionIndex, totalQuestions]);

  function selectOption(questionId: string, optionId: string) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId
    }));
    setNotice(emptyNotice);
  }

  function moveToNextIncomplete() {
    const nextIncompleteIndex = quiz.questions.findIndex((question) => !answers[question.id]);
    if (nextIncompleteIndex >= 0) setCurrentQuestionIndex(nextIncompleteIndex);
  }

  async function handleSubmit() {
    if (answeredCount < totalQuestions) {
      setNotice({
        tone: "error",
        message: "Selesaikan semua pertanyaan sebelum submit assessment."
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

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Assessment gagal dikirim.");
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
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Assessment gagal dikirim."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (attemptResult) {
    return (
      <div className="mx-auto max-w-2xl">
        <section className="glass-panel rounded-xl p-6 text-center md:p-8">
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${
              attemptResult.passed
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/30 bg-rose-500/10 text-rose-200"
            }`}
          >
            <span className="text-2xl font-black">{attemptResult.passed ? "OK" : "!"}</span>
          </div>
          <StatusPill tone={attemptResult.passed ? "success" : "danger"}>
            {attemptResult.passed ? "Passed" : "Needs Review"}
          </StatusPill>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">
            {attemptResult.passed ? "Assessment selesai" : "Assessment belum lulus"}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
            {attemptResult.passed
              ? `Skor memenuhi passing score. Poin room ${quiz.room.points} dicatat sekali di leaderboard.`
              : `Skor belum mencapai passing score ${quiz.passingScore}%. Pelajari penjelasan di bawah lalu coba ulang.`}
          </p>
          <div className="mx-auto mt-6 max-w-xs rounded-lg border border-white/[0.06] bg-black/25 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Skor Akhir</p>
            <p className={`mt-1 text-4xl font-black ${attemptResult.passed ? "text-emerald-300" : "text-rose-300"}`}>
              {attemptResult.score}%
            </p>
            <ProgressBar value={attemptResult.score} />
            <p className="mt-3 text-xs text-slate-400">
              {attemptResult.correctCount} dari {attemptResult.totalQuestions} pertanyaan benar
            </p>
          </div>
          {attemptResult.progressPercentage !== null ? (
            <p className="mt-4 text-xs text-slate-400">
              {attemptResult.roomCompleted
                ? "Room ini sudah selesai sepenuhnya. Kerja bagus."
                : `Progress room sekarang ${attemptResult.progressPercentage}%. Room selesai setelah semua task benar dan quiz lulus.`}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                setAttemptResult(null);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setNotice(emptyNotice);
              }}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.05]"
            >
              Retake Assessment
            </button>
            <button
              type="button"
              onClick={() => router.push(`/rooms/${slug}`)}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-blue-300"
            >
              Back to Room
            </button>
          </div>
        </section>

        {attemptResult.review.length > 0 ? (
          <section className="glass-panel mt-6 rounded-xl p-5 md:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary text-glow">Review</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-100">Pembahasan per pertanyaan</h3>
            <p className="mt-1 text-xs text-slate-400">Bandingkan jawaban Anda dengan jawaban benar dan baca penjelasannya sebelum mencoba lagi.</p>

            <ol className="mt-5 space-y-4">
              {attemptResult.review.map((item) => (
                <li
                  key={item.questionId}
                  className={`rounded-xl border p-4 ${
                    item.isCorrect ? "border-emerald-500/25 bg-emerald-500/[0.06]" : "border-rose-500/25 bg-rose-500/[0.06]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-sm font-semibold leading-snug text-slate-100">
                      <span className="mr-2 text-slate-500">{item.orderIndex}.</span>
                      {item.question}
                    </p>
                    <StatusPill tone={item.isCorrect ? "success" : "danger"}>{item.isCorrect ? "Benar" : "Salah"}</StatusPill>
                  </div>

                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-lg border border-white/[0.06] bg-black/25 p-3">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Jawaban Anda</dt>
                      <dd className={`mt-1 font-medium ${item.isCorrect ? "text-emerald-200" : "text-rose-200"}`}>{item.selectedLabel ?? "Tidak dijawab"}</dd>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-black/25 p-3">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Jawaban benar</dt>
                      <dd className="mt-1 font-medium text-emerald-200">{item.correctLabel ?? "-"}</dd>
                    </div>
                  </dl>

                  {item.explanation ? (
                    <p className="mt-3 rounded-lg border-l-2 border-primary/50 bg-primary/[0.06] px-3 py-2 text-xs leading-relaxed text-slate-300">
                      <span className="font-bold text-primary">Penjelasan: </span>
                      {item.explanation}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="glass-panel rounded-xl p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Concept Check</p>
            <h2 className="mt-2 text-xl font-semibold leading-snug text-slate-100">{currentQuestion.question}</h2>
          </div>
          <div className="min-w-36">
            <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <span>Question</span>
              <span>
                {currentQuestionIndex + 1}/{totalQuestions}
              </span>
            </div>
            <ProgressBar value={currentProgress} />
          </div>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectOption(currentQuestion.id, option.id)}
                className={`focus-ring flex w-full items-start gap-3 rounded-lg border p-4 text-left text-sm transition ${
                  isSelected
                    ? "border-primary/60 bg-primary-container/15 text-slate-100"
                    : "border-white/[0.06] bg-black/20 text-slate-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    isSelected ? "border-primary bg-primary" : "border-slate-600"
                  }`}
                >
                  {isSelected ? <span className="h-1.5 w-1.5 rounded-full bg-slate-950" /> : null}
                </span>
                <span className="font-medium leading-relaxed">{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-4 border-t border-white/[0.06] pt-5">
          <ActionMessage state={notice} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((value) => Math.max(0, value - 1))}
              disabled={currentQuestionIndex === 0}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((value) => Math.min(totalQuestions - 1, value + 1))}
                disabled={!answers[currentQuestion.id]}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next Question
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount < totalQuestions}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Assessment"}
              </button>
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="glass-panel rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Navigator</p>
            <StatusPill tone="primary">
              {answeredCount}/{totalQuestions}
            </StatusPill>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((question, index) => {
              const isCurrent = index === currentQuestionIndex;
              const isAnswered = Boolean(answers[question.id]);

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`aspect-square rounded-md border text-xs font-bold transition ${
                    isCurrent
                      ? "border-primary bg-primary text-slate-950"
                      : isAnswered
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/[0.06] bg-black/20 text-slate-500 hover:bg-white/[0.04]"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </section>

        <section className="glass-panel rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Completion</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-2xl font-black text-slate-100">{answeredPercent}%</span>
            <span className="text-xs text-slate-500">answered</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={answeredPercent} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Submit hanya aktif ketika semua pertanyaan sudah dijawab.
          </p>
        </section>
      </aside>
    </div>
  );
}
