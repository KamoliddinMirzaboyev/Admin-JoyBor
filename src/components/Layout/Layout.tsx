import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const { isDark, sidebarCollapsed } = useAppStore();
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // NProgress for route changes
  useEffect(() => {
    return () => {
    };
  }, [location, navigationType]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-300">
      <Sidebar />

      <main
        className={`pt-16 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
      >
        <div className="min-h-[calc(100vh-4rem)] p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;