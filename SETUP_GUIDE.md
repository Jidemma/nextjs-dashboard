# NJEM Analytics Dashboard - Setup Guide

This guide will walk you through setting up the Next.js analytics dashboard from scratch.

## 📋 Prerequisites Check

Before starting, ensure you have:

- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm 9+ installed (`npm --version`)
- ✅ MongoDB access credentials
- ✅ Terminal/Command line access

## 🚀 Step-by-Step Setup

### Step 1: Navigate to Dashboard Directory

```bash
cd /Users/jidemma/Desktop/PROJECTS/NJEM_WORK/njem-airflow-etl/nextjs-dashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts (for charts)
- React Query (for data fetching)
- MongoDB driver
- And more...

**Expected output**: Installation should complete without errors in 1-3 minutes.

### Step 3: Configure Environment Variables

Create a `.env.local` file:

```bash
touch .env.local
```

Open the file and add your MongoDB credentials:

```env
# MongoDB Configuration (REQUIRED)
MONGODB_URI=mongodb://njem360user:mongodb52-kg-02-A@95.216.8.140:40774/njemdb?authMechanism=SCRAM-SHA-256&authSource=admin
MONGODB_DB=njemdb

# Next.js Configuration (OPTIONAL - has defaults)
NEXT_PUBLIC_APP_NAME=NJEM Analytics Dashboard
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Auto-refresh interval in milliseconds (OPTIONAL - default: 30000)
NEXT_PUBLIC_REFRESH_INTERVAL=30000

# Debug mode (OPTIONAL - default: false)
DEBUG_MODE=false
```

**⚠️ Important**: Never commit `.env.local` to version control!

### Step 4: Test MongoDB Connection

Before running the dashboard, test your MongoDB connection:

```bash
# Create a test script
cat > test-connection.js << 'EOF'
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    const db = client.db(process.env.MONGODB_DB);
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
EOF

# Run the test
node test-connection.js

# Clean up
rm test-connection.js
```

**Expected output**:
```
✅ MongoDB connection successful!
✅ Found 15 collections
```

### Step 5: Start Development Server

```bash
npm run dev
```

**Expected output**:
```
  ▲ Next.js 14.1.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.x:3000

 ✓ Ready in 2.3s
```

### Step 6: Access the Dashboard

Open your browser and navigate to:

**http://localhost:3000**

You should be automatically redirected to: **http://localhost:3000/dashboard**

## ✅ Verification Checklist

Verify each page loads successfully:

- [ ] **Overview Dashboard** (`/dashboard`) - Shows platform metrics
- [ ] **Users** (`/dashboard/users`) - Shows user analytics
- [ ] **Journeys** (`/dashboard/journeys`) - Shows journey data
- [ ] **Geographic** (`/dashboard/geographic`) - Shows location data
- [ ] **Social** (`/dashboard/social`) - Shows network metrics
- [ ] **Collections** (`/dashboard/collections`) - Lists MongoDB collections
- [ ] **Health** (`/dashboard/health`) - Shows system health

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Failed

**Symptoms**: Dashboard shows "Failed to fetch" errors

**Solutions**:
1. Check MongoDB URI in `.env.local`
2. Verify MongoDB server is running
3. Check firewall/network access
4. Test with MongoDB Compass

```bash
# Test MongoDB connectivity
nc -zv 95.216.8.140 40774
```

### Issue 2: Port 3000 Already in Use

**Symptoms**: Error: `EADDRINUSE: address already in use :::3000`

**Solutions**:

```bash
# Option 1: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use different port
npm run dev -- -p 3001
```

### Issue 3: Module Not Found Errors

**Symptoms**: TypeScript or import errors

**Solutions**:

```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Issue 4: No Data Showing

**Symptoms**: Dashboard loads but shows no data or zeros

**Solutions**:
1. Check if MongoDB has data in analytics collections
2. Run your Airflow ETL pipeline to generate analytics
3. Check browser console for API errors (F12 → Console tab)

