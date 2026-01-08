# Journey Analytics Time Period Test Results

**Date:** 2026-01-07  
**Status:** ✅ Passed (after backend fix)  

## What we validated

- Response structure matches the UI contract (`journey_overview`, `journey_engagement`, etc.)
- Invariants:
  - `active_journeys <= total_journeys`
  - `completed_journeys <= total_journeys`
  - `avg_comments_per_journey ≈ total_comments / total_journeys`
  - `status_distribution` sum matches `total_journeys` when present
  - `journey_trends` sum matches `total_journeys` when present
- Cross-period monotonic checks (bigger windows should not reduce counts):
  - `Today <= Last Week <= Last Month <= Last Year <= All Time` for journeys/comments

## Results snapshot

| Period | Total Journeys | Total Comments |
|---|---:|---:|
| Today | 0 | 0 |
| Last Week | 0 | 0 |
| Last Month | 20 | 0 |
| Last Year | 103 | 104 |
| All Time | 170 | 107 |
| Custom (Last 14 days) | 1 | 0 |

## Important fix made

The `All Time` Journey Analytics endpoint was previously returning **cached/summary** data from a different schema (`journey_analytics_summary`), which produced totals that were **not consistent** with the dashboard’s Journey Analytics (which is based on `pandas_journey` + `pandas_comments`).

We changed the FastAPI endpoint to **always compute journey analytics on-the-fly** for correctness and consistency.

## How to re-run

```bash
cd nextjs-dashboard
npm run test:journeys
```


