import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pingip")({
  beforeLoad: () => {
    throw redirect({ to: "/ping-ip", replace: true });
  },
});