```bash
# Check if collections exist
mongo "mongodb://njem360user:mongodb52-kg-02-A@95.216.8.140:40774/njemdb?authMechanism=SCRAM-SHA-256&authSource=admin"
> show collections
> db.pandas_users.countDocuments()
```

### Issue 5: Styling Issues

**Symptoms**: Dashboard looks broken or unstyled

**Solutions**:

```bash
# Rebuild Tailwind CSS
npm run dev

# Or clear Next.js cache
rm -rf .next
npm run dev
```

## 🔧 Advanced Configuration

### Custom Port

```bash
# Development
npm run dev -- -p 8080

# Production
PORT=8080 npm start
```

### Custom API Base URL

If deploying to a different domain:

```env
NEXT_PUBLIC_API_BASE_URL=https://analytics.yourdomain.com
```

### Database Query Optimization

Add MongoDB indexes for better performance:

```javascript
// Connect to MongoDB and run:
db.pandas_users.createIndex({ createdAt: 1 });
db.pandas_journey.createIndex({ start_date: 1 });
db.pandas_comments.createIndex({ created_at: 1 });
```

## 📦 Production Build

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

### Production Checklist

- [ ] All environment variables configured
- [ ] MongoDB connection tested
- [ ] Build completes without errors
- [ ] All pages load correctly
- [ ] Data displays properly
- [ ] Charts render correctly
- [ ] Export functionality works
- [ ] Mobile responsive
- [ ] Performance tested

### Performance Testing

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run performance test
lighthouse http://localhost:3000/dashboard --view
```

**Target scores**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. Push to GitHub:
```bash
git add nextjs-dashboard/
git commit -m "Add Next.js dashboard"
git push
```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Add environment variables
6. Deploy!

**Environment variables to add**:
- `MONGODB_URI`
- `MONGODB_DB`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_API_BASE_URL`

### Option 2: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t njem-dashboard .
docker run -p 3000:3000 --env-file .env.local njem-dashboard
```

### Option 3: PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "njem-dashboard" -- start

# View logs
pm2 logs njem-dashboard

# Auto-restart on system reboot
pm2 startup
pm2 save
```

## 📊 Usage Tips

### 1. Using Date Filters

- Click on a time period button (Day/Week/Month/Year/All)
- Or select "Custom" and choose specific dates
- Data updates automatically when you change the filter

### 2. Exporting Data

- Click the "Export" button on any analytics page
- Choose JSON format for full data structure
- Choose CSV format for spreadsheet analysis

### 3. Auto-Refresh

- Health page auto-refreshes every 30 seconds
- Other pages can be manually refreshed using the "Refresh" button
- Configure auto-refresh interval in `.env.local`

### 4. Mobile Access

- Dashboard is fully responsive
- Access from any device with a web browser
- Sidebar collapses on mobile devices

## 🔍 Monitoring

### Check Logs

```bash
# Development logs (real-time)
npm run dev

# Production logs with PM2
pm2 logs njem-dashboard

# Docker logs
docker logs -f njem-dashboard
```

### Health Monitoring

Access the health page: `/dashboard/health`

- Shows database connection status
- Displays response times
- Auto-refreshes every 30 seconds

### API Testing

Test API endpoints directly:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test overview analytics
curl http://localhost:3000/api/analytics/overview

# Test with date filter
curl "http://localhost:3000/api/analytics/users?startDate=2024-01-01&endDate=2024-12-31"
```

## 🎓 Next Steps

1. **Explore the Dashboard**: Visit each page and familiarize yourself with the features
2. **Customize**: Modify colors, add new charts, or create custom pages
3. **Integrate**: Connect with your existing systems and workflows
4. **Monitor**: Set up monitoring and alerts for production
5. **Scale**: Optimize queries and caching as data grows

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Recharts Documentation](https://recharts.org/en-US/api)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)

## 🆘 Getting Help

If you encounter issues:

1. Check the **Common Issues** section above
2. Review the **README.md** file
3. Check browser console for errors (F12 → Console)
4. Test MongoDB connection separately
5. Contact the development team

---

**✅ Setup Complete!**

Your NJEM Analytics Dashboard is now ready to use. Enjoy exploring your data! 🎉

