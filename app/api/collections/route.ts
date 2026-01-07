/**
 * Collections API Route
 * ====================
 * Get list of all collections and their metadata
 */

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { CollectionInfo } from '@/types/analytics';

export async function GET() {
  try {
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    
    // Get detailed info for each collection
    const collectionsInfo: CollectionInfo[] = await Promise.all(
      collections.map(async (col) => {
        try {
          const collection = db.collection(col.name);
          const stats = await collection.stats();
          const count = await collection.countDocuments();
          
          // Try to get the most recent document for lastUpdated
          const recentDoc = await collection
            .find({})
            .sort({ _id: -1 })
            .limit(1)
            .toArray();
          
          let lastUpdated: string | undefined;
          if (recentDoc.length > 0) {
            const doc = recentDoc[0];
            // Try to find a date field
            lastUpdated = 
              doc.generated_at || 
              doc.updated_at || 
              doc.createdAt || 
              doc.created_at ||
              new Date(doc._id.getTimestamp()).toISOString();
          }
          
          return {
            name: col.name,
            count: count,
            size: stats.size || 0,
            avgObjSize: stats.avgObjSize || 0,
            lastUpdated,
          };
        } catch (error) {
          console.error(`Error getting stats for ${col.name}:`, error);
          return {
            name: col.name,
            count: 0,
            size: 0,
            avgObjSize: 0,
          };
        }
      })
    );
    
    // Categorize collections
    const categorized = {
      analytics: collectionsInfo.filter(c => 
        c.name.toLowerCase().includes('analytics')
      ),
      source: collectionsInfo.filter(c => 
        c.name.startsWith('pandas_')
      ),
      other: collectionsInfo.filter(c => 
        !c.name.toLowerCase().includes('analytics') && 
        !c.name.startsWith('pandas_')
      ),
    };
    
    return NextResponse.json({
      success: true,
      data: {
        all: collectionsInfo,
        categorized,
        total: collectionsInfo.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
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

