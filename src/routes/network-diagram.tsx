import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toolHead } from "@/lib/seo";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  addEdge,
  NodeResizer,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";

const TEAL = "#00D4AA";
const SURFACE = "#131829";
const SURFACE_DEEP = "#0f1422";
const BORDER = "#1f2740";
const TEXT = "#ffffff";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";
const GREEN = "#10B981";
const AMBER = "#f5a623";
const RED = "#EF4444";

const STORAGE_KEY = "pulse-speed:network-diagram:v1";

export const Route = createFileRoute("/network-diagram")({
  component: NetworkDiagramPage,
  head: () =>
    toolHead({
      path: "/network-diagram",
      name: "Network Diagram Builder",
      title: "Network Diagram Builder — Draw Network Topology Online",
      description:
        "Free drag-and-drop network topology builder for engineers. Add routers, switches, firewalls, access points, servers and cloud nodes, label uplink interfaces and IPs, set link states, group VLAN zones and export a PNG.",
      category: "DesignApplication",
      faqs: [
        {
          q: "Is my network diagram saved?",
          a: "Yes — the canvas is stored in your browser's local storage automatically, so your topology survives a page refresh. Nothing is uploaded to a server.",
        },
        {
          q: "Can I export the topology?",
          a: "You can download the canvas as a PNG image at any time, and the topology stays saved in your browser between visits.",
        },
      ],
    }),
});

// ---------------------------------------------------------------- device kinds
type Kind = "router" | "switch" | "firewall" | "accesspoint" | "server" | "database" | "cloud";

const ApIcon = ({ size = 16, color = "#38BDF8" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <ellipse cx="12" cy="16" rx="8" ry="3.2" fill={color} opacity="0.85" />
    <path d="M12 13.2V8.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M8.6 7.2a4.8 4.8 0 0 1 6.8 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6.3 4.9a8 8 0 0 1 11.4 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const KINDS: { kind: Kind; label: string; icon: React.ReactNode; color: string; hint: string }[] = [
  { kind: "router", label: "Router", icon: "🛰️", color: TEAL, hint: "L3 gateway / WAN edge" },
  { kind: "switch", label: "Switch", icon: "🔀", color: "#9B8FE8", hint: "L2 access / distribution" },
  { kind: "firewall", label: "Firewall", icon: "🛡️", color: RED, hint: "Perimeter / DMZ policy" },
  {
    kind: "accesspoint",
    label: "Access Point",
    icon: <ApIcon />,
    color: "#38BDF8",
    hint: "Wi-Fi AP / wireless edge",
  },
  { kind: "server", label: "Server", icon: "🖥️", color: "#38BDF8", hint: "Application / host" },
  { kind: "database", label: "Database", icon: "🗄️", color: AMBER, hint: "SQL / NoSQL store" },
  { kind: "cloud", label: "Cloud", icon: "☁️", color: "#c8d0e0", hint: "Internet / SaaS / VPC" },
];

const kindMeta = (k: Kind) => KINDS.find((x) => x.kind === k) ?? KINDS[0];

type DeviceData = {
  kind: Kind;
  name: string;
  ip: string;
  mask: string;
  notes: string;
};

type ZoneData = { label: string; color: string };

type LinkState = "active" | "congested" | "down";

type LinkData = {
  state: LinkState;
  aIf?: string;
  aIp?: string;
  bIf?: string;
  bIp?: string;
};

const linkLabel = (d: Partial<LinkData> | undefined) => {
  const a = [d?.aIf, d?.aIp].filter(Boolean).join(" ");
  const b = [d?.bIf, d?.bIp].filter(Boolean).join(" ");
  if (!a && !b) return undefined;
  return a && b ? `${a}  ↔  ${b}` : a || b;
};

const linkLabelProps = (d: Partial<LinkData> | undefined): Partial<Edge> => ({
  label: linkLabel(d),
  labelShowBg: true,
  labelBgPadding: [6, 3],
  labelBgBorderRadius: 6,
  labelBgStyle: { fill: SURFACE, stroke: BORDER },
  labelStyle: { fill: TEXT_SEC, fontSize: 10, fontFamily: "ui-monospace, monospace" },
});

const edgeStyleFor = (state: LinkState, simulation: boolean): Partial<Edge> => {
  if (state === "congested")
    return { style: { stroke: AMBER, strokeWidth: 2, strokeDasharray: "8 5" }, animated: simulation };
  if (state === "down")
    return {
      style: { stroke: RED, strokeWidth: 2, strokeDasharray: "3 6" },
      animated: false,
      className: simulation ? "pulse-pulseAnim" : undefined,
    };
  return { style: { stroke: GREEN, strokeWidth: 2 }, animated: simulation };
};

// ---------------------------------------------------------------- custom nodes
function DeviceNode({ data, selected }: NodeProps) {
  const d = data as unknown as DeviceData;
  const meta = kindMeta(d.kind);
  const handleStyle = {
    width: 9,
    height: 9,
    background: SURFACE_DEEP,
    border: `2px solid ${meta.color}`,
  };
  return (
    <div
      style={{
        minWidth: 150,
        borderRadius: 12,
        background: SURFACE,
        border: `1px solid ${selected ? meta.color : BORDER}`,
        boxShadow: selected ? `0 0 0 3px ${meta.color}22` : "0 6px 20px rgba(0,0,0,0.35)",
        padding: "10px 12px",
        color: TEXT,
      }}
    >
      <Handle type="target" position={Position.Top} id="t" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="l" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="r" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${meta.color}1f`,
            border: `1px solid ${meta.color}55`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
          }}
        >
          {meta.icon}
        </span>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{d.name}</div>
          <div style={{ fontSize: 10, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.6 }}>
            {meta.label}
          </div>
        </div>
      </div>
      <div
        className="font-mono-pulse"
        style={{ marginTop: 8, fontSize: 11, color: d.ip ? TEAL : TEXT_MUTED }}
      >
        {d.ip ? `${d.ip}${d.mask ? ` / ${d.mask}` : ""}` : "no IP set"}
      </div>
    </div>
  );
}

function ZoneNode({ data, selected }: NodeProps) {
  const z = data as unknown as ZoneData;
  return (
    <>
      <NodeResizer
        color={z.color}
        isVisible={selected}
        minWidth={120}
        minHeight={90}
        handleStyle={{ width: 10, height: 10, borderRadius: 3, background: z.color, border: "none" }}
        lineStyle={{ borderColor: z.color }}
      />
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 14,
        background: `${z.color}14`,
        border: `1.5px dashed ${selected ? z.color : `${z.color}88`}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 12,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          color: z.color,
          textTransform: "uppercase",
        }}
      >
        {z.label}
      </div>
    </div>
    </>
  );
}

