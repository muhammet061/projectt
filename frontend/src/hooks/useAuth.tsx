import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: number;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    const userData = Cookies.get('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        // Invalid user data, clear cookies
        Cookies.remove('token');
        Cookies.remove('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    Cookies.set('token', token, { expires: 7 });
    Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    setUser(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};