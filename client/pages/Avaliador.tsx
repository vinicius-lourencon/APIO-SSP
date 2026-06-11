import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getProjects, assignProject, getEvaluationStats } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Project } from "@shared/api";
import { STATUS_LABELS, STATUS_COLORS } from "@shared/api";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  adjustments: number;
}

export default function Avaliador() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, adjustments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignLoading, setAssignLoading] = useState<number | null>(null);
  const [tab, setTab] = useState<"pendentes" | "todos">("pendentes");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectsData, statsData] = await Promise.all([
        getProjects({ status: statusFilter || undefined, search: search || undefined }),
        getEvaluationStats(),
      ]);
      setProjects(projectsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (projectId: number) => {
    if (!confirm("Deseja assumir a avaliação deste projeto?")) return;
    setAssignLoading(projectId);
    try {
      await assignProject(projectId);
      fetchData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao assumir projeto.");
    } finally {
      setAssignLoading(null);
    }
  };

  const pendentes = projects.filter(
    (p) => p.status === "submetido" && !p.professor_id
  );
  const emAnalise = projects.filter(
    (p) => p.status === "em_analise"
  );
  const historico = projects.filter(
    (p) => ["aprovado", "reprovado", "ajustes_solicitados"].includes(p.status)
  );

  const displayedProjects =
    tab === "pendentes"
      ? [...pendentes, ...emAnalise]
      : projects;

  const filtered = displayedProjects.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-ubuntu">
      <Header />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] py-8">
        <h1 className="font-ubuntu font-bold text-3xl sm:text-[36px] text-black">
          Área do Avaliador
        </h1>
        <p className="font-ubuntu text-lg sm:text-[20px] text-[#5A5858] mt-2">
          Bem-vindo, Prof. {user?.name?.split(" ")[0]}. Gerencie as avaliações de projetos.
        </p>

        {/* Stats cards */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Avaliados",
              value: stats.total,
              icon: (
                <svg className="w-8 h-8 text-[#10512D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              color: "text-[#10512D]",
            },
            {
              label: "Pendentes",
              value: stats.pending,
              icon: (
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: "text-yellow-600",
            },
            {
              label: "Aprovados",
              value: stats.approved,
              icon: (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: "text-green-600",
            },
            {
              label: "Ajustes Solicitados",
              value: stats.adjustments,
              icon: (
                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ),
              color: "text-orange-500",
            },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white border border-[#EEE] rounded-xl p-5 flex items-center gap-4">
              <div className="shrink-0">{icon}</div>
              <div>
                <p className="text-sm text-[#5A5858] font-ubuntu">{label}</p>
                <p className={`text-3xl font-bold font-ubuntu ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="mt-8 rounded border border-[#CCC] bg-[rgba(204,204,204,0.80)] px-4 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 min-h-[67px]">
          <div className="flex items-center">
            <button
              onClick={() => setTab("pendentes")}
              className={`font-ubuntu text-base px-4 py-4 sm:py-0 transition-opacity ${
                tab === "pendentes" ? "font-semibold text-[#5A5858] opacity-100" : "text-[#5A5858]/60 hover:opacity-100"
              }`}
            >
              Para Avaliar
              {pendentes.length > 0 && (
                <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full px-1.5 py-0.5">
                  {pendentes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("todos")}
              className={`font-ubuntu text-base px-4 py-4 sm:py-0 transition-opacity ${
                tab === "todos" ? "font-semibold text-[#5A5858] opacity-100" : "text-[#5A5858]/60 hover:opacity-100"
              }`}
            >
              Todos os Projetos
            </button>
          </div>
          <div className="border border-[#CCC] bg-white rounded flex items-center px-3 h-[49px] w-full sm:w-80 lg:w-[400px]">
            <svg className="w-4 h-4 text-[#5A5858] opacity-50 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar projeto ou aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-transparent"
            />
          </div>
        </div>

        {/* Project list */}
        <div className="mt-1 border border-[#CCC] rounded-lg bg-white overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-[#10512D] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-red-600 font-ubuntu">{error}</p>
              <button onClick={fetchData} className="bg-[#10512D] text-white px-4 py-2 rounded font-ubuntu">
                Tentar novamente
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <svg className="w-16 h-16 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="font-ubuntu text-xl text-[#5A5858]">
                {tab === "pendentes" ? "Nenhum projeto aguardando avaliação." : "Nenhum projeto encontrado."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#CCC]">
              {filtered.map((project) => {
                const statusStyle = STATUS_COLORS[project.status];
                const statusLabel = STATUS_LABELS[project.status];
                const canAssign = project.status === "submetido" && !project.professor_id;
                const isMyProject = project.professor_id === user?.id;
                const canEvaluate = project.status === "em_analise" && isMyProject;
                const isAssigning = assignLoading === project.id;

                return (
                  <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-ubuntu font-bold text-xl text-black truncate">
                          {project.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-[#5A5858]">
                          {project.student_name && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {project.student_name}
                            </span>
                          )}
                          {project.proposal_type && (
                            <span>• {project.proposal_type}</span>
                          )}
                          <span>
                            • {new Date(project.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          {project.attachment_count != null && project.attachment_count > 0 && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {project.attachment_count} arquivo(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`shrink-0 inline-block px-3 py-1 rounded-full text-xs font-ubuntu font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusLabel}
                        </span>
                        {isMyProject && (
                          <span className="text-xs text-[#10512D] font-ubuntu">Meu projeto</span>
                        )}
                      </div>
                    </div>

                    {/* Latest feedback */}
                    {project.latest_feedback && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-[#5A5858]">
                        <span className="font-semibold text-amber-700">Último feedback: </span>
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
                      {canAssign && (
                        <button
                          onClick={() => handleAssign(project.id)}
                          disabled={isAssigning}
                          className="px-3 py-1.5 bg-[#10512D] text-white rounded text-sm font-ubuntu hover:bg-[#0d4325] disabled:opacity-60"
                        >
                          {isAssigning ? "Assumindo..." : "Assumir avaliação"}
                        </button>
                      )}
                      {canEvaluate && (
                        <Link
                          to={`/avaliacao/${project.id}`}
                          className="px-3 py-1.5 bg-[#008000] text-white rounded text-sm font-ubuntu hover:bg-green-800"
                        >
                          Avaliar projeto
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
