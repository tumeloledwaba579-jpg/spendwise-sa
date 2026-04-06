'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to refresh the access token
async function refreshAccessToken(): Promise<boolean> {
  try {
    console.log('🔄 Attempting to refresh access token...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Access token refreshed, expires in:', data.expires_in, 'seconds');
      return true;
    } else {
      console.log('❌ Token refresh failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const authChecked = useRef(false);
  const router = useRouter();

  // Check authentication status on initial load
  useEffect(() => {
    const checkAuth = async () => {
      // Prevent multiple checks
      if (authChecked.current) return;
      authChecked.current = true;

      console.log('🔍 Checking authentication status...');

      try {
        // First, try to get user data
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          console.log('✅ User authenticated:', userData.email);
        } else if (response.status === 401) {
          // Try to refresh the token
          console.log('⚠️ Session expired, attempting to refresh...');
          const refreshed = await refreshAccessToken();

          if (refreshed) {
            // Retry fetching user data
            const retryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
              credentials: 'include'
            });
            if (retryResponse.ok) {
              const userData = await retryResponse.json();
              setUser(userData);
              console.log('✅ User re-authenticated after refresh:', userData.email);
            } else {
              console.log('❌ Re-authentication failed');
              setUser(null);
            }
          } else {
            console.log('❌ No valid session');
            setUser(null);
          }
        } else {
          console.log('❌ Auth check failed with status:', response.status);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Periodic token refresh (only when user is logged in)
  useEffect(() => {
    if (!user) return;

    let intervalId: NodeJS.Timeout;

    // Start refresh interval after user is logged in
    const startRefreshInterval = () => {
      // Refresh every 12 hours (43200000 ms) - much less frequent
      intervalId = setInterval(async () => {
        if (isRefreshing) return; // Prevent multiple concurrent refreshes

        setIsRefreshing(true);
        console.log('🔄 Periodic token refresh...');
        const success = await refreshAccessToken();
        setIsRefreshing(false);

        if (!success) {
          console.log('⚠️ Token refresh failed, user may need to re-login');
          // Don't automatically logout - let the next API call handle 401
        }
      }, 12 * 60 * 60 * 1000); // 12 hours
    };

    startRefreshInterval();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, isRefreshing]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('🔐 Attempting login for:', email);

      // First, check if backend is reachable
      try {
        const healthCheck = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        if (!healthCheck.ok) {
          throw new Error('Backend not reachable');
        }
      } catch (err) {
        console.error('❌ Backend not reachable:', err);
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 Login response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch (e) {
          errorMessage = `Login failed: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Login successful, token expires in:', data.expires_in, 'seconds');

      // Wait a moment for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 200));

      // After login, fetch user data
      console.log('🔍 Fetching user data...');
      const meResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
        credentials: 'include'
      });

      console.log('📡 User data response status:', meResponse.status);

      if (meResponse.ok) {
        const userData = await meResponse.json();
        console.log('✅ User data loaded:', userData.email);
        setUser(userData);

        // Navigate to dashboard with a slight delay to ensure state is updated
        setTimeout(() => {
          console.log('🚀 Redirecting to dashboard');
          window.location.href = '/dashboard';
        }, 100);
      } else {
        console.error('❌ Failed to fetch user data:', await meResponse.text());
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Logging out...');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear any cached state
      authChecked.current = false;
      console.log('✅ Logout successful, redirecting to login');
      router.push('/login');
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}