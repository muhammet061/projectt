import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Upload, LogOut, Settings, Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Upload className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">FileShare</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              {user?.is_admin && (
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;