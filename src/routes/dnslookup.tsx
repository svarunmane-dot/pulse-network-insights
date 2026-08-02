import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dnslookup")({
  beforeLoad: () => {
    throw redirect({ to: "/dns-lookup", replace: true });
  },
});
