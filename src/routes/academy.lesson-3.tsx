import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-3")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/ip-addressing", replace: true });
  },
});