const nodeTypes = { device: DeviceNode, zone: ZoneNode };

// ---------------------------------------------------------------- seed diagram
function seedDiagram(): { nodes: Node[]; edges: Edge[] } {
  const mk = (id: string, kind: Kind, name: string, ip: string, x: number, y: number): Node => ({
    id,
    type: "device",
    position: { x, y },
    data: { kind, name, ip, mask: "255.255.255.0", notes: "" },
  });
  const nodes: Node[] = [
    {
      id: "zone-1",
      type: "zone",
      position: { x: 60, y: 240 },
      style: { width: 620, height: 260 },
      data: { label: "LAN — VLAN 10", color: TEAL },
      draggable: true,
      selectable: true,
      zIndex: -1,
    },
    mk("n1", "cloud", "Internet", "", 300, 20),
    mk("n2", "firewall", "EDGE-FW-01", "203.0.113.2", 300, 130),
    mk("n3", "router", "CORE-RTR-01", "192.168.1.1", 300, 290),
    mk("n4", "switch", "ACC-SW-01", "192.168.1.2", 110, 400),
    mk("n5", "server", "APP-01", "192.168.1.20", 320, 400),
    mk("n6", "database", "DB-01", "192.168.1.30", 520, 400),
  ];
  const link = (id: string, source: string, target: string, state: LinkState): Edge => ({
    id,
    source,
    target,
    sourceHandle: "b",
    targetHandle: "t",
    data: { state },
    ...edgeStyleFor(state, false),
  });
  const edges: Edge[] = [
    link("e1", "n1", "n2", "active"),
    link("e2", "n2", "n3", "active"),
    link("e3", "n3", "n4", "active"),
    link("e4", "n3", "n5", "congested"),
    link("e5", "n3", "n6", "active"),
  ];
  return { nodes, edges };
}

