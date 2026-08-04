import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-11")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/what-is-a-default-gateway", replace: true });
  },
});
