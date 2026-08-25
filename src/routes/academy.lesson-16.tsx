import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-16")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/vlans", replace: true });
  },
});
