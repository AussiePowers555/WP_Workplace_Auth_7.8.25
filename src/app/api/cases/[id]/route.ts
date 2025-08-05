import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, initializeDatabase } from '@/lib/database';
import { requireAuth, canAccessCase } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Initialize database if needed
    initializeDatabase();
    
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    
    const { user } = authResult;
    const { id } = context.params;
    
    const caseData = DatabaseService.getCaseById(id);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Check if user can access this case
    if (!canAccessCase(user, caseData.workspaceId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Initialize database if needed
    initializeDatabase();
    
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    
    const { user } = authResult;
    const { id } = context.params;
    
    // First check if case exists and user can access it
    const caseData = DatabaseService.getCaseById(id);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    if (!canAccessCase(user, caseData.workspaceId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updates = await request.json();
    
    // Prevent workspace users from changing workspace assignment 
    if (user.role === 'workspace_user' && updates.workspace_id && updates.workspace_id !== user.workspace_id) {
      return NextResponse.json({ error: 'Cannot modify workspace assignment' }, { status: 403 });
    }
    
    DatabaseService.updateCase(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Initialize database if needed
    initializeDatabase();
    
    // Authenticate user (require admin for deletion)
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    
    const { user } = authResult;
    
    // Only admins can delete cases
    if (user.role !== 'admin' && user.role !== 'developer') {
      return NextResponse.json({ error: 'Admin access required for deletion' }, { status: 403 });
    }

    const { id } = context.params;
    DatabaseService.deleteCase(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}