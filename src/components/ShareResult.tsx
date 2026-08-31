import { useRef, useState } from "react";

const TEAL = "#00D4AA";

export type ShareStat = { label: string; value: string };
export type ShareRow = { label: string; value: string };

export type ShareResultProps = {
  /** Big heading on the image, e.g. "Internet Speed Test" */
  title: string;
  /** Line under the title, e.g. the target host / IP */
  subtitle?: string;
  /** Up to 6 headline metrics shown as big tiles */
  stats?: ShareStat[];
  /** Extra key/value detail lines */
  rows?: ShareRow[];
  /** Optional short verdict/summary line at the bottom of the card */
  note?: string;
  /** File name (without extension) used when downloading */
  fileName?: string;
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) return lines;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderShareCard(p: ShareResultProps): HTMLCanvasElement {
  const stats = (p.stats || []).slice(0, 6);
  const rows = (p.rows || []).slice(0, 8);

  const W = 1200;
  const padX = 64;
  const headerH = 210;
  const statRows = stats.length ? Math.ceil(stats.length / 3) : 0;
  const statsH = statRows * 132 + (statRows ? 24 : 0);
  const rowsH = rows.length * 44 + (rows.length ? 24 : 0);
  const noteH = p.note ? 96 : 0;
  const H = Math.max(630, headerH + statsH + rowsH + noteH + 130);

  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#070d16");
  bg.addColorStop(1, "#0d1a26");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Teal glow
  const glow = ctx.createRadialGradient(W - 120, 0, 20, W - 120, 0, 520);
  glow.addColorStop(0, "rgba(0,212,170,0.22)");
  glow.addColorStop(1, "rgba(0,212,170,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = TEAL;
  ctx.fillRect(0, 0, W, 6);

  // Brand
  ctx.fillStyle = TEAL;
  ctx.font = "700 30px Inter, Arial, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("PULSE", padX, 84);
  const pulseW = ctx.measureText("PULSE").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(" SPEED", padX + pulseW, 84);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 20px Inter, Arial, sans-serif";
  const stamp = new Date().toLocaleString();
  const stampW = ctx.measureText(stamp).width;
  ctx.fillText(stamp, W - padX - stampW, 84);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 52px Inter, Arial, sans-serif";
  ctx.fillText(truncate(ctx, p.title, W - padX * 2), padX, 152);

  if (p.subtitle) {
    ctx.fillStyle = TEAL;
    ctx.font = "600 26px 'DM Mono', Menlo, monospace";
    ctx.fillText(truncate(ctx, p.subtitle, W - padX * 2), padX, 190);
  }

  let y = headerH;

  // Stats tiles
  if (stats.length) {
    const gap = 20;
    const cols = Math.min(3, stats.length);
    const tileW = (W - padX * 2 - gap * (cols - 1)) / cols;
    stats.forEach((s, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padX + col * (tileW + gap);
      const ty = y + row * 132;
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      drawRoundRect(ctx, x, ty, tileW, 112, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,212,170,0.25)";
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, x, ty, tileW, 112, 16);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "600 18px Inter, Arial, sans-serif";
      ctx.fillText(truncate(ctx, s.label.toUpperCase(), tileW - 36), x + 18, ty + 40);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 38px Inter, Arial, sans-serif";
      ctx.fillText(truncate(ctx, s.value, tileW - 36), x + 18, ty + 88);
    });
    y += statsH;
  }

  // Detail rows
  if (rows.length) {
    rows.forEach((r, i) => {
      const ry = y + i * 44;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "500 22px Inter, Arial, sans-serif";
      ctx.fillText(truncate(ctx, r.label, 340), padX, ry + 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 22px 'DM Mono', Menlo, monospace";
      ctx.fillText(truncate(ctx, r.value, W - padX * 2 - 380), padX + 380, ry + 28);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, ry + 42);
      ctx.lineTo(W - padX, ry + 42);
      ctx.stroke();
    });
    y += rowsH;
  }

  // Note
  if (p.note) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "500 22px Inter, Arial, sans-serif";
    const lines = wrapText(ctx, p.note, W - padX * 2, 2);
    lines.forEach((l, i) => ctx.fillText(l, padX, y + 28 + i * 32));
    y += noteH;
  }

  // Footer
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.moveTo(padX, H - 74);
  ctx.lineTo(W - padX, H - 74);
  ctx.stroke();
  ctx.fillStyle = TEAL;
  ctx.font = "700 24px Inter, Arial, sans-serif";
  ctx.fillText("pulse-speed.com", padX, H - 34);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "500 20px Inter, Arial, sans-serif";
  const tag = "Free network tools for engineers";
  ctx.fillText(tag, W - padX - ctx.measureText(tag).width, H - 34);

  return canvas;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/png"),
  );
}

function textSummary(p: ShareResultProps) {
  const lines = [`${p.title}${p.subtitle ? ` — ${p.subtitle}` : ""}`, ""];
  (p.stats || []).forEach((s) => lines.push(`${s.label}: ${s.value}`));
  (p.rows || []).forEach((r) => lines.push(`${r.label}: ${r.value}`));
  if (p.note) lines.push("", p.note);
  lines.push("", "Tested on https://pulse-speed.com");
  return lines.join("\n");
}

const btn: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: 10,
  border: "1px solid rgba(0,212,170,0.35)",
  background: "rgba(0,212,170,0.10)",
  color: TEAL,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

export default function ShareResult(props: ShareResultProps) {
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 3000);
  };

  const fileName = `${props.fileName || "pulse-speed-result"}.png`;

  const build = async () => toBlob(renderShareCard(props));

  const onDownload = async () => {
    const blob = await build();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    flash("Image downloaded — attach it to your email.");
  };

  const onCopy = async () => {
    try {
      const blob = await build();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      flash("Image copied — paste it straight into your email.");
    } catch {
      try {
        await navigator.clipboard.writeText(textSummary(props));
        flash("Image copy unsupported here — text summary copied instead.");
      } catch {
        flash("Copy blocked by the browser. Use Download instead.");
      }
    }
  };

  const onShare = async () => {
    try {
      const blob = await build();
      const file = new File([blob], fileName, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: props.title, text: textSummary(props) });
        return;
      }
      await onDownload();
    } catch {
      /* user cancelled */
    }
  };

  const onEmail = async () => {
    const subject = encodeURIComponent(`${props.title} — pulse-speed.com`);
    const body = encodeURIComponent(textSummary(props));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    const blob = await build();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    flash("Email drafted and the result image saved — attach it to the draft.");
  };

  const onPreview = async () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
      return;
    }
    const blob = await build();
    setPreview(URL.createObjectURL(blob));
  };

  return (
    <div
      style={{
        marginTop: 18,
        padding: 16,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
        SHARE THIS RESULT
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" style={btn} onClick={onDownload}>⬇ Download image</button>
        <button type="button" style={btn} onClick={onCopy}>⧉ Copy image</button>
        <button type="button" style={btn} onClick={onShare}>↗ Share</button>
        <button type="button" style={btn} onClick={onEmail}>✉ Email result</button>
        <button type="button" style={{ ...btn, borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)" }} onClick={onPreview}>
          {preview ? "Hide preview" : "Preview image"}
        </button>
      </div>
      {msg && <div style={{ marginTop: 10, color: TEAL, fontSize: 13 }}>{msg}</div>}
      {preview && (
        <img
          src={preview}
          alt={`${props.title} result card`}
          style={{ marginTop: 14, width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}
        />
      )}
    </div>
  );
}
