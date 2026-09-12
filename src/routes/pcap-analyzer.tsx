import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// Browser-only: the panel owns the Worker and File APIs, so it must never be
// statically imported into the SSR graph.
const PcapAnalyzerPanel = lazy(() => import("@/components/PcapAnalyzerPanel"));

export const Route = createFileRoute("/pcap-analyzer")({
  head: () => ({
    meta: [
      { title: "PCAP Troubleshooter — Pulse Speed" },
      {
        name: "description",
        content:
          "Analyse packet captures entirely in your browser. Files never leave your machine.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "PCAP Troubleshooter — Pulse Speed" },
      {
        property: "og:description",
        content:
          "Analyse packet captures entirely in your browser. Files never leave your machine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PcapAnalyzerPage,
});

function Fallback() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px", color: "#6b7794" }}>
      Loading the analyser…
    </div>
  );
}

function PcapAnalyzerPage() {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <PcapAnalyzerPanel />
      </Suspense>
    </ClientOnly>
  );
}
