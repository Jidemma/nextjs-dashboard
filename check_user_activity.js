require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkUserActivity() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('airflow_database');
    
    console.log('\n📊 CHECKING USER ACTIVITY DATA IN MONGODB:\n');
    
    // Check journeys collection
    const journeysCount = await db.collection('pandas_journey').countDocuments();
    const journeysWithUserId = await db.collection('pandas_journey').countDocuments({ user_id: { $exists: true, $ne: null } });
    console.log(`Journeys: ${journeysCount} total, ${journeysWithUserId} with user_id`);
    
    // Check comments collection
    const commentsCount = await db.collection('pandas_comments').countDocuments();
    const commentsWithUserId = await db.collection('pandas_comments').countDocuments({ user_id: { $exists: true, $ne: null } });
    console.log(`Comments: ${commentsCount} total, ${commentsWithUserId} with user_id`);
    
    // Check friends collection
    const friendsCount = await db.collection('pandas_friends').countDocuments();
    console.log(`Friendships: ${friendsCount} total`);
    
    // Check users collection
    const usersCount = await db.collection('pandas_users').countDocuments();
    console.log(`Users: ${usersCount} total\n`);
    
    // Sample some data
    console.log('📝 SAMPLE DATA:\n');
    
    // Sample journey
    const sampleJourney = await db.collection('pandas_journey').findOne({ user_id: { $exists: true } });
    if (sampleJourney) {
      console.log('Sample Journey:', {
        user_id: sampleJourney.user_id,
        destination: sampleJourney.destination,
        has_user_id: !!sampleJourney.user_id
      });
    } else {
      console.log('No journeys with user_id found');
    }
    
    // Sample comment
    const sampleComment = await db.collection('pandas_comments').findOne({ user_id: { $exists: true } });
    if (sampleComment) {
      console.log('Sample Comment:', {
        user_id: sampleComment.user_id,
        journey_id: sampleComment.journey_id,
        has_user_id: !!sampleComment.user_id
      });
    } else {
      console.log('No comments with user_id found');
    }
    
    // Sample friend
    const sampleFriend = await db.collection('pandas_friends').findOne();
    if (sampleFriend) {
      console.log('Sample Friendship:', {
        follower_id: sampleFriend.follower_id,
        followee_id: sampleFriend.followee_id
      });
    } else {
      console.log('No friendships found');
    }
    
    // Check user_analytics collection
    const userAnalytics = await db.collection('user_analytics').findOne({}, { sort: { generated_at: -1 } });
    if (userAnalytics) {
      console.log('\n📈 USER ANALYTICS SUMMARY:');
      const dashboard = userAnalytics.data?.user_dashboard || {};
      const engagement = dashboard.engagement_metrics || {};
      console.log('Engagement Metrics:', {
        avg_journeys_per_user: engagement.avg_journeys_per_user,
        avg_comments_per_user: engagement.avg_comments_per_user,
        avg_connections_per_user: engagement.avg_connections_per_user
      });
    } else {
      console.log('\n❌ No user_analytics document found');
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserActivity();
