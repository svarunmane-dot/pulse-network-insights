export type ConnectionMetric = "ping" | "jitter" | "download" | "upload";
export type QualityRating = "excellent" | "good" | "fair" | "poor";

type ThresholdBand = {
  excellent: number;
  good: number;
  fair: number;
  direction: "lower" | "higher";
  unit: "ms" | "Mbps";
};

export const SPEED_THRESHOLDS: Record<ConnectionMetric, ThresholdBand> = {
  ping: { excellent: 30, good: 60, fair: 100, direction: "lower", unit: "ms" },
  jitter: { excellent: 5, good: 10, fair: 20, direction: "lower", unit: "ms" },
  download: { excellent: 100, good: 50, fair: 25, direction: "higher", unit: "Mbps" },
  upload: { excellent: 50, good: 10, fair: 5, direction: "higher", unit: "Mbps" },
};

export type UseCaseKey =
  | "gaming"
  | "videoCalls"
  | "streaming4k"
  | "largeUploads";

export type UseCaseRequirement = {
  icon: string;
  label: string;
  download: number;
  upload: number;
  ping: number;
  jitter: number;
};

export const USE_CASE_REQUIREMENTS: Record<UseCaseKey, UseCaseRequirement> = {
  gaming: {
    icon: "🎮",
    label: "Gaming",
    download: 15,
    upload: 5,
    ping: 60,
    jitter: 10,
  },
  videoCalls: {
    icon: "📹",
    label: "Video Calls",
    download: 10,
    upload: 5,
    ping: 100,
    jitter: 20,
  },
  streaming4k: {
    icon: "📺",
    label: "4K Streaming",
    download: 25,
    upload: 5,
    ping: 150,
    jitter: 30,
  },
  largeUploads: {
    icon: "☁️",
    label: "Large Uploads",
    download: 5,
    upload: 50,
    ping: 200,
    jitter: 50,
  },
};

export type SpeedResult = Record<ConnectionMetric, number>;

export function rateMetric(metric: ConnectionMetric, value: number): QualityRating {
  const band = SPEED_THRESHOLDS[metric];
  if (band.direction === "lower") {
    if (value <= band.excellent) return "excellent";
    if (value <= band.good) return "good";
    if (value <= band.fair) return "fair";
    return "poor";
  }
  if (value >= band.excellent) return "excellent";
  if (value >= band.good) return "good";
  if (value >= band.fair) return "fair";
  return "poor";
}

export function isUseCaseReady(result: SpeedResult, requirement: UseCaseRequirement) {
  return (
    result.download >= requirement.download &&
    result.upload >= requirement.upload &&
    result.ping < requirement.ping &&
    result.jitter < requirement.jitter
  );
}

export function formatUseCaseRequirements(requirement: UseCaseRequirement) {
  return `${requirement.download} Mbps download, ${requirement.upload} Mbps upload, ping below ${requirement.ping} ms and jitter below ${requirement.jitter} ms`;
}

export function buildSpeedAnalysis(result: SpeedResult) {
  const ratings = {
    download: rateMetric("download", result.download),
    upload: rateMetric("upload", result.upload),
    ping: rateMetric("ping", result.ping),
    jitter: rateMetric("jitter", result.jitter),
  };
  const gaming = USE_CASE_REQUIREMENTS.gaming;
  const calls = USE_CASE_REQUIREMENTS.videoCalls;
  const streaming = USE_CASE_REQUIREMENTS.streaming4k;
  const uploads = USE_CASE_REQUIREMENTS.largeUploads;

  return [
    `Download is ${ratings.download} at ${result.download.toFixed(1)} Mbps; 4K streaming needs at least ${streaming.download} Mbps.`,
    `Upload is ${ratings.upload} at ${result.upload.toFixed(1)} Mbps; video calls need ${calls.upload} Mbps and large uploads need ${uploads.upload} Mbps.`,
    `Ping is ${ratings.ping} at ${result.ping} ms and jitter is ${ratings.jitter} at ${result.jitter} ms; gaming needs ping below ${gaming.ping} ms and jitter below ${gaming.jitter} ms.`,
  ].join(" ");
}

export const SPEED_FAQS = [
  {
    q: "What is a good internet speed?",
    a: `For 4K streaming, use at least ${formatUseCaseRequirements(USE_CASE_REQUIREMENTS.streaming4k)}. Video calls need ${formatUseCaseRequirements(USE_CASE_REQUIREMENTS.videoCalls)}.`,
  },
  {
    q: "What speed is good for gaming?",
    a: `For gaming, aim for ${formatUseCaseRequirements(USE_CASE_REQUIREMENTS.gaming)}. Low delay and stable timing matter more than very high bandwidth.`,
  },
  {
    q: "How much speed do I need for streaming?",
    a: `A single 4K stream needs ${USE_CASE_REQUIREMENTS.streaming4k.download} Mbps download. Allow more bandwidth when several devices stream at once.`,
  },
  {
    q: "What connection is suitable for large uploads?",
    a: `For large cloud backups and file transfers, aim for ${formatUseCaseRequirements(USE_CASE_REQUIREMENTS.largeUploads)}.`,
  },
] as const;