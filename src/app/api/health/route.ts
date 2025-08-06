import { NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized, getDatabaseType, testDatabaseConnection } from '@/lib/database';

export async function GET() {
  try {
    // Check database connectivity
    await ensureDatabaseInitialized();
    
    const dbType = getDatabaseType();
    const isConnected = await testDatabaseConnection();
    
    // Try a simple database operation if connected
    let casesCount = 0;
    if (isConnected) {
      try {
        const cases = DatabaseService.getAllCases();
        casesCount = cases.length;
      } catch (e) {
        console.log('Could not get cases count:', e);
      }
    }
    
    return NextResponse.json({
      status: isConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        type: dbType,
        connected: isConnected
      },
      environment: process.env.NODE_ENV || 'development',
      casesCount
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}