// ---------------------------------------------------------------- page
function NetworkDiagramPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 20px 60px" }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          Network Diagram Builder
        </h1>
        <p style={{ color: TEXT_SEC, fontSize: 14, maxWidth: 780, marginTop: 8 }}>
          Drag routers, switches, firewalls, servers, databases and cloud nodes onto an infinite grid
          canvas, cable them together, mark link states, group devices into VLAN or DMZ zones, and export
          the canvas as a PNG. Label each uplink with its interface name and IP. Everything is saved in
          your browser automatically.
        </p>
      </header>
      {mounted ? (
        <ReactFlowProvider>
          <Builder />
        </ReactFlowProvider>
      ) : (
        <div
          style={{
            height: 640,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
            background: SURFACE_DEEP,
            display: "grid",
            placeItems: "center",
            color: TEXT_MUTED,
            fontSize: 13,
          }}
        >
          Loading canvas…
        </div>
      )}
      <Explainer />
    </div>
  );
}

let idSeq = 1;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${idSeq++}`;

function Builder() {
  const seed = useMemo(seedDiagram, []);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(seed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(seed.edges);
  const [simulation, setSimulation] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkMenu, setLinkMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const wrapper = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [loaded, setLoaded] = useState(false);

  // restore from local storage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.nodes)) setNodes(parsed.nodes);
        if (Array.isArray(parsed.edges)) setEdges(parsed.edges);
      }
    } catch {}
    setLoaded(true);
  }, [setNodes, setEdges]);

  // persist
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, nodes, edges }));
    } catch {}
  }, [nodes, edges, loaded]);

  // re-apply edge visuals when simulation toggles
  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        ...edgeStyleFor(((e.data?.state as LinkState) ?? "active"), simulation),
        ...linkLabelProps(e.data as Partial<LinkData>),
      })),
    );
  }, [simulation, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...params, id: nextId("e"), data: { state: "active" }, ...edgeStyleFor("active", simulation) },
          eds,
        ),
      ),
    [setEdges, simulation],
  );

  const addDevice = useCallback(
    (kind: Kind, position: { x: number; y: number }) => {
      const meta = kindMeta(kind);
      setNodes((nds) =>
        nds.concat({
          id: nextId("n"),
          type: "device",
          position,
          data: {
            kind,
            name: `${meta.label.toUpperCase()}-${String(
              nds.filter((n) => (n.data as unknown as DeviceData)?.kind === kind).length + 1,
            ).padStart(2, "0")}`,
            ip: "",
            mask: "255.255.255.0",
            notes: "",
          },
        }),
      );
    },
    [setNodes],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData("application/pulse-node") as Kind;
      if (!kind) return;
      addDevice(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addDevice, screenToFlowPosition],
  );

  const addZone = () => {
    const colors = [TEAL, "#9B8FE8", AMBER, RED, "#38BDF8"];
    setNodes((nds) => {
      const count = nds.filter((n) => n.type === "zone").length;
      return [
        {
          id: nextId("z"),
          type: "zone",
          position: { x: 80 + count * 30, y: 560 + count * 20 },
          style: { width: 420, height: 240 },
          data: { label: `VLAN ${10 + count * 10}`, color: colors[count % colors.length] },
          zIndex: -1,
        } as Node,
        ...nds,
      ];
    });
  };

  // ---- draw a zone by dragging on the canvas
  const createZoneFromRect = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const colors = [TEAL, "#9B8FE8", AMBER, RED, "#38BDF8"];
    const p1 = screenToFlowPosition(a);
    const p2 = screenToFlowPosition(b);
    const width = Math.max(120, Math.abs(p2.x - p1.x));
    const height = Math.max(90, Math.abs(p2.y - p1.y));
    setNodes((nds) => {
      const count = nds.filter((n) => n.type === "zone").length;
      return [
        {
          id: nextId("z"),
          type: "zone",
          position: { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y) },
          style: { width, height },
          data: { label: `VLAN ${10 + count * 10}`, color: colors[count % colors.length] },
          zIndex: -1,
        } as Node,
        ...nds,
      ];
    });
  };

  const onCanvasMouseDown = (event: React.MouseEvent) => {
    if (!drawMode || event.button !== 0) return;
    const rect = wrapper.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    drawStart.current = { x: event.clientX, y: event.clientY };
    setDraft({ x: event.clientX - rect.left, y: event.clientY - rect.top, w: 0, h: 0 });
  };

  const onCanvasMouseMove = (event: React.MouseEvent) => {
    if (!drawMode || !drawStart.current) return;
    const rect = wrapper.current?.getBoundingClientRect();
    if (!rect) return;
    const s = drawStart.current;
    setDraft({
      x: Math.min(s.x, event.clientX) - rect.left,
      y: Math.min(s.y, event.clientY) - rect.top,
      w: Math.abs(event.clientX - s.x),
      h: Math.abs(event.clientY - s.y),
    });
  };

  const onCanvasMouseUp = (event: React.MouseEvent) => {
    if (!drawMode || !drawStart.current) return;
    const s = drawStart.current;
    drawStart.current = null;
    setDraft(null);
    setDrawMode(false);
    createZoneFromRect(s, { x: event.clientX, y: event.clientY });
  };

  const setLinkState = (edgeId: string, state: LinkState) => {
    setEdges((eds) =>
      eds.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, state }, ...edgeStyleFor(state, simulation) } : e)),
    );
    setLinkMenu(null);
  };

  const setLinkMeta = (edgeId: string, patch: Partial<LinkData>) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== edgeId) return e;
        const data = { ...(e.data as Partial<LinkData>), ...patch };
        return { ...e, data, ...linkLabelProps(data) };
      }),
    );
  };

  const clearCanvas = () => {
    if (!window.confirm("Clear the entire canvas?")) return;
    setNodes([]);
    setEdges([]);
  };

  const downloadPng = async () => {
    const el = wrapper.current?.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!el) return;
    const dataUrl = await toPng(el, {
      backgroundColor: "#0A0E1A",
      pixelRatio: 2,
      filter: (n) =>
        !(n instanceof HTMLElement && (n.classList?.contains("react-flow__minimap") || n.classList?.contains("react-flow__controls"))),
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "pulse-speed-topology.png";
    a.click();
  };

  const editing = nodes.find((n) => n.id === editingId) ?? null;
  const filtered = KINDS.filter((k) =>
    (k.label + k.hint).toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div>
      <ActionBar
        simulation={simulation}
        onToggleSim={() => setSimulation((s) => !s)}
        onClear={clearCanvas}
        onPng={downloadPng}
        onZone={addZone}
      />

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 14, marginTop: 14 }}>
        <aside
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: 12,
            alignSelf: "start",
          }}
        >
          <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.7 }}>
            Components
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devices…"
            aria-label="Search components"
            style={{
              width: "100%",
              marginTop: 8,
              padding: "8px 10px",
              borderRadius: 9,
              border: `1px solid ${BORDER}`,
              background: SURFACE_DEEP,
              color: TEXT,
              fontSize: 13,
              outline: "none",
            }}
          />
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {filtered.map((k) => (
              <div
                key={k.kind}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/pulse-node", k.kind);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDoubleClick={() => addDevice(k.kind, { x: 120, y: 120 })}
                title={`Drag ${k.label} onto the canvas`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 10px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  background: SURFACE_DEEP,
                  cursor: "grab",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: `${k.color}1f`,
                    border: `1px solid ${k.color}55`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  {k.icon}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{k.label}</div>
                  <div style={{ fontSize: 10, color: TEXT_MUTED }}>{k.hint}</div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ fontSize: 12, color: TEXT_MUTED }}>No component matches “{search}”.</div>
            )}
          </div>
          <p style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.6, marginTop: 14 }}>
            Drag onto the canvas (or double-click a palette item). Hover a node to reveal the four anchor
            points, then drag from an anchor to another node to cable them. Double-click a node to edit its
            details, click a link to change its state.
          </p>
        </aside>

        <div
          ref={wrapper}
          style={{
            height: 660,
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${BORDER}`,
            background: SURFACE_DEEP,
            position: "relative",
          }}
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            snapToGrid
            snapGrid={[16, 16]}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
            onNodeDoubleClick={(_, node) => node.type === "device" && setEditingId(node.id)}
            onEdgeClick={(event, edge) => {
              const rect = wrapper.current?.getBoundingClientRect();
              setLinkMenu({
                id: edge.id,
                x: event.clientX - (rect?.left ?? 0),
                y: event.clientY - (rect?.top ?? 0),
              });
            }}
            onPaneClick={() => setLinkMenu(null)}
            colorMode="dark"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#26304d" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable maskColor="rgba(10,14,26,0.7)" style={{ background: SURFACE }} />
          </ReactFlow>

          {linkMenu && (
            <LinkPopup
              x={linkMenu.x}
              y={linkMenu.y}
              data={(edges.find((e) => e.id === linkMenu.id)?.data as Partial<LinkData>) ?? {}}
              onSelect={(s) => setLinkState(linkMenu.id, s)}
              onMeta={(patch) => setLinkMeta(linkMenu.id, patch)}
              onDelete={() => {
                setEdges((eds) => eds.filter((e) => e.id !== linkMenu.id));
                setLinkMenu(null);
              }}
              onClose={() => setLinkMenu(null)}
            />
          )}

          {editing && (
            <InspectorPanel
              node={editing}
              onClose={() => setEditingId(null)}
              onChange={(patch) =>
                setNodes((nds) =>
                  nds.map((n) => (n.id === editing.id ? { ...n, data: { ...n.data, ...patch } } : n)),
                )
              }
              onDelete={() => {
                setNodes((nds) => nds.filter((n) => n.id !== editing.id));
                setEdges((eds) => eds.filter((e) => e.source !== editing.id && e.target !== editing.id));
                setEditingId(null);
              }}
            />
          )}
        </div>
      </div>

      <Legend />
    </div>
  );
}

