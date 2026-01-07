/**
 * MongoDB Connection Utility
 * ==========================
 * Handles MongoDB connections with connection pooling and error handling
 */

import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please add your MongoDB database name to .env.local');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the connection
  // across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Get MongoDB client instance
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Get MongoDB database instance
 */
export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

/**
 * Test MongoDB connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await getMongoClient();
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB connection successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
}

/**
 * Get list of all collections in the database
 */
export async function listCollections(): Promise<string[]> {
  try {
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    return collections.map(col => col.name);
  } catch (error) {
    console.error('Error listing collections:', error);
    return [];
  }
}

/**
 * Get analytics collections (those containing analytics data)
 */
export async function getAnalyticsCollections(): Promise<string[]> {
  try {
    const allCollections = await listCollections();
    // Filter for analytics-related collections
    // You can customize this filter based on your naming conventions
    return allCollections.filter(name => 
      name.includes('analytics') || 
      name.startsWith('pandas_') ||
      ['users', 'journey', 'comments', 'friends', 'medias'].some(keyword => name.includes(keyword))
    );
  } catch (error) {
    console.error('Error getting analytics collections:', error);
    return [];
  }
}

export default clientPromise;

