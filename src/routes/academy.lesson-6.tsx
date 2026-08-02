import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-6")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/subnetting", replace: true });
  },
});
