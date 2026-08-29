import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-17")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/inter-vlan-routing", replace: true });
  },
});
