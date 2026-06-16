import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign In / Sign Up – Pulse Speed WAN Monitoring" },
      {
        name: "description",
        content:
          "Create your free Pulse Speed account to monitor WAN IPs with TCP probes every minute and view uptime history.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // MFA challenge state
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  // TOTP enrolment for new accounts
  const [enrol, setEnrol] = useState<{ factorId: string; qr: string; secret: string } | null>(
    null,
  );
  const [enrolCode, setEnrolCode] = useState("");

  useEffect(() => {
    // If already fully signed in (AAL2), bounce to monitoring.
    void supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      if (!data) return;
      if (data.currentLevel === "aal2" || (data.currentLevel === "aal1" && data.nextLevel === "aal1")) {
        router.navigate({ to: "/monitoring" });
      }
    });
  }, [router]);

  async function checkMfaAndContinue() {
    const { data } = await supabase.auth.mfa.listFactors();
    const totp = data?.totp?.find((f) => f.status === "verified");
    if (totp) {
      setMfaFactorId(totp.id);
      setNeedsMfa(true);
      return;
    }
    // No verified factor — start enrolment
    const { data: e, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error || !e) {
      setErr(error?.message ?? "Could not start TOTP enrolment");
      return;
    }
    setEnrol({ factorId: e.id, qr: e.totp.qr_code, secret: e.totp.secret });
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        // With auto-confirm on, a session is created — set up TOTP.
        await checkMfaAndContinue();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await checkMfaAndContinue();
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId) return;
    setBusy(true);
    setErr(null);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (chErr || !ch) throw chErr ?? new Error("Challenge failed");
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: ch.id,
        code: mfaCode.trim(),
      });
      if (error) throw error;
      router.navigate({ to: "/monitoring" });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function submitEnrol(e: React.FormEvent) {
    e.preventDefault();
    if (!enrol) return;
    setBusy(true);
    setErr(null);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: enrol.factorId,
      });
      if (chErr || !ch) throw chErr ?? new Error("Challenge failed");
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrol.factorId,
        challengeId: ch.id,
        code: enrolCode.trim(),
      });
      if (error) throw error;
      setMsg("Two-factor enabled — signing you in…");
      router.navigate({ to: "/monitoring" });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#fff" }}>
          {enrol ? "Set up two-factor" : needsMfa ? "Two-factor code" : mode === "signup" ? "Create account" : "Sign in"}
        </h1>
        <p style={{ marginTop: 6, color: "#8b94b0", fontSize: 13 }}>
          WAN Monitoring is for registered users. We protect every account with TOTP (authenticator app).
        </p>

        {err && <div style={errorBox}>{err}</div>}
        {msg && <div style={msgBox}>{msg}</div>}

        {!enrol && !needsMfa && (
          <form onSubmit={handleAuth} style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <label style={lbl}>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={input}
                autoComplete="email"
              />
            </label>
            <label style={lbl}>
              Password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={input}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </label>
            <button type="submit" disabled={busy} style={btn}>
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              style={linkBtn}
            >
              {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </form>
        )}

        {enrol && (
          <form onSubmit={submitEnrol} style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <p style={{ color: "#c8d0e0", fontSize: 13, margin: 0 }}>
              Scan this QR with Google Authenticator, Authy, or 1Password, then enter the 6-digit code.
            </p>
            <div style={{ background: "#fff", padding: 12, borderRadius: 10, alignSelf: "center" }}>
              <img src={enrol.qr} alt="TOTP QR" width={180} height={180} />
            </div>
            <div style={{ fontSize: 11, color: "#8b94b0", wordBreak: "break-all" }}>
              Manual key: <code>{enrol.secret}</code>
            </div>
            <label style={lbl}>
              6-digit code
              <input
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={enrolCode}
                onChange={(e) => setEnrolCode(e.target.value)}
                style={input}
                required
              />
            </label>
            <button type="submit" disabled={busy} style={btn}>
              {busy ? "Verifying…" : "Enable two-factor"}
            </button>
          </form>
        )}

        {needsMfa && !enrol && (
          <form onSubmit={submitMfa} style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <p style={{ color: "#c8d0e0", fontSize: 13, margin: 0 }}>
              Enter the 6-digit code from your authenticator app.
            </p>
            <label style={lbl}>
              6-digit code
              <input
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                style={input}
                required
                autoFocus
              />
            </label>
            <button type="submit" disabled={busy} style={btn}>
              {busy ? "Verifying…" : "Verify and continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: "calc(100vh - 80px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "#0a0e1a",
};
const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 440,
  background: "#0f1426",
  border: "1px solid #1f2740",
  borderRadius: 16,
  padding: 28,
};
const lbl: React.CSSProperties = {
  display: "grid",
  gap: 6,
  color: "#c8d0e0",
  fontSize: 13,
};
const input: React.CSSProperties = {
  background: "#0a0e1a",
  border: "1px solid #283054",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#fff",
  fontSize: 14,
  outline: "none",
};
const btn: React.CSSProperties = {
  background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
  color: "#04150f",
  border: 0,
  padding: "12px 14px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};
const linkBtn: React.CSSProperties = {
  background: "transparent",
  color: "#9B8FE8",
  border: 0,
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
};
const errorBox: React.CSSProperties = {
  marginTop: 14,
  background: "rgba(255,80,80,0.12)",
  border: "1px solid rgba(255,80,80,0.35)",
  color: "#ffb4b4",
  padding: "10px 12px",
  borderRadius: 10,
  fontSize: 13,
};
const msgBox: React.CSSProperties = {
  marginTop: 14,
  background: "rgba(0,212,170,0.12)",
  border: "1px solid rgba(0,212,170,0.35)",
  color: "#9af0d8",
  padding: "10px 12px",
  borderRadius: 10,
  fontSize: 13,
};
