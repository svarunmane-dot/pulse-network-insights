import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toolHead } from "@/lib/seo";

export const Route = createFileRoute("/password-generator")({
  component: PasswordGeneratorPage,
  head: () =>
    toolHead({
      path: "/password-generator",
      name: "Password Generator",
      title: "Password Generator — Strong, Random & Breach-Checked",
      description:
        "Free secure password generator. Custom length, character sets, live strength meter and a Have I Been Pwned breach check using k-anonymity — nothing leaves your browser.",
      category: "SecurityApplication",
      faqs: [
        {
          q: "Is this password generator safe to use?",
          a: "Yes. Passwords are generated locally in your browser using the Web Crypto API (crypto.getRandomValues). Nothing is sent to any server.",
        },
        {
          q: "How does the breach check work without exposing my password?",
          a: "It uses the Have I Been Pwned k-anonymity model: your password is hashed with SHA-1 locally, and only the first 5 characters of the hash are sent. The full password never leaves your device.",
        },
        {
          q: "What makes a password strong?",
          a: "Length matters most — 16+ characters — combined with a mix of uppercase, lowercase, numbers and symbols. Avoid dictionary words, names and common patterns like 'password123'.",
        },
      ],
    }),
});

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?/|~";

function randomInt(max: number): number {
  const arr = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let x: number;
  do {
    crypto.getRandomValues(arr);
    x = arr[0];
  } while (x >= limit);
  return x % max;
}

function buildPassword(length: number, sets: string[]): string {
  const pool = sets.join("");
  const chars: string[] = [];
  // Guarantee at least one char from each selected set
  for (const s of sets) chars.push(s[randomInt(s.length)]);
  while (chars.length < length) chars.push(pool[randomInt(pool.length)]);
  // Fisher-Yates shuffle with crypto randomness
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, length).join("");
}

type Strength = { label: string; color: string; pct: number; score: number };

function assess(pw: string): Strength {
  if (!pw) return { label: "—", color: "#6b7794", pct: 0, score: 0 };
  let variety = 0;
  if (/[a-z]/.test(pw)) variety++;
  if (/[A-Z]/.test(pw)) variety++;
  if (/[0-9]/.test(pw)) variety++;
  if (/[^a-zA-Z0-9]/.test(pw)) variety++;
  const len = pw.length;
  let score = 0;
  if (len >= 8) score++;
  if (len >= 12) score++;
  if (len >= 16) score++;
  if (len >= 24) score++;
  score += variety; // 0-4
  // Penalize very common patterns
  if (/^(password|qwerty|letmein|admin|welcome|123456)/i.test(pw)) score = Math.min(score, 2);
  if (score <= 3) return { label: "Weak", color: "#ff4d6d", pct: 25, score };
  if (score <= 5) return { label: "Medium", color: "#f5a623", pct: 55, score };
  if (score <= 6) return { label: "Strong", color: "#00D4AA", pct: 80, score };
  return { label: "Very Strong", color: "#00D4AA", pct: 100, score };
}

type BreachState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "safe" }
  | { status: "pwned"; count: number }
  | { status: "error" };

async function sha1Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function checkPwned(pw: string): Promise<number> {
  const hash = await sha1Hex(pw);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  for (const line of body.split("\n")) {
    const [suf, count] = line.trim().split(":");
    if (suf === suffix) return parseInt(count, 10) || 1;
  }
  return 0;
}

const card: React.CSSProperties = {
  background: "#131829",
  border: "1px solid #1f2740",
  borderRadius: 16,
  padding: 24,
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  color: "#c8d0e0",
  fontSize: 15,
  userSelect: "none",
};

