/**
 * Health Check API Route
 * =====================
 * Check database connection and system health
 */

import { NextResponse } from 'next/server';
import { testConnection, getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test MongoDB connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          status: 'unhealthy',
          error: 'Database connection failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
    
    // Get database stats
    const db = await getDatabase();
    const stats = await db.stats();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: {
        connected: true,
        name: db.databaseName,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
      },
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

