import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toolHead } from "@/lib/seo";

const TEAL = "#00D4AA";
const SURFACE = "#131829";
const SURFACE_DEEP = "#0f1422";
const BORDER = "#1f2740";
const TEXT = "#ffffff";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";
const GREEN = "#10B981";
const RED = "#EF4444";
const AMBER = "#f5a623";

export const Route = createFileRoute("/ap-planning")({
  component: ApPlanningPage,
  head: () =>
    toolHead({
      path: "/ap-planning",
      name: "AP Planning Simulator",
      title: "AP Planning Simulator — WiFi Access Point Placement",
      description:
        "Upload a floor plan and get ranked Wi-Fi access point placements with coverage overlays for Fortinet, Cisco Meraki, Ubiquiti, TP-Link and Aruba APs.",
      category: "DesignApplication",
      faqs: [
        {
          q: "Which access point vendors are supported?",
          a: "Fortinet FortiAP, Cisco Meraki, Ubiquiti UniFi, TP-Link Omada and Aruba Instant On, with realistic indoor coverage radii per model.",
        },
        {
          q: "How are the AP placements chosen?",
          a: "A greedy set-cover algorithm samples the floor plan on a grid and picks positions that maximise coverage while minimising overlap and AP count.",
        },
      ],
    }),
});

// --- AP Model database ------------------------------------------------------
// Coverage radius values are typical indoor open-space estimates in meters.

type ApModel = {
  vendor: string;
  model: string;
  radiusM: number;
  maxDevices: number;
  band: string;
};

const AP_DB: ApModel[] = [
  // Fortinet (Fortigate branded AP line)
  { vendor: "Fortinet", model: "FortiAP 231F", radiusM: 15, maxDevices: 250, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "Fortinet", model: "FortiAP 431F", radiusM: 18, maxDevices: 512, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "Fortinet", model: "FortiAP 433F", radiusM: 20, maxDevices: 512, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "Fortinet", model: "FortiAP 831F", radiusM: 22, maxDevices: 1024, band: "Wi-Fi 6E (2.4/5/6 GHz)" },
  // Cisco Meraki
  { vendor: "Cisco Meraki", model: "MR36", radiusM: 15, maxDevices: 250, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "Cisco Meraki", model: "MR46", radiusM: 18, maxDevices: 512, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "Cisco Meraki", model: "MR57", radiusM: 22, maxDevices: 1024, band: "Wi-Fi 6E (2.4/5/6 GHz)" },
  // Ubiquiti UniFi
  { vendor: "Ubiquiti", model: "UniFi U6-Lite", radiusM: 12, maxDevices: 200, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "Ubiquiti", model: "UniFi U6-Pro", radiusM: 16, maxDevices: 300, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "Ubiquiti", model: "UniFi U6-Enterprise", radiusM: 20, maxDevices: 600, band: "Wi-Fi 6E (2.4/5/6 GHz)" },
  { vendor: "Ubiquiti", model: "UniFi U7-Pro", radiusM: 22, maxDevices: 700, band: "Wi-Fi 7 (2.4/5/6 GHz)" },
  // TP-Link Omada / EAP
  { vendor: "TP-Link", model: "EAP245", radiusM: 12, maxDevices: 200, band: "Wi-Fi 5 (2.4/5 GHz)" },
  { vendor: "TP-Link", model: "EAP670", radiusM: 15, maxDevices: 300, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "TP-Link", model: "EAP773", radiusM: 20, maxDevices: 500, band: "Wi-Fi 7 (2.4/5/6 GHz)" },
  // Aruba
  { vendor: "Aruba", model: "AP-505", radiusM: 14, maxDevices: 256, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "Aruba", model: "AP-535", radiusM: 18, maxDevices: 512, band: "Wi-Fi 6 (2.4/5 GHz)" },
  { vendor: "Aruba", model: "AP-635", radiusM: 22, maxDevices: 1024, band: "Wi-Fi 6E (2.4/5/6 GHz)" },
  { vendor: "Aruba", model: "AP-735", radiusM: 24, maxDevices: 1024, band: "Wi-Fi 7 (2.4/5/6 GHz)" },
];

const VENDORS = Array.from(new Set(AP_DB.map((a) => a.vendor)));

// --- Placement algorithm ----------------------------------------------------

