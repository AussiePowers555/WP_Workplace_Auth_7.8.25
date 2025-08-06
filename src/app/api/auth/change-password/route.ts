import { NextRequest, NextResponse } from 'next/server';
import { changePassword, validatePassword, authenticateUser } from '@/lib/user-auth';
import { ensureDatabaseInitialized, DatabaseService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();
    
    const { userId, email, oldPassword, newPassword } = await request.json();
    
    console.log('Password change request:', { userId, email, hasOldPassword: !!oldPassword, hasNewPassword: !!newPassword });
    
    // Support both userId-based and email/oldPassword-based password change
    let userIdToUpdate = userId;
    
    if (!userIdToUpdate && email && oldPassword) {
      // Authenticate with old password first
      console.log('Authenticating user with email:', email);
      const auth = await authenticateUser(email, oldPassword);
      console.log('Authentication result:', { success: auth.success, hasUser: !!auth.user, error: auth.error });
      
      if (!auth.success || !auth.user) {
        return NextResponse.json(
          { success: false, error: auth.error || 'Invalid current password' },
          { status: 401 }
        );
      }
      userIdToUpdate = auth.user.id;
      console.log('User ID to update:', userIdToUpdate);
    }
    
    if (!userIdToUpdate || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'User identification and new password are required' },
        { status: 400 }
      );
    }
    
    // Validate password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }
    
    // Change password
    const success = await changePassword(userIdToUpdate, newPassword);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to change password' },
        { status: 500 }
      );
    }
    
    // Update user status from 'pending_password_change' to 'active'
    try {
      const user = DatabaseService.getUserById(userIdToUpdate);
      if (user && user.status === 'pending_password_change') {
        DatabaseService.updateUserStatus(userIdToUpdate, 'active');
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
      // Don't fail the request if status update fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}