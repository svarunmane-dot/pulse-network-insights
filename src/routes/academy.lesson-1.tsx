import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-1")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/what-is-a-computer-network", replace: true });
  },
});
