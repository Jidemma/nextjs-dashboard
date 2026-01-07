/**
 * Overview Analytics API Route
 * ============================
 * Get platform-wide overview analytics including metrics, growth, and engagement
 */

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    
    // Treat empty strings as null (All Time)
    if (startDate === '' || startDate === null) startDate = null;
    if (endDate === '' || endDate === null) endDate = null;
    
    const db = await getDatabase();
    
    // If date filters are provided, compute on-the-fly for accurate filtering
    if (startDate || endDate) {
      const overviewAnalytics = await computeOverviewAnalytics(db, startDate, endDate);
      return NextResponse.json({
        success: true,
        data: overviewAnalytics,
        computed: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // For "All Time", check pre-computed analytics first
    const analyticsCollection = db.collection('overview_analytics');
    const analytics = await analyticsCollection.findOne({}, { sort: { generated_at: -1 } });
    
    if (analytics && analytics.data && analytics.data.overview_dashboard) {
      // Transform from stored format to dashboard format
      const transformedData = await transformOverviewAnalytics(analytics, db);
      return NextResponse.json({
        success: true,
        data: transformedData,
        fromCache: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Fallback: compute on-the-fly if no pre-computed data exists
    const overviewAnalytics = await computeOverviewAnalytics(db, startDate, endDate);
    return NextResponse.json({
      success: true,
      data: overviewAnalytics,
      computed: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching overview analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Transform overview analytics from stored format to dashboard format
 */
async function transformOverviewAnalytics(analytics: any, db: any): Promise<any> {
  const dashboard = analytics.data?.overview_dashboard || {};
  const keyMetrics = dashboard.key_metrics || {};
  const timeSeries = analytics.data?.overview_time_series || {};
  const featureUsage = dashboard.feature_usage || [];
  
  // Extract friendships from feature_usage array
  // Format: [["Media Uploads", 196], ["Journeys", 170], ["Friend Connections", 88], ["Albums", 25]]
  let totalFriendships = 0;
  
  featureUsage.forEach((item: any) => {
    if (Array.isArray(item) && item.length >= 2) {
      const [name, count] = item;
      if (typeof name === 'string' && typeof count === 'number') {
        if (name.toLowerCase().includes('friend')) {
          totalFriendships = count;
        }
      }
    }
  });
  
  // Comments are not in feature_usage, so get from database
  const commentsCollection = db.collection('pandas_comments');
  const totalComments = await commentsCollection.countDocuments();
  
  // Get journeys from key_metrics (stored as journeys_created)
  const totalJourneys = keyMetrics.journeys_created || keyMetrics.total_journeys || 0;
  const totalUsers = keyMetrics.total_users || 0;
  const activeUsers = keyMetrics.active_users || 0;
  
  // Calculate engagement metrics
  const avgCommentsPerJourney = totalJourneys > 0 ? Number((totalComments / totalJourneys).toFixed(2)) : 0;
  const avgFriendsPerUser = totalUsers > 0 ? Number((totalFriendships / totalUsers).toFixed(2)) : 0;
  const engagementRate = keyMetrics.active_users_pct || keyMetrics.engaged_users_pct || 0;
  
  // Time series data is not available in stored format (only aggregated totals)
  // Compute from raw data for accurate daily breakdowns
  const usersCollection = db.collection('pandas_users');
  const journeysCollection = db.collection('pandas_journey');
  
  const dailyUsers = await computeDailyTimeSeries(usersCollection, 'createdAt', null, null);
  const dailyJourneys = await computeDailyTimeSeries(journeysCollection, 'start_date', null, null);
  const dailyEngagement = await computeDailyEngagementTimeSeries(
    journeysCollection,
    commentsCollection,
    null,
    null
  );
  
  return {
    generated_at: analytics.generated_at || new Date().toISOString(),
    time_period: {
      start_date: 'all',
      end_date: analytics.generated_at || new Date().toISOString(),
      description: dashboard.period_info?.period_description || 'All Time',
    },
    platform_health: {
      status: 'healthy',
      uptime_percentage: 99.9,
      last_update: analytics.generated_at || new Date().toISOString(),
    },
    total_metrics: {
      total_users: totalUsers,
      active_users: activeUsers,
      total_journeys: totalJourneys,
      active_journeys: totalJourneys, // All journeys are considered active
      total_comments: totalComments,
      total_friendships: totalFriendships,
    },
    growth_metrics: {
      user_growth_rate: keyMetrics.user_growth_rate || 0,
      journey_growth_rate: keyMetrics.journey_growth_rate || 0,
      engagement_growth_rate: keyMetrics.engagement_growth_rate || 0,
    },
    engagement_metrics: {
      avg_comments_per_journey: avgCommentsPerJourney,
      avg_friends_per_user: avgFriendsPerUser,
      engagement_rate: Number(engagementRate.toFixed(1)),
    },
    time_series: {
      daily_users: dailyUsers,
      daily_journeys: dailyJourneys,
      daily_engagement: dailyEngagement,
    },
  };
}

/**
 * Compute overview analytics from MongoDB collections
 */
async function computeOverviewAnalytics(
  db: any,
  startDate: string | null,
  endDate: string | null
) {
  const usersCollection = db.collection('pandas_users');
  const journeysCollection = db.collection('pandas_journey');
  const commentsCollection = db.collection('pandas_comments');
  const friendsCollection = db.collection('pandas_friends');
  
  // Build date filters
  const dateFilter: any = {};
  const activityDateFilter: any = {};
  
  if (startDate) {
    const start = new Date(startDate);
    dateFilter.$gte = start.toISOString();
    activityDateFilter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end.toISOString();
    activityDateFilter.$lte = end;
  }
  
  // Total metrics - count all documents regardless of date
  const totalUsers = await usersCollection.countDocuments({});
  
  // Active users: users with journeys or comments in the period
  const journeyUserFilter: any = {};
  const commentUserFilter: any = {};
  if (Object.keys(activityDateFilter).length > 0) {
    journeyUserFilter.start_date = activityDateFilter;
    commentUserFilter.created_at = activityDateFilter;
  }
  
  const usersWithJourneys = await journeysCollection.distinct('user_id', journeyUserFilter);
  const usersWithComments = await commentsCollection.distinct('user_id', commentUserFilter);
  const activeUserIds = new Set([
    ...usersWithJourneys.map((id: any) => String(id)),
    ...usersWithComments.map((id: any) => String(id))
  ]);
  const activeUsers = activeUserIds.size;
  
  // Total journeys
  const totalJourneys = await journeysCollection.countDocuments(journeyUserFilter);
  
  // Active journeys: journeys with comments or activity in the period
  const activeJourneys = totalJourneys; // Simplified: all journeys in period are active
  
  // Total comments in period
  const totalComments = await commentsCollection.countDocuments(commentUserFilter);
  
  // Total friendships
  const totalFriendships = await friendsCollection.countDocuments();
  
  // Growth metrics - compare with previous period
  let userGrowthRate = 0;
  let journeyGrowthRate = 0;
  let engagementGrowthRate = 0;
  
  if (startDate && endDate) {
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    const periodDuration = periodEnd.getTime() - periodStart.getTime();
    const previousPeriodStart = new Date(periodStart.getTime() - periodDuration);
    const previousPeriodEnd = periodStart;
    
    // Previous period filters
    const previousActivityFilter: any = {
      $gte: previousPeriodStart,
      $lte: previousPeriodEnd
    };
    
    // Count previous period metrics
    const previousJourneyFilter = { start_date: previousActivityFilter };
    const previousCommentFilter = { created_at: previousActivityFilter };
    
    const previousUsersWithJourneys = await journeysCollection.distinct('user_id', previousJourneyFilter);
    const previousUsersWithComments = await commentsCollection.distinct('user_id', previousCommentFilter);
    const previousActiveUserIds = new Set([
      ...previousUsersWithJourneys.map((id: any) => String(id)),
      ...previousUsersWithComments.map((id: any) => String(id))
    ]);
    const previousActiveUsers = previousActiveUserIds.size;
    
    const previousJourneys = await journeysCollection.countDocuments(previousJourneyFilter);
    const previousComments = await commentsCollection.countDocuments(previousCommentFilter);
    
    // Calculate growth rates
    if (previousActiveUsers > 0) {
      userGrowthRate = ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100;
    }
    if (previousJourneys > 0) {
      journeyGrowthRate = ((totalJourneys - previousJourneys) / previousJourneys) * 100;
    }
    const previousEngagement = previousComments + previousJourneys;
    const currentEngagement = totalComments + totalJourneys;
    if (previousEngagement > 0) {
      engagementGrowthRate = ((currentEngagement - previousEngagement) / previousEngagement) * 100;
    }
  }
  
  // Engagement metrics
  const avgCommentsPerJourney = totalJourneys > 0 
    ? Number((totalComments / totalJourneys).toFixed(2))
    : 0;
  
  const avgFriendsPerUser = totalUsers > 0
    ? Number((totalFriendships / totalUsers).toFixed(2))
    : 0;
  
  const engagementRate = totalUsers > 0
    ? Number(((activeUsers / totalUsers) * 100).toFixed(1))
    : 0;
  
  // Time series data - daily aggregation
  const dailyUsers = await computeDailyTimeSeries(usersCollection, 'createdAt', startDate, endDate);
  const dailyJourneys = await computeDailyTimeSeries(journeysCollection, 'start_date', startDate, endDate);
  const dailyEngagement = await computeDailyEngagementTimeSeries(
    journeysCollection,
    commentsCollection,
    startDate,
    endDate
  );
  
  // Platform health (simplified)
  const platformHealth = {
    status: 'healthy',
    uptime_percentage: 99.9,
    last_update: new Date().toISOString(),
  };
  
  // Time period description
  let periodDescription = 'All Time';
  if (startDate && endDate) {
    periodDescription = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  } else if (startDate) {
    periodDescription = `Since ${new Date(startDate).toLocaleDateString()}`;
  } else if (endDate) {
    periodDescription = `Until ${new Date(endDate).toLocaleDateString()}`;
  }
  
  return {
    generated_at: new Date().toISOString(),
    time_period: {
      start_date: startDate || 'all',
      end_date: endDate || new Date().toISOString(),
      description: periodDescription,
    },
    platform_health: platformHealth,
    total_metrics: {
      total_users: totalUsers,
      active_users: activeUsers,
      total_journeys: totalJourneys,
      active_journeys: activeJourneys,
      total_comments: totalComments,
      total_friendships: totalFriendships,
    },
    growth_metrics: {
      user_growth_rate: Number(userGrowthRate.toFixed(1)),
      journey_growth_rate: Number(journeyGrowthRate.toFixed(1)),
      engagement_growth_rate: Number(engagementGrowthRate.toFixed(1)),
    },
    engagement_metrics: {
      avg_comments_per_journey: avgCommentsPerJourney,
      avg_friends_per_user: avgFriendsPerUser,
      engagement_rate: engagementRate,
    },
    time_series: {
      daily_users: dailyUsers,
      daily_journeys: dailyJourneys,
      daily_engagement: dailyEngagement,
    },
  };
}

/**
 * Compute daily time series from a collection
 */
async function computeDailyTimeSeries(
  collection: any,
  dateField: string,
  startDate: string | null,
  endDate: string | null
) {
  try {
    const matchFilter: any = {};
    
    // Handle both Date and string date fields
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      
      // Try both date formats (Date object and ISO string)
      matchFilter.$or = [
        { [dateField]: dateFilter },
        { [dateField]: { $gte: startDate ? new Date(startDate).toISOString() : undefined } }
      ];
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (matchFilter.$or[1][dateField]) {
          matchFilter.$or[1][dateField].$lte = end.toISOString();
        }
      }
    }
    
    // For string dates, also check if they're valid ISO strings
    const pipeline: any[] = [
      { $match: matchFilter },
      {
        $addFields: {
          date_parsed: {
            $cond: {
              if: { $eq: [{ $type: `$${dateField}` }, 'date'] },
              then: `$${dateField}`,
              else: {
                $dateFromString: {
                  dateString: `$${dateField}`,
                  onError: null,
                },
              },
            },
          },
        },
      },
      { $match: { date_parsed: { $ne: null } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date_parsed',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          value: '$count',
          _id: 0,
        },
      },
    ];
    
    const result = await collection.aggregate(pipeline).toArray();
    return result;
  } catch (error) {
    console.error('Error computing daily time series:', error);
    return [];
  }
}

/**
 * Compute daily engagement time series (journeys + comments)
 */
async function computeDailyEngagementTimeSeries(
  journeysCollection: any,
  commentsCollection: any,
  startDate: string | null,
  endDate: string | null
) {
  try {
    // Get daily journeys
    const dailyJourneys = await computeDailyTimeSeries(journeysCollection, 'start_date', startDate, endDate);
    
    // Get daily comments
    const dailyComments = await computeDailyTimeSeries(commentsCollection, 'created_at', startDate, endDate);
    
    // Combine into a single time series
    const combined: { [key: string]: number } = {};
    
    dailyJourneys.forEach((item: any) => {
      combined[item.date] = (combined[item.date] || 0) + item.value;
    });
    
    dailyComments.forEach((item: any) => {
      combined[item.date] = (combined[item.date] || 0) + item.value;
    });
    
    // Convert to array and sort
    const result = Object.entries(combined)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  } catch (error) {
    console.error('Error computing daily engagement time series:', error);
    return [];
  }
}

