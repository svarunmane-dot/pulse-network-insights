import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toolHead } from "@/lib/seo";
import {
  ALL_COMMANDS,
  PROBLEM_GROUPS,
  QUICK_GROUPS,
  allTags,
  applyFilters,
  relatedCommands,
  searchCommands,
  uniqueValues,
  type CookbookCommand,
  type CookbookFilters,
} from "@/lib/cookbook";

export const Route = createFileRoute("/troubleshooting")({
  head: () =>
    toolHead({
      path: "/troubleshooting",
      name: "Network Troubleshooting Cookbook",
      title: "Network Troubleshooting Commands & Engineer Command Cookbook | Pulse Speed",
      description:
        "Searchable network troubleshooting commands for Cisco and other network platforms, with explanations, red flags, expected results and next troubleshooting steps.",
      category: "NetworkingApplication",
      faqs: [
        {
          q: "What is the Network Troubleshooting Cookbook?",
          a: "A searchable knowledge base of vendor CLI commands that tells you what to run, why, what to check in the output, what red flags mean, and which command to run next.",
        },
        {
          q: "Which vendors are covered?",
          a: "The initial dataset covers Cisco IOS/IOS-XE with 100 commands. NX-OS, FortiGate, Palo Alto, Juniper, Aruba, F5, Arista, Ruckus and Linux datasets are planned next.",
        },
        {
          q: "Are the commands safe to run in production?",
          a: "Every command carries a risk label: Safe, Caution or Danger. Debug commands are marked Danger and should be used carefully in production environments.",
        },
      ],
    }),
  component: TroubleshootingPage,
});

const C = {
  bg: "#0a0e1a",
  card: "#131829",
  border: "#1f2740",
  text: "#c8d0e0",
  dim: "#6b7794",
  accent: "#00D4AA",
  danger: "#ff4d6d",
  caution: "#f5a623",
};

const RISK_COLOR: Record<string, string> = {
  Safe: C.accent,
  Caution: C.caution,
  Danger: C.danger,
};

const mono: React.CSSProperties = {
  fontFamily: "'DM Mono', ui-monospace, monospace",
};

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        border: `1px solid ${color ?? C.border}`,
        color: color ?? C.dim,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        padding: "5px 12px",
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: copied ? "rgba(0,212,170,0.15)" : "#0f1422",
        color: copied ? C.accent : C.text,
        fontSize: 12,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function Field({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  if (!value) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.dim, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: warn ? C.danger : C.text, lineHeight: 1.55, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function CommandCard({ c, onSelect }: { c: CookbookCommand; onSelect: (id: string) => void }) {
  const related = relatedCommands(c);
  return (
    <article
      id={`cmd-${c.id}`}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <Badge label={c.vendor} color="#9B8FE8" />
        <Badge label={c.platform} />
        <Badge label={c.device_type} />
        <Badge label={`${c.category} · ${c.subcategory}`} />
        <span style={{ flex: 1 }} />
        <Badge label={c.risk.toUpperCase()} color={RISK_COLOR[c.risk]} />
        <Badge label={c.difficulty} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
          background: "#0b0f1c",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "10px 12px",
        }}
      >
        <code style={{ ...mono, fontSize: 14, color: C.accent, wordBreak: "break-all", flex: 1 }}>
          {c.command}
        </code>
        <CopyButton text={c.command} />
      </div>

      <Field label="Purpose" value={c.purpose} />
      <Field label="When to use" value={c.when_to_use} />
      <Field label="What to check" value={c.what_to_check} />
      <Field label="Healthy indication" value={c.healthy_indication} />
      <Field label="Red flags" value={c.red_flags} warn />
      <Field label="Likely meaning" value={c.likely_meaning} />

      {c.next_command && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.dim, textTransform: "uppercase" }}>
            Next command
          </div>
          {(() => {
            const next = related.find(
              (r) => r.command.toLowerCase() === c.next_command.toLowerCase(),
            );
            return next ? (
              <button
                type="button"
                onClick={() => onSelect(next.id)}
                style={{
                  ...mono,
                  fontSize: 12,
                  color: "#9B8FE8",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                {c.next_command}
              </button>
            ) : (
              <code style={{ ...mono, fontSize: 12, color: "#9B8FE8" }}>{c.next_command}</code>
            );
          })()}
        </div>
      )}

      {related.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.dim, textTransform: "uppercase" }}>
            Related commands
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {related.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.id)}
                style={{
                  ...mono,
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.text,
                  cursor: "pointer",
                }}
              >
                {r.command}
              </button>
            ))}
          </div>
        </div>
      )}

      {c.notes && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.dim, fontStyle: "italic" }}>
          Note: {c.notes}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, color: C.dim }}>
        {c.id} · {c.command_mode} · {c.os_version_scope}
      </div>
    </article>
  );
}

const selectStyle: React.CSSProperties = {
  background: "#0f1422",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  fontSize: 12,
  padding: "7px 10px",
  minWidth: 0,
};

type Tab = "search" | "problem" | "quick";

