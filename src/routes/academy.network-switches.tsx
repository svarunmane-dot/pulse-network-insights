import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toolHead } from "@/lib/seo";
import heroImg from "@/assets/academy-lesson15-hero.jpg";

export const Route = createFileRoute("/academy/network-switches")({
  head: () =>
    toolHead({
      path: "/academy/network-switches",
      title: "Lesson 15: How Network Switches Work | Pulse Speed Academy",
      description:
        "Learn how network switches forward Ethernet frames using MAC address tables, ports, learning, flooding and aging — with an interactive switch MAC learning simulator.",
      name: "Lesson 15 – How Network Switches Work",
      category: "EducationalApplication",
      faqs: [
        {
          q: "What does a network switch use to forward Ethernet frames?",
          a: "A traditional Layer 2 switch uses the destination MAC address of an Ethernet frame to decide which port to forward it out of. It does not use IP addresses for normal Layer 2 forwarding.",
        },
        {
          q: "How does a switch learn MAC addresses?",
          a: "A switch learns by examining the source MAC address of incoming frames and recording the port the frame arrived on. This mapping is stored in the MAC address table (also called the CAM table).",
        },
        {
          q: "What happens when a switch does not know the destination MAC address?",
          a: "When the destination MAC is not in the MAC table, the switch floods the frame out of all relevant ports except the port it arrived on. This is called unknown unicast flooding.",
        },
        {
          q: "What is the difference between a switch and a hub?",
          a: "A hub forwards every frame out of every port, while a switch learns which MAC address is on which port and forwards known unicast traffic only to the correct port, reducing collisions and improving performance.",
        },
      ],
    }),
  component: Lesson15,
});

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ color: "#fff", fontSize: 24, marginTop: 40, letterSpacing: "-0.3px" }}>{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.75, margin: "10px 0" }}>{children}</p>
);
const B = ({ children }: { children: React.ReactNode }) => (
  <strong style={{ color: "#fff" }}>{children}</strong>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul style={{ color: "#c8d0e0", fontSize: 16, lineHeight: 1.8, paddingLeft: 22 }}>{children}</ul>
);

function Pre({ children }: { children: string }) {
  return (
    <pre
      style={{
        border: "1px solid #1f2740",
        borderRadius: 12,
        padding: 18,
        background: "#0f1422",
        color: "#c8d0e0",
        fontFamily: "monospace",
        fontSize: 13.5,
        lineHeight: 1.6,
        overflowX: "auto",
        margin: "14px 0",
      }}
    >
      {children}
    </pre>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ border: "1px solid #1f2740", borderRadius: 12, overflow: "hidden", margin: "14px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead style={{ background: "#0f1422" }}>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  color: "#fff",
                  fontWeight: 600,
                  borderBottom: "1px solid #1f2740",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 12px",
                    color: "#c8d0e0",
                    borderTop: i === 0 ? "none" : "1px solid #1f2740",
                    fontFamily: /[0-9A-F]{2}:[0-9A-F]{2}|port\s?\d|Gi\d/i.test(c) ? "monospace" : undefined,
                  }}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TryItCard({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        marginTop: 14,
        padding: 16,
        borderRadius: 12,
        border: "1px solid rgba(0,212,170,0.4)",
        background: "linear-gradient(135deg, rgba(0,212,170,0.10), rgba(155,143,232,0.08))",
        textDecoration: "none",
      }}
    >
      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>🧪 TRY IT NOW</div>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginTop: 4 }}>{title}</div>
      <div style={{ color: "#c8d0e0", fontSize: 13, marginTop: 4 }}>{body}</div>
    </Link>
  );
}