function ActionBar(props: {
  simulation: boolean;
  onToggleSim: () => void;
  onClear: () => void;
  onPng: () => void;
  onZone: () => void;
}) {
  const btn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: SURFACE_DEEP,
    color: TEXT_SEC,
    fontSize: 13,
    cursor: "pointer",
  };
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: 10,
      }}
    >
      <button type="button" style={btn} onClick={props.onZone}>
        ➕ Subnet Zone
      </button>
      <button type="button" style={btn} onClick={props.onClear}>
        🗑️ Clear Canvas
      </button>
      <button type="button" style={btn} onClick={props.onPng}>
        🖼️ Download PNG
      </button>
      <div style={{ flex: 1 }} />
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: TEXT_SEC }}>
        Simulation Mode
        <button
          type="button"
          role="switch"
          aria-checked={props.simulation}
          onClick={props.onToggleSim}
          style={{
            width: 46,
            height: 26,
            borderRadius: 999,
            border: `1px solid ${props.simulation ? TEAL : BORDER}`,
            background: props.simulation ? `${TEAL}33` : SURFACE_DEEP,
            position: "relative",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: props.simulation ? 22 : 3,
              width: 18,
              height: 18,
              borderRadius: 999,
              background: props.simulation ? TEAL : TEXT_MUTED,
              transition: "left .18s ease",
            }}
          />
        </button>
      </label>
    </div>
  );
}

