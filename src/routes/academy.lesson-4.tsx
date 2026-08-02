import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-4")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/ipv4-address-classes", replace: true });
  },
});
