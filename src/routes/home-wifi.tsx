import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toolHead } from "@/lib/seo";

const TEAL = "#00D4AA";
const PURPLE = "#9B8FE8";
const SURFACE = "#131829";
const INNER = "#0f1422";
const BORDER = "#1f2740";
const TEXT = "#e6ebf5";
const TEXT_SEC = "#c8d0e0";
const MUTED = "#6b7794";
const RED = "#ff4d6d";
const AMBER = "#ffb547";

const FAQS = [
  {
    q: "Why is my Wi-Fi so slow all of a sudden?",
    a: "Sudden slowness is usually interference from neighbours' networks, too many devices streaming or downloading at once, an overheating router, or a provider issue. Restart the router, test near it with a speed test, and switch to the 5 GHz band or a less crowded channel.",
  },
  {
    q: "Why does my Wi-Fi say connected but no internet?",
    a: "Your device reached the router, but the router can't reach your provider. Restart the modem and router (unplug 30 seconds), check the provider's outage page, and test with a cable to rule out Wi-Fi.",
  },
  {
    q: "What is the best Wi-Fi channel for home?",
    a: "On 2.4 GHz use only channels 1, 6 or 11 — whichever your neighbours use least. On 5 GHz pick a non-DFS channel like 36–48 or 149–161 for stability, and use 40 or 80 MHz width.",
  },
  {
    q: "Should I use 2.4 GHz or 5 GHz?",
    a: "5 GHz (and 6 GHz) is much faster and less crowded but has shorter range. 2.4 GHz reaches further through walls but is slower and busier. Use 5 GHz near the router, 2.4 GHz for far rooms and smart-home gadgets.",
  },
  {
    q: "Why does my Wi-Fi keep dropping or disconnecting?",
    a: "The usual causes are weak signal, interference from neighbours or microwaves, an overheating or outdated router, or power-saving on the device. Move closer, change channel, update firmware, and restart the router.",
  },
  {
    q: "How do I fix Wi-Fi dead zones in my house?",
    a: "Move the router to a central, high, open spot away from walls, metal and fish tanks. If dead zones remain, add a mesh Wi-Fi system or a wired access point — a single router rarely covers a whole multi-floor home.",
  },
  {
    q: "Why is my internet slow at night?",
    a: "Evening congestion on your provider's network and neighbours' Wi-Fi channels is common. Run a speed test at different times, switch to a less busy Wi-Fi channel, and use 5 GHz or an Ethernet cable for important devices.",
  },
  {
    q: "What is a good Wi-Fi signal strength in dBm?",
    a: "-30 to -50 dBm is excellent, -50 to -60 is good, -60 to -70 is okay for browsing, and below -70 dBm causes drops and slow speeds. Check the signal guide on this page to see your exact reading on Windows or Mac.",
  },
];

export const Route = createFileRoute("/home-wifi")({
  component: HomeWifiPage,
  head: () =>
    toolHead({
      path: "/home-wifi",
      name: "Home Wi-Fi Troubleshooter",
      title: "Home WiFi Troubleshooter: Fix Slow WiFi, Drops & No Internet | Pulse Speed",
      description:
        "Free step-by-step home WiFi troubleshooting. Fix slow WiFi, WiFi connected but no internet, WiFi keeps disconnecting, dead zones and lag — with live speed, ping and jitter tests.",
      faqs: FAQS,
    }),
});

/* ---------------- Symptom wizard data ---------------- */

type Step = { title: string; detail: string };
type Symptom = { id: string; icon: string; label: string; summary: string; steps: Step[]; tool?: { to: string; label: string } };

