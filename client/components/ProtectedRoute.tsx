import { Navigate, useLocation } from "react-router-dom";
import { RefreshCw, WifiOff } from "lucide-react";
import { EmptyState } from "@/components/PageStates";
import { primaryButton, secondaryButton } from "@/lib/styles";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@shared/api";

interface Props {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading, sessionError, retrySession, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-mata border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-apoio">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user && sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-fundo p-6 font-sans">
        <div className="w-full max-w-md" role="alert">
          <EmptyState
            icon={WifiOff}
            title="Não conseguimos confirmar sua sessão"
            description={`${sessionError} Você continua conectado.`}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={retrySession}
                  className={primaryButton}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Tentar novamente
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className={secondaryButton}
                >
                  Sair da conta
                </button>
              </div>
            }
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    const redirect =
      user.role === "professor" ? "/avaliador" : "/meus-projetos";
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
