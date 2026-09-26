import { COOKBOOK_COMMANDS, type CookbookCommand } from "./cisco-iosxe";
import { NXOS_COMMANDS } from "./cisco-nxos";

export type { CookbookCommand };

// Data layer: vendor datasets (NX-OS, FortiGate, Palo Alto, ...) are
// imported as additional modules and concatenated here. The frontend only
// ever reads ALL_COMMANDS, so new datasets need no UI changes.
export const ALL_COMMANDS: CookbookCommand[] = [
  ...COOKBOOK_COMMANDS,
  ...NXOS_COMMANDS,
];

const norm = (s: string) => s.toLowerCase();

export function searchCommands(query: string): CookbookCommand[] {
  const q = norm(query.trim());
  if (!q) return ALL_COMMANDS;
  const terms = q.split(/\s+/);
  return ALL_COMMANDS.filter((c) => {
    const hay = norm(
      [
        c.command,
        c.vendor,
        c.platform,
        c.device_type,
        c.category,
        c.subcategory,
        c.purpose,
        c.when_to_use,
        c.what_to_check,
        c.red_flags,
        c.likely_meaning,
        c.tags,
        c.notes,
      ].join(" "),
    );
    return terms.every((t) => hay.includes(t));
  });
}

export interface CookbookFilters {
  vendor?: string;
  platform?: string;
  deviceType?: string;
  category?: string;
  subcategory?: string;
  difficulty?: string;
  risk?: string;
  tag?: string;
}

export function applyFilters(
  list: CookbookCommand[],
  f: CookbookFilters,
): CookbookCommand[] {
  return list.filter(
    (c) =>
      (!f.vendor || c.vendor === f.vendor) &&
      (!f.platform || c.platform === f.platform) &&
      (!f.deviceType || c.device_type === f.deviceType) &&
      (!f.category || c.category === f.category) &&
      (!f.subcategory || c.subcategory === f.subcategory) &&
      (!f.difficulty || c.difficulty === f.difficulty) &&
      (!f.risk || c.risk === f.risk) &&
      (!f.tag || c.tags.toLowerCase().includes(f.tag.toLowerCase())),
  );
}

export function uniqueValues(key: keyof CookbookCommand): string[] {
  return [...new Set(ALL_COMMANDS.map((c) => String(c[key])).filter(Boolean))].sort();
}

export function allTags(): string[] {
  const s = new Set<string>();
  for (const c of ALL_COMMANDS)
    for (const t of c.tags.split(",")) {
      const v = t.trim();
      if (v) s.add(v);
    }
  return [...s].sort();
}

// Related commands: explicit next_command link plus same category/subcategory.
export function relatedCommands(c: CookbookCommand): CookbookCommand[] {
  const out: CookbookCommand[] = [];
  const seen = new Set<string>([c.id]);
  if (c.next_command) {
    const next = ALL_COMMANDS.find(
      (x) => norm(x.command) === norm(c.next_command),
    );
    if (next && !seen.has(next.id)) {
      out.push(next);
      seen.add(next.id);
    }
  }
  for (const x of ALL_COMMANDS) {
    if (out.length >= 5) break;
    if (seen.has(x.id)) continue;
    if (x.vendor === c.vendor && x.platform === c.platform && x.category === c.category) {
      out.push(x);
      seen.add(x.id);
    }
  }
  return out;
}

// "Troubleshoot a Problem" groups mapped onto the real CSV data via
// category/tag/keyword matching — no invented flows.
export interface ProblemGroup {
  group: string;
  problems: { label: string; match: (c: CookbookCommand) => boolean }[];
}

const has = (c: CookbookCommand, ...words: string[]) => {
  const hay = norm(
    `${c.category} ${c.subcategory} ${c.purpose} ${c.when_to_use} ${c.red_flags} ${c.likely_meaning} ${c.tags} ${c.command}`,
  );
  return words.some((w) => hay.includes(w));
};

