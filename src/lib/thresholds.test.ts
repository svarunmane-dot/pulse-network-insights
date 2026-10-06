import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  SPEED_THRESHOLDS,
  USE_CASE_REQUIREMENTS,
  isUseCaseReady,
  rateMetric,
} from "./thresholds";
import { calculatePingStats } from "./speed-test";

describe("shared speed thresholds", () => {
  test("gaming requires ping below 60 ms and jitter below 10 ms", () => {
    assert.equal(USE_CASE_REQUIREMENTS.gaming.ping, 60);
    assert.equal(USE_CASE_REQUIREMENTS.gaming.jitter, 10);
    assert.equal(isUseCaseReady(
      { download: 15, upload: 5, ping: 59, jitter: 9 },
      USE_CASE_REQUIREMENTS.gaming,
    ), true);
    assert.equal(isUseCaseReady(
      { download: 15, upload: 5, ping: 60, jitter: 9 },
      USE_CASE_REQUIREMENTS.gaming,
    ), false);
    assert.equal(isUseCaseReady(
      { download: 15, upload: 5, ping: 59, jitter: 10 },
      USE_CASE_REQUIREMENTS.gaming,
    ), false);
  });

  test("all metric ratings use the shared bands", () => {
    assert.equal(rateMetric("ping", SPEED_THRESHOLDS.ping.excellent), "excellent");
    assert.equal(rateMetric("jitter", SPEED_THRESHOLDS.jitter.good), "good");
    assert.equal(rateMetric("download", SPEED_THRESHOLDS.download.fair), "fair");
    assert.equal(rateMetric("upload", SPEED_THRESHOLDS.upload.fair - 0.1), "poor");
  });
});

describe("ping statistics", () => {
  test("uses the median and consecutive mean absolute difference", () => {
    assert.deepEqual(calculatePingStats([10, 20, 15, 25]), { ping: 18, jitter: 8 });
  });
});