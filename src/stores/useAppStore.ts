import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isDark: boolean;
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isDark: false,
      sidebarCollapsed: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'joyBor-storage',
      partialize: (state) => ({
        isDark: state.isDark,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
