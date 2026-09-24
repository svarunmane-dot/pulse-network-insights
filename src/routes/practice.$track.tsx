import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/seo";
import { isTrack, shuffle, TRACKS, usePractice, type Answer, type Question, type TrackSlug } from "@/lib/practice";

export const Route = createFileRoute("/practice/$track")({
  ssr: false,
  beforeLoad: ({ params }) => {
    if (!isTrack(params.track)) throw notFound();
  },
  head: ({ params }) => {
    const t = isTrack(params.track) ? TRACKS[params.track] : null;
    const title = t ? `${t.title} Quiz – 10 Random Questions | Pulse Speed` : "Practice Quiz | Pulse Speed";
    const description = t ? `${t.blurb} Instant feedback and explanations.` : "Network practice quiz.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/practice/${params.track}` }],
    };
  },
  notFoundComponent: () => (
    <p>
      Unknown track. <Link to="/practice" className="text-practice-accent underline">Back to tracks</Link>
    </p>
  ),
  component: Quiz,
});

function Quiz() {
  const { track } = Route.useParams() as { track: TrackSlug };
  const meta = TRACKS[track];
  const { setResult } = usePractice();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const load = useCallback(async () => {
    setQuestions(null);
    setError(null);
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
    const { data, error } = await supabase.rpc("get_random_practice_questions", {
      _category: meta.category,
      _limit: 10,
    });
    if (error) return setError("Couldn't load questions. Please try again.");
    const qs = (data ?? []).map((r) => ({
      id: r.id,
      question_text: r.question_text,
      correct_option: r.correct_option,
      explanation: r.explanation,
      options: shuffle(Array.isArray(r.options) ? (r.options as string[]) : []),
    }));
    // Extra client-side Fisher–Yates on top of the random DB order.
    setQuestions(shuffle(qs));
  }, [meta.category]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error)
    return (
      <div className="rounded-2xl border border-practice-bad/50 bg-practice-surface p-6">
        <p>{error}</p>
        <button onClick={load} className="mt-4 rounded-lg bg-practice-accent px-4 py-2 font-semibold text-practice-surface">
          Retry
        </button>
      </div>
    );
  if (!questions) return <p className="text-practice-dim">Loading fresh questions…</p>;
  if (questions.length === 0) return <p>No questions available for this track yet.</p>;

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const isCorrect = submitted && selected === q.correct_option;

  const submit = () => {
    if (!selected || submitted) return;
    setSubmitted(true);
    setAnswers((a) => [...a, { question: q, selected, correct: selected === q.correct_option }]);
  };

  const next = () => {
    if (!submitted) return;
    if (isLast) {
      setResult({ track, answers });
      navigate({ to: "/practice/results" });
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        <Link to="/practice" className="text-practice-dim hover:text-practice-accent">← Tracks</Link>
        <span className="font-semibold text-practice-accent">{meta.title}</span>
        <span className="text-practice-dim">
          {index + 1} / {questions.length}
        </span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-practice-line">
        <div
          className="h-full bg-practice-accent transition-all"
          style={{ width: `${((index + (submitted ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl border border-practice-line bg-practice-surface p-5 sm:p-6">
        <h1 className="text-lg font-semibold leading-snug sm:text-xl">{q.question_text}</h1>
        <div className="mt-5 grid gap-3" role="radiogroup">
          {q.options.map((opt) => {
            const chosen = selected === opt;
            let cls = "border-practice-line hover:border-practice-accent";
            if (!submitted && chosen) cls = "border-practice-accent bg-practice-accent/10";
            if (submitted) {
              if (opt === q.correct_option) cls = "border-practice-ok bg-practice-ok/15";
              else if (chosen) cls = "border-practice-bad bg-practice-bad/15";
              else cls = "border-practice-line opacity-60";
            }
            return (
              <button
                key={opt}
                role="radio"
                aria-checked={chosen}
                disabled={submitted}
                onClick={() => setSelected(opt)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default sm:text-base ${cls}`}
                style={
                  submitted && opt === q.correct_option
                    ? { borderColor: "var(--practice-ok)", background: "color-mix(in oklab, var(--practice-ok) 18%, transparent)" }
                    : submitted && chosen
                      ? { borderColor: "var(--practice-bad)", background: "color-mix(in oklab, var(--practice-bad) 18%, transparent)" }
                      : undefined
                }
              >
                {opt}
                {submitted && opt === q.correct_option && <span className="ml-2 text-practice-ok">✓</span>}
                {submitted && chosen && opt !== q.correct_option && <span className="ml-2 text-practice-bad">✗</span>}
              </button>
            );
          })}
        </div>

        {submitted && (
          <p className={`mt-4 font-semibold ${isCorrect ? "text-practice-ok" : "text-practice-bad"}`}>
            {isCorrect ? "Correct!" : "Not quite."}
          </p>
        )}
        {submitted && !isCorrect && (
          <div className="mt-3 rounded-xl border-l-4 border-practice-accent bg-practice-line/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-practice-accent">Explanation</p>
            <p className="mt-1 text-sm leading-relaxed">{q.explanation}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            onClick={submit}
            disabled={!selected || submitted}
            className="rounded-lg border border-practice-accent px-4 py-2 font-semibold text-practice-accent disabled:opacity-40"
          >
            Submit Answer
          </button>
          <button
            onClick={next}
            disabled={!submitted}
            className="rounded-lg bg-practice-accent px-4 py-2 font-semibold text-practice-surface disabled:opacity-40"
          >
            {isLast ? "See Results" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
