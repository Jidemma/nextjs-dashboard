# 🚀 Quick Start

Spin up the dashboard against the backend API in minutes.

## ⚡ 3 Steps

```bash
# 1) Install
cd nextjs-dashboard
npm install

# 2) Point to the backend API
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_REFRESH_INTERVAL=30000
EOF

# 3) Run
npm run dev
```

Open http://localhost:3000 to view the dashboard.

## 🎯 What’s Included

- Overview, Users, Journeys, Geographic, Social dashboards
- Backend-driven analytics (FastAPI) via `NEXT_PUBLIC_API_URL`
- Date range filters, JSON export, responsive UI

## 🔌 Sample API Call

```bash
curl "$NEXT_PUBLIC_API_URL/api/analytics/journeys?startDate=2024-01-01&endDate=2024-01-31"
```

## 🔧 Common Commands

```bash
npm run dev       # local dev
npm run build     # production build
npm start         # start built app
npm run lint      # lint checks
npm run type-check
```

## 🐛 Quick Fixes

- Backend not reachable → confirm `NEXT_PUBLIC_API_URL` and start FastAPI service.
- Port 3000 busy → `npm run dev -- -p 3001`.
- Stuck loading → try Refresh button or restart dev server.

