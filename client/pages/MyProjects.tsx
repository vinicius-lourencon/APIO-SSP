import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { getProjects, deleteProject, submitProject } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Project } from "@shared/api";
import { STATUS_LABELS, STATUS_COLORS } from "@shared/api";

export default function MyProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProjects({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setProjects(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja excluir este rascunho permanentemente?")) return;
    setActionLoading(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Rascunho excluído com sucesso.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (id: number) => {
    if (!confirm("Deseja enviar este projeto para avaliação? Após envio não poderá ser editado.")) return;
    setActionLoading(id);
    try {
      await submitProject(id);
      toast.success("Projeto enviado para avaliação!");
      fetchProjects();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao enviar projeto.");
    } finally {
      setActionLoading(null);
    }
  };

  const total = projects.length;
  const approved = projects.filter((p) => p.status === "aprovado").length;
  const inAnalysis = projects.filter((p) =>
    ["em_analise", "submetido"].includes(p.status)
  ).length;
  const adjustments = projects.filter((p) => p.status === "ajustes_solicitados").length;
  const drafts = projects.filter((p) => p.status === "rascunho").length;

  const filtered = projects.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  const STATUS_FILTERS = [
    { value: "", label: "Todos" },
    { value: "rascunho", label: "Rascunho" },
    { value: "submetido", label: "Submetido" },
    { value: "em_analise", label: "Em Análise" },
    { value: "ajustes_solicitados", label: "Ajustes" },
    { value: "aprovado", label: "Aprovado" },
    { value: "reprovado", label: "Reprovado" },
  ];

  return (
    <div className="min-h-screen bg-white font-ubuntu">
      <Header />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] py-8">
        <h1 className="font-ubuntu font-bold text-3xl sm:text-[36px] text-black">
          Meus Projetos de Extensão
        </h1>
        <p className="font-ubuntu text-lg sm:text-[20px] text-[#5A5858] mt-2">
          Gerencie seus projetos e acompanhe o status de avaliação
        </p>

        {/* Tab bar */}
        <div className="mt-8 rounded border border-[#CCC] bg-[rgba(204,204,204,0.80)] px-4 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 min-h-[67px]">
          <div className="flex items-center">
            <span className="font-ubuntu text-[20px] font-semibold text-[#5A5858] px-4 py-4 sm:py-0">
              Meus Projetos
            </span>
            <Link
              to="/novo-projeto"
              className="font-ubuntu text-[20px] text-[#5A5858]/60 px-4 py-4 sm:py-0 hover:opacity-100 transition-opacity"
            >
              Novo Projeto
            </Link>
          </div>
          <div className="border border-[#CCC] bg-white rounded flex items-center px-3 h-[49px] w-full sm:w-80 lg:w-[400px]">
            <svg className="w-4 h-4 text-[#5A5858] opacity-50 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar projeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-transparent"
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Total", value: total, color: "text-black" },
            { label: "Aprovados", value: approved, color: "text-green-600" },
            { label: "Em Análise", value: inAnalysis, color: "text-yellow-600" },
            { label: "Ajustes", value: adjustments, color: "text-orange-500" },
            { label: "Rascunhos", value: drafts, color: "text-gray-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="border border-[#CCC] rounded-lg p-4 bg-white text-center">
              <p className="font-ubuntu text-sm text-[#5A5858] mb-1">{label}</p>
              <p className={`font-ubuntu text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Status filter chips */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1 rounded-full text-sm font-ubuntu transition-colors ${
                statusFilter === value
                  ? "bg-[#10512D] text-white"
                  : "bg-gray-100 text-[#5A5858] hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Project list */}
        <div className="mt-4 border border-[#CCC] rounded-lg bg-white overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-[#10512D] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-red-600 font-ubuntu">{error}</p>
              <button
                onClick={fetchProjects}
                className="bg-[#10512D] text-white px-4 py-2 rounded font-ubuntu hover:bg-green-800"
              >
                Tentar novamente
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <svg className="w-16 h-16 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-ubuntu text-xl text-[#5A5858]">Nenhum projeto encontrado.</p>
              <Link
                to="/novo-projeto"
                className="mt-2 bg-[#008000] text-white font-ubuntu px-6 py-2 rounded hover:bg-green-800"
              >
                Criar novo projeto
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#CCC]">
              {filtered.map((project) => {
                const statusStyle = STATUS_COLORS[project.status];
                const statusLabel = STATUS_LABELS[project.status];
                const canEdit =
                  project.status === "rascunho" || project.status === "ajustes_solicitados";
                const canSubmit = project.status === "rascunho";
                const canDelete = project.status === "rascunho";
                const isActing = actionLoading === project.id;

                return (
                  <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-ubuntu font-bold text-xl text-black truncate">
                          {project.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-[#5A5858]">
                          {project.proposal_type && (
                            <span>{project.proposal_type}</span>
                          )}
                          {project.professor_name && (
                            <span>• Prof. {project.professor_name}</span>
                          )}
                          <span>
                            •{" "}
                            {new Date(project.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 inline-block px-3 py-1 rounded-full text-xs font-ubuntu font-medium ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-[#5A5858] mb-1">
                        <span>Progresso da avaliação</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-[#10512D] h-2 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Latest feedback */}
                    {project.latest_feedback && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-[#5A5858]">
                        <span className="font-semibold text-amber-700">Feedback: </span>
                        {project.latest_feedback}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Link
                        to={`/projetos/${project.id}`}
                        className="px-3 py-1.5 border border-[#CCC] rounded text-sm font-ubuntu text-[#5A5858] hover:bg-gray-100"
                      >
                        Ver detalhes
                      </Link>
                      {canEdit && (
                        <Link
                          to={`/novo-projeto?id=${project.id}`}
                          className="px-3 py-1.5 border border-[#10512D] rounded text-sm font-ubuntu text-[#10512D] hover:bg-green-50"
                        >
                          Editar
                        </Link>
                      )}
                      {canSubmit && (
                        <button
                          onClick={() => handleSubmit(project.id)}
                          disabled={isActing}
                          className="px-3 py-1.5 bg-[#008000] text-white rounded text-sm font-ubuntu hover:bg-green-800 disabled:opacity-60"
                        >
                          {isActing ? "Enviando..." : "Enviar para Avaliação"}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={isActing}
                          className="px-3 py-1.5 border border-red-200 rounded text-sm font-ubuntu text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New project CTA (only show when there are projects) */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Link
              to="/novo-projeto"
              className="flex items-center gap-2 bg-[#008000] text-white font-ubuntu px-6 py-2.5 rounded hover:bg-green-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Projeto
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
