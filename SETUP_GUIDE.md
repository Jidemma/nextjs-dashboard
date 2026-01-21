# NJEM Analytics Dashboard — Setup Guide

The dashboard now consumes the backend analytics API (FastAPI) instead of hosting its own API routes or connecting directly to MongoDB. Follow the steps below to get running.

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Access to the analytics backend (URL like `http://localhost:8000`)
- Terminal access

## 🚀 Setup Steps

1) **Install dependencies**
```bash
cd /Users/jidemma/Desktop/PROJECTS/NJEM_WORK/nextjs-dashboard
npm install
```

2) **Configure environment**
```bash
cat > .env.local <<'EOF_ENV'
NEXT_PUBLIC_API_URL=http://localhost:8000
# Optional: polling interval (ms) used by refresh buttons
NEXT_PUBLIC_REFRESH_INTERVAL=30000
EOF_ENV
```

3) **Start the backend**
- Ensure the FastAPI service from `python-dataAPI` (or your deployed backend) is running and reachable at `NEXT_PUBLIC_API_URL`.

4) **Run the dashboard**
```bash
npm run dev
# Production: npm run build && npm start
```

Open http://localhost:3000 and navigate to:
- Overview `/dashboard`
- Users `/dashboard/users`
- Journeys `/dashboard/journeys`
- Geographic `/dashboard/geographic`
- Social `/dashboard/social`

## 🔌 Verify Connectivity

```bash
curl "$NEXT_PUBLIC_API_URL/api/analytics/overview"
curl "$NEXT_PUBLIC_API_URL/api/analytics/users?startDate=2024-01-01&endDate=2024-01-31"
```

If these return JSON, the dashboard will load data.

## 🐛 Troubleshooting

- **Backend unreachable**: Check the FastAPI process, firewall, and `NEXT_PUBLIC_API_URL`. The frontend will show error states if the request fails.
- **CORS errors**: Allow the dashboard origin in the backend CORS settings.
- **Long queries timing out**: Increase `API_TIMEOUT` in `lib/api.ts` or adjust backend timeouts.
- **Port 3000 busy**: `npm run dev -- -p 3001`.

## 🔧 Useful Scripts

```
npm run dev       # local development
npm run build     # production build
npm start         # run built app
npm run lint      # lint checks
npm run type-check
```

Legacy MongoDB helper scripts (`check_*.js`) remain for backend/data verification. They require database access and are not part of the dashboard runtime.

## 🚢 Deploying

- Set `NEXT_PUBLIC_API_URL` (and `NEXT_PUBLIC_REFRESH_INTERVAL` if needed) in your hosting provider.
- Build with `npm run build` and start with `npm start`, or deploy via Vercel/Netlify using the same env vars.

## ✅ Quick Checklist

- [ ] Backend API reachable at `NEXT_PUBLIC_API_URL`
- [ ] `.env.local` created
- [ ] `npm run dev` starts without errors
- [ ] Dashboard pages render data without errors

Happy analyzing! 🎉
