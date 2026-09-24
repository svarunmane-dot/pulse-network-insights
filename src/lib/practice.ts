import { createContext, useContext } from "react";

export type TrackSlug = "ccna" | "ccnp" | "interview";
export type Category = "CCNA" | "CCNP" | "Interview";

export const TRACKS: Record<TrackSlug, { category: Category; title: string; blurb: string; icon: string }> = {
  ccna: { category: "CCNA", title: "CCNA Practice", blurb: "Subnetting, switching, VLANs, OSPF, NAT, IPv6 and core fundamentals.", icon: "🧩" },
  ccnp: { category: "CCNP", title: "CCNP Practice", blurb: "BGP path selection, OSPF LSAs, EIGRP, FHRP, MPLS, VXLAN and QoS.", icon: "🛰️" },
  interview: { category: "Interview", title: "Interview Prep", blurb: "Real troubleshooting scenarios hiring managers ask network engineers.", icon: "💼" },
};

export const isTrack = (s: string): s is TrackSlug => s in TRACKS;

export type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_option: string;
  explanation: string;
  topic?: string | null;
};

export type Answer = { question: Question; selected: string; correct: boolean };
export type SessionResult = { track: TrackSlug; answers: Answer[] };

export const PASS_PERCENT = 70;

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(input: T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const PracticeContext = createContext<{
  result: SessionResult | null;
  setResult: (r: SessionResult | null) => void;
} | null>(null);

export function usePractice() {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error("usePractice must be inside /practice");
  return ctx;
}
