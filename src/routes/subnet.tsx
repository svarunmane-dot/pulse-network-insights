import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/subnet")({
  beforeLoad: () => {
    throw redirect({ to: "/subnet-calculator", replace: true });
  },
});
