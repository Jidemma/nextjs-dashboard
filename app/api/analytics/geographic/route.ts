/**
 * Geographic Analytics API Route
 * ==============================
 * Get geographic distribution and travel patterns
 */

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const db = await getDatabase();
    
    // Always compute analytics on the fly when date filters are provided
    // This ensures date filtering works correctly
    if (startDate || endDate) {
      const geoAnalytics = await computeGeographicAnalytics(db, startDate, endDate, limit);
      
      return NextResponse.json({
        success: true,
        data: geoAnalytics,
        computed: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Check for pre-computed analytics only when no date filters are provided
    const analyticsCollection = db.collection('geographic_analytics_summary');
    const analytics = await analyticsCollection
      .findOne({}, { sort: { generated_at: -1 } });
    
    if (analytics && analytics.geographic_dashboard) {
      // Transform from your format to dashboard format
      const transformedData = transformGeographicAnalytics(analytics);
      
      return NextResponse.json({
        success: true,
        data: transformedData,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Compute analytics on the fly (no date filters)
    const geoAnalytics = await computeGeographicAnalytics(db, null, null, limit);
    
    return NextResponse.json({
      success: true,
      data: geoAnalytics,
      computed: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching geographic analytics:', error);
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
 * Transform geographic analytics from your format to dashboard format
 */
function transformGeographicAnalytics(analytics: any): any {
  const dashboard = analytics.geographic_dashboard || {};
  const destinationAnalysis = dashboard.destination_analysis || {};
  const userLocations = dashboard.user_locations || {};
  const regionalEngagement = dashboard.regional_engagement || {};
  const allDestinations = destinationAnalysis.all_destinations || [];
  const topDestinations = destinationAnalysis.top_destinations || [];
  const destinationCoordinates = destinationAnalysis.destination_coordinates || [];
  const combinedUserLocations = userLocations.combined_user_locations || {};
  const topUserLocations = combinedUserLocations.top_locations || [];
  const regionalData = regionalEngagement.regional_engagement || {};
  const destAnalysis = destinationAnalysis.destination_analysis || {};
  
  return {
    generated_at: analytics.generated_at || new Date().toISOString(),
    time_period: {
      start_date: 'all',
      end_date: new Date().toISOString(),
    },
    // Summary metrics
    summary_metrics: {
      total_destinations: destinationAnalysis.total_destinations || 0,
      unique_destinations: destinationAnalysis.unique_destinations || 0,
      destinations_with_coordinates: destAnalysis.destinations_with_coordinates || 0,
      destinations_without_coordinates: destAnalysis.destinations_without_coordinates || 0,
      users_with_location: combinedUserLocations.total_users_with_location || 0,
      unique_user_locations: combinedUserLocations.unique_locations || 0,
    },
    // User locations (where users are from)
    user_locations: {
      has_data: userLocations.has_location_data || false,
      top_locations: topUserLocations.map((loc: any) => ({
        location: loc.location || 'Unknown',
        user_count: loc.user_count || 0,
      })),
      // User location coordinates for map
      location_coordinates: (userLocations.location_coordinates || []).map((loc: any) => ({
        destination: loc.location || 'Unknown',
        latitude: loc.lat || 0,
        longitude: loc.lon || 0,
        visits: loc.user_count || 0,
      })),
    },
    // Regional engagement breakdown
    regional_engagement: {
      has_data: regionalEngagement.has_engagement_data || false,
      regions: Object.entries(regionalData).map(([region, data]: [string, any]) => ({
        region: region,
        user_count: data.user_count || 0,
        destination_count: data.destination_count || 0,
        engagement_ratio: data.engagement_ratio || 0,
        popularity_score: data.popularity_score || 0,
      })),
    },
    // All destinations with names (for full list display)
    all_destinations: allDestinations.map((d: any) => ({
      destination: d.destination || 'Unknown',
      visits: d.count || 0,
      has_coordinates: destinationCoordinates.some((coord: any) => coord.destination === d.destination),
    })),
    // Destination coordinates for map (only destinations with coordinates)
    destination_coordinates: destinationCoordinates.map((d: any) => ({
      destination: d.destination || 'Unknown',
      latitude: d.lat || 0,
      longitude: d.lon || 0,
      visits: d.count || 0,
    })),
    // Popular destinations (top 50)
    geographic_distribution: {
      countries: [],  // Not in current data structure
      cities: [],  // Not in current data structure
    },
    popular_destinations: topDestinations.map((d: any) => ({
      destination: d.destination || 'Unknown',
      visits: d.count || 0,
      unique_users: 0,  // Not in current data
    })),
    travel_patterns: {
      avg_distance_traveled: 0,
      most_common_routes: [],
    },
  };
}

async function computeGeographicAnalytics(
  db: any, 
  startDate: string | null, 
  endDate: string | null,
  limit: number
) {
  const usersCollection = db.collection('pandas_users');
  const journeysCollection = db.collection('pandas_journey');
  
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  // Get country distribution
  const countriesData = await usersCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $group: {
        _id: '$country',
        user_count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'pandas_journey',
        let: { country: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$country', '$$country'] } } }
        ],
        as: 'journeys'
      }
    },
    {
      $project: {
        country: '$_id',
        user_count: 1,
        journey_count: { $size: '$journeys' },
        _id: 0
      }
    },
    { $sort: { user_count: -1 } },
    { $limit: limit }
  ]).toArray();
  
  // Get city distribution
  const citiesData = await usersCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { createdAt: dateFilter } }] : []),
    {
      $match: {
        city: { $exists: true, $ne: null, $ne: '' }
      }
    },
    {
      $group: {
        _id: { city: '$city', country: '$country' },
        user_count: { $sum: 1 }
      }
    },
    {
      $project: {
        city: '$_id.city',
        country: '$_id.country',
        user_count: 1,
        journey_count: 0, // Simplified
        _id: 0
      }
    },
    { $sort: { user_count: -1 } },
    { $limit: limit }
  ]).toArray();
  
  // Get popular destinations
  const destinations = await journeysCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { start_date: dateFilter } }] : []),
    {
      $match: {
        destination: { $exists: true, $ne: null, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$destination',
        visits: { $sum: 1 },
        unique_users: { $addToSet: '$user_id' }
      }
    },
    {
      $project: {
        destination: '$_id',
        visits: 1,
        unique_users: { $size: '$unique_users' },
        _id: 0
      }
    },
    { $sort: { visits: -1 } },
    { $limit: limit }
  ]).toArray();
  
  return {
    generated_at: new Date().toISOString(),
    time_period: {
      start_date: startDate || 'all',
      end_date: endDate || new Date().toISOString(),
    },
    geographic_distribution: {
      countries: countriesData,
      cities: citiesData,
    },
    popular_destinations: destinations,
    travel_patterns: {
      avg_distance_traveled: 0, // Requires lat/lng calculation
      most_common_routes: [],
    },
  };
}

