import { createServerFn } from "@tanstack/react-start";

/**
 * File-hash reputation lookup via CIRCL hashlookup (public, no auth).
 * Supports MD5 / SHA-1 / SHA-256. Returns malicious / known-good / unknown.
 */

function detectHashType(h: string): "md5" | "sha1" | "sha256" | null {
  const v = h.trim();
  if (!/^[a-fA-F0-9]+$/.test(v)) return null;
  if (v.length === 32) return "md5";
  if (v.length === 40) return "sha1";
  if (v.length === 64) return "sha256";
  return null;
}

export const hashLookup = createServerFn({ method: "POST" })
  .inputValidator((d: { hash: string }) => {
    const hash = (d.hash ?? "").trim();
    const type = detectHashType(hash);
    if (!type) throw new Error("Enter a valid MD5 (32), SHA-1 (40) or SHA-256 (64) hex hash.");
    return { hash, type };
  })
  .handler(async ({ data }) => {
    const url = `https://hashlookup.circl.lu/lookup/${data.type}/${encodeURIComponent(data.hash)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.status === 404) {
      return {
        hash: data.hash,
        type: data.type,
        verdict: "unknown" as const,
        source: "CIRCL hashlookup",
        details: null as Record<string, unknown> | null,
      };
    }
    if (!res.ok) throw new Error(`Lookup failed: HTTP ${res.status}`);
    const json = (await res.json()) as Record<string, unknown>;
    const malicious = typeof json.KnownMalicious === "string" && json.KnownMalicious.length > 0;
    return {
      hash: data.hash,
      type: data.type,
      verdict: (malicious ? "malicious" : "known-good") as "malicious" | "known-good",
      source: "CIRCL hashlookup" + (malicious ? ` (${String(json.KnownMalicious)})` : ""),
      details: json,
    };
  });