import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

// Helper function to get user from session storage as fallback
function getUserFromStorage(): any {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('🔄 Fallback: Found user in session storage:', user);
      return user;
    }
  } catch (error) {
    console.error('Error reading user from session storage:', error);
  }
  return null;
}

// Helper function to get auth headers
function getAuthHeaders(user: any): Record<string, string> {
  if (!user) {
    // Fallback to session storage
    const fallbackUser = getUserFromStorage();
    if (fallbackUser) {
      console.log('🔄 Using fallback user for auth headers');
      user = fallbackUser;
    } else {
      console.log('❌ No user available for auth headers (tried fallback)');
      return {};
    }
  }
  
  const headers: Record<string, string> = {};
  if (user.id) headers['x-user-id'] = user.id;
  if (user.email) headers['x-user-email'] = user.email;
  
  console.log('🔑 Auth headers generated:', headers);
  return headers;
}

// Generic database hook for API calls
export function useDatabase<T>(endpoint: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get user for headers with fallback
      const effectiveUser = user || getUserFromStorage();
      console.log(`🔍 [FETCH DEBUG] ${endpoint} - user from context:`, user);
      console.log(`🔍 [FETCH DEBUG] ${endpoint} - effective user:`, effectiveUser);
      
      const headers = getAuthHeaders(effectiveUser);
      console.log(`🔍 [FETCH DEBUG] ${endpoint} - headers being sent:`, headers);
      
      const response = await fetch(`/api/${endpoint}`, { headers });
      if (!response.ok) {
        console.log(`❌ [FETCH DEBUG] ${endpoint} - Response not OK:`, response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(`Error fetching ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, user]);

  useEffect(() => {
    // Check for user from AuthContext or fallback to session storage
    const effectiveUser = user || getUserFromStorage();
    
    if (effectiveUser) {
      console.log(`📊 User found for ${endpoint}, fetching data...`, effectiveUser);
      fetchData();
    } else {
      console.log(`⏳ No user yet for ${endpoint}, waiting...`);
      // If no user, set loading to false but don't fetch
      setLoading(false);
    }
  }, [fetchData, user]); // Still depend on user for AuthContext updates

  const create = useCallback(async (item: Omit<T, 'id'>) => {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(user),
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newItem = await response.json();
      setData(prev => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      throw err;
    }
  }, [endpoint, user]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(user),
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setData(prev => prev.map(item => 
        (item as any).id === id ? { ...item, ...updates } : item
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    }
  }, [endpoint, user]);

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setData(prev => prev.filter(item => (item as any).id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  }, [endpoint, user]);

  return {
    data,
    setData,
    loading,
    error,
    refresh: fetchData,
    create,
    update,
    remove,
  };
}

// Import from unified schema - SINGLE SOURCE OF TRUTH
import {
  CaseFrontend,
  ContactFrontend,
  WorkspaceFrontend,
  UserAccount,
  Bike,
  BikeFrontend
} from '@/lib/database-schema';

// Specific hooks for each data type - using frontend-friendly interfaces
export const useCases = () => useDatabase<CaseFrontend>('cases');
export const useContacts = () => useDatabase<ContactFrontend>('contacts');
export const useWorkspaces = () => useDatabase<WorkspaceFrontend>('workspaces');
export const useUsers = () => useDatabase<UserAccount>('users');
export const useBikes = () => useDatabase<BikeFrontend>('bikes');