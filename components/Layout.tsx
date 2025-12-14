
import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LayoutDashboard, Briefcase, Users, LogOut, Menu, X, CheckSquare } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: [] },
    { name: 'Projects', href: '/projects', icon: Briefcase, roles: [] },
    // Removed restricted roles for Users to allow everyone to view the directory
    { name: 'Users', href: '/admin/users', icon: Users, roles: [] },
  ];

  const filteredNav = navigation.filter(item => 
    item.roles.length === 0 || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col bg-slate-900 text-white transition-all duration-300">
        <div className="flex items-center justify-center h-16 bg-slate-950 shadow-md">
          <CheckSquare className="h-8 w-8 text-blue-500 mr-2" />
          <span className="text-xl font-bold tracking-tight">ProManage AI</span>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto p-4">
          <nav className="space-y-1">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center mb-4">
              <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {user?.name.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-slate-800 hover:text-red-300 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center">
             <CheckSquare className="h-6 w-6 text-blue-500 mr-2" />
             <span className="font-bold text-lg">ProManage</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800 text-white p-4 space-y-2">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-700"
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-700"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