const SYMPTOMS: Symptom[] = [
  {
    id: "no-internet",
    icon: "🚫",
    label: "Connected, but no internet",
    summary: "Your device talks to the router, but the router can't reach the internet.",
    tool: { to: "/ping-ip", label: "Ping 8.8.8.8" },
    steps: [
      { title: "Check other devices", detail: "If every device has no internet, the problem is the router or provider — not your phone or laptop." },
      { title: "Restart modem and router", detail: "Unplug both for 30 seconds. Plug the modem in first, wait until its lights are steady, then the router." },
      { title: "Look at the router lights", detail: "A red or orange 'Internet' / 'WAN' light usually means the line from your provider is down." },
      { title: "Check for an outage", detail: "Visit your provider's status page or app using mobile data." },
      { title: "Try a cable", detail: "Plug a laptop directly into the router. If it works by cable, the Wi-Fi settings are the issue." },
      { title: "Change DNS", detail: "If some sites open but others don't, set DNS to 1.1.1.1 or 8.8.8.8 on the router or device." },
    ],
  },
  {
    id: "slow",
    icon: "🐢",
    label: "Wi-Fi is slow",
    summary: "Speeds are lower than what you pay for.",
    tool: { to: "/", label: "Run a speed test" },
    steps: [
      { title: "Test near the router", detail: "Run a speed test right next to the router. If it's fast there, the issue is range or walls, not your plan." },
      { title: "Test by cable", detail: "If even a cable is slow, contact your provider — the line itself is slow." },
      { title: "Switch to 5 GHz", detail: "Connect to the 5 GHz network (often named with '5G'). It's far faster than 2.4 GHz at short range." },
      { title: "Find heavy users", detail: "Pause downloads, cloud backups, game updates and 4K streams on other devices, then re-test." },
      { title: "Change the channel", detail: "Neighbours on the same channel slow you down. See the channel guide below." },
      { title: "Update or replace the router", detail: "Routers older than ~5 years (Wi-Fi 4/5) can bottleneck modern plans. Update firmware first." },
    ],
  },
  {
    id: "dropping",
    icon: "📉",
    label: "Keeps disconnecting",
    summary: "Wi-Fi drops out or reconnects randomly.",
    tool: { to: "/stability-test", label: "Run a stability test" },
    steps: [
      { title: "Note when it happens", detail: "Every device at once points to the router; only one device points to that device." },
      { title: "Check router heat & placement", detail: "Routers in cupboards overheat and reboot. Give it open air and a high shelf." },
      { title: "Update firmware", detail: "Open the router app or admin page and install updates — they often fix drop-outs." },
      { title: "Turn off device power-saving", detail: "On laptops, disable 'Allow the computer to turn off this device' for the Wi-Fi adapter." },
      { title: "Split band names", detail: "If 2.4 and 5 GHz share one name, devices may flip between them. Try separate names." },
      { title: "Forget and rejoin", detail: "Forget the network on the device and reconnect with the password." },
    ],
  },
  {
    id: "dead-zone",
    icon: "🏚️",
    label: "Weak signal in some rooms",
    summary: "Wi-Fi is fine near the router but bad elsewhere.",
    steps: [
      { title: "Move the router", detail: "Central, high, in the open. Not behind a TV, inside a cabinet or near the floor." },
      { title: "Avoid blockers", detail: "Concrete, brick, mirrors, metal, fish tanks and floor heating absorb Wi-Fi." },
      { title: "Use 2.4 GHz far away", detail: "It travels further through walls, at lower speed." },
      { title: "Add a mesh system", detail: "Mesh points placed halfway between the router and the dead zone give the best coverage." },
      { title: "Use powerline or cable backhaul", detail: "Wiring mesh points with Ethernet gives full speed on every floor." },
    ],
  },
  {
    id: "gaming",
    icon: "🎮",
    label: "Lag in games or video calls",
    summary: "High ping, jitter or freezing on calls.",
    tool: { to: "/global", label: "Check global latency" },
    steps: [
      { title: "Use a cable if possible", detail: "Ethernet removes almost all Wi-Fi jitter. It's the single biggest fix." },
      { title: "Stay on 5 GHz", detail: "Less interference means steadier ping." },
      { title: "Enable QoS / gaming mode", detail: "Many routers can prioritise your console or work laptop." },
      { title: "Stop background uploads", detail: "Cloud photo backups and uploads ruin ping. Pause them during matches or calls." },
      { title: "Check jitter, not just speed", detail: "Jitter under 10 ms and 0% loss matter more than raw download speed." },
    ],
  },
  {
    id: "cant-join",
    icon: "🔑",
    label: "Can't connect at all",
    summary: "Wrong password errors or the network doesn't appear.",
    steps: [
      { title: "Check the password", detail: "It's case-sensitive. The default is often printed on the router's sticker." },
      { title: "Toggle Wi-Fi / airplane mode", detail: "Turn it off and on on the device." },
      { title: "Forget the network", detail: "Remove the saved network and rejoin." },
      { title: "Look for the right band", detail: "Older gadgets can't see 5 GHz or 6 GHz — they need the 2.4 GHz network." },
      { title: "Check security mode", detail: "Very old devices may fail on WPA3-only. Use 'WPA2/WPA3 mixed' mode." },
      { title: "Check device limits / MAC filtering", detail: "Some routers block new devices — check the router app's device list." },
    ],
  },
];

