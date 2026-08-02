import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-9")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/network-broadcast-usable-ip", replace: true });
  },
});
