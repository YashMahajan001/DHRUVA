import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dhruva_sidebar_expanded');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // Fallback if localStorage is unavailable
    }
    // Default collapsed on initial load for a clean, minimal engineering cockpit
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('dhruva_sidebar_expanded', String(isExpanded));
    } catch {
      // Ignore storage errors
    }
  }, [isExpanded]);

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
