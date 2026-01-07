# 🚀 Quick Start Guide

Get your NJEM Analytics Dashboard running in **5 minutes**!

## ⚡ Super Quick Setup

```bash
# 1. Navigate to dashboard directory
cd nextjs-dashboard

# 2. Run automated setup script
./setup.sh

# 3. Start development server
npm run dev
```

That's it! Open **http://localhost:3000** in your browser.

---

## 📝 Manual Setup (if script doesn't work)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env.local
```

Edit `.env.local` with your MongoDB credentials:
```env
MONGODB_URI=mongodb://njem360user:password@host:port/njemdb
MONGODB_DB=njemdb
```

### 3. Start Development Server
```bash
npm run dev
```

---

## 🎯 What You Get

### 7 Dashboard Pages

1. **Overview** → Platform-wide metrics and health
2. **Users** → User demographics and activity
3. **Journeys** → Travel analytics and destinations
4. **Geographic** → Location distribution and patterns
5. **Social** → Network metrics and influencers
6. **Collections** → Browse MongoDB collections
7. **Health** → System status monitoring

### Key Features

✅ **Real-time Data** - Direct MongoDB connection  
✅ **Interactive Charts** - Recharts visualizations  
✅ **Date Filtering** - Day/Week/Month/Year/Custom  
✅ **Data Export** - JSON & CSV downloads  
✅ **Auto-Refresh** - Configurable intervals  
✅ **Responsive** - Works on all devices  
✅ **Fast** - React Query caching  
✅ **TypeScript** - Type-safe code  

---

## 🔧 Common Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📊 Example API Calls

Test your API endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Overview analytics
curl http://localhost:3000/api/analytics/overview

# User analytics with date filter
curl "http://localhost:3000/api/analytics/users?startDate=2024-01-01&endDate=2024-12-31"

# List all collections
curl http://localhost:3000/api/collections
```

---

## 🐛 Troubleshooting Quick Fixes

### MongoDB Connection Failed
```bash
# Test connection
nc -zv 95.216.8.140 40774

# Check .env.local has correct MONGODB_URI
cat .env.local
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Missing Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear cache
rm -rf .next
npm run build
```

---

## 📱 Accessing the Dashboard

Once running, visit these URLs:

| Page | URL |
|------|-----|
| Overview | http://localhost:3000/dashboard |
| Users | http://localhost:3000/dashboard/users |
| Journeys | http://localhost:3000/dashboard/journeys |
| Geographic | http://localhost:3000/dashboard/geographic |
| Social | http://localhost:3000/dashboard/social |
| Collections | http://localhost:3000/dashboard/collections |
| Health | http://localhost:3000/dashboard/health |

---

## 🚀 Production Deployment

### Option 1: Vercel (Easiest)
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Option 2: PM2
```bash
npm run build
pm2 start npm --name "njem-dashboard" -- start
```

### Option 3: Docker
```bash
docker build -t njem-dashboard .
docker run -p 3000:3000 --env-file .env.local njem-dashboard
```

---

## 📚 More Information

- **README.md** - Full documentation
- **SETUP_GUIDE.md** - Detailed setup instructions
- **package.json** - Dependencies and scripts

---

## 🎉 You're All Set!

Your analytics dashboard is ready to use. Explore your data, create insights, and make data-driven decisions!

Need help? Check the README.md or contact the development team.

**Happy analyzing!** 📊✨

