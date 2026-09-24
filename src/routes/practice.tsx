import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PracticeContext, type SessionResult } from "@/lib/practice";

export const Route = createFileRoute("/practice")({
  component: PracticeLayout,
});

function PracticeLayout() {
  const [result, setResult] = useState<SessionResult | null>(null);
  const value = useMemo(() => ({ result, setResult }), [result]);
  return (
    <PracticeContext.Provider value={value}>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 text-practice-text sm:px-6">
        <Outlet />
      </div>
    </PracticeContext.Provider>
  );
}
