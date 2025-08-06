import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import UserCreationValidator from '@/lib/user-creation-validator';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    // Run comprehensive test
    const testResult = await UserCreationValidator.runComprehensiveTest();
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test execution error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Test login simulation for specific user
    const loginTest = await UserCreationValidator.simulateLogin(email, password);
    
    return NextResponse.json({
      success: loginTest.success,
      message: loginTest.message,
      details: loginTest.details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}