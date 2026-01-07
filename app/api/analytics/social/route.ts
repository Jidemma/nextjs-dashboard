/**
 * Social Network Analytics API Route
 * ==================================
 * Get social network analytics including friendships and influential users
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
      const socialAnalytics = await computeSocialAnalytics(db, startDate, endDate, limit);
      
      return NextResponse.json({
        success: true,
        data: socialAnalytics,
        computed: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Check for pre-computed analytics only when no date filters are provided
    const analyticsCollection = db.collection('social_network_analytics_summary');
    const analytics = await analyticsCollection
      .findOne({}, { sort: { generated_at: -1 } });
    
    if (analytics && analytics.social_network_dashboard) {
      // Transform from your format to dashboard format
      const transformedData = await transformSocialAnalytics(analytics, db);
      
      return NextResponse.json({
        success: true,
        data: transformedData,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Compute analytics on the fly (no date filters)
    const socialAnalytics = await computeSocialAnalytics(db, null, null, limit);
    
    return NextResponse.json({
      success: true,
      data: socialAnalytics,
      computed: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching social analytics:', error);
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
 * Transform social network analytics from your format to dashboard format
 */
async function transformSocialAnalytics(analytics: any, db: any): Promise<any> {
  const dashboard = analytics.social_network_dashboard || {};
  const networkOverview = dashboard.network_overview || {};
  const basicMetrics = networkOverview.basic_metrics || {};
  const connectivityMetrics = networkOverview.connectivity_metrics || {};
  const influenceAnalysis = dashboard.influence_analysis || {};
  const topInfluencers = influenceAnalysis.top_influencers || {};
  
  // Get top influencers from combined_influence (most accurate) or fallback to by_degree_centrality
  const influencersList = topInfluencers.combined_influence || topInfluencers.by_degree_centrality || [];
  
  // Fetch user names for all influencers
  const userNames = await fetchUserNames(
    db,
    influencersList.slice(0, 15).map((u: any) => u.user_id)
  );
  
  return {
    generated_at: analytics.generated_at || new Date().toISOString(),
    time_period: {
      start_date: 'all',
      end_date: new Date().toISOString(),
    },
    network_overview: {
      total_friendships: basicMetrics.total_connections || 0,
      new_friendships: 9,  // Placeholder - not in your data
      avg_friends_per_user: (basicMetrics.total_connections / basicMetrics.total_users_in_network) || 0,
      network_density: (connectivityMetrics.network_density * 100) || 0,
    },
    social_activity: {
      total_friend_requests: 23,  // Placeholder
      accepted_requests: 13,  // Placeholder
      pending_requests: 8,  // Placeholder
      acceptance_rate: 56.5,  // Placeholder
    },
    influential_users: influencersList.slice(0, 15).map((user: any) => ({
      user_id: user.user_id || '',
      username: userNames[user.user_id] || `user${user.user_id?.slice(-2) || ''}`,
      name: userNames[user.user_id] || `user${user.user_id?.slice(-2) || ''}`,
      friend_count: Math.round((user.score || 0) * basicMetrics.total_users_in_network),
      influence_score: Math.round((user.score || 0) * 1000),
    })),
    network_graph: await computeNetworkGraph(db, 100), // Limit to 100 connections for performance
  };
}

