import "./global.css";

import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "./pages/Login";
import Index from "./pages/Index";
import MyProjects from "./pages/MyProjects";
import GeneralInfo from "./pages/GeneralInfo";
import Profile from "./pages/Profile";
import Avaliador from "./pages/Avaliador";
import ProjectDetail from "./pages/ProjectDetail";
import AvaliacaoForm from "./pages/AvaliacaoForm";
import NotificacoesPage from "./pages/NotificacoesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/" element={<Login />} />

            {/* Student routes */}
            <Route
              path="/meus-projetos"
              element={
                <ProtectedRoute requiredRole="aluno">
                  <MyProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/novo-projeto"
              element={
                <ProtectedRoute requiredRole="aluno">
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/informacoes-gerais"
              element={
                <ProtectedRoute requiredRole="aluno">
                  <GeneralInfo />
                </ProtectedRoute>
              }
            />

            {/* Professor routes */}
            <Route
              path="/avaliador"
              element={
                <ProtectedRoute requiredRole="professor">
                  <Avaliador />
                </ProtectedRoute>
              }
            />
            <Route
              path="/avaliacao/:id"
              element={
                <ProtectedRoute requiredRole="professor">
                  <AvaliacaoForm />
                </ProtectedRoute>
              }
            />

            {/* Shared authenticated routes */}
            <Route
              path="/projetos/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notificacoes"
              element={
                <ProtectedRoute>
                  <NotificacoesPage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
