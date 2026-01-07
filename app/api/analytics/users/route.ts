/**
 * User Analytics API Route
 * ========================
 * Get user analytics data including demographics and activity
 */

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Treat empty strings as null (All Time)
    if (startDate === '' || startDate === null) startDate = null;
    if (endDate === '' || endDate === null) endDate = null;
    
    const db = await getDatabase();
    
    // If date filters are provided, compute on-the-fly for accurate filtering
    if (startDate || endDate) {
      const userAnalytics = await computeUserAnalytics(db, startDate, endDate, limit);
      
      return NextResponse.json({
        success: true,
        data: userAnalytics,
        computed: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // For "All Time", check pre-computed analytics first
    const analyticsCollection = db.collection('user_analytics');
    const analytics = await analyticsCollection.findOne({}, { sort: { generated_at: -1 } });
    
    if (analytics && analytics.data && analytics.data.user_dashboard) {
      // Transform from stored format to dashboard format
      const transformedData = await transformUserAnalyticsFromCache(analytics, db, limit);
      return NextResponse.json({
        success: true,
        data: transformedData,
        fromCache: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Fallback: compute on-the-fly if no pre-computed data exists
    const userAnalytics = await computeUserAnalytics(db, startDate, endDate, limit);
    
    return NextResponse.json({
      success: true,
      data: userAnalytics,
      computed: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching user analytics:', error);
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
 * Transform user analytics from stored format to dashboard format
 */
async function transformUserAnalyticsFromCache(analytics: any, db: any, limit: number): Promise<any> {
  const dashboard = analytics.data?.user_dashboard || {};
  const activityDist = dashboard.activity_distribution || {};
  const growthMetrics = dashboard.growth_metrics || {};
  const engagementMetrics = dashboard.engagement_metrics || {};
  const retentionAnalysis = dashboard.retention_analysis || {};
  
  // Get most active users (still need to compute this as it's user-specific)
  const mostActiveUsers = await computeMostActiveUsers(db, null, null, limit);
  
  // Transform activity distribution
  const activityDistribution = [
    { range: 'Inactive (<1/week)', count: activityDist.inactive_users || 0 },
    { range: 'Medium (1-3/week)', count: activityDist.medium_users || 0 },
    { range: 'Active (3+/week)', count: activityDist.active_users || 0 },
  ];
  
  return {
    generated_at: analytics.generated_at || new Date().toISOString(),
    time_period: {
      start_date: 'all',
      end_date: analytics.generated_at || new Date().toISOString(),
    },
    user_demographics: {
      total_users: growthMetrics.total_users || 0,
      active_users: growthMetrics.active_users || 0,
      new_users: growthMetrics.new_users || 0,
      gender_distribution: dashboard.gender_distribution || {},
    },
    user_activity: {
      avg_journeys_per_user: engagementMetrics.avg_journeys_per_user || 0,
      avg_comments_per_user: engagementMetrics.avg_comments_per_user || 0,
      avg_friends_per_user: engagementMetrics.avg_friends_per_user || 0,
      most_active_users: mostActiveUsers,
    },
    user_retention: {
      retention_rate: retentionAnalysis.retention_rate || 0,
      churn_rate: retentionAnalysis.churn_rate || 0,
      returning_users: retentionAnalysis.returning_users || 0,
    },
    registration_trends: dashboard.registration_trends || [],
    activity_distribution: activityDistribution,
  };
}

/**
 * Transform user analytics from your format to dashboard format
 * NOTE: This function is deprecated - we now always compute on the fly for consistency
 * Keeping it for backward compatibility but it should not be used
 */
async function transformUserAnalytics(analytics: any, db: any, startDate: string | null, endDate: string | null): Promise<any> {
  // Instead of using pre-computed analytics, compute everything on the fly for consistency
  return await computeUserAnalytics(db, startDate, endDate, 15);
}

/**
 * Compute most active users with date filtering
 */
async function computeMostActiveUsers(db: any, startDate: string | null, endDate: string | null, limit: number): Promise<any[]> {
  try {
    const usersCollection = db.collection('pandas_users');
    
    // Build activity date filter for lookups (filter activities by date, not users)
    const activityDateFilterForLookup: any = {};
    if (startDate) {
      const start = new Date(startDate);
      activityDateFilterForLookup.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      activityDateFilterForLookup.$lte = end;
    }

    // Get most active users
    // Include ALL users but filter their activities by date
    const mostActiveUsers = await usersCollection.aggregate([
      {
        $lookup: {
          from: 'pandas_journey',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user_id', '$$userId'] },
                ...(Object.keys(activityDateFilterForLookup).length > 0 ? { start_date: activityDateFilterForLookup } : {})
              }
            }
          ],
          as: 'journeys'
        }
      },
      {
        $lookup: {
          from: 'pandas_comments',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user_id', '$$userId'] },
                ...(Object.keys(activityDateFilterForLookup).length > 0 ? { created_at: activityDateFilterForLookup } : {})
              }
            }
          ],
          as: 'comments'
        }
      },
      {
        $addFields: {
          activity_score: {
            $add: [
              { $size: '$journeys' },
              { $multiply: [{ $size: '$comments' }, 0.5] }
            ]
          }
        }
    },
      // Only include users with some activity
      { $match: { activity_score: { $gt: 0 } } },
      { $sort: { activity_score: -1 } },
      { $limit: limit },
      {
        $project: {
          user_id: { $toString: '$_id' },
          username: 1,
          name: 1,
          activity_score: 1
        }
      }
    ]).toArray();
    
    return mostActiveUsers;
  } catch (error) {
    console.error('Error computing most active users:', error);
    return [];
  }
}

/**
 * Compute registration trends from users collection
 */
async function computeRegistrationTrends(db: any, startDate: string | null = null, endDate: string | null = null): Promise<any[]> {
  try {
    const usersCollection = db.collection('pandas_users');
    
    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      dateFilter.$gte = start.toISOString();
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end.toISOString();
    }
    
    const trends = await usersCollection.aggregate([
      {
        $match: {
          createdAt: { $exists: true, $ne: null, ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}) }
        }
      },
      {
        $addFields: {
          date_parsed: {
            $dateFromString: {
              dateString: '$createdAt',
              onError: null
            }
          }
        }
      },
      {
        $match: {
          date_parsed: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$date_parsed'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]).toArray();
    return trends;
  } catch (error) {
    console.error('Error computing registration trends:', error);
    return [];
  }
}

/**
 * Compute activity distribution from users based on activities per week
 * Aligned with "Active Users" metric - only counts journeys and comments
 * Active users: >= 3 activities per week
 * Inactive users: < 1 activity per week
 * Medium users: 1-3 activities per week
 */
async function computeActivityDistribution(db: any, startDate: string | null = null, endDate: string | null = null): Promise<any[]> {
  try {
    const usersCollection = db.collection('pandas_users');
    
    // Calculate weeks in the time period
    let weeks = 4.0; // Default to 4 weeks
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      weeks = Math.max(1, days / 7.0);
    } else if (startDate) {
      const start = new Date(startDate);
      const now = new Date();
      const days = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      weeks = Math.max(1, days / 7.0);
    } else if (endDate) {
      const end = new Date(endDate);
      const start = new Date(end);
      start.setDate(start.getDate() - 30); // Assume 30 days before
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      weeks = Math.max(1, days / 7.0);
    } else {
      // For all-time data, calculate weeks based on earliest and latest activity dates
      try {
        const earliestActivity = await usersCollection.findOne(
          { createdAt: { $exists: true, $ne: null } },
          { sort: { createdAt: 1 }, projection: { createdAt: 1 } }
        );
        const latestActivity = await usersCollection.findOne(
          { createdAt: { $exists: true, $ne: null } },
          { sort: { createdAt: -1 }, projection: { createdAt: 1 } }
        );
        
        if (earliestActivity?.createdAt && latestActivity?.createdAt) {
          const start = new Date(earliestActivity.createdAt);
          const end = new Date(latestActivity.createdAt);
          const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          weeks = Math.max(1, days / 7.0);
        }
      } catch (err) {
        // If calculation fails, use default 4 weeks
        console.warn('Could not calculate weeks from data, using default:', err);
      }
    }
    
    // Build date filter for activities (journeys, comments, etc.)
    // NOTE: We include ALL users, not filtered by creation date
    // The time period should only filter activities, not the user base
    const activityDateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      activityDateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      activityDateFilter.$lte = end;
    }
    
    // Get all users and calculate their weekly activities in the selected period
    // Include ALL users, but only count activities in the selected time period
    const usersWithActivities = await usersCollection.aggregate([
      {
        $lookup: {
          from: 'pandas_journey',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user_id', '$$userId'] },
                ...(Object.keys(activityDateFilter).length > 0 ? { start_date: activityDateFilter } : {})
              }
            }
          ],
          as: 'journeys'
        }
      },
      {
        $lookup: {
          from: 'pandas_comments',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user_id', '$$userId'] },
                ...(Object.keys(activityDateFilter).length > 0 ? { created_at: activityDateFilter } : {})
              }
            }
          ],
          as: 'comments'
        }
      },
      {
        $addFields: {
          // Count total activities - aligned with "Active Users" metric
          // Only count journeys and comments (same as Active Users calculation)
          total_activities: {
            $add: [
              { $size: '$journeys' }, // Journeys created
              { $size: '$comments' }  // Comments made
            ]
          }
        }
      },
      {
        $addFields: {
          // Calculate activities per week
          activities_per_week: {
            $divide: ['$total_activities', weeks]
          }
        }
      },
      {
        $project: {
          _id: 1,
          activities_per_week: 1
        }
      }
    ]).toArray();
    
    // Classify users based on activities per week
    const distribution = {
      'Inactive (<1/week)': 0,
      'Medium (1-3/week)': 0,
      'Active (3+/week)': 0
    };
    
    for (const user of usersWithActivities) {
      const activitiesPerWeek = user.activities_per_week || 0;
      if (activitiesPerWeek < 1.0) {
        distribution['Inactive (<1/week)']++;
      } else if (activitiesPerWeek < 3.0) {
        distribution['Medium (1-3/week)']++;
      } else {
        distribution['Active (3+/week)']++;
      }
    }
    
    // Convert to array format
    return [
      {
        range: 'Inactive (<1/week)',
        count: distribution['Inactive (<1/week)']
      },
      {
        range: 'Medium (1-3/week)',
        count: distribution['Medium (1-3/week)']
      },
      {
        range: 'Active (3+/week)',
        count: distribution['Active (3+/week)']
      }
    ];
  } catch (error) {
    console.error('Error computing activity distribution:', error);
    return [];
  }
}

