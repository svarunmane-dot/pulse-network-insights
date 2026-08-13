import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-14")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/mac-addresses", replace: true });
  },
});
