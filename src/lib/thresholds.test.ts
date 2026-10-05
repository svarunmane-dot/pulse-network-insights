import { describe, expect, test } from "bun:test";
import {
  SPEED_THRESHOLDS,
  USE_CASE_REQUIREMENTS,
  isUseCaseReady,
  rateMetric,
} from "./thresholds";
import { calculatePingStats } from "./speed-test";

describe("shared speed thresholds", () => {
  test("gaming requires ping below 60 ms and jitter below 10 ms", () => {
    expect(USE_CASE_REQUIREMENTS.gaming.ping).toBe(60);
    expect(USE_CASE_REQUIREMENTS.gaming.jitter).toBe(10);
    expect(isUseCaseReady(
      { download: 15, upload: 5, ping: 59, jitter: 9 },
      USE_CASE_REQUIREMENTS.gaming,
    )).toBe(true);
    expect(isUseCaseReady(
      { download: 15, upload: 5, ping: 60, jitter: 9 },
      USE_CASE_REQUIREMENTS.gaming,
    )).toBe(false);
    expect(isUseCaseReady(
      { download: 15, upload: 5, ping: 59, jitter: 10 },
      USE_CASE_REQUIREMENTS.gaming,
    )).toBe(false);
  });

  test("all metric ratings use the shared bands", () => {
    expect(rateMetric("ping", SPEED_THRESHOLDS.ping.excellent)).toBe("excellent");
    expect(rateMetric("jitter", SPEED_THRESHOLDS.jitter.good)).toBe("good");
    expect(rateMetric("download", SPEED_THRESHOLDS.download.fair)).toBe("fair");
    expect(rateMetric("upload", SPEED_THRESHOLDS.upload.fair - 0.1)).toBe("poor");
  });
});

describe("ping statistics", () => {
  test("uses the median and consecutive mean absolute difference", () => {
    expect(calculatePingStats([10, 20, 15, 25])).toEqual({ ping: 18, jitter: 10 });
  });
});