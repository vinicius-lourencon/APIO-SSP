import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { toast } from "sonner";
import type { RegisterRequest, User } from "@shared/api";
import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  SESSION_EXPIRED_EVENT,
  TOKEN_KEY,
} from "@/lib/api";
import { isSessionInvalid, sessionErrorMessage } from "@/lib/session";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Falha temporária ao restaurar a sessão: o token continua salvo */
  sessionError: string;
  retrySession: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // Token expired or became invalid mid-session: drop the user so ProtectedRoute sends them to login
  useEffect(() => {
    function onSessionExpired() {
      if (userRef.current) toast.error("Sua sessão expirou. Entre novamente.");
      setUser(null);
      setSessionError("");
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  const restoreSession = useCallback(() => {
    setSessionError("");
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMe()
      .then(setUser)
      .catch((error: unknown) => {
        if (isSessionInvalid(error)) localStorage.removeItem(TOKEN_KEY);
        else setSessionError(sessionErrorMessage(error));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    setSessionError("");
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await apiRegister(data);
    localStorage.setItem(TOKEN_KEY, res.token);
    setSessionError("");
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setSessionError("");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionError,
        retrySession: restoreSession,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
