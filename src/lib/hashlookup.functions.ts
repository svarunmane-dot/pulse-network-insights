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
    const base = { hash: data.hash, type: data.type, source: "CIRCL hashlookup" };
    if (res.status === 404) {
      return { ...base, verdict: "unknown" as const, malicious_source: null as string | null, filename: null as string | null, filesize: null as string | null, product: null as string | null, trust: null as number | null };
    }
    if (!res.ok) throw new Error(`Lookup failed: HTTP ${res.status}`);
    const json = (await res.json()) as Record<string, unknown>;
    const malicious = typeof json.KnownMalicious === "string" && json.KnownMalicious.length > 0;
    const product = json.ProductCode && typeof json.ProductCode === "object"
      ? String((json.ProductCode as Record<string, unknown>).ProductName ?? "") || null
      : null;
    return {
      ...base,
      verdict: (malicious ? "malicious" : "known-good") as "malicious" | "known-good",
      malicious_source: malicious ? String(json.KnownMalicious) : null,
      filename: typeof json.FileName === "string" ? json.FileName : null,
      filesize: typeof json.FileSize === "string" ? json.FileSize : null,
      product,
      trust: typeof json["hashlookup:trust"] === "number" ? (json["hashlookup:trust"] as number) : null,
    };
  });