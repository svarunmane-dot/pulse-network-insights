export function calculatePingStats(samples: number[]) {
  if (samples.length === 0) return { ping: 0, jitter: 0 };

  const sorted = [...samples].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];

  const differences = samples
    .slice(1)
    .map((sample, index) => Math.abs(sample - samples[index]));
  const jitter = differences.length
    ? differences.reduce((sum, value) => sum + value, 0) / differences.length
    : 0;

  return {
    ping: Math.max(1, Math.round(median)),
    jitter: Math.round(jitter),
  };
}