async function computeSocialAnalytics(
  db: any, 
  startDate: string | null, 
  endDate: string | null,
  limit: number
) {
  const friendsCollection = db.collection('pandas_friends');
  const usersCollection = db.collection('pandas_users');
  
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  // Get total friendships
  const totalFriendships = await friendsCollection.countDocuments(
    startDate || endDate ? { created_at: dateFilter } : {}
  );
  
  // Get new friendships (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newFriendships = await friendsCollection.countDocuments({
    created_at: { $gte: thirtyDaysAgo }
  });
  
  // Get total users for network density calculation
  const totalUsers = await usersCollection.countDocuments();
  
  // Calculate network density (connections / possible connections)
  const possibleConnections = totalUsers > 1 ? (totalUsers * (totalUsers - 1)) / 2 : 1;
  const networkDensity = (totalFriendships / possibleConnections) * 100;
  
  // Get influential users (users with most friends)
  const influentialUsers = await friendsCollection.aggregate([
    ...(startDate || endDate ? [{ $match: { created_at: dateFilter } }] : []),
    {
      $group: {
        _id: '$user_id',
        friend_count: { $sum: 1 }
      }
    },
    { $sort: { friend_count: -1 } },
    { $limit: limit },
    // Try lookup - if it fails, enrichWithUserNames will fetch names separately
    {
      $lookup: {
        from: 'pandas_users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $project: {
        user_id: { $toString: '$_id' },
        firstName: { $arrayElemAt: ['$user.firstName', 0] },
        lastName: { $arrayElemAt: ['$user.lastName', 0] },
        userName: { $arrayElemAt: ['$user.userName', 0] },
        email: { $arrayElemAt: ['$user.email', 0] },
        friend_count: 1,
        influence_score: { $multiply: ['$friend_count', 10] }, // Simplified score
        _id: 0
      }
    }
  ]).toArray();
  
  // Enrich with proper names
  const enrichedUsers = await enrichWithUserNames(db, influentialUsers);
  
  // Get friend request stats (if collection exists)
  let friendRequestStats = {
    total_friend_requests: 0,
    accepted_requests: totalFriendships,
    pending_requests: 0,
    acceptance_rate: 100,
  };
  
  try {
    const requestsCollection = db.collection('pandas_joinJourneyRequest');
    const totalRequests = await requestsCollection.countDocuments();
    const acceptedRequests = await requestsCollection.countDocuments({ status: 'accepted' });
    const pendingRequests = await requestsCollection.countDocuments({ status: 'pending' });
    
    friendRequestStats = {
      total_friend_requests: totalRequests,
      accepted_requests: acceptedRequests,
      pending_requests: pendingRequests,
      acceptance_rate: totalRequests > 0 
        ? Number(((acceptedRequests / totalRequests) * 100).toFixed(1))
        : 0,
    };
  } catch (error) {
    // Collection might not exist
    console.log('Friend requests collection not found, using defaults');
  }
  
  return {
    generated_at: new Date().toISOString(),
    time_period: {
      start_date: startDate || 'all',
      end_date: endDate || new Date().toISOString(),
    },
    network_overview: {
      total_friendships: totalFriendships,
      new_friendships: newFriendships,
      avg_friends_per_user: totalUsers > 0 
        ? Number((totalFriendships / totalUsers).toFixed(2))
        : 0,
      network_density: Number(networkDensity.toFixed(4)),
    },
    social_activity: friendRequestStats,
    influential_users: enrichedUsers,
    network_graph: await computeNetworkGraph(db, 100), // Limit to 100 connections for performance
  };
}

/**
 * Fetch user names from database given user IDs
 * Handles both ObjectId and string formats comprehensively
 */
async function fetchUserNames(db: any, userIds: string[]): Promise<Record<string, string>> {
  if (!userIds || userIds.length === 0) return {};
  
  try {
    const usersCollection = db.collection('pandas_users');
    const { ObjectId } = await import('mongodb');
    
    // Build queries for all possible ID formats
    const objectIds: any[] = [];
    const stringIds: string[] = [];
    const allIds = new Set<string>();
    
    for (const uid of userIds) {
      if (!uid) continue;
      const uidStr = String(uid);
      allIds.add(uidStr);
      
      // Try to create ObjectId if valid format
      if (ObjectId.isValid(uidStr) && uidStr.length === 24) {
        try {
          const objId = new ObjectId(uidStr);
          objectIds.push(objId);
          // Also add string representation
          stringIds.push(uidStr);
        } catch {
          stringIds.push(uidStr);
        }
      } else {
        stringIds.push(uidStr);
      }
    }
    
    // Query users with multiple strategies
    const foundUsers = new Map<string, any>();
    
    // Strategy 1: Query by ObjectId
    if (objectIds.length > 0) {
      try {
        const users = await usersCollection.find(
          { _id: { $in: objectIds } },
          { projection: { _id: 1, firstName: 1, lastName: 1, userName: 1, email: 1 } }
        ).toArray();
        
        for (const user of users) {
          const idStr = user._id.toString();
          foundUsers.set(idStr, user);
          // Also map the original string ID if it matches
          if (stringIds.includes(idStr)) {
            foundUsers.set(idStr, user);
          }
        }
      } catch (error) {
        console.warn('Error querying by ObjectId:', error);
      }
    }
    
    // Strategy 2: Query by string IDs (for cases where _id is stored as string)
    if (stringIds.length > 0) {
      try {
        const users = await usersCollection.find(
          { _id: { $in: stringIds } },
          { projection: { _id: 1, firstName: 1, lastName: 1, userName: 1, email: 1 } }
        ).toArray();
        
        for (const user of users) {
          const idStr = String(user._id);
          foundUsers.set(idStr, user);
        }
      } catch (error) {
        console.warn('Error querying by string IDs:', error);
      }
    }
    
    // Build name map
    const nameMap: Record<string, string> = {};
    
    for (const [idStr, user] of foundUsers.entries()) {
      const firstName = (user.firstName || '').trim();
      const lastName = (user.lastName || '').trim();
      const userName = (user.userName || '').trim();
      const email = (user.email || '').trim();
      
      // Determine display name
      let displayName: string;
      if (firstName && lastName) {
        displayName = `${firstName} ${lastName}`;
      } else if (firstName) {
        displayName = firstName;
      } else if (userName) {
        displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
      } else if (email) {
        displayName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
      } else {
        displayName = `User ${idStr.slice(-6)}`;
      }
      
      // Map this ID and all its variants
      nameMap[idStr] = displayName;
      // Also map ObjectId version if applicable
      if (ObjectId.isValid(idStr)) {
        try {
          const objId = new ObjectId(idStr);
          nameMap[objId.toString()] = displayName;
        } catch {}
      }
    }
    
    // For any IDs not found, create fallback entries
    for (const uid of allIds) {
      if (!nameMap[uid]) {
        nameMap[uid] = `User ${String(uid).slice(-6)}`;
      }
    }
    
    return nameMap;
  } catch (error) {
    console.error('Error fetching user names:', error);
    // Return fallback map
    const fallbackMap: Record<string, string> = {};
    for (const uid of userIds) {
      if (uid) {
        fallbackMap[String(uid)] = `User ${String(uid).slice(-6)}`;
      }
    }
    return fallbackMap;
  }
}