function LinkPopup(props: {
  x: number;
  y: number;
  data: Partial<LinkData>;
  onSelect: (s: LinkState) => void;
  onMeta: (patch: Partial<LinkData>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const current = props.data.state ?? "active";
  const items: { state: LinkState; label: string; color: string }[] = [
    { state: "active", label: "Active", color: GREEN },
    { state: "congested", label: "Congested / High latency", color: AMBER },
    { state: "down", label: "Down / Failed", color: RED },
  ];
  const input: React.CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 7,
    border: `1px solid ${BORDER}`,
    background: SURFACE_DEEP,
    color: TEXT,
    fontSize: 11.5,
    outline: "none",
  };
  return (
    <div
      style={{
        position: "absolute",
        left: Math.max(8, props.x - 90),
        top: Math.max(8, props.y - 10),
        zIndex: 20,
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 8,
        width: 244,
        maxHeight: 420,
        overflowY: "auto",
        boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ fontSize: 11, color: TEXT_MUTED, padding: "2px 6px 6px" }}>Link state</div>
      {items.map((i) => (
        <button
          key={i.state}
          type="button"
          onClick={() => props.onSelect(i.state)}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            gap: 8,
            padding: "7px 8px",
            borderRadius: 8,
            border: "none",
            background: current === i.state ? `${i.color}1f` : "transparent",
            color: TEXT_SEC,
            fontSize: 12.5,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ width: 18, height: 2, background: i.color, borderRadius: 2 }} />
          {i.label}
        </button>
      ))}
      <div style={{ fontSize: 11, color: TEXT_MUTED, padding: "10px 6px 6px" }}>Uplink interfaces</div>
      <div style={{ display: "grid", gap: 6, padding: "0 4px" }}>
        <input
          style={input}
          placeholder="A-side interface (e.g. Gi0/0/1)"
          aria-label="A-side interface name"
          value={props.data.aIf ?? ""}
          onChange={(e) => props.onMeta({ aIf: e.target.value })}
        />
        <input
          style={input}
          placeholder="A-side IP (e.g. 10.0.0.1/30)"
          aria-label="A-side interface IP"
          value={props.data.aIp ?? ""}
          onChange={(e) => props.onMeta({ aIp: e.target.value })}
        />
        <input
          style={input}
          placeholder="B-side interface (e.g. Gi1/0/24)"
          aria-label="B-side interface name"
          value={props.data.bIf ?? ""}
          onChange={(e) => props.onMeta({ bIf: e.target.value })}
        />
        <input
          style={input}
          placeholder="B-side IP (e.g. 10.0.0.2/30)"
          aria-label="B-side interface IP"
          value={props.data.bIp ?? ""}
          onChange={(e) => props.onMeta({ bIp: e.target.value })}
        />
      </div>
      <button
        type="button"
        onClick={props.onDelete}
        style={{
          width: "100%",
          marginTop: 6,
          padding: "7px 8px",
          borderRadius: 8,
          border: `1px solid ${BORDER}`,
          background: SURFACE_DEEP,
          color: RED,
          fontSize: 12.5,
          cursor: "pointer",
        }}
      >
        Remove link
      </button>
    </div>
  );
}

