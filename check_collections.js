require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkCollections() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('airflow_database');
    
    console.log('\n📋 ALL COLLECTIONS IN DATABASE:\n');
    const collections = await db.listCollections().toArray();
    
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`${coll.name}: ${count} documents`);
    }
    
    // Check if there are any journey-related collections
    console.log('\n🔍 CHECKING SPECIFIC COLLECTIONS:\n');
    const journeyCollections = collections.filter(c => c.name.toLowerCase().includes('journey'));
    const userCollections = collections.filter(c => c.name.toLowerCase().includes('user'));
    const commentCollections = collections.filter(c => c.name.toLowerCase().includes('comment'));
    const friendCollections = collections.filter(c => c.name.toLowerCase().includes('friend'));
    
    console.log('Journey collections:', journeyCollections.map(c => c.name));
    console.log('User collections:', userCollections.map(c => c.name));
    console.log('Comment collections:', commentCollections.map(c => c.name));
    console.log('Friend collections:', friendCollections.map(c => c.name));
    
    // Check analytics collections
    const analyticsCollections = collections.filter(c => c.name.toLowerCase().includes('analytics'));
    console.log('\n📊 ANALYTICS COLLECTIONS:');
    for (const coll of analyticsCollections) {
      const count = await db.collection(coll.name).countDocuments();
      const latest = await db.collection(coll.name).findOne({}, { sort: { generated_at: -1 } });
      console.log(`${coll.name}: ${count} documents`);
      if (latest) {
        console.log(`  Latest: ${latest.generated_at || 'no timestamp'}`);
      }
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCollections();