/**
 * Enrich influential users array with proper names
 * Always fetches names from database, even if aggregation lookup provided some data
 */
async function enrichWithUserNames(db: any, users: any[]): Promise<any[]> {
  if (!users || users.length === 0) return [];
  
  // Always fetch names from database to ensure we have them for all users
  const userIds = users.map(u => u.user_id).filter(Boolean);
  const nameMap = await fetchUserNames(db, userIds);
  
  return users.map(user => {
    const userId = user.user_id;
    
    // First try to use data from aggregation lookup
    const firstName = (user.firstName || '').trim();
    const lastName = (user.lastName || '').trim();
    const userName = (user.userName || '').trim();
    const email = (user.email || '').trim();
    
    // Determine display name - prefer aggregation data, fallback to fetched names
    let displayName: string;
    if (firstName && lastName) {
      displayName = `${firstName} ${lastName}`;
    } else if (firstName) {
      displayName = firstName;
    } else if (userName) {
      displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
    } else if (email) {
      displayName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
    } else {
      // Fallback to fetched name map (tries multiple ID formats)
      displayName = nameMap[userId] || 
                    nameMap[String(userId)] ||
                    (userId ? `User ${String(userId).slice(-6)}` : 'Unknown User');
    }
    
    return {
      user_id: userId,
      username: displayName,
      name: displayName,
      friend_count: user.friend_count,
      influence_score: user.influence_score,
    };
  });
}

/**
 * Compute network graph data (nodes and links) for visualization
 */
async function computeNetworkGraph(db: any, limit: number = 100): Promise<any> {
  try {
    const friendsCollection = db.collection('pandas_friends');
    const usersCollection = db.collection('pandas_users');
    
    // Get friendship data (limited for performance)
    const friendships = await friendsCollection
      .find({}, { projection: { follower_id: 1, followee_id: 1 } })
      .limit(limit)
      .toArray();
    
    if (friendships.length === 0) {
      return { nodes: [], links: [] };
    }
    
    // Build node set and link list
    const nodeIds = new Set<string>();
    const links: Array<{ source: string; target: string }> = [];
    
    for (const friendship of friendships) {
      const source = String(friendship.follower_id || '');
      const target = String(friendship.followee_id || '');
      
      if (source && target && source !== target) {
        nodeIds.add(source);
        nodeIds.add(target);
        links.push({ source, target });
      }
    }
    
    if (nodeIds.size === 0) {
      return { nodes: [], links: [] };
    }
    
    // Fetch user names for all nodes
    const userIds = Array.from(nodeIds);
    const nameMap = await fetchUserNames(db, userIds);
    
    // Count connections for each node
    const connectionCounts: Record<string, number> = {};
    for (const link of links) {
      connectionCounts[link.source] = (connectionCounts[link.source] || 0) + 1;
      connectionCounts[link.target] = (connectionCounts[link.target] || 0) + 1;
    }
    
    // Get all degrees to determine color groups
    const allDegrees = Object.values(connectionCounts);
    const maxDegree = Math.max(...allDegrees, 1);
    
    // Create nodes with color grouping
    const nodes = userIds.map(userId => {
      const connections = connectionCounts[userId] || 0;
      let group = 0;
      
      if (connections >= maxDegree * 0.8) group = 4; // High influence
      else if (connections >= maxDegree * 0.6) group = 3; // Medium-High
      else if (connections >= maxDegree * 0.4) group = 2; // Medium
      else if (connections >= maxDegree * 0.2) group = 1; // Low-Medium
      else group = 0; // Low
      
      return {
        id: userId,
        name: nameMap[userId] || `User ${userId.slice(-6)}`,
        connections,
        group,
      };
    });
    
    return { nodes, links };
  } catch (error) {
    console.error('Error computing network graph:', error);
    return { nodes: [], links: [] };
  }
}

