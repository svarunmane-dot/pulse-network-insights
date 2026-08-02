import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-7")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/subnet-masks", replace: true });
  },
});
