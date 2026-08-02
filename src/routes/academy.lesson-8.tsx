import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-8")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/cidr-notation", replace: true });
  },
});
