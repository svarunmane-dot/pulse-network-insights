import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GlobalLatencySection } from "./global";

/* ============================================================
   LIBRESPEED-BASED ENGINE
   ============================================================ */

const CF = "https://speed.cloudflare.com";

async function pingTest(): Promise<{ ping: number; jitter: number }> {
  const samples: number[] = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    try {
      await fetch(`${CF}/__down?bytes=0&_=${i}-${Date.now()}`, {
        cache: "no-store",
      });
      samples.push(performance.now() - t0);
    } catch {}
  }
  if (!samples.length) return { ping: 0, jitter: 0 };

  const sorted = [...samples].sort((a, b) => a - b);
  const trimmed = sorted.slice(0, Math.max(1, sorted.length - 1));

  const ping = trimmed[Math.floor(trimmed.length / 2)];

  let jitter = 0;
  for (let i = 1; i < trimmed.length; i++) {
    jitter += Math.abs(trimmed[i] - trimmed[i - 1]);
  }
  jitter = trimmed.length > 1 ? jitter / (trimmed.length - 1) : 0;

  return {
    ping: Math.max(1, Math.round(ping)),
    jitter: Math.round(jitter),
  };
}

async function downloadTest(
  onProgress: (mbps: number, frac: number) => void,
): Promise<number> {
  const CHUNK = 25 * 1024 * 1024;
  const PARALLEL = 6;
  const DURATION_MS = 10000;

  const controller = new AbortController();
  let totalBytes = 0;
  const t0 = performance.now();

  const ticker = window.setInterval(() => {
    const elapsed = (performance.now() - t0) / 1000;
    if (elapsed > 0) {
      onProgress(
        (totalBytes * 8) / elapsed / 1e6,
        Math.min((performance.now() - t0) / DURATION_MS, 1),
      );
    }
    if (performance.now() - t0 >= DURATION_MS) controller.abort();
  }, 200);

  const stream = async () => {
    while (performance.now() - t0 < DURATION_MS) {
      try {
        const res = await fetch(
          `${CF}/__down?bytes=${CHUNK}&_=${Math.random()}`,
          { cache: "no-store", signal: controller.signal },
        );

        const reader = res.body?.getReader();
        if (!reader) break;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.byteLength;
        }
      } catch {
        break;
      }
    }
  };

  await Promise.all(Array.from({ length: PARALLEL }, stream));

  window.clearInterval(ticker);

  const elapsed = (performance.now() - t0) / 1000;
  return elapsed > 0 ? (totalBytes * 8) / elapsed / 1e6 : 0;
}

/* ============================================================
   UPDATED UPLOAD TEST (REPLACED)
   ============================================================ */

async function uploadTest(
  onProgress: (mbps: number, frac: number) => void,
): Promise<number> {
  const CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB per stream chunk
  const TOTAL_PER_STREAM = 64 * 1024 * 1024;
  const PARALLEL = 3;
  const DURATION_MS = 10000;

  const chunkData = new Uint8Array(CHUNK_SIZE);
  for (let i = 0; i < chunkData.length; i++) {
    chunkData[i] = (i * 31 + 7) & 0xff;
  }

  const t0 = performance.now();
  let totalSentBytes = 0;

  const samples: { bytes: number; sec: number }[] = [];
  let lastBytes = 0;
  let lastTs = t0;

  const ticker = window.setInterval(() => {
    const now = performance.now();
    const elapsed = (now - t0) / 1000;
    const frac = Math.min((now - t0) / DURATION_MS, 1);

    const deltaB = totalSentBytes - lastBytes;
    const deltaS = (now - lastTs) / 1000;

    if (deltaS >= 0.4 && deltaB > 0) {
      samples.push({ bytes: deltaB, sec: deltaS });
      lastBytes = totalSentBytes;
      lastTs = now;
    }

    const win = samples.slice(-5);
    const wB = win.reduce((s, x) => s + x.bytes, 0);
    const wS = win.reduce((s, x) => s + x.sec, 0);

    const mbps =
      wS > 0
        ? (wB * 8) / wS / 1e6
        : elapsed > 0
          ? (totalSentBytes * 8) / elapsed / 1e6
          : 0;

    onProgress(mbps, frac);
  }, 200);

  const runStream = async (idx: number): Promise<void> => {
    let sentThisStream = 0;

    while (
      performance.now() - t0 < DURATION_MS &&
      sentThisStream < TOTAL_PER_STREAM
    ) {
      const chunksPerRequest = 4;
      let chunksSent = 0;

      const stream = new ReadableStream({
        pull(controller) {
          if (
            chunksSent >= chunksPerRequest ||
            performance.now() - t0 >= DURATION_MS
          ) {
            controller.close();
            return;
          }

          controller.enqueue(chunkData);
          chunksSent++;

          sentThisStream += CHUNK_SIZE;
          totalSentBytes += CHUNK_SIZE;
        },
      });

      try {
        await fetch(
          `https://speed.cloudflare.com/__up?_=${idx}-${Date.now()}`,
          {
            method: "POST",
            body: stream,
            // @ts-ignore
            duplex: "half",
            headers: {
              "Content-Type": "application/octet-stream",
            },
            signal: AbortSignal.timeout(Math.min(8000, DURATION_MS)),
          },
        );
      } catch {}
    }
  };

  await Promise.race([
    Promise.all(Array.from({ length: PARALLEL }, (_, i) => runStream(i))),
    new Promise<void>((res) =>
      window.setTimeout(res, DURATION_MS + 2000),
    ),
  ]);

  window.clearInterval(ticker);

  if (samples.length >= 3) {
    const mbpsList = samples.map((s) => (s.bytes * 8) / s.sec / 1e6);
    const sorted = [...mbpsList].sort((a, b) => a - b);
    const trim = Math.max(1, Math.floor(sorted.length * 0.15));
    const core = sorted.slice(trim, sorted.length - trim);

    if (core.length > 0) {
      return core.reduce((s, n) => s + n, 0) / core.length;
    }
  }

  const elapsed = (performance.now() - t0) / 1000;
  return elapsed > 0 ? (totalSentBytes * 8) / elapsed / 1e6 : 0;
}
