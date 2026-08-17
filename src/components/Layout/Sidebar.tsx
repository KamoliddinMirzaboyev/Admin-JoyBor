import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Building,
  FileText,
  Settings,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
// API imports o'chirilgan - demo ma'lumotlar

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Talabalar', href: '/students', icon: Users },
  { name: 'To\'lovlar', href: '/payments', icon: CreditCard },
  { name: 'Xodimlar', href: '/staff', icon: Users },
  { name: 'Yotoqxona', href: '/rooms', icon: Building },
  { name: 'Davomat', href: '/attendance', icon: UserCheck },
  { name: 'Hisobotlar', href: '/reports', icon: BarChart3 },
  { name: 'Arizalar', href: '/applications', icon: FileText },
  { name: 'Sozlamalar', href: '/settings', icon: Settings },
];

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 72;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  // Mobil uchun
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
  );
  React.useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      setMobileOpen(false);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  // Mobil va desktop uchun alohida toggle
  const handleSidebarToggle = () => {
    if (isMobile) setMobileOpen((v) => !v);
    else toggleSidebar();
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    if (isMobile) setMobileOpen(false);
  };

  // Sidebar content
  const sidebarContent = (
    <motion.aside
      initial={false}
      animate={{
        width: sidebarCollapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
      }}
      transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 0.7 }}
      className="h-full flex flex-col bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 overflow-hidden relative transition-all duration-300"
      style={{
        minWidth: sidebarCollapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
        maxWidth: sidebarCollapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
      }}
    >
      {/* Navigation */}
      <nav className="mt-6 flex-1 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.name} className="relative group">
                {isActive && (
                  <motion.span
                    layoutId="activeIndicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-600"
                  />
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                      : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-surface-500 dark:text-surface-400 group-hover:text-surface-700 dark:group-hover:text-surface-300'
                    }`}
                  />
                  {(!sidebarCollapsed || mobileOpen) && (
                    <span className="truncate">{item.name}</span>
                  )}
                </motion.button>
                {/* Tooltip for collapsed state (desktop) */}
                {sidebarCollapsed && !mobileOpen && (
                  <div className="absolute left-20 ml-2 px-2 py-1 bg-surface-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    {item.name}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <AnimatePresence>
        {(!sidebarCollapsed || mobileOpen) && (
          <motion.div
            key="sidebar-footer"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="mt-auto mb-5 px-3"
          >
            <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-3 border border-surface-200 dark:border-surface-800">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center p-1">
                  <img src="/logoicon.svg" alt="TTU Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-surface-900 dark:text-white">Universitet</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">JoyBor Yotoqxonasi</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );

  return (
    <>
      {/* Navbarga handleSidebarToggle propini uzataman */}
      <Navbar handleSidebarToggle={handleSidebarToggle} />
      {/* Mobile sidebar & backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="sidebar-mobile"
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              className="fixed top-0 left-0 z-50 h-full"
              style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, maxWidth: SIDEBAR_WIDTH }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed top-16 left-0 z-30 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;