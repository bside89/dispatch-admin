import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getUser } from "../services/api";
import type { User } from "../types/User";
import { tokenStorage } from "../utils/tokenStorage";

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  user: User | null;
  loginUser: (userId: string) => void;
  setUser: (user: User | null) => void;
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
  const [user, setUser] = useState<User | null>(null);

  const loginUser = (id: string) => {
    setIsAuthenticated(true);
    setUserId(id);
  };

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setUser(null);
      return;
    }

    let cancelled = false;

    getUser(userId)
      .then((loadedUser) => {
        if (!cancelled) {
          setUser(loadedUser);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  const logoutUser = () => {
    tokenStorage.clear();
    setIsAuthenticated(false);
    setUserId(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userId, user, loginUser, setUser, logoutUser }}
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