export const PROBLEM_GROUPS: ProblemGroup[] = [
  {
    group: "Connectivity",
    problems: [
      { label: "Cannot reach host / gateway", match: (c) => has(c, "ping", "connectivity", "reachability", "gateway", "arp") },
      { label: "Intermittent connectivity", match: (c) => has(c, "flap", "intermittent", "unstable", "storm") },
      { label: "High latency / packet loss", match: (c) => has(c, "latency", "loss", "drop", "congestion", "qos") },
    ],
  },
  {
    group: "Switching",
    problems: [
      { label: "VLAN not working", match: (c) => has(c, "vlan") },
      { label: "Trunk problem", match: (c) => has(c, "trunk") },
      { label: "MAC address missing / flapping", match: (c) => has(c, "mac address", "mac-table", "mac flap") },
      { label: "STP blocking", match: (c) => has(c, "stp", "spanning-tree", "spanning tree") },
      { label: "Port-channel problem", match: (c) => has(c, "port-channel", "etherchannel", "lacp") },
      { label: "PoE problem", match: (c) => has(c, "poe", "power inline") },
    ],
  },
  {
    group: "Routing",
    problems: [
      { label: "Route missing / wrong route", match: (c) => has(c, "route", "routing table", "cef") },
      { label: "OSPF neighbor down", match: (c) => has(c, "ospf") },
      { label: "BGP neighbor down", match: (c) => has(c, "bgp") },
      { label: "EIGRP neighbor down", match: (c) => has(c, "eigrp") },
    ],
  },
  {
    group: "Security",
    problems: [
      { label: "ACL blocking traffic", match: (c) => has(c, "acl", "access-list") },
      { label: "NAT problem", match: (c) => has(c, "nat") },
      { label: "VPN / IPsec tunnel issue", match: (c) => has(c, "vpn", "ipsec", "isakmp", "crypto") },
      { label: "Authentication problem", match: (c) => has(c, "aaa", "radius", "tacacs", "authentication") },
    ],
  },
  {
    group: "Performance",
    problems: [
      { label: "Interface errors", match: (c) => has(c, "crc", "input errors", "errors") },
      { label: "Interface drops", match: (c) => has(c, "drops", "queue") },
      { label: "High CPU", match: (c) => has(c, "cpu") },
      { label: "High memory", match: (c) => has(c, "memory") },
      { label: "QoS drops", match: (c) => has(c, "qos", "policy-map") },
    ],
  },
  {
    group: "Wireless / DHCP",
    problems: [
      { label: "DHCP issue", match: (c) => has(c, "dhcp") },
      { label: "Client cannot connect", match: (c) => has(c, "dhcp", "authentication", "association") },
    ],
  },
];

// Quick Commands groupings.
export const QUICK_GROUPS: { label: string; match: (c: CookbookCommand) => boolean }[] = [
  { label: "Interface", match: (c) => has(c, "interface") && !has(c, "port-channel") },
  { label: "VLAN", match: (c) => has(c, "vlan") },
  { label: "MAC", match: (c) => has(c, "mac address", "mac-table") },
  { label: "STP", match: (c) => has(c, "stp", "spanning-tree") },
  { label: "Routing", match: (c) => c.category === "Routing" || has(c, "ip route", "cef") },
  { label: "OSPF", match: (c) => has(c, "ospf") },
  { label: "BGP", match: (c) => has(c, "bgp") },
  { label: "ACL", match: (c) => has(c, "acl", "access-list") },
  { label: "NAT", match: (c) => has(c, "nat") },
  { label: "DHCP", match: (c) => has(c, "dhcp") },
  { label: "VPN", match: (c) => has(c, "vpn", "ipsec", "crypto") },
  { label: "Logs", match: (c) => has(c, "logging", "log") },
  { label: "Diagnostics", match: (c) => c.category === "Diagnostics" || has(c, "ping", "traceroute", "debug") },
];
