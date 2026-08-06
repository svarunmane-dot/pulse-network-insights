import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-12")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/what-is-dns", replace: true });
  },
});
