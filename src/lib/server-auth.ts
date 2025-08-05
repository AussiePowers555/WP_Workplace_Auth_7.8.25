import { NextRequest } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from './database';
import type { UserWithWorkspace } from './database-schema';

/**
 * Server-side authentication and authorization utilities
 * For protecting API routes with workspace-based access control
 */

export interface AuthResult {
  success: boolean;
  user?: UserWithWorkspace;
  error?: string;
}

/**
 * Extract user information from request headers
 * In a production app, this would validate JWT tokens or session cookies
 * For now, we'll use a simple header-based approach
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    await ensureDatabaseInitialized();
    
    // Get user ID from headers (set by frontend)
    let userId = request.headers.get('x-user-id');
    let userEmail = request.headers.get('x-user-email');
    
    // Debug: Log all headers to see what's being sent
    console.log('🔍 [AUTH DEBUG] All headers:', Object.fromEntries(request.headers.entries()));
    console.log('🔍 [AUTH DEBUG] x-user-id:', userId);
    console.log('🔍 [AUTH DEBUG] x-user-email:', userEmail);
    
    // If no headers, try to get from cookie
    if (!userId && !userEmail) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        // Extract wpa_auth cookie
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const wpaCookie = cookies.find(c => c.startsWith('wpa_auth='));
        
        if (wpaCookie) {
          try {
            // Decode the URL-encoded cookie value
            const cookieValue = decodeURIComponent(wpaCookie.split('=')[1]);
            const userData = JSON.parse(cookieValue);
            userId = userData.id;
            userEmail = userData.email;
            console.log('🔑 [AUTH DEBUG] Extracted from cookie:', { userId, userEmail });
          } catch (error) {
            console.error('❌ [AUTH DEBUG] Failed to parse wpa_auth cookie:', error);
          }
        }
      }
    }
    
    if (!userId && !userEmail) {
      console.log('❌ [AUTH DEBUG] No authentication headers or valid cookie found');
      return { success: false, error: 'Authentication required' };
    }
    
    // Get user with workspace info
    let user = null;
    try {
      if (userId) {
        console.log('🔍 [AUTH DEBUG] Trying getUserWorkspace with ID:', userId);
        user = DatabaseService.getUserWorkspace(userId);
        console.log('🔍 [AUTH DEBUG] getUserWorkspace result:', user);
      } else if (userEmail) {
        console.log('🔍 [AUTH DEBUG] Trying getUserByEmail with email:', userEmail);
        user = DatabaseService.getUserByEmail(userEmail);
        console.log('🔍 [AUTH DEBUG] getUserByEmail result:', user);
      }
    } catch (error) {
      console.error('🔍 [AUTH DEBUG] Database query error:', error);
      return { success: false, error: 'Database query failed' };
    }
    
    if (!user) {
      console.log('❌ [AUTH DEBUG] User lookup failed - no user found');
      return { success: false, error: 'User not found' };
    }
    
    console.log('✅ [AUTH DEBUG] User found successfully:', user);
    
    // Get full workspace info if user has workspace_id
    const userWithWorkspace: UserWithWorkspace = {
      ...user,
      workspace: user.workspace_id ? DatabaseService.getWorkspaceById(user.workspace_id) || undefined : undefined
    };
    
    return { success: true, user: userWithWorkspace };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Check if user can access cases based on their workspace
 */
export function canAccessCase(user: UserWithWorkspace, caseWorkspaceId?: string): boolean {
  // Admin users can access all cases
  if (user.role === 'admin' || user.role === 'developer') {
    return true;
  }
  
  // Workspace users can only access cases in their workspace or unassigned cases
  if (user.workspace_id) {
    return !caseWorkspaceId || caseWorkspaceId === user.workspace_id;
  }
  
  // Users without workspace can only access unassigned cases
  return !caseWorkspaceId;
}

/**
 * Filter cases based on user's workspace access
 */
export function filterCasesForUser(user: UserWithWorkspace, cases: any[]): any[] {
  // Admin users see all cases
  if (user.role === 'admin' || user.role === 'developer') {
    return cases;
  }
  
  // Filter based on workspace access - handle both formats
  return cases.filter(caseItem => canAccessCase(user, caseItem.workspace_id || caseItem.workspaceId));
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: NextRequest): Promise<{ user: UserWithWorkspace } | Response> {
  const authResult = await authenticateRequest(request);
  
  if (!authResult.success || !authResult.user) {
    return new Response(
      JSON.stringify({ error: authResult.error || 'Authentication required' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return { user: authResult.user };
}

/**
 * Require admin role middleware
 */
export async function requireAdmin(request: NextRequest): Promise<{ user: UserWithWorkspace } | Response> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult; // Return the error response
  }
  
  const { user } = authResult;
  
  if (user.role !== 'admin' && user.role !== 'developer') {
    return new Response(
      JSON.stringify({ error: 'Admin access required' }), 
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return { user };
}

/**
 * Check if user can access specific workspace
 */
export function canAccessWorkspace(user: UserWithWorkspace, workspaceId: string): boolean {
  // Admin users can access any workspace
  if (user.role === 'admin' || user.role === 'developer') {
    return true;
  }
  
  // Workspace users can only access their own workspace
  return user.workspace_id === workspaceId;
}