import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/academy/lesson-10")({
  beforeLoad: () => {
    throw redirect({ to: "/academy/subnetting-made-easy", replace: true });
  },
});
