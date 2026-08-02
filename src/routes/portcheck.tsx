import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/portcheck")({
  beforeLoad: () => {
    throw redirect({ to: "/port-check", replace: true });
  },
});
