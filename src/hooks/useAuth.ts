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
        console.log('🔍 Checking stored user:', storedUser);
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Validate stored user data
          if (parsedUser && typeof parsedUser === 'object' && 
              'email' in parsedUser && 'isAuthenticated' in parsedUser) {
            console.log('✅ Found valid stored user:', parsedUser);
            setUser(parsedUser);
          } else {
            console.warn('⚠️ Invalid stored user data format');
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          console.log('ℹ️ No stored user found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error parsing stored user:', error);
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
    console.log('🔑 Login attempt:', { email });
    
    try {
      if (email === 'forecasting@kemppi.com' && password === 'laatu') {
        const userData = {
          email: 'forecasting@kemppi.com',
          isAuthenticated: true
        };
        
        // Store in localStorage first
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ Login successful, user data stored');
        
        // Then update state
        setUser(userData);
        return true;
      }
      
      console.log('❌ Login failed: Invalid credentials');
      return false;
    } catch (error) {
      console.error('❌ Error during login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    console.log('🚪 Logging out user');
    try {
      // Clear localStorage first
      localStorage.removeItem('user');
      // Then update state
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Error during logout:', error);
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