import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/blacklist")({
  beforeLoad: () => {
    throw redirect({ to: "/blacklist-check", replace: true });
  },
});
