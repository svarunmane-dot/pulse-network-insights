import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { recordSiteHit } from "@/lib/sitestats.functions";

const GA_MEASUREMENT_ID = "G-7SQKFM1G4E";

/** Routes that must never produce an analytics hit (local-only capture analysis). */
const ANALYTICS_DENYLIST = ["/pcap-analyzer"];

function isDenied(pathname: string): boolean {
  return ANALYTICS_DENYLIST.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

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

    const w = window as unknown as Record<string, unknown> & {
      gtag?: (...args: unknown[]) => void;
    };
    const disableKey = `ga-disable-${GA_MEASUREMENT_ID}`;

    if (isDenied(pathname)) {
      // Belt and braces: hard-disable GA for as long as this route is mounted,
      // on top of not sending an explicit page_view.
      w[disableKey] = true;
      return () => {
        w[disableKey] = false;
      };
    }

    w[disableKey] = false;
    try {
      w.gtag?.("event", "page_view", {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    } catch {
      /* analytics must never break navigation */
    }

    recordSiteHit({ data: { visitorId: visitorId() } }).catch(() => {});
    return undefined;
  }, [pathname]);

  return null;
}
