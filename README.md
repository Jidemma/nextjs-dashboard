# NJEM Analytics Dashboard

A modern, interactive analytics dashboard built with Next.js 14 for the NJEM Travel Platform. This dashboard provides real-time insights into user behavior, journey analytics, geographic distribution, and social network metrics.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.3-green)
![React Query](https://img.shields.io/badge/React_Query-5.17-red)

## ✨ Features

- **📊 Interactive Dashboards**: Five specialized dashboards for different analytics categories
- **🎨 Modern UI**: Beautiful, responsive design built with Tailwind CSS
- **📈 Rich Visualizations**: Interactive charts using Recharts library
- **🔄 Real-time Updates**: Auto-refresh capabilities with configurable intervals
- **📅 Date Filtering**: Flexible date range selection for time-based analysis
- **💾 Data Export**: Export analytics data as JSON or CSV
- **🚀 High Performance**: Optimized with React Query caching and Next.js SSR
- **🔌 API-First**: Clean RESTful API routes for data access
- **📱 Responsive**: Works seamlessly on desktop, tablet, and mobile devices

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Next.js Frontend (App Router)      │
│  ┌────────────────────────────────────────┐ │
│  │  Dashboard Pages (React Components)    │ │
│  │  - Overview  - Users  - Journeys       │ │
│  │  - Geographic  - Social  - Health      │ │
│  └────────────────────────────────────────┘ │
│                    ↕                         │
│  ┌────────────────────────────────────────┐ │
│  │  API Routes (/api/analytics/*)         │ │
│  │  - Data aggregation                    │ │
│  │  - Query optimization                  │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────┐
│          MongoDB Database (njemdb)           │
│  ┌────────────────────────────────────────┐ │
│  │  Analytics Collections                 │ │
│  │  - overview_analytics                  │ │
│  │  - user_analytics                      │ │
│  │  - journey_analytics                   │ │
│  │  - geographic_analytics                │ │
│  │  - social_network_analytics            │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │  Source Collections (pandas_*)         │ │
│  │  - pandas_users                        │ │
│  │  - pandas_journey                      │ │
│  │  - pandas_comments                     │ │
│  │  - pandas_friends                      │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **MongoDB**: Access to your NJEM MongoDB database
- **Git**: For cloning the repository

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate to the dashboard directory
cd nextjs-dashboard

# Install dependencies
npm install
```

### 2. Configuration

Create a `.env.local` file in the `nextjs-dashboard` directory:

```bash
# Copy the example env file
cp .env.example .env.local
```

Edit `.env.local` with your MongoDB credentials:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://njem360user:mongodb52-kg-02-A@95.216.8.140:40774/njemdb?authMechanism=SCRAM-SHA-256&authSource=admin
MONGODB_DB=njemdb

# Next.js Configuration
NEXT_PUBLIC_APP_NAME=NJEM Analytics Dashboard
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Optional: Auto-refresh interval in milliseconds
NEXT_PUBLIC_REFRESH_INTERVAL=30000

# Optional: Enable debug mode
DEBUG_MODE=false
```

### 3. Run Development Server

```bash
npm run dev
```

The dashboard will be available at: **http://localhost:3000**

### 4. Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📊 Dashboard Pages

### 1. **Overview Dashboard** (`/dashboard`)
- Platform-wide metrics
- Total users, journeys, comments, friendships
- Growth and engagement metrics
- Platform health status
- Time-series charts for daily trends

### 2. **User Analytics** (`/dashboard/users`)
- User demographics (gender, age distribution)
- User activity metrics
- Most active users
- Retention and churn rates
- New user trends

### 3. **Journey Analytics** (`/dashboard/journeys`)
- Total and active journeys
- Journey duration statistics
- Most commented journeys
- Popular destinations
- Journey engagement metrics

### 4. **Geographic Analytics** (`/dashboard/geographic`)
- User distribution by country and city
- Popular travel destinations
- Travel patterns and routes
- Geographic heat maps

### 5. **Social Network Analytics** (`/dashboard/social`)
- Friendship network metrics
- Network density
- Influential users
- Friend request statistics
- Community clusters

### 6. **Collections Browser** (`/dashboard/collections`)
- Browse all MongoDB collections
- Collection statistics (size, document count)
- Last updated timestamps
- Categorized view (analytics, source, other)

### 7. **System Health** (`/dashboard/health`)
- Database connection status
- System performance metrics
- Response time monitoring
- Auto-refresh health checks

## 🎨 Features in Detail

### Date Range Filtering

All analytics pages support flexible date filtering:
- **Last Day**: View yesterday's data
- **Last Week**: View past 7 days
- **Last Month**: View past 30 days
- **Last Year**: View past 365 days
- **All Time**: View all historical data
- **Custom Range**: Select specific start and end dates

### Data Export

Export analytics data in multiple formats:
- **JSON**: Full data export with nested objects
- **CSV**: Flat data export for spreadsheet analysis

Click the "Export" button on any dashboard page to download current data.

### Real-time Updates

Configure auto-refresh intervals in `.env.local`:
```env
NEXT_PUBLIC_REFRESH_INTERVAL=30000  # 30 seconds
```

Or manually refresh using the "Refresh" button on any page.

### Responsive Design

The dashboard automatically adapts to different screen sizes:
- **Desktop**: Full sidebar with multi-column layouts
- **Tablet**: Responsive grid layouts
- **Mobile**: Stacked layouts with collapsible navigation

## 🔧 API Endpoints

All API endpoints return JSON responses in this format:

```typescript
{
  "success": boolean,
  "data": { ... },
  "timestamp": "ISO 8601 date string"
}
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health check |
| `/api/collections` | GET | List all collections |
| `/api/analytics/overview` | GET | Overview analytics |
| `/api/analytics/users` | GET | User analytics |
| `/api/analytics/journeys` | GET | Journey analytics |
| `/api/analytics/geographic` | GET | Geographic analytics |
| `/api/analytics/social` | GET | Social network analytics |

### Query Parameters

All analytics endpoints support these parameters:
- `startDate`: ISO 8601 date string (optional)
- `endDate`: ISO 8601 date string (optional)
- `limit`: Number of results (default: 10)

Example:
```bash
curl "http://localhost:3000/api/analytics/users?startDate=2024-01-01&endDate=2024-12-31&limit=20"
```

## 🛠️ Development

### Project Structure

```
nextjs-dashboard/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── analytics/            # Analytics endpoints
│   │   ├── collections/          # Collections endpoint
│   │   └── health/               # Health check endpoint
│   ├── dashboard/                # Dashboard pages
│   │   ├── users/                # User analytics page
│   │   ├── journeys/             # Journey analytics page
│   │   ├── geographic/           # Geographic page
│   │   ├── social/               # Social analytics page
│   │   ├── collections/          # Collections browser
│   │   ├── health/               # Health monitor
│   │   ├── layout.tsx            # Dashboard layout
│   │   └── page.tsx              # Overview page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home (redirects)
│   └── providers.tsx             # React Query provider
├── components/                   # Reusable components
│   ├── charts/                   # Chart components
│   │   ├── BarChart.tsx
│   │   ├── LineChart.tsx
│   │   └── PieChart.tsx
│   ├── DateRangePicker.tsx       # Date filter
│   ├── ErrorMessage.tsx          # Error display
│   ├── Header.tsx                # Page header
│   ├── LoadingSpinner.tsx        # Loading state
│   ├── MetricCard.tsx            # Metric display
│   └── Sidebar.tsx               # Navigation sidebar
├── lib/                          # Utilities
│   ├── mongodb.ts                # MongoDB connection
│   └── utils.ts                  # Helper functions
├── types/                        # TypeScript types
│   └── analytics.ts              # Analytics types
├── public/                       # Static assets
├── .env.example                  # Example environment
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js config
├── package.json                  # Dependencies
├── postcss.config.js             # PostCSS config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

### Adding New Charts

1. Create a new chart component in `components/charts/`
2. Import Recharts components
3. Add TypeScript types for props
4. Handle empty data states
5. Export the component

Example:
```typescript
// components/charts/AreaChart.tsx
import { AreaChart as RechartsAreaChart, Area } from 'recharts';

export function AreaChart({ data, xKey, yKey }) {
  return (
    <RechartsAreaChart data={data}>
      <Area dataKey={yKey} />
    </RechartsAreaChart>
  );
}
```

### Adding New API Routes

1. Create a new file in `app/api/`
2. Export a `GET` function (or POST, PUT, DELETE)
3. Use `getDatabase()` for MongoDB access
4. Return `NextResponse.json()`

Example:
```typescript
// app/api/analytics/custom/route.ts
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  const db = await getDatabase();
  const data = await db.collection('my_collection').find({}).toArray();
  
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error**: `MongoServerError: Authentication failed`

**Solution**:
1. Verify your MongoDB URI in `.env.local`
2. Check username and password
3. Ensure network access (IP whitelisting)
4. Test connection using MongoDB Compass

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Missing Environment Variables

**Error**: `Please add your MongoDB URI to .env.local`

**Solution**:
1. Create `.env.local` file in project root
2. Copy contents from `.env.example`
3. Update with your actual MongoDB credentials

### Build Errors

**Error**: `Module not found` or TypeScript errors

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## 📈 Performance Optimization

### Caching Strategy

- **React Query**: 1-minute stale time for analytics data
- **MongoDB Connection**: Connection pooling (5-10 connections)
- **API Routes**: Edge caching with revalidation

### Best Practices

1. **Use Date Filters**: Narrow down date ranges for faster queries
2. **Limit Results**: Use the `limit` parameter for large datasets
3. **Pre-compute Analytics**: Run scheduled jobs to pre-compute complex analytics
4. **Enable Indexes**: Ensure MongoDB collections have proper indexes

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub:
```bash
git add .
git commit -m "Add Next.js analytics dashboard"
git push origin main
```

2. Connect to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables from `.env.local`
   - Deploy!

### Deploy to Other Platforms

The dashboard can be deployed to any platform that supports Node.js:
- **Netlify**: Use `next build` and `next start`
- **AWS**: Deploy to Elastic Beanstalk or Lambda
- **DigitalOcean**: Use App Platform or Droplets
- **Docker**: Build a Docker image

### Environment Variables in Production

Ensure all environment variables are set in your deployment platform:
- `MONGODB_URI`
- `MONGODB_DB`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_API_BASE_URL`

## 🤝 Integration with Existing System

### Using with Airflow ETL

This dashboard works seamlessly with your existing Airflow ETL pipeline:

1. **Airflow generates analytics** → MongoDB collections
2. **Dashboard reads from** → MongoDB collections
3. **Real-time updates** → Auto-refresh or manual refresh

### Using with Streamlit Dashboard

You can run both dashboards simultaneously:
- **Streamlit**: Port 8501 (Python-based, existing dashboard)
- **Next.js**: Port 3000 (New, this dashboard)

They both read from the same MongoDB database.

## 📝 License

This project is part of the NJEM Travel Platform.

## 👥 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Contact the development team

## 🎉 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Recharts](https://recharts.org/) - Charting library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [React Query](https://tanstack.com/query) - Data fetching
- [MongoDB](https://www.mongodb.com/) - Database
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

**Made with ❤️ for NJEM Travel Platform**