function TroubleshootingPage() {
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CookbookFilters>({});
  const [openProblem, setOpenProblem] = useState<string | null>(null);

  const results = useMemo(
    () => applyFilters(searchCommands(query), filters),
    [query, filters],
  );

  const tags = useMemo(() => allTags(), []);

  const setF = (k: keyof CookbookFilters, v: string) =>
    setFilters((f) => ({ ...f, [k]: v || undefined }));

  const scrollTo = (id: string) => {
    setTab("search");
    setQuery("");
    setFilters({});
    window.setTimeout(() => {
      document.getElementById(`cmd-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 16px 60px", color: C.text }}>
      <h1 style={{ color: "#fff", fontSize: 28, margin: 0, letterSpacing: "-0.5px" }}>
        Network Troubleshooting Cookbook
      </h1>
      <p style={{ color: C.dim, fontSize: 14, marginTop: 8, maxWidth: 720, lineHeight: 1.6 }}>
        What command to run, why to run it, what to check in the output, what red flags mean —
        and what to run next. Currently covering {ALL_COMMANDS.length} commands across{" "}
        {uniqueValues("platform").join(" and ")}, with more vendors coming.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {(
          [
            ["search", "🔍 Search Commands"],
            ["problem", "🛠 Troubleshoot a Problem"],
            ["quick", "⚡ Quick Commands"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: `1px solid ${tab === t ? C.accent : C.border}`,
              background: tab === t ? "rgba(0,212,170,0.12)" : C.card,
              color: tab === t ? C.accent : C.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "search" && (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you troubleshooting? e.g. BGP neighbor down, CRC errors, DHCP failure…"
            aria-label="Search troubleshooting commands"
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginTop: 16,
              padding: "14px 16px",
              fontSize: 15,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.card,
              color: "#fff",
              outline: "none",
            }}
          />

          {/* Filters */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 8,
              marginTop: 12,
            }}
          >
            <select style={selectStyle} value={filters.vendor ?? ""} onChange={(e) => setF("vendor", e.target.value)} aria-label="Filter by vendor">
              <option value="">Vendor: all</option>
              {uniqueValues("vendor").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select style={selectStyle} value={filters.platform ?? ""} onChange={(e) => setF("platform", e.target.value)} aria-label="Filter by platform">
              <option value="">Platform: all</option>
              {uniqueValues("platform").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select style={selectStyle} value={filters.deviceType ?? ""} onChange={(e) => setF("deviceType", e.target.value)} aria-label="Filter by device type">
              <option value="">Device: all</option>
              {uniqueValues("device_type").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select style={selectStyle} value={filters.category ?? ""} onChange={(e) => setF("category", e.target.value)} aria-label="Filter by category">
              <option value="">Category: all</option>
              {uniqueValues("category").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select style={selectStyle} value={filters.subcategory ?? ""} onChange={(e) => setF("subcategory", e.target.value)} aria-label="Filter by subcategory">
              <option value="">Subcategory: all</option>
              {uniqueValues("subcategory").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select style={selectStyle} value={filters.difficulty ?? ""} onChange={(e) => setF("difficulty", e.target.value)} aria-label="Filter by difficulty">
              <option value="">Difficulty: all</option>
              {uniqueValues("difficulty").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select style={selectStyle} value={filters.risk ?? ""} onChange={(e) => setF("risk", e.target.value)} aria-label="Filter by risk">
              <option value="">Risk: all</option>
              {uniqueValues("risk").map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select style={selectStyle} value={filters.tag ?? ""} onChange={(e) => setF("tag", e.target.value)} aria-label="Filter by tag">
              <option value="">Tag: all</option>
              {tags.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div style={{ marginTop: 14, fontSize: 12, color: C.dim }}>
            {results.length} of {ALL_COMMANDS.length} commands
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 480px), 1fr))",
              gap: 14,
              marginTop: 12,
            }}
          >
            {results.map((c) => (
              <CommandCard key={c.id} c={c} onSelect={scrollTo} />
            ))}
            {results.length === 0 && (
              <p style={{ color: C.dim, fontSize: 14 }}>
                No commands match. Try fewer words or clear the filters.
              </p>
            )}
          </div>
        </>
      )}

      {tab === "problem" && (
        <div style={{ marginTop: 20, display: "grid", gap: 20 }}>
          {PROBLEM_GROUPS.map((g) => (
            <section key={g.group}>
              <h2 style={{ color: "#fff", fontSize: 17, margin: "0 0 10px" }}>{g.group}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {g.problems.map((p) => {
                  const count = ALL_COMMANDS.filter(p.match).length;
                  const key = `${g.group}/${p.label}`;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setOpenProblem(openProblem === key ? null : key)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: `1px solid ${openProblem === key ? C.accent : C.border}`,
                        background: openProblem === key ? "rgba(0,212,170,0.12)" : C.card,
                        color: openProblem === key ? C.accent : C.text,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {p.label} <span style={{ color: C.dim }}>({count})</span>
                    </button>
                  );
                })}
              </div>
              {g.problems.map((p) => {
                const key = `${g.group}/${p.label}`;
                if (openProblem !== key) return null;
                const cmds = ALL_COMMANDS.filter(p.match);
                return (
                  <div
                    key={key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 480px), 1fr))",
                      gap: 14,
                      marginTop: 14,
                    }}
                  >
                    {cmds.map((c) => (
                      <CommandCard key={c.id} c={c} onSelect={scrollTo} />
                    ))}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}

      {tab === "quick" && (
        <div style={{ marginTop: 20, display: "grid", gap: 20 }}>
          {QUICK_GROUPS.map((g) => {
            const cmds = ALL_COMMANDS.filter(g.match);
            if (cmds.length === 0) return null;
            return (
              <section
                key={g.label}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}
              >
                <h2 style={{ color: "#fff", fontSize: 15, margin: "0 0 10px" }}>
                  {g.label} <span style={{ color: C.dim, fontWeight: 400 }}>({cmds.length})</span>
                </h2>
                <div style={{ display: "grid", gap: 6 }}>
                  {cmds.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "#0b0f1c",
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <code style={{ ...mono, fontSize: 13, color: C.accent, flex: 1, minWidth: 200, wordBreak: "break-all" }}>
                        {c.command}
                      </code>
                      <span style={{ fontSize: 12, color: C.dim, flex: 2, minWidth: 160 }}>{c.purpose}</span>
                      <Badge label={c.risk.toUpperCase()} color={RISK_COLOR[c.risk]} />
                      <CopyButton text={c.command} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
