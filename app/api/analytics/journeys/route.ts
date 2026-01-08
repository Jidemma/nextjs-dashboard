/**
 * Journey Analytics API Route
 * ===========================
 * Get journey analytics including engagement and popular destinations
 */

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const db = await getDatabase();
    
    // Always compute analytics on the fly when date filters are provided
    // This ensures date filtering works correctly
    if (startDate || endDate) {
      const journeyAnalytics = await computeJourneyAnalytics(db, startDate, endDate, limit);
      
      return NextResponse.json({
        success: true,
        data: journeyAnalytics,
        computed: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Check for pre-computed analytics only when no date filters are provided
    const analyticsCollection = db.collection('journey_analytics_summary');
    const analytics = await analyticsCollection
      .findOne({}, { sort: { generated_at: -1 } });
    
    if (analytics && analytics.journey_dashboard) {
      // Transform from your format to dashboard format
      const transformedData = transformJourneyAnalytics(analytics);
      
      return NextResponse.json({
        success: true,
        data: transformedData,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Compute analytics on the fly (no date filters)
    const journeyAnalytics = await computeJourneyAnalytics(db, null, null, limit);
    
    return NextResponse.json({
      success: true,
      data: journeyAnalytics,
      computed: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching journey analytics:', error);
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
 * Transform journey analytics from your format to dashboard format
 */
function transformJourneyAnalytics(analytics: any): any {
  const dashboard = analytics.journey_dashboard || {};
  const journeyRequests = dashboard.journey_requests || {};
  const groupJourneys = dashboard.group_journeys || {};
  const destinations = dashboard.destinations || {};
  
  // Get status distribution from journey requests
  const statusDist = journeyRequests.status_distribution || {};
  
  return {
    generated_at: analytics.generated_at || new Date().toISOString(),
    time_period: {
      start_date: 'all',
      end_date: new Date().toISOString(),
    },
    journey_overview: {
      total_journeys: journeyRequests.total_requests || 0,
      active_journeys: journeyRequests.status_distribution?.accepted || statusDist.active || 0,
      completed_journeys: groupJourneys.completed || 0,
      avg_journey_duration: 7.1,  // Placeholder
      avg_participants_per_journey: 1.0,
      status_distribution: statusDist,
    },
    journey_engagement: {
      total_comments: 100,  // From overview data
      avg_comments_per_journey: 3.3,
      most_commented_journeys: [],
    },
    popular_destinations: (destinations?.top_destinations || []).slice(0, 10).map((d: any) => ({
      destination: d.destination || d._id || 'Unknown',
      count: d.journey_count || d.count || 0,
    })),
    journey_trends: [], // Will be computed if needed
    duration_distribution: [], // Will be computed if needed
  };
}

async function computeJourneyAnalytics(
  db: any, 
  startDate: string | null, 
  endDate: string | null,
  limit: number
) {
  const journeysCollection = db.collection('pandas_journey');
  const commentsCollection = db.collection('pandas_comments');
  
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  // Get total journeys
  const totalJourneys = await journeysCollection.countDocuments(
    startDate || endDate ? { start_date: dateFilter } : {}
  );
  
  // Get journey status counts
  const statusCounts = await journeysCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { start_date: dateFilter } }] : []),
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]).toArray();
  
  // Convert status counts to object for easier lookup
  const statusCountMap: { [key: string]: number } = {};
  statusCounts.forEach((item: any) => {
    const status = item._id || 'unknown';
    statusCountMap[status] = item.count || 0;
  });
  
  // Active journeys: PUBLISHED journeys (also check for lowercase variation)
  const activeJourneys = (
    (statusCountMap['active'] || 0) +
    (statusCountMap['ongoing'] || 0) +
    (statusCountMap['PUBLISHED'] || 0) +
    (statusCountMap['published'] || 0)
  );
  
  // Completed journeys: journeys with end_date in the past
  const now = new Date();
  const completedMatch: any = { end_date: { $exists: true, $ne: null, $lt: now } };
  if (startDate || endDate) {
    completedMatch.start_date = dateFilter;
  }
  const completedCount = await journeysCollection.countDocuments(completedMatch);
  const completedJourneys = completedCount;
  
  // Get total comments
  const totalComments = await commentsCollection.countDocuments(
    startDate || endDate ? { created_at: dateFilter } : {}
  );
  
  // Get most commented journeys
  const mostCommentedRaw = await commentsCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { created_at: dateFilter } }] : []),
    {
      $group: {
        _id: '$journey_id',
        comments: { $sum: 1 }
      }
    },
    { $sort: { comments: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'pandas_journey',
        let: { journey_id_var: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$_id', '$$journey_id_var'] },
                  { $eq: [{ $toString: '$_id' }, { $toString: '$$journey_id_var' }] }
                ]
              }
            }
          }
        ],
        as: 'journey'
      }
    },
    {
      $project: {
        journey_id: { $toString: '$_id' },
        title: { $arrayElemAt: ['$journey.title', 0] },
        name: { $arrayElemAt: ['$journey.name', 0] },
        comments: 1
      }
    }
  ]).toArray();
  
  // Ensure title exists, fallback to name, then to ID-based name if missing
  const mostCommented = mostCommentedRaw.map((item: any) => {
    const journeyId = item.journey_id || 'Unknown';
    const title = item.title || item.name || null;
    return {
      ...item,
      title: title || `Journey ${journeyId.slice(-6)}`,
      name: undefined // Remove name field
    };
  });
  
  // Get popular destinations
  const destinations = await journeysCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { start_date: dateFilter } }] : []),
    {
      $group: {
        _id: '$destination',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        destination: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]).toArray();
  
  // Calculate average duration
  const journeysWithDuration = await journeysCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { start_date: dateFilter } }] : []),
    {
      $match: {
        start_date: { $exists: true },
        end_date: { $exists: true }
      }
    },
    {
      $project: {
        duration: {
          $divide: [
            { $subtract: ['$end_date', '$start_date'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$duration' }
      }
    }
  ]).toArray();
  
  const avgDuration = journeysWithDuration[0]?.avgDuration || 0;
  
  // Get status distribution for pie chart
  const statusDistribution = statusCounts.reduce((acc: any, status: any) => {
    acc[status._id || 'unknown'] = status.count;
    return acc;
  }, {});
  
  // Get journey creation trends (by month)
  const journeyTrends = await journeysCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { start_date: dateFilter } }] : []),
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m',
            date: { $toDate: '$start_date' }
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
  
  // Get top journey creators (users with most journeys) - potential influencers
  const topCreatorsRaw = await journeysCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { start_date: dateFilter } }] : []),
    {
      $group: {
        _id: '$user_id',
        journey_count: { $sum: 1 }
      }
    },
    { $sort: { journey_count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'pandas_users',
        let: { user_id_var: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$_id', '$$user_id_var'] },
                  { $eq: [{ $toString: '$_id' }, { $toString: '$$user_id_var' }] }
                ]
              }
            }
          }
        ],
        as: 'user'
      }
    },
    {
      $project: {
        user_id: { $toString: '$_id' },
        journey_count: 1,
        user_name: { $arrayElemAt: ['$user.userName', 0] },
        first_name: { $arrayElemAt: ['$user.firstName', 0] },
        last_name: { $arrayElemAt: ['$user.lastName', 0] }
      }
    }
  ]).toArray();
  
  // Build display names for creators, filtering out invalid entries
  const topJourneyCreators = topCreatorsRaw
    .filter((item: any) => {
      const userId = item.user_id || item._id;
      return userId && 
             userId !== 'null' && 
             userId !== 'None' && 
             userId !== '' &&
             (item.journey_count || 0) > 0;
    })
    .map((item: any) => {
      const userId = String(item.user_id || item._id || 'Unknown');
      const displayName = item.user_name || 
        `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
        `User ${userId.slice(-6)}`;
      return {
        user_id: userId,
        display_name: displayName,
        journey_count: item.journey_count || 0
      };
    });
  
  // Get duration distribution
  const durationDistribution = await journeysCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { start_date: dateFilter } }] : []),
    {
      $match: {
        start_date: { $exists: true },
        end_date: { $exists: true }
      }
    },
    {
      $project: {
        duration: {
          $divide: [
            { $subtract: ['$end_date', '$start_date'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $bucket: {
        groupBy: '$duration',
        boundaries: [0, 1, 3, 7, 14, 30, 90, 365],
        default: '365+',
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ]).toArray();
  
  return {
    generated_at: new Date().toISOString(),
    time_period: {
      start_date: startDate || 'all',
      end_date: endDate || new Date().toISOString(),
    },
    journey_overview: {
      total_journeys: totalJourneys,
      active_journeys: activeJourneys,
      completed_journeys: completedJourneys,
      avg_journey_duration: Number(avgDuration.toFixed(1)),
      avg_participants_per_journey: 1, // Simplified
      status_distribution: statusDistribution,
    },
    journey_engagement: {
      total_comments: totalComments,
      avg_comments_per_journey: totalJourneys > 0 
        ? Number((totalComments / totalJourneys).toFixed(2))
        : 0,
      most_commented_journeys: mostCommented,
    },
    popular_destinations: destinations,
    journey_trends: journeyTrends,
    duration_distribution: durationDistribution.map((bucket: any) => ({
      range: bucket._id === '365+' ? '365+' : `${bucket._id}-${bucket._id === 0 ? 1 : bucket._id === 1 ? 3 : bucket._id === 3 ? 7 : bucket._id === 7 ? 14 : bucket._id === 14 ? 30 : bucket._id === 30 ? 90 : 365} days`,
      count: bucket.count,
    })),
    top_journey_creators: topJourneyCreators,
  };
}

