import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  operatorId: string;
  stationRole: string;
  clearanceLevel: string;
}

interface AuthContextType extends AuthState {
  login: (operatorId: string, accessKey: string, role: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('dhruvaa_auth');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      isAuthenticated: false, // Default to unauthenticated to force Entry -> Login flow
      operatorId: 'CDR. V. SHASTRI [OP-7741]',
      stationRole: 'engineer',
      clearanceLevel: 'LEVEL 2 // CLASSIFIED FLIGHT ENVELOPE',
    };
  });

  useEffect(() => {
    localStorage.setItem('dhruvaa_auth', JSON.stringify(auth));
  }, [auth]);

  const login = async (operatorId: string, accessKey: string, role: string): Promise<boolean> => {
    // Validate required fields
    if (!operatorId.trim() || !accessKey.trim()) {
      return false;
    }
    // Simulation authentication
    setAuth({
      isAuthenticated: true,
      operatorId,
      stationRole: role || 'engineer',
      clearanceLevel: 'LEVEL 2 // CLASSIFIED FLIGHT ENVELOPE',
    });
    return true;
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      operatorId: '',
      stationRole: '',
      clearanceLevel: '',
    });
    localStorage.removeItem('dhruvaa_auth');
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
