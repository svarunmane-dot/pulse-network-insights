import { createFileRoute, Link } from "@tanstack/react-router";
import { toolHead } from "@/lib/seo";
import { TRACKS, type TrackSlug } from "@/lib/practice";

export const Route = createFileRoute("/practice/")({
  head: () =>
    toolHead({
      path: "/practice",
      title: "CCNA, CCNP & Network Interview Practice Tests | Pulse Speed",
      description:
        "Free CCNA and CCNP practice questions plus network engineer interview prep. 25 randomized questions per session with instant feedback and explanations.",
      name: "Certification & Interview Practice",
      category: "EducationalApplication",
    }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-practice-accent">Certification & Interview Practice</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Sharpen your networking skills</h1>
        <p className="mt-3 max-w-2xl text-practice-dim">
          Pick a track. Every session pulls 25 freshly shuffled questions, locks your answer on submit and explains
          anything you miss.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(TRACKS) as TrackSlug[]).map((slug) => {
          const t = TRACKS[slug];
          return (
            <Link
              key={slug}
              to="/practice/$track"
              params={{ track: slug }}
              className="group flex flex-col rounded-2xl border border-practice-line bg-practice-surface p-5 transition hover:-translate-y-0.5 hover:border-practice-accent"
            >
              <span className="text-3xl">{t.icon}</span>
              <h2 className="mt-3 text-lg font-semibold">{t.title}</h2>
              <p className="mt-2 flex-1 text-sm text-practice-dim">{t.blurb}</p>
              <span className="mt-4 text-sm font-semibold text-practice-accent">Start 25 questions →</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
