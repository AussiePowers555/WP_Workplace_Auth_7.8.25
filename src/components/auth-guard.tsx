'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'USER' | 'CLIENT';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const checkAuth = async () => {
      try {
        // First check session storage
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Then check server auth
        const response = await fetch('/api/auth/simple-login', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json();
              if (data.success && data.user) {
                setUser(data.user);
                setIsAuthenticated(true);
                // Store in sessionStorage for consistency
                sessionStorage.setItem('currentUser', JSON.stringify(data.user));
              } else {
                setIsAuthenticated(false);
              }
            } catch (error) {
              console.error('Failed to parse JSON response:', error);
              setIsAuthenticated(false);
            }
          } else {
            // Response is not JSON (likely HTML error page)
            console.warn('Auth endpoint returned non-JSON response');
            setIsAuthenticated(false);
          }
        } else {
          console.warn('Auth endpoint returned error status:', response.status);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isClient]);

  useEffect(() => {
    if (!isClient || isLoading) return;

    if (!isAuthenticated) {
      console.log('AuthGuard: No user found, redirecting to login');
      router.push('/login');
      return;
    }

    if (user && requiredRole && user.role !== requiredRole) {
      console.log(`AuthGuard: User role ${user.role} doesn't match required role ${requiredRole}`);
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, requiredRole, router, isClient, user]);

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}