/* ---------------- Live checks ---------------- */

type Check = { label: string; value: string; status: "good" | "warn" | "bad" | "idle" };

function useLiveChecks() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    const out: Check[] = [];
    const online = navigator.onLine;
    out.push({ label: "Browser online", value: online ? "Yes" : "No", status: online ? "good" : "bad" });

    const conn = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection;
    if (conn?.effectiveType) {
      out.push({
        label: "Connection estimate",
        value: `${conn.effectiveType.toUpperCase()}${conn.downlink ? ` · ~${conn.downlink} Mbps` : ""}`,
        status: conn.effectiveType === "4g" ? "good" : "warn",
      });
    }

    // Latency: 5 small requests to our own site
    const times: number[] = [];
    let fails = 0;
    for (let i = 0; i < 6; i++) {
      const t = performance.now();
      try {
        await fetch(`/favicon.png?wifi=${Date.now()}-${i}`, { cache: "no-store" });
        times.push(performance.now() - t);
      } catch {
        fails++;
      }
    }
    if (times.length > 1) times.shift(); // drop warm-up
    if (times.length) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      let jitter = 0;
      for (let i = 1; i < times.length; i++) jitter += Math.abs(times[i] - times[i - 1]);
      jitter = times.length > 1 ? jitter / (times.length - 1) : 0;
      out.push({ label: "Response time", value: `${Math.round(avg)} ms`, status: avg < 80 ? "good" : avg < 200 ? "warn" : "bad" });
      out.push({ label: "Jitter", value: `${Math.round(jitter)} ms`, status: jitter < 15 ? "good" : jitter < 40 ? "warn" : "bad" });
    }
    out.push({ label: "Failed requests", value: `${fails} of 6`, status: fails === 0 ? "good" : fails < 2 ? "warn" : "bad" });

    // DNS check via a cross-origin fetch
    const t = performance.now();
    try {
      await fetch(`https://www.google.com/generate_204?t=${Date.now()}`, { mode: "no-cors", cache: "no-store" });
      const ms = performance.now() - t;
      out.push({ label: "Reach the wider internet", value: `${Math.round(ms)} ms`, status: ms < 300 ? "good" : "warn" });
    } catch {
      out.push({ label: "Reach the wider internet", value: "Failed", status: "bad" });
    }

    setChecks(out);
    setRunning(false);
  }

  return { checks, running, run };
}

function verdict(checks: Check[]) {
  if (!checks.length) return null;
  if (checks.some((c) => c.status === "bad")) return { color: RED, text: "Problems found — follow the matching symptom below." };
  if (checks.some((c) => c.status === "warn")) return { color: AMBER, text: "Working, but not ideal. Try the speed and placement tips." };
  return { color: TEAL, text: "Your connection looks healthy right now." };
}

/* ---------------- UI helpers ---------------- */

const card: React.CSSProperties = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 };
const h2: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: TEXT, margin: "0 0 6px" };
const sub: React.CSSProperties = { color: MUTED, fontSize: 14, margin: "0 0 18px", lineHeight: 1.6 };
const statusColor = (s: Check["status"]) => (s === "good" ? TEAL : s === "warn" ? AMBER : s === "bad" ? RED : MUTED);

