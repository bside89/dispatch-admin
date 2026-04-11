import { createContext, useContext, useState, type ReactNode } from "react";
import { tokenStorage } from "../utils/tokenStorage";

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  loginUser: (userId: string) => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!tokenStorage.getAccessToken(),
  );
  const [userId, setUserId] = useState<string | null>(() =>
    tokenStorage.getUserId(),
  );

  const loginUser = (id: string) => {
    setIsAuthenticated(true);
    setUserId(id);
  };

  const logoutUser = () => {
    tokenStorage.clear();
    setIsAuthenticated(false);
    setUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userId, loginUser, logoutUser }}
    >
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
