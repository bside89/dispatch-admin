import { createContext, useContext, useState, type ReactNode } from "react";
import { tokenStorage } from "../utils/tokenStorage";

interface AuthContextType {
  isAuthenticated: boolean;
  loginUser: () => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!tokenStorage.getAccessToken(),
  );

  const loginUser = () => setIsAuthenticated(true);

  const logoutUser = () => {
    tokenStorage.clear();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
