import { createFileRoute, Link } from "@tanstack/react-router";
import { PASS_PERCENT, TRACKS, usePractice } from "@/lib/practice";

export const Route = createFileRoute("/practice/results")({
  head: () => ({
    meta: [
      { title: "Your Practice Results | Pulse Speed" },
      { name: "description", content: "Score, pass/fail status and a full review of your practice session." },
      { property: "og:title", content: "Your Practice Results | Pulse Speed" },
      { property: "og:description", content: "Score, pass/fail status and a full review of your practice session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Results,
});

function Results() {
  const { result } = usePractice();

  if (!result)
    return (
      <div className="rounded-2xl border border-practice-line bg-practice-surface p-6">
        <p>No finished session to show.</p>
        <Link to="/practice" className="mt-3 inline-block font-semibold text-practice-accent">Choose a track →</Link>
      </div>
    );

  const total = result.answers.length;
  const score = result.answers.filter((a) => a.correct).length;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const passed = pct >= PASS_PERCENT;
  const meta = TRACKS[result.track];

  return (
    <div>
      <div className="rounded-2xl border border-practice-line bg-practice-surface p-6 text-center">
        <p className="text-sm text-practice-dim">{meta.title}</p>
        <h1 className="mt-2 text-4xl font-bold">
          Score: {score}/{total}
        </h1>
        <p className="mt-1 text-2xl text-practice-dim">{pct}%</p>
        <span
          className={`mt-4 inline-block rounded-full px-4 py-1 text-sm font-bold ${
            passed ? "bg-practice-ok/20 text-practice-ok" : "bg-practice-bad/20 text-practice-bad"
          }`}
        >
          {passed ? "PASS" : "FAIL"} · pass mark {PASS_PERCENT}%
        </span>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/practice/$track"
            params={{ track: result.track }}
            className="rounded-lg bg-practice-accent px-4 py-2 font-semibold text-practice-surface"
          >
            Retry with new questions
          </Link>
          <Link to="/practice" className="rounded-lg border border-practice-line px-4 py-2 font-semibold">
            All tracks
          </Link>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-semibold">Review</h2>
      <ol className="grid gap-3">
        {result.answers.map((a, i) => (
          <li
            key={a.question.id}
            className={`rounded-xl border bg-practice-surface p-4 ${a.correct ? "border-practice-ok/40" : "border-practice-bad/40"}`}
          >
            <p className="font-medium">
              {i + 1}. {a.question.question_text}
            </p>
            <p className="mt-2 text-sm">
              Your answer:{" "}
              <span className={a.correct ? "text-practice-ok" : "text-practice-bad"}>
                {a.selected} {a.correct ? "✓" : "✗"}
              </span>
            </p>
            {!a.correct && (
              <p className="text-sm">
                Correct answer: <span className="text-practice-ok">{a.question.correct_option}</span>
              </p>
            )}
            <p className="mt-2 text-sm text-practice-dim">{a.question.explanation}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