function InspectorPanel(props: {
  node: Node;
  onChange: (patch: Partial<DeviceData> & Partial<ZoneData>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const d = props.node.data as unknown as DeviceData;
  const field: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 9,
    border: `1px solid ${BORDER}`,
    background: SURFACE_DEEP,
    color: TEXT,
    fontSize: 13,
    outline: "none",
  };
  const label: React.CSSProperties = { fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 4 };
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 300,
        background: SURFACE,
        borderLeft: `1px solid ${BORDER}`,
        padding: 16,
        zIndex: 30,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 14 }}>{kindMeta(d.kind).label} details</strong>
        <button
          type="button"
          onClick={props.onClose}
          aria-label="Close inspector"
          style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer", fontSize: 16 }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        <div>
          <label style={label}>Device name</label>
          <input style={field} value={d.name} onChange={(e) => props.onChange({ name: e.target.value })} />
        </div>
        <div>
          <label style={label}>Management IP address</label>
          <input
            style={field}
            placeholder="192.168.1.1"
            value={d.ip}
            onChange={(e) => props.onChange({ ip: e.target.value })}
          />
        </div>
        <div>
          <label style={label}>Subnet mask</label>
          <input
            style={field}
            placeholder="255.255.255.0"
            value={d.mask}
            onChange={(e) => props.onChange({ mask: e.target.value })}
          />
        </div>
        <div>
          <label style={label}>Notes</label>
          <textarea
            style={{ ...field, minHeight: 90, resize: "vertical" }}
            value={d.notes}
            onChange={(e) => props.onChange({ notes: e.target.value })}
          />
        </div>
        <button
          type="button"
          onClick={props.onDelete}
          style={{
            padding: "9px 10px",
            borderRadius: 9,
            border: `1px solid ${RED}55`,
            background: `${RED}14`,
            color: RED,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Delete device
        </button>
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { c: GREEN, t: "Active link" },
    { c: AMBER, t: "Congested / high latency" },
    { c: RED, t: "Down / failed" },
  ];
  return (
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 12, fontSize: 12, color: TEXT_MUTED }}>
      {items.map((i) => (
        <span key={i.t} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 22, height: 2, background: i.c, borderRadius: 2 }} />
          {i.t}
        </span>
      ))}
      <span>Snap grid: 16 px · Autosaved to this browser</span>
    </div>
  );
}

function Explainer() {
  return (
    <section style={{ marginTop: 34, display: "grid", gap: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>How to use the Network Diagram Builder</h2>
      <ol style={{ color: TEXT_SEC, fontSize: 14, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
        <li>Drag a Router, Switch, Firewall, Server, Database or Cloud node from the palette onto the grid.</li>
        <li>Hover a node and drag from one of its four anchor points to another node to draw a link.</li>
        <li>Double-click a node to set its device name, management IP, subnet mask and notes.</li>
        <li>Click any link to mark it Active, Congested or Down; enable Simulation Mode to animate traffic.</li>
        <li>
          Click a link to set its state and label the uplink interface names and IPs on both ends, then
          download the canvas as a PNG.
        </li>
      </ol>
      <p style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.8, margin: 0 }}>
        Planning the addressing behind your topology? Use the{" "}
        <a href="/subnet-calculator" style={{ color: TEAL }}>
          IP Subnet Calculator
        </a>{" "}
        to split ranges, verify reachability with the{" "}
        <a href="/ping-ip" style={{ color: TEAL }}>
          Ping IP tool
        </a>{" "}
        and learn the fundamentals in the{" "}
        <a href="/academy" style={{ color: TEAL }}>
          Network Engineer Academy
        </a>
        .
      </p>
    </section>
  );
}
