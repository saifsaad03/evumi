import { createContext, useContext, useState, useCallback } from 'react';

const DashboardNavContext = createContext(null);

export function DashboardNavProvider({ children }) {
  const [dashboardNav, setDashboardNavState] = useState({
    title: '',
    roleTheme: 'green',
    navItems: [],
    activeTab: '',
    onTabChange: null,
  });

  const setDashboardNav = useCallback((data) => {
    if (!data) return;
    setDashboardNavState(prev => {
      if (
        prev.title === data.title &&
        prev.activeTab === data.activeTab &&
        prev.roleTheme === data.roleTheme &&
        prev.navItems === data.navItems &&
        prev.onTabChange === data.onTabChange
      ) {
        return prev;
      }
      return { ...prev, ...data };
    });
  }, []);

  return (
    <DashboardNavContext.Provider value={{ dashboardNav, setDashboardNav }}>
      {children}
    </DashboardNavContext.Provider>
  );
}

export function useDashboardNav() {
  const context = useContext(DashboardNavContext);
  return context || { dashboardNav: { navItems: [] }, setDashboardNav: () => {} };
}