function PasswordGeneratorPage() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [breach, setBreach] = useState<BreachState>({ status: "idle" });
  const breachTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sets = useMemo(() => {
    const s: string[] = [];
    if (useUpper) s.push(UPPER);
    if (useLower) s.push(LOWER);
    if (useDigits) s.push(DIGITS);
    if (useSymbols) s.push(SYMBOLS);
    return s;
  }, [useUpper, useLower, useDigits, useSymbols]);

  const generate = useCallback(
    (overrideLength?: number) => {
      if (sets.length === 0) return;
      const len = overrideLength ?? length;
      setPassword(buildPassword(len, sets));
      setCopied(false);
    },
    [length, sets],
  );

  const quickGenerate = useCallback(() => {
    // One-tap strong password: 20 chars, all character classes — meets every major site's policy
    setLength(20);
    setUseUpper(true);
    setUseLower(true);
    setUseDigits(true);
    setUseSymbols(true);
    setPassword(buildPassword(20, [UPPER, LOWER, DIGITS, SYMBOLS]));
    setCopied(false);
  }, []);

  // Generate on first load
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced breach check whenever the password changes
  useEffect(() => {
    if (!password) {
      setBreach({ status: "idle" });
      return;
    }
    setBreach({ status: "checking" });
    if (breachTimer.current) clearTimeout(breachTimer.current);
    breachTimer.current = setTimeout(async () => {
      try {
        const count = await checkPwned(password);
        setBreach(count > 0 ? { status: "pwned", count } : { status: "safe" });
      } catch {
        setBreach({ status: "error" });
      }
    }, 500);
    return () => {
      if (breachTimer.current) clearTimeout(breachTimer.current);
    };
  }, [password]);

  const strength = assess(password);

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = password;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
      <header style={{ textAlign: "center", marginBottom: 32 }} className="pulse-fadeUp">
        <div style={{ fontSize: 44, marginBottom: 8 }}>🔐</div>
        <h1 style={{ fontSize: 34, margin: "0 0 10px", color: "#fff" }}>Password Generator</h1>
        <p style={{ color: "#6b7794", margin: 0, fontSize: 15, lineHeight: 1.6 }}>
          Cryptographically random passwords, generated entirely in your browser.
          <br />
          Nothing is stored or sent anywhere — the breach check uses k-anonymity.
        </p>
      </header>

      {/* Output card */}
      <section style={{ ...card, marginBottom: 20 }} className="pulse-fadeUp">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            readOnly
            value={password}
            aria-label="Generated password"
            className="font-mono-pulse"
            style={{
              flex: "1 1 260px",
              background: "#0f1422",
              border: "1px solid #1f2740",
              borderRadius: 10,
              color: "#00D4AA",
              fontSize: 18,
              padding: "14px 16px",
              letterSpacing: 0.5,
              outline: "none",
            }}
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={copy}
            style={{
              background: copied ? "#00D4AA" : "#1f2740",
              color: copied ? "#0A0E1A" : "#c8d0e0",
              border: "none",
              borderRadius: 10,
              padding: "0 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              minHeight: 48,
            }}
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
        </div>

        {/* Strength meter */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#6b7794" }}>Strength</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: strength.color, transition: "color 0.3s" }}>
              {strength.label}
            </span>
          </div>
          <div style={{ height: 8, background: "#0f1422", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${strength.pct}%`,
                background: strength.color,
                borderRadius: 4,
                transition: "width 0.4s ease, background 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Breach check */}
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: 16,
            padding: "12px 14px",
            borderRadius: 10,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "all 0.3s",
            background:
              breach.status === "pwned"
                ? "rgba(255,77,109,0.08)"
                : breach.status === "safe"
                  ? "rgba(0,212,170,0.08)"
                  : "#0f1422",
            border: `1px solid ${
              breach.status === "pwned"
                ? "rgba(255,77,109,0.4)"
                : breach.status === "safe"
                  ? "rgba(0,212,170,0.4)"
                  : "#1f2740"
            }`,
            color: breach.status === "pwned" ? "#ff4d6d" : breach.status === "safe" ? "#00D4AA" : "#6b7794",
          }}
        >
          {breach.status === "checking" && (
            <>
              <span className="pulse-spinAnim" style={{ display: "inline-block" }}>⏳</span>
              Checking against breached-password databases…
            </>
          )}
          {breach.status === "safe" && <>✅ Safe — this password was not found in any known data breach.</>}
          {breach.status === "pwned" && (
            <>
              ⚠️ <strong>Warning:</strong>&nbsp;this password has appeared in data breaches{" "}
              {breach.count.toLocaleString()} time{breach.count === 1 ? "" : "s"}. Do not use it — generate a new one.
            </>
          )}
          {breach.status === "error" && <>⚠️ Breach check unavailable right now — the password itself was still generated securely offline.</>}
          {breach.status === "idle" && <>Breach check runs automatically via Have I Been Pwned (k-anonymity).</>}
        </div>
      </section>

      {/* Customization card */}
      <section style={{ ...card, marginBottom: 20 }} className="pulse-fadeUp">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <label htmlFor="pw-length" style={{ color: "#c8d0e0", fontSize: 15, fontWeight: 600 }}>
            Password length
          </label>
          <span className="font-num-pulse" style={{ color: "#00D4AA", fontSize: 22, fontWeight: 700 }}>
            {length}
          </span>
        </div>
        <input
          id="pw-length"
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value, 10))}
          style={{ width: "100%", accentColor: "#00D4AA", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7794", marginTop: 2 }}>
          <span>8</span>
          <span>64</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginTop: 20,
          }}
        >
          {(
            [
              ["Uppercase (A-Z)", useUpper, setUseUpper],
              ["Lowercase (a-z)", useLower, setUseLower],
              ["Numbers (0-9)", useDigits, setUseDigits],
              ["Symbols (!@#$…)", useSymbols, setUseSymbols],
            ] as Array<[string, boolean, (v: boolean) => void]>
          ).map(([label, value, setter]) => (
            <label key={label} style={labelStyle}>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setter(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#00D4AA", cursor: "pointer" }}
              />
              {label}
            </label>
          ))}
        </div>
        {sets.length === 0 && (
          <p style={{ color: "#ff4d6d", fontSize: 13, margin: "12px 0 0" }}>
            Select at least one character set to generate a password.
          </p>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
          <button
            onClick={() => generate()}
            disabled={sets.length === 0}
            style={{
              flex: "1 1 200px",
              background: sets.length === 0 ? "#1f2740" : "#00D4AA",
              color: sets.length === 0 ? "#6b7794" : "#0A0E1A",
              border: "none",
              borderRadius: 10,
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 700,
              cursor: sets.length === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            🔄 Generate Password
          </button>
          <button
            onClick={quickGenerate}
            style={{
              flex: "1 1 200px",
              background: "transparent",
              color: "#9B8FE8",
              border: "1px solid #9B8FE8",
              borderRadius: 10,
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            ⚡ Quick Strong Password
          </button>
        </div>
        <p style={{ color: "#6b7794", fontSize: 12.5, margin: "12px 0 0", lineHeight: 1.5 }}>
          ⚡ Quick Strong gives you a 20-character password with every character class — it satisfies the password
          policy of virtually every website (Google, Microsoft, banks, etc.) in one tap.
        </p>
      </section>

      {/* Info card */}
      <section style={card} className="pulse-fadeUp">
        <h2 style={{ fontSize: 18, margin: "0 0 12px", color: "#fff" }}>How it works</h2>
        <ul style={{ color: "#c8d0e0", fontSize: 14, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
          <li>
            <strong>Truly random:</strong> passwords are built with your browser's Web Crypto API
            (crypto.getRandomValues) — the same source of randomness used by security software.
          </li>
          <li>
            <strong>Private by design:</strong> generation happens 100% on your device. No server ever sees your
            password.
          </li>
          <li>
            <strong>Breach check with k-anonymity:</strong> your password is hashed locally with SHA-1 and only the
            first 5 hash characters are sent to Have I Been Pwned, so the full password is never exposed.
          </li>
          <li>
            <strong>Strength meter:</strong> scores length and character variety — aim for 16+ characters with all
            four sets enabled.
          </li>
        </ul>
      </section>
    </main>
  );
}