function HomeWifiPage() {
  const { checks, running, run } = useLiveChecks();
  const [symptomId, setSymptomId] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const wizardRef = useRef<HTMLDivElement>(null);
  const symptom = SYMPTOMS.find((s) => s.id === symptomId) ?? null;
  const v = verdict(checks);

  useEffect(() => {
    if (symptomId) wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [symptomId]);

  const doneCount = symptom ? symptom.steps.filter((_, i) => done[`${symptom.id}-${i}`]).length : 0;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", color: TEXT_SEC }}>
      <header style={{ textAlign: "center", marginBottom: 36 }}>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: `linear-gradient(135deg,${TEAL},${PURPLE})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 10,
          }}
        >
          Home Wi-Fi Troubleshooter
        </h1>
        <p style={{ color: MUTED, fontSize: 15, maxWidth: 680, margin: "0 auto", lineHeight: 1.6 }}>
           Fix slow Wi-Fi, "connected but no internet", constant drop-outs and dead zones at home. Run a free live health check, pick your symptom below, and follow simple step-by-step fixes — no tech skills needed.
        </p>
      </header>

      {/* Live check */}
      <section style={card}>
<h2 style={h2}>1. Quick Wi-Fi health check</h2>
        <p style={sub}>Free internet speed, ping and jitter test — checks your connection from this browser in a few seconds.</p>
        <button
          onClick={run}
          disabled={running}
          style={{
            padding: "12px 22px",
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg,${TEAL},${PURPLE})`,
            color: "#04150f",
            fontWeight: 700,
            fontSize: 15,
            cursor: running ? "wait" : "pointer",
            opacity: running ? 0.6 : 1,
          }}
        >
          {running ? "Checking…" : checks.length ? "Check again" : "Run health check"}
        </button>
        {checks.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginTop: 18 }}>
              {checks.map((c) => (
                <div key={c.label} style={{ background: INNER, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: statusColor(c.status), fontFamily: "'DM Mono', monospace" }}>{c.value}</div>
                </div>
              ))}
            </div>
            {v && (
              <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 10, border: `1px solid ${v.color}55`, color: v.color, fontSize: 14 }}>
                {v.text}
              </div>
            )}
          </>
        )}
      </section>

      {/* Symptom picker */}
      <section style={card}>
        <h2 style={h2}>2. What's wrong with your Wi-Fi? Pick a symptom</h2>
        <p style={sub}>Pick the one that sounds most like yours.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }}>
          {SYMPTOMS.map((s) => {
            const active = s.id === symptomId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSymptomId(s.id)}
                style={{
                  textAlign: "left",
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${active ? TEAL : BORDER}`,
                  background: active ? "rgba(0,212,170,0.08)" : INNER,
                  color: TEXT,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{s.summary}</div>
              </button>
            );
          })}
        </div>
      </section>

      {symptom && (
        <section ref={wizardRef} style={{ ...card, borderColor: `${TEAL}55` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h2 style={h2}>
              {symptom.icon} {symptom.label}
            </h2>
            <span style={{ fontSize: 13, color: TEAL }}>
              {doneCount} / {symptom.steps.length} tried
            </span>
          </div>
          <p style={sub}>Work through these in order. Tick each one off as you try it.</p>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {symptom.steps.map((st, i) => {
              const key = `${symptom.id}-${i}`;
              const checked = !!done[key];
              return (
                <li key={key}>
                  <label
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: 14,
                      borderRadius: 12,
                      background: INNER,
                      border: `1px solid ${checked ? `${TEAL}55` : BORDER}`,
                      cursor: "pointer",
                      opacity: checked ? 0.7 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setDone((d) => ({ ...d, [key]: !d[key] }))}
                      style={{ marginTop: 3, accentColor: TEAL }}
                    />
                    <span>
                      <span style={{ display: "block", fontWeight: 700, color: TEXT, fontSize: 14, marginBottom: 3 }}>
                        {i + 1}. {st.title}
                      </span>
                      <span style={{ fontSize: 13, lineHeight: 1.6 }}>{st.detail}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ol>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {symptom.tool && (
              <Link
                to={symptom.tool.to}
                style={{ padding: "10px 16px", borderRadius: 10, background: `${TEAL}1a`, border: `1px solid ${TEAL}`, color: TEAL, fontWeight: 600, fontSize: 14, textDecoration: "none" }}
              >
                {symptom.tool.label} →
              </Link>
            )}
            {doneCount === symptom.steps.length && (
              <span style={{ fontSize: 14, color: AMBER, alignSelf: "center" }}>
                Still broken? Contact your internet provider — the problem is likely on their side or the router needs replacing.
              </span>
            )}
          </div>
        </section>
      )}

      {/* Placement */}
      <section style={card}>
        <h2 style={h2}>Best router placement for better Wi-Fi signal: do's and don'ts</h2>
        <p style={sub}>Where the router sits matters more than most settings.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          <List color={TEAL} title="✅ Do" items={["Put it in the middle of the home", "Raise it high — a shelf, not the floor", "Keep it in open air", "Point antennas up and sideways", "Restart it once a month"]} />
          <List color={RED} title="❌ Don't" items={["Hide it in a cupboard or behind a TV", "Place it next to a microwave or baby monitor", "Put it near mirrors, metal or fish tanks", "Leave it in a far corner or basement", "Stack it on top of other electronics"]} />
        </div>
      </section>

      {/* Bands & channels */}
      <section style={card}>
        <h2 style={h2}>2.4 GHz vs 5 GHz vs 6 GHz: which Wi-Fi band and channel is best?</h2>
        <p style={sub}>Most routers do this automatically. If you have trouble, set it by hand in the router app.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: MUTED, textAlign: "left" }}>
                {["Band", "Range", "Speed", "Best channels", "Use it for"].map((h) => (
                  <th key={h} style={{ padding: "10px 8px", borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["2.4 GHz", "Longest", "Slowest", "1, 6 or 11 (20 MHz)", "Far rooms, smart plugs, cameras"],
                ["5 GHz", "Medium", "Fast", "36–48 or 149–161 (80 MHz)", "Laptops, phones, TVs, gaming"],
                ["6 GHz (Wi-Fi 6E/7)", "Shortest", "Fastest", "Auto (160 MHz)", "New devices in the same room"],
              ].map((r) => (
                <tr key={r[0]}>
                  {r.map((c, i) => (
                    <td key={i} style={{ padding: "10px 8px", borderBottom: `1px solid ${BORDER}`, color: i === 0 ? TEXT : TEXT_SEC, fontWeight: i === 0 ? 700 : 400 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Signal guide */}
      <section style={card}>
        <h2 style={h2}>Wi-Fi signal strength explained: what the bars and dBm numbers mean</h2>
        <p style={sub}>On laptops you can see the exact signal (in dBm). Closer to 0 is better.</p>
        <div style={{ display: "grid", gap: 8 }}>
          {[
            ["-30 to -50 dBm", "Excellent", TEAL, "Full speed, perfect for everything"],
            ["-51 to -65 dBm", "Good", TEAL, "Smooth streaming and calls"],
            ["-66 to -70 dBm", "Fair", AMBER, "Browsing OK, video may stutter"],
            ["-71 to -80 dBm", "Weak", RED, "Drop-outs and slow speeds likely"],
            ["below -80 dBm", "Unusable", RED, "Move closer or add a mesh point"],
          ].map(([r, l, c, d]) => (
            <div key={r} style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 14px", background: INNER, borderRadius: 10, border: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", minWidth: 130, color: TEXT }}>{r}</span>
              <span style={{ color: c, fontWeight: 700, minWidth: 80 }}>{l}</span>
              <span style={{ fontSize: 13 }}>{d}</span>
            </div>
          ))}
        </div>
        <p style={{ ...sub, marginTop: 14, marginBottom: 0 }}>
          Windows: open Command Prompt and type <code style={{ color: TEAL }}>netsh wlan show interfaces</code> (look at "Signal"). Mac: hold Option and click the Wi-Fi icon (look at "RSSI").
        </p>
      </section>

      {/* FAQ */}
      <section style={card}>
        <h2 style={h2}>Home Wi-Fi troubleshooting: frequently asked questions</h2>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {FAQS.map((f) => (
            <details key={f.q} style={{ background: INNER, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: TEXT, fontSize: 14 }}>{f.q}</summary>
              <p style={{ fontSize: 13, lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function List({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div style={{ background: INNER, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 700, color, marginBottom: 10 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13 }}>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
