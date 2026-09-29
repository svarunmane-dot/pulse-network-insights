import { useEffect, useState } from "react";

/* ============================================================
   SPEED TEST HISTORY (LOCAL STORAGE ONLY)
   Keeps the last 50 runs in the visitor's own browser. Nothing
   is uploaded — the list never leaves the machine.
   ============================================================ */

const TEAL = "#00D4AA";
const SURFACE = "#131829";
const SURFACE2 = "#0f1422";
const BORDER = "#1f2740";
const TEXT_SEC = "#c8d0e0";
const TEXT_MUTED = "#6b7794";

export const HISTORY_KEY = "pulse-speed:speedtest-history";
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  ts: number;
  download: number;
  upload: number;
  ping: number;
  jitter: number;
}

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) => e && typeof e.ts === "number" && typeof e.download === "number",
    );
  } catch {
    return [];
  }
}

export function appendHistory(entry: HistoryEntry): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const next = [entry, ...readHistory()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — history is best-effort */
  }
  return next;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

function toCsv(rows: HistoryEntry[]): string {
  const head = "Date,Download (Mbps),Upload (Mbps),Ping (ms),Jitter (ms)";
  const body = rows.map(
    (r) =>
      `${new Date(r.ts).toISOString()},${r.download.toFixed(2)},${r.upload.toFixed(
        2,
      )},${r.ping},${r.jitter}`,
  );
  return [head, ...body].join("\n");
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function avg(rows: HistoryEntry[], key: keyof HistoryEntry): number {
  if (!rows.length) return 0;
  return rows.reduce((s, r) => s + (r[key] as number), 0) / rows.length;
}

export default function SpeedTestHistory({
  history,
  onChange,
}: {
  history: HistoryEntry[];
  onChange: (next: HistoryEntry[]) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(history)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pulse-speed-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "12px 24px",
          borderRadius: 50,
          border: `1px solid ${BORDER}`,
          background: SURFACE,
          color: TEXT_SEC,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        📊 Test History{history.length ? ` (${history.length})` : ""}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Speed test history"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(4,8,18,0.72)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 640,
              maxHeight: "85vh",
              overflowY: "auto",
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 18,
              padding: 22,
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 19,
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                Your Speed Test History
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close history"
                style={{
                  border: `1px solid ${BORDER}`,
                  background: SURFACE2,
                  color: TEXT_SEC,
                  borderRadius: 8,
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ color: TEXT_MUTED, fontSize: 12.5, marginTop: 6 }}>
              Saved only in this browser. Never uploaded anywhere.
            </p>

            {history.length === 0 ? (
              <p style={{ color: TEXT_SEC, fontSize: 14, marginTop: 20 }}>
                No tests recorded yet. Run a test and it will appear here.
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  {[
                    { l: "Avg download", v: `${avg(history, "download").toFixed(1)} Mbps` },
                    { l: "Avg upload", v: `${avg(history, "upload").toFixed(1)} Mbps` },
                    { l: "Avg ping", v: `${Math.round(avg(history, "ping"))} ms` },
                    { l: "Tests saved", v: String(history.length) },
                  ].map((s) => (
                    <div
                      key={s.l}
                      style={{
                        background: SURFACE2,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 12,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ fontSize: 10.5, color: TEXT_MUTED, letterSpacing: 0.6, textTransform: "uppercase" }}>
                        {s.l}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginTop: 3 }}>
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ overflowX: "auto", marginTop: 18 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ color: TEXT_MUTED, textAlign: "left" }}>
                        {["Date", "Down", "Up", "Ping", "Jitter"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "8px 10px",
                              borderBottom: `1px solid ${BORDER}`,
                              fontWeight: 600,
                              fontSize: 11.5,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r) => (
                        <tr key={r.ts} style={{ color: TEXT_SEC }}>
                          <td style={{ padding: "8px 10px", borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" }}>
                            {fmtDate(r.ts)}
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: `1px solid ${BORDER}`, color: TEAL, fontWeight: 600 }}>
                            {r.download.toFixed(1)}
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: `1px solid ${BORDER}` }}>
                            {r.upload.toFixed(1)}
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: `1px solid ${BORDER}` }}>
                            {r.ping}
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: `1px solid ${BORDER}` }}>
                            {r.jitter}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                  <button
                    onClick={exportCsv}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 10,
                      border: `1px solid ${BORDER}`,
                      background: SURFACE2,
                      color: TEAL,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⬇ Export CSV
                  </button>
                  <button
                    onClick={() => {
                      clearHistory();
                      onChange([]);
                    }}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 10,
                      border: `1px solid ${BORDER}`,
                      background: SURFACE2,
                      color: "#ff4d6d",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Clear history
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
