import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-2")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/lan-wan-man-pan", replace: true });
  },
});