async function computeUserAnalytics(
  db: any, 
  startDate: string | null, 
  endDate: string | null,
  limit: number
) {
  const usersCollection = db.collection('pandas_users');
  const journeysCollection = db.collection('pandas_journey');
  const commentsCollection = db.collection('pandas_comments');
  const friendsCollection = db.collection('pandas_friends');
  
  // Handle date filtering for string dates (createdAt is stored as string)
  const dateFilter: any = {};
  if (startDate) {
    const start = new Date(startDate);
    dateFilter.$gte = start.toISOString();
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end.toISOString();
  }
  
  // Get total users - ALWAYS show all users regardless of time period
  // The time period should filter activities, not the user base
  const totalUsers = await usersCollection.countDocuments({});
  
  // Get new users for the selected period (or last 30 days if no period selected)
  let newUsersDateFilter: any = {};
  if (startDate || endDate) {
    // Use the selected period for new users
    if (startDate) {
      const start = new Date(startDate);
      newUsersDateFilter.$gte = start.toISOString();
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      newUsersDateFilter.$lte = end.toISOString();
    }
  } else {
    // Default to last 30 days if no period selected
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    newUsersDateFilter.$gte = thirtyDaysAgo.toISOString();
  }
  const newUsers = await usersCollection.countDocuments({
    createdAt: newUsersDateFilter
  });
  
  // Get gender distribution
  const genderDistribution = await usersCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $group: {
        _id: '$gender',
        count: { $sum: 1 }
      }
    }
  ]).toArray();
  
  const genderDist: any = {};
  genderDistribution.forEach(item => {
    if (item._id) {
      genderDist[item._id] = item.count;
    }
  });
  
  // Get most active users using the shared function
  const mostActiveUsers = await computeMostActiveUsers(db, startDate, endDate, limit);
  
  // Calculate averages - apply date filters if provided
  const journeyCountFilter: any = {};
  const commentCountFilter: any = {};
  if (startDate || endDate) {
    const activityDateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      activityDateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      activityDateFilter.$lte = end;
    }
    journeyCountFilter.start_date = activityDateFilter;
    commentCountFilter.created_at = activityDateFilter;
  }
  
  const totalJourneys = await journeysCollection.countDocuments(journeyCountFilter);
  const totalComments = await commentsCollection.countDocuments(commentCountFilter);
  const totalFriends = await friendsCollection.countDocuments();
  
  // Get user registration trends (by month) - handle string dates
  const registrationTrends = await usersCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $match: {
        createdAt: { $exists: true, $ne: null }
      }
    },
    {
      $addFields: {
        date_parsed: {
          $dateFromString: {
            dateString: '$createdAt',
            onError: null
          }
        }
      }
    },
    {
      $match: {
        date_parsed: { $ne: null }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m',
            date: '$date_parsed'
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        month: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]).toArray();
  
  // Get activity distribution based on activities per week
  // Calculate weeks in the time period
  let weeks = 4.0; // Default to 4 weeks
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    weeks = Math.max(1, days / 7.0);
  } else if (startDate) {
    const start = new Date(startDate);
    const now = new Date();
    const days = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    weeks = Math.max(1, days / 7.0);
  } else if (endDate) {
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 30); // Assume 30 days before
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    weeks = Math.max(1, days / 7.0);
  } else {
    // For all-time data, calculate weeks based on earliest and latest user creation dates
    try {
      const earliestUser = await usersCollection.findOne(
        { createdAt: { $exists: true, $ne: null } },
        { sort: { createdAt: 1 }, projection: { createdAt: 1 } }
      );
      const latestUser = await usersCollection.findOne(
        { createdAt: { $exists: true, $ne: null } },
        { sort: { createdAt: -1 }, projection: { createdAt: 1 } }
      );
      
      if (earliestUser?.createdAt && latestUser?.createdAt) {
        const start = new Date(earliestUser.createdAt);
        const end = new Date(latestUser.createdAt);
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        weeks = Math.max(1, days / 7.0);
      }
    } catch (err) {
      // If calculation fails, use default 4 weeks
      console.warn('Could not calculate weeks from data, using default:', err);
    }
  }
  
  // Build date filter for activities
  const activityDateFilterForLookup: any = {};
  if (startDate) {
    const start = new Date(startDate);
    activityDateFilterForLookup.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    activityDateFilterForLookup.$lte = end;
  }
  
  // Comprehensive app usage tracking: journeys, comments, media, albums, friends, journey requests
  // Include ALL users (not filtered by creation date) but filter activities by the selected period
  const usersWithActivities = await usersCollection.aggregate([
    {
      $lookup: {
        from: 'pandas_journey',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$user_id', '$$userId'] },
              ...(Object.keys(activityDateFilterForLookup).length > 0 ? { start_date: activityDateFilterForLookup } : {})
            }
          }
        ],
        as: 'journeys'
      }
    },
    {
      $lookup: {
        from: 'pandas_comments',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$user_id', '$$userId'] },
              ...(Object.keys(activityDateFilterForLookup).length > 0 ? { created_at: activityDateFilterForLookup } : {})
            }
          }
        ],
        as: 'comments'
      }
    },
    {
      $lookup: {
        from: 'pandas_friends',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$follower_id', '$$userId'] },
                  { $eq: ['$followee_id', '$$userId'] }
                ]
              },
              ...(Object.keys(activityDateFilterForLookup).length > 0 ? { created_at: activityDateFilterForLookup } : {})
            }
          }
        ],
        as: 'friends'
      }
    },
    {
      $lookup: {
        from: 'pandas_medias',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$user_id', '$$userId'] },
              ...(Object.keys(activityDateFilterForLookup).length > 0 ? { created_at: activityDateFilterForLookup } : {})
            }
          }
        ],
        as: 'medias'
      }
    },
    {
      $lookup: {
        from: 'pandas_albums',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$user_id', '$$userId'] },
              ...(Object.keys(activityDateFilterForLookup).length > 0 ? { created_at: activityDateFilterForLookup } : {})
            }
          }
        ],
        as: 'albums'
      }
    },
    {
      $lookup: {
        from: 'pandas_joinJourneyRequest',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$user_id', '$$userId'] },
              ...(Object.keys(activityDateFilterForLookup).length > 0 ? { created_at: activityDateFilterForLookup } : {})
            }
          }
        ],
        as: 'journey_requests'
      }
    },
    {
      $addFields: {
        journey_count: { $size: '$journeys' },
        comment_count: { $size: '$comments' },
        friend_count: { $size: '$friends' },
        media_count: { $size: '$medias' },
        album_count: { $size: '$albums' },
        request_count: { $size: '$journey_requests' },
          // Count total activities - aligned with "Active Users" metric
          // Only count journeys and comments (same as Active Users calculation)
        total_activities: {
          $add: [
            { $size: '$journeys' }, // Journeys created
              { $size: '$comments' }  // Comments made
          ]
        }
      }
    },
    {
      $addFields: {
        // Calculate activities per week
        activities_per_week: {
          $divide: ['$total_activities', weeks]
        }
      }
    },
    {
      $project: {
        _id: 1,
        activities_per_week: 1
      }
    }
  ]).toArray();
  
  // Classify users based on activities per week
  const distribution: { [key: string]: number } = {
    'Inactive (<1/week)': 0,
    'Medium (1-3/week)': 0,
    'Active (3+/week)': 0
  };
  
  for (const user of usersWithActivities) {
    const activitiesPerWeek = user.activities_per_week || 0;
    if (activitiesPerWeek < 1.0) {
      distribution['Inactive (<1/week)']++;
    } else if (activitiesPerWeek < 3.0) {
      distribution['Medium (1-3/week)']++;
    } else {
      distribution['Active (3+/week)']++;
    }
  }
  
  // Convert to array format matching the expected structure
  const activityDistribution = [
    {
      _id: 'Inactive (<1/week)',
      count: distribution['Inactive (<1/week)']
    },
    {
      _id: 'Medium (1-3/week)',
      count: distribution['Medium (1-3/week)']
    },
    {
      _id: 'Active (3+/week)',
      count: distribution['Active (3+/week)']
    }
  ];
  
  // Get active users (users with meaningful activity in the selected date range)
  // Definition: A user is "active" if they have at least one journey OR comment in the period
  // This follows the DAU/MAU (Daily/Monthly Active Users) standard metric
  // 
  // Note: We use journeys and comments as they represent core engagement:
  // - Journeys: Primary content creation (planning/sharing trips)
  // - Comments: Social engagement (interacting with others' content)
  //
  // Other activities (friends, media, albums) are secondary and don't indicate
  // active platform engagement on their own.
  
  // Build date filter for journeys and comments
  const activityDateFilter: any = {};
  if (startDate) {
    const start = new Date(startDate);
    activityDateFilter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    activityDateFilter.$lte = end;
  }
  
  // Get users with journeys in the date range
  const journeyFilter: any = {};
  if (Object.keys(activityDateFilter).length > 0) {
    journeyFilter.start_date = activityDateFilter;
  }
  const usersWithJourneys = await journeysCollection.distinct('user_id', journeyFilter);
  
  // Get users with comments in the date range
  const commentFilter: any = {};
  if (Object.keys(activityDateFilter).length > 0) {
    commentFilter.created_at = activityDateFilter;
  }
  const usersWithComments = await commentsCollection.distinct('user_id', commentFilter);
  
  // Combine and deduplicate - a user is active if they have ANY journey OR comment
  const activeUserIds = new Set([
    ...usersWithJourneys.map((id: any) => String(id)),
    ...usersWithComments.map((id: any) => String(id))
  ]);
  const activeUsersCount = activeUserIds.size;
  
  // Calculate engagement rate (active users / total users)
  const engagementRate = totalUsers > 0 
    ? Number(Math.min(100, ((activeUsersCount / totalUsers) * 100)).toFixed(1))
    : 0;
  
  // For retention and churn, we need to compare with a previous period
  // For now, we'll use a simplified approach:
  // - Retention Rate: Same as engagement rate (users active in period / total users)
  //   Note: True retention requires comparing to previous period active users
  // - Churn Rate: Inverse of engagement (users not active / total users)
  //   Note: True churn requires identifying users who were active before but inactive now
  
  // Calculate previous period for retention/churn (if we have a date range)
  let previousPeriodActiveUsers = 0;
  let returningUsersCount = 0;
  
  if (startDate && endDate) {
    // Calculate previous period (same duration before startDate)
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    const periodDuration = periodEnd.getTime() - periodStart.getTime();
    const previousPeriodStart = new Date(periodStart.getTime() - periodDuration);
    const previousPeriodEnd = periodStart;
    
    // Get active users in previous period
    const previousActivityFilter: any = {
      $gte: previousPeriodStart,
      $lte: previousPeriodEnd
    };
    
    const previousJourneyFilter: any = { start_date: previousActivityFilter };
    const previousCommentFilter: any = { created_at: previousActivityFilter };
    
    const previousUsersWithJourneys = await journeysCollection.distinct('user_id', previousJourneyFilter);
    const previousUsersWithComments = await commentsCollection.distinct('user_id', previousCommentFilter);
    
    const previousActiveUserIds = new Set([
      ...previousUsersWithJourneys.map((id: any) => String(id)),
      ...previousUsersWithComments.map((id: any) => String(id))
    ]);
    previousPeriodActiveUsers = previousActiveUserIds.size;
    
    // Returning users: users active in previous period AND current period
    returningUsersCount = Array.from(previousActiveUserIds).filter(id => activeUserIds.has(id)).length;
  } else {
    // For "All Time", we can't calculate previous period, so use simplified metrics
    previousPeriodActiveUsers = activeUsersCount;
    returningUsersCount = activeUsersCount;
  }
  
  // Calculate retention rate: users active in previous period who are still active
  const retentionRate = previousPeriodActiveUsers > 0
    ? Number(Math.min(100, ((returningUsersCount / previousPeriodActiveUsers) * 100)).toFixed(1))
    : engagementRate; // Fallback to engagement rate if no previous period data
  
  // Calculate churn rate: users active in previous period who are NOT active now
  const churnRate = previousPeriodActiveUsers > 0
    ? Number(Math.min(100, (((previousPeriodActiveUsers - returningUsersCount) / previousPeriodActiveUsers) * 100)).toFixed(1))
    : (100 - engagementRate); // Fallback to inverse of engagement if no previous period data
  
  // Calculate growth rate: new users as percentage of total users
  // Note: True growth rate would compare to previous period, but this is "New User Rate"
  const growthRate = totalUsers > 0
    ? Number(((newUsers / totalUsers) * 100).toFixed(1))
    : 0;
  
  return {
    generated_at: new Date().toISOString(),
    time_period: {
      start_date: startDate || 'all',
      end_date: endDate || new Date().toISOString(),
    },
    user_demographics: {
      total_users: totalUsers,
      active_users: activeUsersCount,
      new_users: newUsers,
      gender_distribution: genderDist,
    },
    user_activity: {
      avg_journeys_per_user: totalUsers > 0 
        ? Number((totalJourneys / totalUsers).toFixed(2)) 
        : 0,
      avg_comments_per_user: totalUsers > 0 
        ? Number((totalComments / totalUsers).toFixed(2)) 
        : 0,
      avg_friends_per_user: totalUsers > 0 
        ? Number((totalFriends / totalUsers).toFixed(2)) 
        : 0,
      most_active_users: mostActiveUsers,
    },
    user_retention: {
      retention_rate: retentionRate,
      churn_rate: churnRate,
      returning_users: returningUsersCount,
    },
    registration_trends: registrationTrends,
    activity_distribution: activityDistribution.map((bucket: any) => {
      return {
        range: bucket._id,
        count: bucket.count || 0,
      };
    }).sort((a, b) => {
      // Sort by activity level: Inactive first, then Medium, then Active
      const order = ['Inactive (<1/week)', 'Medium (1-3/week)', 'Active (3+/week)'];
      const aIndex = order.indexOf(a.range);
      const bIndex = order.indexOf(b.range);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    }),
  };
}

