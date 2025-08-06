import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import CryptoJS from 'crypto-js';
import UserCreationValidator from '@/lib/user-creation-validator';

// Password hashing utility - must match user-auth.ts
function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
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
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { email, role, workspace_id, contact_id, send_email, password } = body;
    
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
    
    // Use provided password or generate random password
    const tempPassword = password || generateRandomPassword();
    
    console.log(`Creating user ${email} with temporary password: ${tempPassword}`);
    
    // Create user with validation to ensure password works
    const createResult = await UserCreationValidator.createUserWithValidation({
      email,
      password: tempPassword,
      role,
      workspace_id: workspace_id || null,
      contact_id: contact_id || null
    });
    
    if (!createResult.success) {
      console.error('User creation validation failed:', createResult.message);
      return NextResponse.json(
        { success: false, error: createResult.message },
        { status: 400 }
      );
    }
    
    // Get the created user for response
    const newUser = DatabaseService.getUserByEmail(email);
    if (!newUser) {
      return NextResponse.json(
        { success: false, error: 'User created but not found in database' },
        { status: 500 }
      );
    }
    
    // Log successful creation with verification
    console.log(`✅ User ${email} created successfully and login verified`);
    console.log(`   Password: ${tempPassword} (verified working)`);
    console.log(`   Role: ${role}`);
    console.log(`   Workspace: ${workspace_id || 'none'}`);
    
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
        if (emailSent) {
          console.log(`📧 Credentials sent to ${email}`);
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'User created and login verified successfully',
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
      email_sent: emailSent,
      validation: {
        passwordVerified: true,
        canLogin: true
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to create user: ${errorMessage}` },
      { status: 500 }
    );
  }
}