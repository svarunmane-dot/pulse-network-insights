import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/whoisip")({
  beforeLoad: () => {
    throw redirect({ to: "/whose-ip", replace: true });
  },
});
