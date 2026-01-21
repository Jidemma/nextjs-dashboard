# NJEM Analytics Dashboard

Modern analytics UI built with Next.js 14 that consumes the Python/FastAPI analytics backend. The dashboard shows user behavior, journeys, geographic distribution, and social network insights.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React Query](https://img.shields.io/badge/React_Query-5.17-red)

## ✨ Highlights

- Five focused dashboards (overview, users, journeys, geographic, social)
- Fast API-powered data via `NEXT_PUBLIC_API_URL`
- React Query caching with loading/error states
- JSON export for every view
- Date range filtering across all pages
- Responsive Tailwind UI and reusable chart components

## 🏗️ Architecture

```
Next.js App Router (frontend)
        │
        ▼
Analytics Backend API (FastAPI, python-dataAPI)
        │
        ▼
Data store (managed by the backend)
```

The frontend no longer exposes its own `/api/*` routes or talks directly to MongoDB. All data flows through the backend service.

## 📋 Requirements

- Node.js 18+ and npm 9+
- Running analytics backend (FastAPI) reachable at `NEXT_PUBLIC_API_URL`

## 🚀 Setup

```bash
# 1) Install deps
cd nextjs-dashboard
npm install

# 2) Configure backend URL
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
# Optional: increase for long analytics jobs (ms)
NEXT_PUBLIC_REFRESH_INTERVAL=30000
EOF

# 3) Run the app
npm run dev
# or production
npm run build && npm start
```

The dashboard runs at http://localhost:3000.

## 📊 Dashboard Pages

- `Overview` `/dashboard`: platform totals, health, growth, engagement, time series
- `Users` `/dashboard/users`: demographics, activity, retention, top users
- `Journeys` `/dashboard/journeys`: journey volumes, engagement, destinations, creators
- `Geographic` `/dashboard/geographic`: destinations, user locations, regional engagement, maps
- `Social` `/dashboard/social`: friendships, acceptance rates, influencers, network graph

## 🔌 Backend Endpoints

All pages call the backend with:

- `GET {API_URL}/api/analytics/overview`
- `GET {API_URL}/api/analytics/users`
- `GET {API_URL}/api/analytics/journeys`
- `GET {API_URL}/api/analytics/geographic`
- `GET {API_URL}/api/analytics/social`

Optional query params: `startDate`, `endDate` (ISO strings).

Example:

```bash
curl "$NEXT_PUBLIC_API_URL/api/analytics/overview?startDate=2024-01-01&endDate=2024-01-31"
```

## 🛠️ Project Structure

```
app/
  dashboard/             # Feature pages
  globals.css
  layout.tsx
  providers.tsx          # React Query provider
components/              # UI + charts
lib/
  api.ts                 # API base URL + fetchWithTimeout
  metricDefinitions.ts   # Tooltip/help copy
  utils.ts               # Formatters & helpers
types/analytics.ts       # Shared response shapes
```

## 🧪 Utilities

Legacy MongoDB helper scripts (`check_*.js`) remain for backend/data validation and require `mongodb` + direct database access. They are not used by the dashboard itself.

## 🐛 Troubleshooting

- **Backend unreachable**: verify `NEXT_PUBLIC_API_URL`, backend is running, and CORS allows the dashboard origin.
- **Long-running queries**: bump `NEXT_PUBLIC_REFRESH_INTERVAL` or adjust `API_TIMEOUT` in `lib/api.ts`.
- **Stale UI after date change**: queries are keyed by `startDate/endDate`; use the Refresh button to force refetch.

## 🤝 Notes

This dashboard is part of the NJEM Travel Platform and pairs with the FastAPI analytics service (`python-dataAPI`). Open issues or questions in the repo or contact the dev team.

