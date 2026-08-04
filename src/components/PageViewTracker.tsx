import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { recordSiteHit } from "@/lib/sitestats.functions";

function visitorId(): string | undefined {
  try {
    const key = "pulse-speed:vid";
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/** Fire-and-forget page view counter (anonymous, aggregated). */
export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    recordSiteHit({ data: { visitorId: visitorId() } }).catch(() => {});
  }, [pathname]);

  return null;
}