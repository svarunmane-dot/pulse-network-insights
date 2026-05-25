import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const Route = createFileRoute("/ping")({
  component: PingPage,
  head: () => ({
    meta: [
      { title: "Ping a friend — Pulse" },
      { name: "description", content: "Measure real peer-to-peer round-trip latency between two devices over a direct WebRTC connection." },
    ],
  }),
});

type Phase = "idle" | "signaling" | "connecting" | "connected" | "failed";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const genCode = () => String(Math.floor(1000 + Math.random() * 9000));

function PingPage() {
  const [myCode] = useState(genCode);
  const [peerCode, setPeerCode] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("Share your code and enter your friend's code to connect.");
  const [rtt, setRtt] = useState<number | null>(null);
  const [samples, setSamples] = useState<number[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const chRef = useRef<RealtimeChannel | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const pendingPingsRef = useRef<Map<number, number>>(new Map());

  const stats = useMemo(() => {
    if (samples.length === 0) return null;
    const sorted = [...samples].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
    const variance = samples.reduce((s, v) => s + (v - avg) ** 2, 0) / samples.length;
    return { min, max, avg, jitter: Math.sqrt(variance), count: samples.length };
  }, [samples]);

  const cleanup = () => {
    if (pingTimerRef.current) {
      window.clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    pendingPingsRef.current.clear();
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (chRef.current) {
      supabase.removeChannel(chRef.current);
      chRef.current = null;
    }
  };

  useEffect(() => () => cleanup(), []);

  const startPingLoop = (dc: RTCDataChannel) => {
    if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
    pingTimerRef.current = window.setInterval(() => {
      if (dc.readyState !== "open") return;
      const id = Math.floor(Math.random() * 1e9);
      pendingPingsRef.current.set(id, performance.now());
      try {
        dc.send(JSON.stringify({ t: "ping", id }));
      } catch {
        /* noop */
      }
      window.setTimeout(() => pendingPingsRef.current.delete(id), 3000);
    }, 1000);
  };

  const handleDataChannel = (dc: RTCDataChannel) => {
    dcRef.current = dc;
    dc.onopen = () => {
      setPhase("connected");
      setStatus("Connected peer-to-peer. Measuring latency…");
      startPingLoop(dc);
    };
    dc.onclose = () => {
      setStatus("Disconnected.");
      setPhase("idle");
      cleanup();
    };
    dc.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.t === "ping") {
          dc.send(JSON.stringify({ t: "pong", id: msg.id }));
        } else if (msg.t === "pong") {
          const sent = pendingPingsRef.current.get(msg.id);
          if (sent != null) {
            pendingPingsRef.current.delete(msg.id);
            const r = performance.now() - sent;
            setRtt(r);
            setSamples((prev) => [...prev.slice(-29), r]);
          }
        }
      } catch {
        /* noop */
      }
    };
  };

  const connect = async () => {
    const peer = peerCode.trim();
    if (!/^\d{4}$/.test(peer)) {
      setStatus("Enter your friend's 4-digit code.");
      return;
    }
    if (peer === myCode) {
      setStatus("That's your own code. Use the other person's code.");
      return;
    }
    cleanup();
    setSamples([]);
    setRtt(null);
    setPhase("signaling");
    setStatus("Looking for your friend…");

    const [a, b] = [myCode, peer].sort();
    const isOfferer = myCode === a;
    const roomName = `pingroom-${a}-${b}`;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    const ch = supabase.channel(roomName, {
      config: { broadcast: { self: false, ack: false } },
    });
    chRef.current = ch;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        ch.send({
          type: "broadcast",
          event: "ice",
          payload: { from: myCode, candidate: e.candidate.toJSON() },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connecting") setPhase("connecting");
      if (s === "failed" || s === "disconnected" || s === "closed") {
        setPhase((prev) => (prev === "connected" ? prev : "failed"));
      }
    };

    pc.ondatachannel = (e) => handleDataChannel(e.channel);

    if (isOfferer) {
      const dc = pc.createDataChannel("ping", { ordered: false, maxRetransmits: 0 });
      handleDataChannel(dc);
    }

    ch.on("broadcast", { event: "offer" }, async ({ payload }) => {
      if (payload.from === myCode || isOfferer) return;
      await pc.setRemoteDescription(payload.sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ch.send({
        type: "broadcast",
        event: "answer",
        payload: { from: myCode, sdp: pc.localDescription },
      });
      setStatus("Friend found — opening direct connection…");
      setPhase("connecting");
    });

    ch.on("broadcast", { event: "answer" }, async ({ payload }) => {
      if (payload.from === myCode || !isOfferer) return;
      if (pc.currentRemoteDescription) return;
      await pc.setRemoteDescription(payload.sdp);
      setStatus("Friend answered — opening direct connection…");
      setPhase("connecting");
    });

    ch.on("broadcast", { event: "ice" }, async ({ payload }) => {
      if (payload.from === myCode) return;
      try {
        await pc.addIceCandidate(payload.candidate);
      } catch (err) {
        console.warn("ICE add failed", err);
      }
    });

    await ch.subscribe(async (subStatus) => {
      if (subStatus !== "SUBSCRIBED") return;
      ch.send({ type: "broadcast", event: "hello", payload: { from: myCode } });
      if (isOfferer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ch.send({
          type: "broadcast",
          event: "offer",
          payload: { from: myCode, sdp: pc.localDescription },
        });
      }
    });
  };

  const disconnect = () => {
    cleanup();
    setPhase("idle");
    setStatus("Disconnected.");
    setRtt(null);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
    } catch {
      /* noop */
    }
  };

  const phaseColor =
    phase === "connected" ? "#00e5b0" :
    phase === "connecting" || phase === "signaling" ? "#f5a623" :
    phase === "failed" ? "#ff4d6d" : "#4a7090";
  const phaseLabel =
    phase === "connected" ? "CONNECTED" :
    phase === "connecting" ? "CONNECTING" :
    phase === "signaling" ? "WAITING" :
    phase === "failed" ? "FAILED" : "IDLE";

  const busy = phase === "connecting" || phase === "connected" || phase === "signaling";

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 60, minHeight: "100vh" }}>
      <header style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          to="/"
          className="font-mono-pulse"
          style={{ fontSize: 12, color: "#4a7090", textDecoration: "none" }}
        >
          ← Back
        </Link>
        <span
          className="font-mono-pulse"
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            color: phaseColor,
            padding: "4px 10px",
            borderRadius: 20,
            border: `1px solid ${phaseColor}55`,
            background: `${phaseColor}11`,
          }}
        >
          {phaseLabel}
        </span>
      </header>

      <section style={{ textAlign: "center", padding: "20px 24px 28px" }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
          Peer-to-peer ping
        </div>
        <p className="font-mono-pulse" style={{ fontSize: 13, color: "#4a7090", marginTop: 12 }}>
          Swap 4-digit codes on two devices to measure real round-trip time
        </p>
      </section>

      <section style={{ padding: "0 24px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0d1f2d, #0a1829)",
            border: "1px solid #1a3045",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div className="font-mono-pulse" style={{ fontSize: 10, letterSpacing: 2, color: "#4a7090" }}>
            YOUR CODE
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: "0.3em",
                background: "linear-gradient(90deg, #00e5b0, #2D8CFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {myCode}
            </span>
            <button
              onClick={copyCode}
              className="font-mono-pulse"
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #1a3045",
                background: "transparent",
                color: "#c8dae8",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              COPY
            </button>
          </div>
          <div className="font-mono-pulse" style={{ fontSize: 11, color: "#4a7090", marginTop: 6 }}>
            Share this code with the other person.
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="font-mono-pulse" style={{ fontSize: 10, letterSpacing: 2, color: "#4a7090" }}>
              FRIEND'S CODE
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                placeholder="1234"
                value={peerCode}
                onChange={(e) => setPeerCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={busy}
                style={{
                  flex: 1,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 22,
                  letterSpacing: "0.3em",
                  background: "#050d16",
                  border: "1px solid #1a3045",
                  borderRadius: 10,
                  color: "#fff",
                  padding: "10px 14px",
                  outline: "none",
                }}
              />
              {busy ? (
                <button
                  onClick={disconnect}
                  className="font-mono-pulse"
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,77,109,0.4)",
                    background: "rgba(255,77,109,0.1)",
                    color: "#ff4d6d",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  DISCONNECT
                </button>
              ) : (
                <button
                  onClick={connect}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #00e5b0, #2D8CFF)",
                    color: "#050d16",
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: "'Syne', sans-serif",
                    cursor: "pointer",
                  }}
                >
                  CONNECT
                </button>
              )}
            </div>
          </div>

          <div
            className="font-mono-pulse"
            style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 11, color: "#7a9bb5" }}
          >
            <span
              className={phase === "signaling" || phase === "connecting" ? "pulse-pulseAnim" : ""}
              style={{ width: 6, height: 6, borderRadius: "50%", background: phaseColor }}
            />
            {status}
          </div>
        </div>
      </section>

      <section style={{ padding: "16px 24px 0" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0d1f2d, #0a1829)",
            border: "1px solid #1a3045",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="font-mono-pulse" style={{ fontSize: 10, letterSpacing: 2, color: "#4a7090" }}>
              LATENCY (RTT)
            </div>
            {stats && (
              <div className="font-mono-pulse" style={{ fontSize: 10, color: "#4a7090" }}>
                {stats.count} sample{stats.count === 1 ? "" : "s"}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
              {rtt != null ? rtt.toFixed(0) : "—"}
            </span>
            <span className="font-mono-pulse" style={{ fontSize: 16, color: "#4a7090" }}>ms</span>
          </div>

          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 16 }}>
              {[
                { label: "MIN", value: stats.min },
                { label: "AVG", value: stats.avg },
                { label: "JITTER", value: stats.jitter },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "#050d16",
                    border: "1px solid #1a3045",
                    borderRadius: 10,
                    padding: "10px 8px",
                    textAlign: "center",
                  }}
                >
                  <div className="font-mono-pulse" style={{ fontSize: 9, color: "#4a7090", letterSpacing: 2 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#c8dae8", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                    {s.value.toFixed(0)}
                    <span className="font-mono-pulse" style={{ fontSize: 10, color: "#4a7090", marginLeft: 3 }}>ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="font-mono-pulse" style={{ fontSize: 11, color: "#4a7090", marginTop: 14, lineHeight: 1.6 }}>
            The first sample includes WebRTC setup and may be higher than the rest. After that, each
            ping is a single round-trip over the direct peer-to-peer channel.
          </p>
        </div>
      </section>
    </main>
  );
}