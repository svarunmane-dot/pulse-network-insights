import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-13")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/what-is-dhcp", replace: true });
  },
});
