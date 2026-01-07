require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkRealDB() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('\n🔍 MONGODB CONNECTION:\n');
    console.log('URI:', uri ? uri.replace(/:[^:@]+@/, ':****@') : 'NOT FOUND');
    
    if (!uri) {
      console.log('❌ MONGODB_URI not found');
      return;
    }
    
    const client = await MongoClient.connect(uri);
    
    // Extract database name from URI
    const dbName = uri.match(/\/([^?]+)/)?.[1] || 'test';
    console.log('Database name from URI:', dbName);
    
    const db = client.db(dbName);
    
    console.log('\n📊 CHECKING COLLECTIONS IN', dbName, ':\n');
    const collections = await db.listCollections().toArray();
    
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      if (count > 0) {
        console.log(`${coll.name}: ${count} documents`);
      }
    }
    
    // Check specific collections
    console.log('\n🔍 SPECIFIC CHECKS:\n');
    const checks = [
      'pandas_users',
      'pandas_journey', 
      'pandas_comments',
      'pandas_friends',
      'overview_analytics_summary',
      'user_analytics'
    ];
    
    for (const collName of checks) {
      try {
        const count = await db.collection(collName).countDocuments();
        if (count > 0) {
          console.log(`✅ ${collName}: ${count} documents`);
          if (collName.includes('analytics')) {
            const sample = await db.collection(collName).findOne({}, { sort: { generated_at: -1 } });
            if (sample) {
              console.log(`   Latest: ${sample.generated_at || 'no timestamp'}`);
            }
          }
        } else {
          console.log(`❌ ${collName}: 0 documents`);
        }
      } catch (e) {
        console.log(`⚠️  ${collName}: collection doesn't exist`);
      }
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRealDB();