function Callout({ tone, title, children }: { tone: "info" | "warn"; title: string; children: React.ReactNode }) {
  const teal = tone === "info";
  return (
    <div
      style={{
        marginTop: 14,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${teal ? "rgba(0,212,170,0.35)" : "rgba(255,180,80,0.35)"}`,
        background: teal ? "rgba(0,212,170,0.06)" : "rgba(255,180,80,0.06)",
      }}
    >
      <div style={{ color: teal ? "#00D4AA" : "#ffb450", fontWeight: 700, fontSize: 13, letterSpacing: 0.4 }}>
        {title}
      </div>
      <div style={{ color: "#c8d0e0", fontSize: 15, lineHeight: 1.7, marginTop: 6 }}>{children}</div>
    </div>
  );
}

/* ---------------- Interactive Switch MAC Learning Simulator ---------------- */

type Device = { id: string; port: number; mac: string; ip: string };

const DEVICES: Device[] = [
  { id: "PC1", port: 1, mac: "AA:AA:AA:AA:AA:01", ip: "192.168.1.11" },
  { id: "PC2", port: 2, mac: "BB:BB:BB:BB:BB:02", ip: "192.168.1.12" },
  { id: "PC3", port: 3, mac: "CC:CC:CC:CC:CC:03", ip: "192.168.1.13" },
  { id: "Server", port: 4, mac: "DD:DD:DD:DD:DD:04", ip: "192.168.1.20" },
];

type TableEntry = { mac: string; port: number; device: string };

type Step = {
  label: string;
  from: "src" | "switch" | "dest";
  text: string;
  learn?: TableEntry; // applied to MAC table when this step is revealed
};

function macKnown(table: TableEntry[], mac: string) {
  return table.find((e) => e.mac === mac);
}

function buildSteps(table: TableEntry[], src: Device, dest: Device | null, isBroadcast: boolean): Step[] {
  const steps: Step[] = [];

  // 1. Frame sent
  const dstLabel = isBroadcast ? "FF:FF:FF:FF:FF:FF (broadcast)" : dest ? `${dest.mac} (${dest.id})` : "unknown";
  steps.push({
    label: "1️⃣ FRAME SENT",
    from: "src",
    text: `${src.id} sends a frame out Port ${src.port} → dest MAC ${dstLabel} (src MAC ${src.mac})`,
  });

  // 2. MAC learning (source)
  const already = macKnown(table, src.mac);
  if (!already) {
    steps.push({
      label: "2️⃣ MAC LEARNED",
      from: "switch",
      text: `Switch records source ${src.mac} → Port ${src.port}`,
      learn: { mac: src.mac, port: src.port, device: src.id },
    });
  } else {
    steps.push({
      label: "2️⃣ SOURCE ALREADY KNOWN",
      from: "switch",
      text: `${src.mac} is already in the table (Port ${already.port}) — no new entry added.`,
    });
  }

  // 3. Check destination
  steps.push({
    label: "3️⃣ CHECK DESTINATION",
    from: "switch",
    text: isBroadcast
      ? "Destination is FF:FF:FF:FF:FF:FF — a broadcast address."
      : `Switch looks up destination ${dest!.mac} in the MAC table.`,
  });

  // 4. Outcome
  if (isBroadcast) {
    steps.push({
      label: "4️⃣ BROADCAST FLOOD",
      from: "switch",
      text: `Broadcast frame is flooded out every port in the broadcast domain, except Port ${src.port}.`,
    });
  } else {
    const d = dest!;
    const known = macKnown(table, d.mac) ?? macKnown([...table], d.mac);
    // Note: learn step hasn't been applied to the closure's table yet, but dest learning
    // only happens from source MACs, and dest hasn't sent a frame, so it can't be known here.
    if (known && known.mac !== src.mac) {
      steps.push({
        label: "4️⃣ FORWARD",
        from: "dest",
        text: `Destination known (${d.mac} → Port ${known.port}). Frame forwarded only out Port ${known.port}.`,
      });
    } else {
      steps.push({
        label: "4️⃣ UNKNOWN UNICAST FLOOD",
        from: "switch",
        text: `Destination ${d.mac} is not in the table. Frame is flooded out all ports except Port ${src.port}. When ${d.id} replies, the switch will learn its MAC.`,
      });
    }
  }

  return steps;
}

function SwitchSimulator() {
  const [table, setTable] = useState<TableEntry[]>([]);
  const [srcId, setSrcId] = useState<string>("PC1");
  const [dstId, setDstId] = useState<string>("PC2");
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [revealed, setRevealed] = useState(0);

  const src = DEVICES.find((d) => d.id === srcId)!;
  const isBroadcast = dstId === "BROADCAST";
  const dest = isBroadcast ? null : DEVICES.find((d) => d.id === dstId)!;

  const sendFrame = () => {
    const newTable = [...table];
    // Pre-compute steps against the CURRENT table (before this frame's learning).
    const built = buildSteps(newTable, src, dest, isBroadcast);
    setSteps(built);
    setRevealed(0);
  };

  const next = () => {
    if (!steps) return;
    const idx = revealed;
    const step = steps[idx];
    if (step?.learn) {
      setTable((t) => (t.some((e) => e.mac === step.learn!.mac) ? t : [...t, step.learn!]));
    }
    setRevealed((r) => r + 1);
  };

  const reset = () => {
    setSteps(null);
    setRevealed(0);
  };
  const resetAll = () => {
    setTable([]);
    setSteps(null);
    setRevealed(0);
  };

  const done = steps !== null && revealed >= steps.length;

  return (
    <div
      style={{
        border: "1px solid rgba(0,212,170,0.35)",
        borderRadius: 16,
        padding: 20,
        background: "linear-gradient(135deg, rgba(0,212,170,0.06), rgba(155,143,232,0.05))",
        margin: "16px 0",
      }}
    >
      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        💡 PULSE-SPEED INTERACTIVE LAB
      </div>
      <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 4 }}>Switch MAC Learning Simulator</div>
      <p style={{ color: "#c8d0e0", fontSize: 14, margin: "6px 0 14px" }}>
        Pick a source and destination, then send a frame. Watch the switch learn the source MAC and decide whether to
        forward or flood.
      </p>

      <Pre>{`  PC1          PC2          PC3          Server
   │            │            │            │
   └────────────┴────────────┴────────────┘
                    │
                 SWITCH (empty table)`}</Pre>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
        <label style={{ color: "#c8d0e0", fontSize: 13 }}>
          Source:{" "}
          <select
            value={srcId}
            onChange={(e) => setSrcId(e.target.value)}
            style={{
              background: "#0f1422",
              color: "#fff",
              border: "1px solid #1f2740",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
            }}
          >
            {DEVICES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} (Port {d.port})
              </option>
            ))}
          </select>
        </label>
        <label style={{ color: "#c8d0e0", fontSize: 13 }}>
          Destination:{" "}
          <select
            value={dstId}
            onChange={(e) => setDstId(e.target.value)}
            style={{
              background: "#0f1422",
              color: "#fff",
              border: "1px solid #1f2740",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 13,
            }}
          >
            {DEVICES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} ({d.mac})
              </option>
            ))}
            <option value="BROADCAST">Broadcast FF:FF:FF:FF:FF:FF</option>
          </select>
        </label>
        <button
          onClick={sendFrame}
          style={{
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            border: "none",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Send Frame →
        </button>
        <button
          onClick={resetAll}
          style={{
            border: "1px solid #1f2740",
            background: "#0f1422",
            color: "#c8d0e0",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ↻ Reset Table
        </button>
      </div>

      {/* MAC table */}
      <div style={{ marginTop: 18 }}>
        <div style={{ color: "#9B8FE8", fontWeight: 700, fontSize: 13, letterSpacing: 0.4 }}>SWITCH MAC ADDRESS TABLE</div>
        {table.length === 0 ? (
          <div
            style={{
              marginTop: 8,
              border: "1px dashed #1f2740",
              borderRadius: 10,
              padding: 14,
              color: "#6b7794",
              fontSize: 13,
              fontFamily: "monospace",
              textAlign: "center",
            }}
          >
            (empty — no MAC addresses learned yet)
          </div>
        ) : (
          <Table head={["MAC Address", "Port", "Device"]} rows={table.map((e) => [e.mac, `Port ${e.port}`, e.device])} />
        )}
      </div>

      {/* Step log */}
      {steps && (
        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {steps.slice(0, revealed).map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === "dest" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "90%",
                  border: `1px solid ${m.from === "dest" ? "rgba(0,212,170,0.4)" : "#1f2740"}`,
                  background: m.from === "dest" ? "rgba(0,212,170,0.10)" : "#0f1422",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: m.from === "dest" ? "#00D4AA" : m.from === "switch" ? "#9B8FE8" : "#ffb450",
                  }}
                >
                  {m.from === "src" ? "💻 SOURCE" : m.from === "switch" ? "🔀 SWITCH" : "📦 DESTINATION"} · {m.label}
                </div>
                <div style={{ color: "#c8d0e0", fontSize: 14, marginTop: 4, fontFamily: "monospace" }}>{m.text}</div>
              </div>
            </div>
          ))}
          {done && (
            <div style={{ color: "#00D4AA", fontWeight: 700, fontSize: 14, marginTop: 4 }}>
              ✅ Frame processing complete. Send another frame to grow the table.
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        {steps && !done && (
          <button
            onClick={next}
            style={{
              background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
              color: "#04150f",
              border: "none",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Next step →
          </button>
        )}
        {steps && revealed > 0 && (
          <button
            onClick={reset}
            style={{
              border: "1px solid #1f2740",
              background: "#0f1422",
              color: "#c8d0e0",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↻ Replay this frame
          </button>
        )}
      </div>

      <Callout tone="info" title="Try this sequence">
        Send <B>PC1 → PC2</B> (table learns PC1, floods to PC2). Then send <B>PC2 → PC1</B> (table learns PC2, forwards
        only to PC1 because PC1 is now known). Then send <B>PC1 → Server</B> — Server is unknown, so it floods again.
      </Callout>
    </div>
  );
}

/* ---------------- Unknown MAC Challenge ---------------- */

function UnknownMacChallenge() {
  const [guess, setGuess] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const CORRECT = "FLOOD";

  return (
    <div
      style={{
        border: "1px solid rgba(155,143,232,0.35)",
        borderRadius: 16,
        padding: 20,
        background: "linear-gradient(135deg, rgba(155,143,232,0.06), rgba(0,212,170,0.05))",
        margin: "16px 0",
      }}
    >
      <div style={{ fontSize: 12, color: "#9B8FE8", fontWeight: 700, letterSpacing: 0.5 }}>🎯 CHALLENGE</div>
      <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 4 }}>Unknown MAC Challenge</div>
      <p style={{ color: "#c8d0e0", fontSize: 14, margin: "6px 0 14px" }}>
        The switch's MAC table only contains <B>PC1</B> (Port 1). PC1 now sends a frame destined for{" "}
        <B>DD:DD:DD:DD:DD:04</B> (the Server), which has never sent any traffic. What does the switch do?
      </p>
      <Pre>{`MAC Address Table
------------------------
AA:AA:AA:AA:AA:01 → Port 1   (PC1)

PC1 sends frame → dest DD:DD:DD:DD:DD:04 (Server)`}</Pre>

      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        {[
          { v: "FORWARD", t: "Forward the frame only to the Server's port" },
          { v: "FLOOD", t: "Flood it out all ports except Port 1" },
          { v: "DROP", t: "Drop the frame immediately" },
        ].map((o) => {
          const picked = guess === o.v;
          const isRight = o.v === CORRECT;
          let border = "1px solid #1f2740";
          let bg = "#0b0f1a";
          let color = "#c8d0e0";
          if (revealed) {
            if (isRight) {
              border = "1px solid #00D4AA";
              bg = "rgba(0,212,170,0.12)";
              color = "#00D4AA";
            } else if (picked) {
              border = "1px solid #ff6b8a";
              bg = "rgba(233,69,96,0.10)";
              color = "#ff6b8a";
            }
          }
          return (
            <button
              key={o.v}
              onClick={() => {
                setGuess(o.v);
                setRevealed(true);
              }}
              disabled={revealed}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 8,
                border,
                background: bg,
                color,
                cursor: revealed ? "default" : "pointer",
                fontSize: 14,
                opacity: revealed && !picked && !isRight ? 0.6 : 1,
              }}
            >
              <strong>{o.v}</strong> — {o.t}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 10,
            border: "1px solid rgba(0,212,170,0.3)",
            background: "rgba(0,212,170,0.06)",
            color: "#c8d0e0",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {guess === CORRECT ? (
            <>
              ✅ <B>Correct!</B> The destination MAC is not in the table, so the switch <B>floods</B> the frame out all
              ports except Port 1. When the Server replies, the switch learns{" "}
              <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>DD:DD:DD:DD:DD:04 → Port 4</code> from the
              reply's source MAC.
            </>
          ) : (
            <>
              ❌ Not quite. The switch doesn't drop unknown unicast, and it can't forward to a port it doesn't know. It{" "}
              <B>floods</B> the frame out all ports except Port 1 so the real destination has a chance to reply.
            </>
          )}
        </div>
      )}
      {revealed && (
        <button
          onClick={() => {
            setGuess(null);
            setRevealed(false);
          }}
          style={{
            marginTop: 10,
            border: "1px solid #1f2740",
            background: "#0f1422",
            color: "#c8d0e0",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ↻ Try again
        </button>
      )}
    </div>
  );
}

/* ---------------- Lesson ---------------- */

function Lesson15() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
      <nav style={{ fontSize: 13, color: "#6b7794", marginBottom: 14 }}>
        <Link to="/academy" style={{ color: "#00D4AA", textDecoration: "none" }}>
          ← Network Engineer Academy
        </Link>
      </nav>

      <div style={{ fontSize: 12, color: "#00D4AA", fontWeight: 700, letterSpacing: 0.5 }}>
        LESSON 15 · BEGINNER · ⏱️ 12–15 MIN READ
      </div>
      <h1
        style={{
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: "-1px",
          margin: "8px 0 12px",
          color: "#fff",
          lineHeight: 1.1,
        }}
      >
        How Network Switches Work – MAC Tables, Ports and Ethernet Frames
      </h1>
      <p style={{ color: "#c8d0e0", fontSize: 18, lineHeight: 1.6, margin: 0 }}>
        Once a frame reaches a switch, how does the switch know where to send it? Meet the network switch and its MAC
        address table — the engine of local Ethernet delivery.
      </p>

      <img
        src={heroImg}
        alt="Network switch with Ethernet ports connected to a PC, printer and server"
        width={1024}
        height={1024}
        style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid #1f2740", margin: "24px 0" }}
      />

      <H2>Introduction</H2>
      <P>You now know that:</P>
      <UL>
        <li>IP addresses identify devices at Layer 3.</li>
        <li>MAC addresses identify network interfaces at Layer 2.</li>
        <li>ARP helps discover the MAC address associated with an IPv4 address.</li>
      </UL>
      <P>But there's another important question:</P>
      <P>
        <B>Once an Ethernet frame reaches a switch, how does the switch know where to send it?</B>
      </P>
      <P>That's the job of the network switch.</P>
      <P>
        A switch connects devices on a local network and uses MAC addresses to intelligently forward Ethernet frames.
      </P>

      <H2>What is a Network Switch?</H2>
      <P>A network switch is a device that connects multiple devices on the same local network.</P>
      <Pre>{`             ┌─────────────┐
             │   SWITCH    │
             └──────┬──────┘
            ┌───────┼───────┐
            │       │       │
           PC      Printer  Server`}</Pre>
      <P>Each device connects to a physical switch port.</P>
      <P>Modern switches can have:</P>
      <UL>
        <li>8 ports</li>
        <li>24 ports</li>
        <li>48 ports</li>
        <li>Hundreds of ports in larger networks</li>
      </UL>

      <H2>Switch vs Hub</H2>
      <P>Older networks used hubs.</P>
      <P>A hub receives a frame and sends it out of every port.</P>
      <P>A switch is smarter.</P>
      <P>A switch learns which MAC address is connected to which port and forwards the frame only where it needs to go.</P>
      <Pre>{`Hub
PC1 ──► HUB ──► PC2
          ├──► PC3
          └──► PC4

Switch
PC1 ──► SWITCH ──► PC2`}</Pre>
      <P>The switch doesn't normally need to send the frame to PC3 and PC4.</P>

      <H2>What is an Ethernet Frame?</H2>
      <P>When data travels across an Ethernet network, it is encapsulated into an Ethernet frame.</P>
      <P>A simplified frame looks like:</P>
      <Pre>{`┌──────────────┬──────────────┬──────────┐
│ Destination  │ Source MAC  │ Payload  │
│ MAC Address  │ Address     │   Data   │
└──────────────┴──────────────┴──────────┘`}</Pre>
      <P>The switch is particularly interested in:</P>
      <UL>
        <li>Source MAC</li>
        <li>Destination MAC</li>
      </UL>
      <P>These tell the switch where the frame came from and where it needs to go.</P>

      <H2>The Switch's MAC Address Table</H2>
      <P>A switch maintains a table that maps:</P>
      <Pre>{`MAC Address → Switch Port`}</Pre>
      <P>For example:</P>
      <Table
        head={["MAC Address", "Port"]}
        rows={[
          ["AA:AA:AA:AA:AA:01", "Port 1"],
          ["BB:BB:BB:BB:BB:02", "Port 2"],
          ["CC:CC:CC:CC:CC:03", "Port 3"],
          ["DD:DD:DD:DD:DD:04", "Port 4"],
        ]}
      />
      <P>This is commonly called the:</P>
      <UL>
        <li>MAC Address Table</li>
        <li>CAM table</li>
        <li>MAC table</li>
        <li>Forwarding table</li>
      </UL>

      <H2>How Does the Switch Learn?</H2>
      <P>Here's the clever part.</P>
      <P>The switch doesn't necessarily need you to manually configure every MAC address. It learns.</P>
      <Pre>{`Imagine:

PC1
MAC: AA:AA:AA:AA:AA:01
        │
        │
      Port 1
        │
        ▼
     SWITCH

PC1 sends a frame.

The switch looks at the source MAC address:
AA:AA:AA:AA:AA:01

It sees that the frame arrived on:
Port 1

So it learns:
AA:AA:AA:AA:AA:01 → Port 1`}</Pre>
      <P>That's called <B>MAC address learning</B>.</P>

      <H2>Step-by-Step Example</H2>
      <P>Imagine this network:</P>
      <Pre>{`             SWITCH
          ┌─────┼─────┐
          │     │     │
        PC1    PC2    PC3
       Port1  Port2  Port3`}</Pre>
      <P>MAC addresses:</P>
      <Pre>{`PC1 → AA:AA:AA:AA:AA:01
PC2 → BB:BB:BB:BB:BB:02
PC3 → CC:CC:CC:CC:CC:03`}</Pre>
      <P>PC1 sends a frame. The switch sees:</P>
      <Pre>{`Source MAC:  AA:AA:AA:AA:AA:01
The frame arrived on Port 1.`}</Pre>
      <P>The switch records:</P>
      <Pre>{`AA:AA:AA:AA:AA:01 → Port 1`}</Pre>
      <P>Later, PC2 sends a frame. The switch learns:</P>
      <Pre>{`BB:BB:BB:BB:BB:02 → Port 2`}</Pre>
      <P>Eventually:</P>
      <Pre>{`MAC Address Table
AA:AA:AA:AA:AA:01 → Port 1
BB:BB:BB:BB:BB:02 → Port 2
CC:CC:CC:CC:CC:03 → Port 3`}</Pre>
      <P>Now the switch understands its local network.</P>

      <H2>What Happens When the Destination MAC is Known?</H2>
      <P>Suppose PC1 wants to communicate with PC2.</P>
      <P>PC1 sends:</P>
      <Pre>{`Source MAC:      AA:AA:AA:AA:AA:01
Destination MAC: BB:BB:BB:BB:BB:02`}</Pre>
      <P>The switch checks its MAC table. It finds:</P>
      <Pre>{`BB:BB:BB:BB:BB:02 → Port 2`}</Pre>
      <P>So it forwards the frame only through Port 2.</P>
      <Pre>{`PC1
 │
 ▼
Switch
 │
 └────────► PC2`}</Pre>
      <P>PC3 doesn't receive the frame. That's one of the major advantages of a switch.</P>

      <H2>What Happens When the Destination MAC is Unknown?</H2>
      <P>This is where things get interesting.</P>
      <P>Suppose the switch receives a frame destined for:</P>
      <Pre>{`DD:DD:DD:DD:DD:04`}</Pre>
      <P>But that MAC address isn't currently in its table.</P>
      <P>The switch doesn't know which port contains that device.</P>
      <P>
        So it <B>floods</B> the frame out the relevant ports, except the port where the frame arrived.
      </P>
      <Pre>{`             SWITCH
          ┌─────┼─────┐
          │     │     │
         PC1   PC2   PC3
                ▲
             Unknown
             destination`}</Pre>
      <P>
        If the destination device responds, the switch can learn its MAC address from the source MAC of the response.
      </P>

      <H2>What About Broadcast Traffic?</H2>
      <P>Some Ethernet traffic is deliberately sent to everyone on the local broadcast domain.</P>
      <P>The Ethernet broadcast address is:</P>
      <Pre>{`FF:FF:FF:FF:FF:FF`}</Pre>
      <P>The switch floods a broadcast frame to the appropriate ports. This is important for protocols such as ARP.</P>
      <Pre>{`For example:

PC1
"Who has 192.168.1.1?"
        │
        ▼
     SWITCH
    /   |   \\
   ▼    ▼    ▼
 PC2  PC3  Router`}</Pre>
      <P>Everyone receives the broadcast, but only the device owning that IP should respond.</P>

      <Callout tone="info" title="Unknown unicast vs broadcast">
        Both can result in flooding, but they're different. <B>Unknown unicast</B> means the destination MAC isn't in
        the table. <B>Broadcast</B> means the destination MAC is <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>FF:FF:FF:FF:FF:FF</code> and is intentionally sent to everyone.
      </Callout>

      <H2>Switches Don't Normally Use IP Addresses to Forward Frames</H2>
      <P>This is a very important distinction.</P>
      <P>A traditional Layer 2 switch primarily looks at:</P>
      <UL>
        <li>Destination MAC</li>
      </UL>
      <P>Not:</P>
      <UL>
        <li>Destination IP</li>
      </UL>
      <Pre>{`For example:
Destination IP:  192.168.1.50
Destination MAC: AA:BB:CC:DD:EE:FF`}</Pre>
      <P>The Layer 2 switch uses the MAC address to determine where to forward the frame.</P>
      <P>Routers, on the other hand, use IP addresses to make Layer 3 forwarding decisions.</P>

      <H2>Switch vs Router</H2>
      <Table
        head={["Switch", "Router"]}
        rows={[
          ["Primarily Layer 2", "Layer 3"],
          ["Uses MAC addresses", "Uses IP addresses"],
          ["Connects devices within networks/VLANs", "Connects different networks"],
          ["Maintains MAC table", "Maintains routing table"],
          ["Forwards Ethernet frames", "Forwards IP packets"],
        ]}
      />
      <P>
        In real enterprise networks, many switches also have Layer 3 capabilities, so the distinction isn't always as
        simple as "switch = Layer 2, router = Layer 3." But this is the correct starting point for beginners.
      </P>

      <H2>What Happens When Traffic Leaves the Network?</H2>
      <P>Suppose your laptop is:</P>
      <Pre>{`192.168.1.10`}</Pre>
      <P>and wants to reach:</P>
      <Pre>{`8.8.8.8`}</Pre>
      <P>Your laptop determines that 8.8.8.8 is outside its local subnet.</P>
      <P>So it sends the packet toward the default gateway.</P>
      <P>But Ethernet still needs a destination MAC address.</P>
      <P>The laptop uses ARP to discover the router's MAC address.</P>
      <Pre>{`Then:

Laptop
192.168.1.10
     │
     │ Ethernet frame
     │ Destination MAC =
     │ Router's MAC
     ▼
Switch
     │
     ▼
Router
192.168.1.1
     │
     ▼
Internet`}</Pre>
      <Callout tone="info" title="The switch only needs local MAC addresses">
        The switch doesn't need to know Google's MAC address. It only needs to forward the local Ethernet frame toward
        the router.
      </Callout>

      <H2>What is MAC Address Aging?</H2>
      <P>Devices can move, disconnect, or reconnect. So a switch can't keep MAC addresses in its table forever.</P>
      <P>MAC entries have an aging timer. If a MAC address hasn't been seen for a certain period, the switch can remove the entry.</P>
      <P>If traffic from that device appears again, the switch learns the MAC address again. This keeps the MAC table current.</P>

      <H2>What Happens When You Move a Cable?</H2>
      <Pre>{`Imagine:

PC1 → Port 1

The switch learns:
PC1 MAC → Port 1

Now you unplug PC1 and connect it to Port 10.

PC1 sends traffic.

The switch sees the same source MAC arriving on Port 10.

It updates its table:
PC1 MAC → Port 10`}</Pre>
      <P>This is another example of dynamic MAC learning.</P>

      <H2>MAC Address Table in a Real Cisco Switch</H2>
      <P>On many Cisco switches, you can view the MAC address table with:</P>
      <Pre>{`show mac address-table`}</Pre>
      <P>You might see:</P>
      <Pre>{`Vlan    Mac Address       Type       Ports
----    -----------       --------   -----
10      aaaa.aaaa.aaaa    DYNAMIC    Gi1/0/1
10      bbbb.bbbb.bbbb    DYNAMIC    Gi1/0/2
20      cccc.cccc.cccc    DYNAMIC    Gi1/0/10`}</Pre>
      <P>This tells a network engineer:</P>
      <UL>
        <li>Which VLAN the MAC belongs to</li>
        <li>Which MAC address was learned</li>
        <li>Whether it is dynamic/static</li>
        <li>Which switch port it is associated with</li>
      </UL>
      <P>This is extremely useful when troubleshooting.</P>

      <H2>Why Network Engineers Care About MAC Tables</H2>
      <P>Imagine a user says:</P>
      <Pre>{`"My laptop is connected, but I can't access the network."`}</Pre>
      <P>You can investigate:</P>
      <Pre>{`Is the switch port up?
       ↓
Is the MAC address learned?
       ↓
Which port is it on?
       ↓
Which VLAN is the port assigned to?
       ↓
Is the device getting an IP address?`}</Pre>
      <P>The MAC table is often one of the first places a network engineer looks.</P>

      <H2>Common Mistakes</H2>
      <UL>
        <li>
          ❌ <B>A switch sends every frame everywhere.</B> Not when it knows the destination MAC. It forwards known
          unicast traffic toward the correct port.
        </li>
        <li>
          ❌ <B>Switches use IP addresses for normal Layer 2 forwarding.</B> Traditional Layer 2 switching uses MAC
          addresses.
        </li>
        <li>
          ❌ <B>The switch knows every device immediately.</B> It learns MAC addresses by observing traffic.
        </li>
        <li>
          ❌ <B>Unknown unicast and broadcast are the same thing.</B> They're different, although both can result in
          flooding. Unknown unicast: destination MAC isn't in the table. Broadcast: destination MAC is{" "}
          <code style={{ color: "#00D4AA", fontFamily: "monospace" }}>FF:FF:FF:FF:FF:FF</code>.
        </li>
      </UL>

      <H2>💡 Pulse-Speed Interactive Lab</H2>
      <P>
        Time to stop reading and start experimenting. Use the simulator below to send frames between devices and watch
        the switch build its MAC address table in real time.
      </P>
      <SwitchSimulator />
      <UnknownMacChallenge />

      <H2>Quick Quiz</H2>
      <Quiz />

      <H2>Key Takeaways</H2>
      <UL>
        <li>✔ Switches connect devices on a local network.</li>
        <li>✔ Ethernet frames contain source and destination MAC addresses.</li>
        <li>✔ Switches learn MAC addresses by examining the source MAC of incoming frames.</li>
        <li>✔ The MAC address table maps MAC addresses to switch ports.</li>
        <li>✔ Known destinations are forwarded to the appropriate port.</li>
        <li>✔ Unknown destinations can be flooded.</li>
        <li>✔ Broadcast frames are flooded across the relevant broadcast domain.</li>
        <li>✔ MAC address tables are essential troubleshooting tools for network engineers.</li>
      </UL>

      <H2>Practice What You've Learned</H2>
      <P>If you have access to a Cisco switch, try:</P>
      <Pre>{`show mac address-table`}</Pre>
      <P>Then identify:</P>
      <UL>
        <li>How many MAC addresses are learned?</li>
        <li>Which ports have devices connected?</li>
        <li>Which VLAN does each MAC belong to?</li>
        <li>Are the entries dynamic or static?</li>
      </UL>
      <P>For a deeper challenge, disconnect a device from one switch port and reconnect it to another. Then run:</P>
      <Pre>{`show mac address-table`}</Pre>
      <P>Watch how the switch learns the MAC address on the new port.</P>

      <TryItCard
        to="/network-diagram"
        title="🔀 Network Diagram Builder"
        body="Drag switches, routers and servers onto a canvas and cable them up to model the exact topology from this lesson."
      />
      <TryItCard
        to="/port-check"
        title="🔌 Open Port Checker"
        body="Verify whether a port is responding on a remote host — the same reachability check a switch port status gives you locally."
      />
      <TryItCard
        to="/whose-ip"
        title="🌍 Whose IP"
        body="See which ISP and location a public IP belongs to once traffic leaves your switch and hits the Internet."
      />

      <div
        style={{
          marginTop: 40,
          padding: 20,
          borderRadius: 14,
          border: "1px solid #1f2740",
          background: "#0f1422",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ color: "#6b7794", fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>PREVIOUS LESSON</div>
          <Link to="/academy/mac-addresses" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            ← Lesson 14: MAC Addresses Explained
          </Link>
        </div>
        <Link
          to="/academy"
          style={{
            background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
            color: "#04150f",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Back to Academy →
        </Link>
      </div>
    </article>
  );
}

function Quiz() {
  const questions = [
    {
      q: "What does a switch primarily use to forward Ethernet frames?",
      options: ["IP address", "MAC address", "DNS name", "Port number"],
      answer: 1,
    },
    {
      q: "What does a switch learn from incoming frames?",
      options: ["Destination IP", "Source MAC and the port it arrived on", "DNS server", "Default gateway"],
      answer: 1,
    },
    {
      q: "What happens when a switch doesn't know the destination MAC?",
      options: [
        "Drops the frame immediately",
        "Floods it out relevant ports except the incoming port",
        "Sends it to the router",
        "Performs a DNS lookup",
      ],
      answer: 1,
    },
    {
      q: "What does a MAC address table contain?",
      options: ["IP → DNS mappings", "MAC → Port mappings", "Port → IP only", "DNS → MAC mappings"],
      answer: 1,
    },
    {
      q: "What is the Ethernet broadcast MAC address?",
      options: ["00:00:00:00:00:00", "255.255.255.255", "FF:FF:FF:FF:FF:FF", "127.0.0.1"],
      answer: 2,
    },
  ];
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {questions.map((q, i) => (
        <QuizItem key={i} q={q.q} options={q.options} answer={q.answer} index={i + 1} />
      ))}
    </div>
  );
}

function QuizItem({ q, options, answer, index }: { q: string; options: string[]; answer: number; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = selected === answer;
  return (
    <div style={{ border: "1px solid #1f2740", borderRadius: 12, padding: 16, background: "#0f1422" }}>
      <div style={{ color: "#fff", fontWeight: 600, marginBottom: 10 }}>
        {index}. {q}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isAnswer = i === answer;
          let border = "1px solid #1f2740";
          let bg = "#0b0f1a";
          let color = "#c8d0e0";
          if (selected !== null) {
            if (isAnswer) {
              border = "1px solid #00D4AA";
              bg = "rgba(0,212,170,0.12)";
              color = "#00D4AA";
            } else if (isSelected) {
              border = "1px solid #ff6b8a";
              bg = "rgba(233,69,96,0.10)";
              color = "#ff6b8a";
            }
          }
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 8,
                border,
                background: bg,
                color,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div style={{ marginTop: 10, fontSize: 13, color: correct ? "#00D4AA" : "#ff6b8a", fontWeight: 600 }}>
          {correct ? "✅ Correct!" : "❌ Not quite. The correct answer is highlighted above."}
        </div>
      )}
    </div>
  );
}
