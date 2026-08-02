import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-5")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/public-vs-private-ip", replace: true });
  },
});
