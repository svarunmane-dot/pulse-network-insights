# Fix homepage speed test results

## What will change
- Add one shared thresholds module for ping, jitter, download, upload, and named use-case requirements. Use it for analysis text, readiness results, visible FAQs, and FAQ structured data.
- Warm the existing HTTPS connection, discard that first request, then calculate ping from the median of 10 measured requests and jitter from consecutive samples.
- Keep final download speed visible during upload, remove automatic page-load testing, and retain click-to-run/retest behavior.
- Remove duplicate download/upload result cards, leaving only Ping and Jitter below the two gauges.
- Rename App Reachability to HTTPS response time and explain why it is higher than ping.
- Add a compact under-640px two-gauge layout and verify desktop/mobile behavior.

## Threshold defaults
- Gaming: 15 Mbps down, 5 Mbps up, ping under 60 ms, jitter under 10 ms.
- Video calls: 10 Mbps down, 5 Mbps up, ping under 100 ms, jitter under 20 ms.
- 4K streaming: 25 Mbps down, 5 Mbps up, ping under 150 ms, jitter under 30 ms.
- Large uploads: 5 Mbps down, 50 Mbps up, ping under 200 ms, jitter under 50 ms.
- Metric quality bands will live alongside these minimums and use inclusive excellent/good/fair limits, with anything higher or lower than the fair limit rated poor as appropriate.

## Validation
- Add focused tests proving the shared ratings and the exact gaming limits.
- Run those tests, check the latest preview build result, and exercise the speed-test start and layout in desktop and mobile browser sizes.