type Placement = {
  rank: number;
  aps: { x: number; y: number; label: string }[];
  coveragePct: number;
  overlapPct: number;
  deadZonePct: number;
  efficiency: number; // 0-10
  apCount: number;
};

/**
 * Compute placements on a grid. We sample the image area with a coarse grid,
 * greedily add AP positions that maximize newly-covered cells, then produce
 * 5 candidate solutions by varying the AP count around the optimum.
 */
function computePlacements(
  imgW: number,
  imgH: number,
  radiusPx: number,
  suggestionCount: number,
): Placement[] {
  // Sample grid — cap resolution for perf.
  const cellSize = Math.max(8, Math.round(Math.min(imgW, imgH) / 80));
  const cols = Math.max(1, Math.floor(imgW / cellSize));
  const rows = Math.max(1, Math.floor(imgH / cellSize));
  const totalCells = cols * rows;

  const cellX = (c: number) => c * cellSize + cellSize / 2;
  const cellY = (r: number) => r * cellSize + cellSize / 2;

  // Candidate AP positions: coarser grid to keep it fast.
  const step = Math.max(cellSize, Math.round(radiusPx * 0.4));
  const candidates: { x: number; y: number }[] = [];
  for (let y = step / 2; y < imgH; y += step) {
    for (let x = step / 2; x < imgW; x += step) {
      candidates.push({ x, y });
    }
  }

  const r2 = radiusPx * radiusPx;

  // Precompute which cells each candidate covers.
  const candCells: number[][] = candidates.map((c) => {
    const list: number[] = [];
    const minC = Math.max(0, Math.floor((c.x - radiusPx) / cellSize));
    const maxC = Math.min(cols - 1, Math.floor((c.x + radiusPx) / cellSize));
    const minR = Math.max(0, Math.floor((c.y - radiusPx) / cellSize));
    const maxR = Math.min(rows - 1, Math.floor((c.y + radiusPx) / cellSize));
    for (let r = minR; r <= maxR; r++) {
      for (let cc = minC; cc <= maxC; cc++) {
        const dx = cellX(cc) - c.x;
        const dy = cellY(r) - c.y;
        if (dx * dx + dy * dy <= r2) list.push(r * cols + cc);
      }
    }
    return list;
  });

  // Greedy set cover until we hit 99% coverage or run out.
  const covered = new Uint8Array(totalCells);
  const coverageCount = new Uint16Array(totalCells);
  const chosen: { x: number; y: number }[] = [];
  const used = new Set<number>();
  const maxAps = 20;

  const snapshots: Placement[] = [];

  for (let step = 0; step < maxAps; step++) {
    let bestIdx = -1;
    let bestGain = 0;
    for (let i = 0; i < candidates.length; i++) {
      if (used.has(i)) continue;
      let gain = 0;
      const cells = candCells[i];
      for (let k = 0; k < cells.length; k++) {
        if (!covered[cells[k]]) gain++;
      }
      if (gain > bestGain) {
        bestGain = gain;
        bestIdx = i;
      }
    }
    if (bestIdx < 0 || bestGain === 0) break;
    used.add(bestIdx);
    const cells = candCells[bestIdx];
    for (let k = 0; k < cells.length; k++) {
      covered[cells[k]] = 1;
      coverageCount[cells[k]] += 1;
    }
    chosen.push(candidates[bestIdx]);

    // Snapshot metrics for this AP count.
    let coveredCount = 0;
    let overlapCount = 0;
    for (let i = 0; i < totalCells; i++) {
      if (covered[i]) coveredCount++;
      if (coverageCount[i] > 1) overlapCount++;
    }
    const covPct = (coveredCount / totalCells) * 100;
    const overPct = (overlapCount / totalCells) * 100;
    const deadPct = 100 - covPct;
    // Efficiency: reward coverage, penalize overlap and extra APs.
    const eff = Math.max(
      0,
      Math.min(
        10,
        covPct / 10 - overPct / 40 - (chosen.length - 1) * 0.15,
      ),
    );
    snapshots.push({
      rank: 0,
      aps: chosen.map((p, i) => ({ x: p.x, y: p.y, label: `AP-${i + 1}` })),
      coveragePct: covPct,
      overlapPct: overPct,
      deadZonePct: deadPct,
      efficiency: eff,
      apCount: chosen.length,
    });

    if (covPct >= 99) break;
  }

  if (snapshots.length === 0) return [];

  // Rank by efficiency, then pick top N.
  const ranked = snapshots
    .slice()
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, Math.max(1, Math.min(suggestionCount, snapshots.length)));
  ranked.forEach((s, i) => (s.rank = i + 1));
  return ranked;
}

