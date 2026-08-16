import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-15")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/network-switches", replace: true });
  },
});
