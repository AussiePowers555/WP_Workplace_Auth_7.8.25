import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import crypto from 'crypto';

// Simple password hashing for now (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateRandomPassword(): string {
  return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const users = DatabaseService.getAllUserAccounts();
    
    return NextResponse.json({
      success: true,
      users: users.map((user: any) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        workspace_id: user.workspace_id,
        contact_id: user.contact_id,
        created_at: user.created_at,
        last_login: user.last_login
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, role, workspace_id, contact_id, send_email } = await request.json();
    
    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: 'Email and role are required' },
        { status: 400 }
      );
    }
    
    await ensureDatabaseInitialized();
    
    // Check if user already exists
    const existingUser = DatabaseService.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Generate random password
    const tempPassword = generateRandomPassword();
    
    // Create user
    const newUser = DatabaseService.createUserAccount({
      email,
      password_hash: hashPassword(tempPassword),
      role,
      status: 'pending_password_change',
      contact_id: contact_id || null,
      workspace_id: workspace_id || null,
      first_login: false,
      remember_login: false
    });
    
    // Send email if requested
    let emailSent = false;
    if (send_email) {
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9015'}/api/users/send-credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: tempPassword,
            role
          })
        });
        emailSent = emailResponse.ok;
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        workspace_id: newUser.workspace_id,
        contact_id: newUser.contact_id
      },
      credentials: send_email ? null : {
        email,
        password: tempPassword
      },
      email_sent: emailSent
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}