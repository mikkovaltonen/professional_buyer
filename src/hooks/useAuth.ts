import { useState, useEffect } from 'react';

interface User {
  email: string;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && typeof parsedUser === 'object' && 
              'email' in parsedUser && 'isAuthenticated' in parsedUser) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('[useAuth] Error initializing auth state from localStorage:', error);
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      if (email === 'forecasting@kemppi.com' && password === 'laatu') {
        const userData = {
          email: 'forecasting@kemppi.com',
          isAuthenticated: true
        };
        
        // Store in localStorage first
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Then update state
        setUser(userData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[useAuth] Error during login attempt:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    try {
      // Clear localStorage first
      localStorage.removeItem('user');
      // Then update state
      setUser(null);
    } catch (error) {
      console.error('[useAuth] Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user?.isAuthenticated
  };
}; 