// --- Component --------------------------------------------------------------

function ApPlanningPage() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgName, setImgName] = useState<string>("");
  const [imgDim, setImgDim] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [vendor, setVendor] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");
  const [scale, setScale] = useState<string>("0.05"); // meters per pixel default
  const [suggestionCount, setSuggestionCount] = useState<number>(5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDead, setShowDead] = useState(true);
  const [showOverlap, setShowOverlap] = useState(true);

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [computing, setComputing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [detailFor, setDetailFor] = useState<Placement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const modelsForVendor = useMemo(
    () => AP_DB.filter((a) => a.vendor === vendor),
    [vendor],
  );
  const model = useMemo(
    () => AP_DB.find((a) => a.vendor === vendor && a.model === modelName) || null,
    [vendor, modelName],
  );

  const scaleNum = parseFloat(scale);
  const scaleValid = Number.isFinite(scaleNum) && scaleNum > 0;
  const radiusPx = model && scaleValid ? model.radiusM / scaleNum : 0;

  const canGenerate =
    !!imgUrl && !!imgDim && !!model && scaleValid && radiusPx > 4 && !computing;

  const onFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    setImgName(f.name);
    setPlacements([]);
    const img = new Image();
    img.onload = () => {
      setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  const generate = useCallback(async () => {
    if (!imgDim || !model || !scaleValid) return;
    setComputing(true);
    // Yield so the button state paints before heavy sync work.
    await new Promise((r) => setTimeout(r, 20));
    const results = computePlacements(imgDim.w, imgDim.h, radiusPx, suggestionCount);
    setPlacements(results);
    setSelectedRank(1);
    setComputing(false);
  }, [imgDim, model, scaleValid, radiusPx, suggestionCount]);

  const selected = placements.find((p) => p.rank === selectedRank) || placements[0];

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgUrl || !imgDim) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      canvas.width = imgDim.w;
      canvas.height = imgDim.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, imgDim.w, imgDim.h);

      if (selected && model && scaleValid) {
        // Dead zones shading (draw green coverage then invert visualization is complex —
        // we mark dead zones with a soft gray tint by drawing gray full-canvas first
        // then punching holes with coverage circles).
        if (showDead) {
          ctx.save();
          ctx.fillStyle = "rgba(107,119,148,0.18)";
          ctx.fillRect(0, 0, imgDim.w, imgDim.h);
          ctx.globalCompositeOperation = "destination-out";
          for (const ap of selected.aps) {
            ctx.beginPath();
            ctx.arc(ap.x, ap.y, radiusPx, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Coverage circles (additive so overlap darkens naturally when overlap on).
        for (const ap of selected.aps) {
          ctx.save();
          ctx.globalCompositeOperation = showOverlap ? "source-over" : "source-over";
          ctx.fillStyle = showOverlap ? "rgba(16,185,129,0.30)" : "rgba(16,185,129,0.30)";
          ctx.beginPath();
          ctx.arc(ap.x, ap.y, radiusPx, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(16,185,129,0.9)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }

        // AP markers + labels
        for (const ap of selected.aps) {
          ctx.fillStyle = RED;
          ctx.beginPath();
          ctx.arc(ap.x, ap.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.font = "bold 14px DM Sans, system-ui, sans-serif";
          ctx.fillStyle = "#fff";
          ctx.strokeStyle = "rgba(0,0,0,0.7)";
          ctx.lineWidth = 3;
          ctx.strokeText(ap.label, ap.x + 10, ap.y - 8);
          ctx.fillText(ap.label, ap.x + 10, ap.y - 8);
        }
      }
    };
    img.src = imgUrl;
  }, [imgUrl, imgDim, selected, radiusPx, model, scaleValid, showDead, showOverlap]);

  const exportCsv = useCallback(() => {
    if (!placements.length || !model) return;
    const rows = [
      ["rank", "ap", "x_px", "y_px", "x_m", "y_m", "coverage_pct", "overlap_pct", "dead_zone_pct", "efficiency", "ap_count", "model", "vendor", "radius_m"],
    ];
    for (const p of placements) {
      for (const ap of p.aps) {
        rows.push([
          String(p.rank),
          ap.label,
          ap.x.toFixed(1),
          ap.y.toFixed(1),
          scaleValid ? (ap.x * scaleNum).toFixed(2) : "",
          scaleValid ? (ap.y * scaleNum).toFixed(2) : "",
          p.coveragePct.toFixed(1),
          p.overlapPct.toFixed(1),
          p.deadZonePct.toFixed(1),
          p.efficiency.toFixed(2),
          String(p.apCount),
          model.model,
          model.vendor,
          String(model.radiusM),
        ]);
      }
    }
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ap-planning-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [placements, model, scaleValid, scaleNum]);

  const copyToClipboard = useCallback(async () => {
    if (!selected || !model) return;
    const lines = [
      `AP Placement (rank #${selected.rank}) — ${model.vendor} ${model.model}`,
      `Coverage ${selected.coveragePct.toFixed(1)}% · Overlap ${selected.overlapPct.toFixed(1)}% · Dead ${selected.deadZonePct.toFixed(1)}% · Eff ${selected.efficiency.toFixed(1)}/10`,
      `APs (${selected.apCount}):`,
      ...selected.aps.map(
        (ap) =>
          `  ${ap.label}: (${ap.x.toFixed(0)}px, ${ap.y.toFixed(0)}px)` +
          (scaleValid ? ` = (${(ap.x * scaleNum).toFixed(2)}m, ${(ap.y * scaleNum).toFixed(2)}m)` : ""),
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      /* noop */
    }
  }, [selected, model, scaleValid, scaleNum]);

  const printPdf = useCallback(() => window.print(), []);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          AP Planning Simulation
        </h1>
        <p style={{ color: TEXT_MUTED, marginTop: 8, maxWidth: 780 }}>
          Upload a floor plan, choose an Access Point model, set the scale in meters per pixel, and
          get ranked placement suggestions with coverage, overlap and dead-zone metrics.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 380px) 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* LEFT — inputs */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* Upload */}
          <Card title="1. Floor plan">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              style={{
                display: "block",
                border: `2px dashed ${BORDER}`,
                borderRadius: 12,
                padding: 18,
                textAlign: "center",
                cursor: "pointer",
                background: SURFACE_DEEP,
              }}
            >
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              {imgUrl && imgDim ? (
                <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
                  <img
                    src={imgUrl}
                    alt="floor plan preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 140,
                      borderRadius: 8,
                      border: `1px solid ${BORDER}`,
                    }}
                  />
                  <div style={{ fontSize: 12, color: TEXT_SEC }}>
                    {imgName} · {imgDim.w} × {imgDim.h}px
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>Click to replace</div>
                </div>
              ) : (
                <div style={{ color: TEXT_MUTED, fontSize: 13, padding: "20px 0" }}>
                  Drop PNG / JPG here, or click to browse
                </div>
              )}
            </label>
          </Card>

          {/* Vendor */}
          <Card title="2. Access Point model">
            <Field label="Vendor">
              <select
                value={vendor}
                onChange={(e) => {
                  setVendor(e.target.value);
                  setModelName("");
                }}
                style={selectStyle}
              >
                <option value="">Select vendor…</option>
                {VENDORS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Model">
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                disabled={!vendor}
                style={{ ...selectStyle, opacity: vendor ? 1 : 0.5 }}
              >
                <option value="">Select model…</option>
                {modelsForVendor.map((m) => (
                  <option key={m.model} value={m.model}>
                    {m.model} — {m.radiusM}m · {m.maxDevices} dev
                  </option>
                ))}
              </select>
            </Field>
            {model && (
              <div
                style={{
                  marginTop: 4,
                  padding: 10,
                  borderRadius: 8,
                  background: SURFACE_DEEP,
                  border: `1px solid ${BORDER}`,
                  fontSize: 12,
                  color: TEXT_SEC,
                  lineHeight: 1.6,
                }}
              >
                <div>
                  <strong style={{ color: TEXT }}>Radius:</strong> {model.radiusM} m
                </div>
                <div>
                  <strong style={{ color: TEXT }}>Max devices:</strong> {model.maxDevices}
                </div>
                <div>
                  <strong style={{ color: TEXT }}>Band:</strong> {model.band}
                </div>
              </div>
            )}
          </Card>

          {/* Scale */}
          <Card title="3. Scale factor">
            <Field label="Meters per pixel">
              <input
                type="number"
                step="0.001"
                min="0.0001"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                style={inputStyle}
              />
            </Field>
            {model && scaleValid && (
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>
                Coverage radius on image: <strong style={{ color: TEAL }}>{radiusPx.toFixed(0)} px</strong>
                {imgDim && (
                  <>
                    {" · "}Floor area: {(imgDim.w * scaleNum).toFixed(1)} × {(imgDim.h * scaleNum).toFixed(1)} m
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Advanced */}
          <Card>
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              style={{
                background: "transparent",
                border: "none",
                color: TEXT_SEC,
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
                fontWeight: 600,
              }}
            >
              {showAdvanced ? "▾" : "▸"} Advanced options
            </button>
            {showAdvanced && (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT_SEC }}>
                  <input type="checkbox" checked={showDead} onChange={(e) => setShowDead(e.target.checked)} />
                  Show dead zones
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT_SEC }}>
                  <input type="checkbox" checked={showOverlap} onChange={(e) => setShowOverlap(e.target.checked)} />
                  Highlight overlap
                </label>
                <Field label={`Suggestions: ${suggestionCount}`}>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={suggestionCount}
                    onChange={(e) => setSuggestionCount(parseInt(e.target.value, 10))}
                    style={{ width: "100%" }}
                  />
                </Field>
              </div>
            )}
          </Card>

          <button
            type="button"
            onClick={generate}
            disabled={!canGenerate}
            style={{
              padding: "14px 20px",
              borderRadius: 12,
              background: canGenerate ? TEAL : BORDER,
              color: canGenerate ? "#04150f" : TEXT_MUTED,
              border: "none",
              fontSize: 15,
              fontWeight: 700,
              cursor: canGenerate ? "pointer" : "not-allowed",
            }}
          >
            {computing ? "Computing…" : "Generate placement suggestions"}
          </button>
        </div>

        {/* RIGHT — results */}
        <div style={{ display: "grid", gap: 16 }}>
          <Card
            title="Coverage visualization"
            right={
              imgUrl && (
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>−</IconBtn>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, alignSelf: "center", minWidth: 40, textAlign: "center" }}>
                    {(zoom * 100).toFixed(0)}%
                  </div>
                  <IconBtn onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>+</IconBtn>
                  <IconBtn onClick={() => setZoom(1)}>⟲</IconBtn>
                </div>
              )
            }
          >
            <div
              style={{
                background: SURFACE_DEEP,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                overflow: "auto",
                maxHeight: 600,
                display: "grid",
                placeItems: "center",
                minHeight: 360,
              }}
            >
              {imgUrl ? (
                <canvas
                  ref={canvasRef}
                  style={{
                    display: "block",
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    maxWidth: zoom === 1 ? "100%" : "none",
                  }}
                />
              ) : (
                <div style={{ color: TEXT_MUTED, padding: 60, fontSize: 14 }}>
                  Upload a floor plan to preview coverage.
                </div>
              )}
            </div>
            <Legend />
          </Card>

          {selected && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 12,
                }}
              >
                <Stat label="Total coverage" value={`${selected.coveragePct.toFixed(1)}%`} color={GREEN} />
                <Stat label="Dead zones" value={`${selected.deadZonePct.toFixed(1)}%`} color={AMBER} />
                <Stat label="Overlap" value={`${selected.overlapPct.toFixed(1)}%`} color={TEAL} />
                <Stat label="Required APs" value={String(selected.apCount)} color={RED} />
              </div>

              <Card
                title="Ranked suggestions"
                right={
                  <div style={{ display: "flex", gap: 6 }}>
                    <SmallBtn onClick={copyToClipboard}>Copy</SmallBtn>
                    <SmallBtn onClick={exportCsv}>CSV</SmallBtn>
                    <SmallBtn onClick={printPdf}>PDF</SmallBtn>
                  </div>
                }
              >
                <div style={{ display: "grid", gap: 10 }}>
                  {placements.map((p) => (
                    <button
                      type="button"
                      key={p.rank}
                      onClick={() => setSelectedRank(p.rank)}
                      style={{
                        textAlign: "left",
                        cursor: "pointer",
                        padding: 14,
                        borderRadius: 12,
                        border: `1px solid ${p.rank === selectedRank ? TEAL : BORDER}`,
                        background: p.rank === selectedRank ? "rgba(0,212,170,0.06)" : SURFACE_DEEP,
                        color: TEXT,
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "linear-gradient(135deg,#00D4AA,#9B8FE8)",
                          color: "#04150f",
                          fontWeight: 800,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 16,
                        }}
                      >
                        #{p.rank}
                      </div>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {model?.vendor} {model?.model} · {p.apCount} AP{p.apCount === 1 ? "" : "s"}
                        </div>
                        <div style={{ fontSize: 12, color: TEXT_MUTED }}>
                          Coverage {p.coveragePct.toFixed(1)}% · Overlap {p.overlapPct.toFixed(1)}% · Dead {p.deadZonePct.toFixed(1)}%
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 18,
                            fontWeight: 700,
                            color: TEAL,
                          }}
                        >
                          {p.efficiency.toFixed(1)}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailFor(p);
                          }}
                          style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: `1px solid ${BORDER}`,
                            background: "transparent",
                            color: TEXT_SEC,
                            cursor: "pointer",
                          }}
                        >
                          View details
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Details modal */}
      {detailFor && model && (
        <div
          onClick={() => setDetailFor(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              maxWidth: 640,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20 }}>
                  Placement #{detailFor.rank} — {model.vendor} {model.model}
                </h3>
                <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 4 }}>
                  {model.band} · {model.radiusM} m radius · {model.maxDevices} devices max
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailFor(null)}
                style={{
                  background: "transparent",
                  color: TEXT_MUTED,
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <MiniStat label="Coverage" value={`${detailFor.coveragePct.toFixed(1)}%`} />
              <MiniStat label="Overlap" value={`${detailFor.overlapPct.toFixed(1)}%`} />
              <MiniStat label="Dead zones" value={`${detailFor.deadZonePct.toFixed(1)}%`} />
              <MiniStat label="Efficiency" value={`${detailFor.efficiency.toFixed(1)} / 10`} />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: TEXT_MUTED, textAlign: "left" }}>
                  <th style={thStyle}>AP</th>
                  <th style={thStyle}>Pixel (x, y)</th>
                  <th style={thStyle}>{scaleValid ? "Meters (x, y)" : "—"}</th>
                </tr>
              </thead>
              <tbody>
                {detailFor.aps.map((ap) => (
                  <tr key={ap.label}>
                    <td style={tdStyle}>{ap.label}</td>
                    <td style={tdStyle}>
                      ({ap.x.toFixed(0)}, {ap.y.toFixed(0)})
                    </td>
                    <td style={tdStyle}>
                      {scaleValid
                        ? `(${(ap.x * scaleNum).toFixed(2)}, ${(ap.y * scaleNum).toFixed(2)})`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- UI primitives ---------------------------------------------------------

function Card({
  title,
  right,
  children,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      {(title || right) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: title ? 12 : 0,
          }}
        >
          {title && <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{title}</div>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div
        style={{
          marginTop: 6,
          fontFamily: "'DM Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: SURFACE_DEEP,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: 10,
      }}
    >
      <div style={{ fontSize: 11, color: TEXT_MUTED }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: TEXT }}>{value}</div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, fontSize: 12, color: TEXT_SEC }}>
      <LegendDot color="rgba(16,185,129,0.6)" label="Coverage" />
      <LegendDot color={RED} label="AP location" />
      <LegendDot color="rgba(107,119,148,0.5)" label="Dead zone" />
      <LegendDot color="rgba(16,185,129,0.9)" label="Overlap edge" />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

function IconBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: `1px solid ${BORDER}`,
        background: SURFACE_DEEP,
        color: TEXT_SEC,
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function SmallBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        border: `1px solid ${BORDER}`,
        background: SURFACE_DEEP,
        color: TEXT_SEC,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  background: SURFACE_DEEP,
  color: TEXT,
  fontSize: 14,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
};

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: `1px solid ${BORDER}`,
  fontWeight: 600,
  fontSize: 12,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: `1px solid ${BORDER}`,
  fontFamily: "'DM Mono', monospace",
  color: TEXT_SEC,
};