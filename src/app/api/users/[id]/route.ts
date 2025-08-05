import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import crypto from 'crypto';

// Simple password hashing for now (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const updates = await request.json();
    
    await ensureDatabaseInitialized();
    
    // If password is being updated, hash it
    if (updates.password) {
      updates.password_hash = hashPassword(updates.password);
      delete updates.password;
    }
    
    DatabaseService.updateUserAccount(id, updates);
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    await ensureDatabaseInitialized();
    
    // In SQLite, we don't have a direct delete method, so we'll update status to 'deleted'
    DatabaseService.updateUserAccount(id, { 
      status: 'deleted',
      updated_at: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}