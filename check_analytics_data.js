require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkAnalytics() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('airflow_database');
    
    console.log('\n📊 CHECKING ANALYTICS COLLECTIONS:\n');
    
    // Check overview_analytics_summary
    const overview = await db.collection('overview_analytics_summary').findOne({}, { sort: { generated_at: -1 } });
    if (overview) {
      console.log('✅ Found overview_analytics_summary');
      const dashboard = overview.data?.overview_dashboard || {};
      const keyMetrics = dashboard.key_metrics || {};
      console.log('Key Metrics:', {
        total_users: keyMetrics.total_users,
        active_users: keyMetrics.active_users,
        journeys_created: keyMetrics.journeys_created,
        total_comments: keyMetrics.total_comments || 'N/A',
        total_friendships: keyMetrics.total_friendships || 'N/A'
      });
    } else {
      console.log('❌ No overview_analytics_summary found');
    }
    
    // Check user_analytics
    const userAnalytics = await db.collection('user_analytics').findOne({}, { sort: { generated_at: -1 } });
    if (userAnalytics) {
      console.log('\n✅ Found user_analytics');
      const dashboard = userAnalytics.data?.user_dashboard || {};
      const engagement = dashboard.engagement_metrics || {};
      console.log('Engagement Metrics:', engagement);
    } else {
      console.log('\n❌ No user_analytics found');
    }
    
    // Check actual source collections with different names
    console.log('\n🔍 CHECKING SOURCE COLLECTIONS:\n');
    const allCollections = await db.listCollections().toArray();
    console.log('All collections:', allCollections.map(c => c.name).join(', '));
    
    // Check for any collection with data
    for (const coll of allCollections) {
      const count = await db.collection(coll.name).countDocuments();
      if (count > 0) {
        console.log(`\n${coll.name}: ${count} documents`);
        const sample = await db.collection(coll.name).findOne();
        if (sample) {
          console.log('Sample keys:', Object.keys(sample).slice(0, 10).join(', '));
        }
      }
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAnalytics();
