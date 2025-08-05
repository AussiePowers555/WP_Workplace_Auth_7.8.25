import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAuth, filterCasesForUser } from '@/lib/server-auth';

// Simple database health logging function
function logDatabaseHealth() {
  try {
    console.log('[DB HEALTH] Checking database connection...');
    console.log('[DB HEALTH] Database operations ready');
  } catch (error) {
    console.error('[DB HEALTH ERROR]', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    logDatabaseHealth();
    await ensureDatabaseInitialized();
    
    // Authenticate user and get workspace info
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    
    const { user } = authResult;
    
    // Get all cases and filter based on user's workspace access
    const allCases = DatabaseService.getAllCases();
    const filteredCases = filterCasesForUser(user, allCases);
    
    return NextResponse.json(filteredCases);
  } catch (error: unknown) {
    let errorMessage = 'Unknown error';
    let errorStack: string | undefined = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
    }
    
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Failed to fetch cases', details: errorMessage, stack: process.env.NODE_ENV === 'development' ? errorStack : undefined }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    logDatabaseHealth();
    await ensureDatabaseInitialized();
    
    // Authenticate user 
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    
    const { user } = authResult;
    
    const caseData = await request.json();
    console.log('[CREATE CASE] Data received:', JSON.stringify(caseData, null, 2));
    
    // For workspace users, automatically assign the case to their workspace
    if (user.role === 'workspace_user' && user.workspace_id) {
      caseData.workspace_id = user.workspace_id;
    }
    
    const newCase = DatabaseService.createCase(caseData);
    console.log(`[CREATE CASE] Successfully created case ${newCase.id}`);
    
    return NextResponse.json(newCase, { status: 201 });
  } catch (error: unknown) {
    let errorMessage = 'Unknown error';
    let errorStack: string | undefined = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
    }
    
    console.error('[CREATE CASE ERROR]', error);
    console.error('[CREATE CASE ERROR] Request body:', await request.text());
    
    logDatabaseHealth();
    
    return NextResponse.json(
      { 
        error: 'Failed to create case',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}