// Centralized authenticated fetch utility
import { useSessionStorage } from '@/hooks/use-session-storage';

// Helper function to get user from session storage
function getUserFromStorage(): any {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user;
    }
  } catch (error) {
    console.error('Error reading user from session storage:', error);
  }
  return null;
}

// Helper function to get auth headers
function getAuthHeaders(user?: any): Record<string, string> {
  const effectiveUser = user || getUserFromStorage();
  
  if (!effectiveUser || !effectiveUser.id || !effectiveUser.email) {
    console.log('❌ No user available for auth headers');
    return {};
  }
  
  const headers: Record<string, string> = {};
  if (effectiveUser.id) headers['x-user-id'] = effectiveUser.id;
  if (effectiveUser.email) headers['x-user-email'] = effectiveUser.email;
  
  console.log('🔑 Auth headers generated for fetch:', headers);
  return headers;
}

// Authenticated fetch function
export async function authFetch(url: string, options: RequestInit = {}, user?: any): Promise<Response> {
  const authHeaders = getAuthHeaders(user);
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };
  
  console.log(`🌐 [AUTH FETCH] ${options.method || 'GET'} ${url}`, { headers: mergedOptions.headers });
  
  return fetch(url, mergedOptions);
}

// React hook for authenticated fetch
export function useAuthFetch() {
  const [currentUser] = useSessionStorage<any>("currentUser", null);
  
  return (url: string, options: RequestInit = {}) => {
    return authFetch(url, options, currentUser);
  };
}