import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getProject, deleteAttachment, submitProject, getDownloadUrl } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Project } from "@shared/api";
import { STATUS_LABELS, STATUS_COLORS } from "@shared/api";

const HISTORY_ICONS: Record<string, string> = {
  criacao: "📄",
  submissao: "📤",
  avaliacao: "🔍",
  ajuste: "✏️",
  notificacao: "🔔",
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const projectId = id ? Number(id) : null;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingAttachment, setDeletingAttachment] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getProject(projectId)
      .then(setProject)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Projeto não encontrado.");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm("Deseja remover este arquivo?")) return;
    setDeletingAttachment(attachmentId);
    try {
      await deleteAttachment(attachmentId);
      setProject((prev) =>
        prev
          ? { ...prev, attachments: prev.attachments?.filter((a) => a.id !== attachmentId) }
          : prev
      );
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao remover arquivo.");
    } finally {
      setDeletingAttachment(null);
    }
  };

  const handleSubmit = async () => {
    if (!projectId) return;
    if (!confirm("Deseja enviar este projeto para avaliação?")) return;
    setSubmitting(true);
    try {
      await submitProject(projectId);
      navigate("/meus-projetos");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao enviar projeto.");
    } finally {
      setSubmitting(false);
    }
  };

  const isStudent = user?.role === "aluno";
  const isProfessor = user?.role === "professor";

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-ubuntu">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#10512D] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white font-ubuntu">
        <Header />
        <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-16 text-center">
          <p className="text-red-600 font-ubuntu mb-4">{error || "Projeto não encontrado."}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#10512D] text-white font-ubuntu px-6 py-2 rounded hover:bg-green-800"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[project.status];
  const statusLabel = STATUS_LABELS[project.status];
  const canEdit = isStudent && (project.status === "rascunho" || project.status === "ajustes_solicitados");
  const canSubmit = isStudent && project.status === "rascunho";
  const canEvaluate = isProfessor && project.status === "em_analise" && project.professor_id === user?.id;
  const backPath = isStudent ? "/meus-projetos" : "/avaliador";

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-ubuntu">
      <Header />
      <main className="max-w-[900px] mx-auto px-4 sm:px-8 py-8">
        {/* Back */}
        <Link
          to={backPath}
          className="flex items-center gap-1 text-sm text-[#5A5858] hover:text-[#10512D] mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>

        {/* Header card */}
        <div className="bg-white border border-[#EEE] rounded-xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-ubuntu font-medium mb-3 ${statusStyle.bg} ${statusStyle.text}`}>
                {statusLabel}
              </span>
              <h1 className="font-ubuntu font-bold text-2xl sm:text-3xl text-black leading-tight">
                {project.title}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[#5A5858]">
                {project.student_name && (
                  <span>Aluno: {project.student_name}</span>
                )}
                {project.professor_name && (
                  <span>• Avaliador: Prof. {project.professor_name}</span>
                )}
                <span>• Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
            {/* Progress */}
            <div className="shrink-0 w-full sm:w-40">
              <p className="text-xs text-[#5A5858] mb-1 text-center">Progresso</p>
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F0F0F0" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9155" fill="none"
                    stroke="#10512D" strokeWidth="3"
                    strokeDasharray={`${project.progress} ${100 - project.progress}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-ubuntu font-bold text-xl text-[#10512D]">{project.progress}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-6">
            {canEdit && (
              <Link
                to={`/novo-projeto?id=${project.id}`}
                className="px-4 py-2 border border-[#10512D] rounded text-sm font-ubuntu text-[#10512D] hover:bg-green-50"
              >
                Editar projeto
              </Link>
            )}
            {canSubmit && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-[#008000] text-white rounded text-sm font-ubuntu hover:bg-green-800 disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Enviar para Avaliação"}
              </button>
            )}
            {canEvaluate && (
              <Link
                to={`/avaliacao/${project.id}`}
                className="px-4 py-2 bg-[#10512D] text-white rounded text-sm font-ubuntu hover:bg-[#0d4325]"
              >
                Avaliar projeto
              </Link>
            )}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* General info */}
            <div className="bg-white border border-[#EEE] rounded-xl p-6">
              <h2 className="font-ubuntu font-semibold text-lg text-[#10512D] mb-4">Detalhes do Projeto</h2>
              <div className="space-y-4">
                {[
                  { label: "Tipo de Proposta", value: project.proposal_type },
                  { label: "Público-Alvo", value: project.public_target },
                  { label: "Duração Prevista", value: project.duration },
                  { label: "Área de Conhecimento", value: project.area },
                ].filter((f) => f.value).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-[#999] uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="font-ubuntu text-[#333]">{value}</p>
                  </div>
                ))}
                {project.keywords?.length > 0 && (
                  <div>
                    <p className="text-xs text-[#999] uppercase tracking-wide mb-2">Palavras-chave</p>
                    <div className="flex flex-wrap gap-2">
                      {project.keywords.map((kw) => (
                        <span key={kw} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-ubuntu">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description, objectives, impact */}
            {[
              { label: "Descrição", value: project.description },
              { label: "Objetivos", value: project.objectives },
              { label: "Impacto Esperado", value: project.impact },
              { label: "Cronograma", value: project.schedule },
              { label: "Recursos Necessários", value: project.resources },
            ].filter((s) => s.value).map(({ label, value }) => (
              <div key={label} className="bg-white border border-[#EEE] rounded-xl p-6">
                <h2 className="font-ubuntu font-semibold text-base text-[#10512D] mb-3">{label}</h2>
                <p className="font-ubuntu text-[#5A5858] leading-relaxed whitespace-pre-wrap">{value}</p>
              </div>
            ))}

            {/* Evaluations */}
            {project.evaluations && project.evaluations.length > 0 && (
              <div className="bg-white border border-[#EEE] rounded-xl p-6">
                <h2 className="font-ubuntu font-semibold text-lg text-[#10512D] mb-4">Avaliações</h2>
                <div className="space-y-4">
                  {project.evaluations.map((ev) => {
                    const decisionColors = {
                      aprovado: "bg-green-50 border-green-200 text-green-700",
                      reprovado: "bg-red-50 border-red-200 text-red-700",
                      ajustes_solicitados: "bg-orange-50 border-orange-200 text-orange-700",
                    };
                    const decisionLabels = {
                      aprovado: "Aprovado",
                      reprovado: "Reprovado",
                      ajustes_solicitados: "Ajustes Solicitados",
                    };
                    return (
                      <div key={ev.id} className={`border rounded-lg p-4 ${decisionColors[ev.decision]}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-ubuntu font-semibold text-sm">
                            {ev.professor_name ? `Prof. ${ev.professor_name}` : "Avaliador"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-ubuntu text-xs font-medium">
                              {decisionLabels[ev.decision]}
                            </span>
                            <span className="text-xs opacity-60">
                              {new Date(ev.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        {ev.feedback && (
                          <p className="text-sm mt-1">{ev.feedback}</p>
                        )}
                        {ev.justification && (
                          <p className="text-xs mt-2 opacity-80">Justificativa: {ev.justification}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Attachments + History */}
          <div className="space-y-6">
            {/* Attachments */}
            <div className="bg-white border border-[#EEE] rounded-xl p-6">
              <h2 className="font-ubuntu font-semibold text-base text-[#10512D] mb-4">
                Documentos ({project.attachments?.length ?? 0})
              </h2>
              {(!project.attachments || project.attachments.length === 0) ? (
                <p className="text-sm text-[#5A5858] italic">Nenhum arquivo anexado.</p>
              ) : (
                <div className="space-y-2">
                  {project.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-2 p-2 border border-[#EEE] rounded-lg">
                      <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-ubuntu text-[#333] truncate">{att.original_name}</p>
                        <p className="text-xs text-[#999]">{(att.size / 1024 / 1024).toFixed(1)}MB</p>
                      </div>
                      <div className="flex gap-1">
                        <a
                          href={getDownloadUrl(att.id)}
                          download
                          className="p-1 rounded hover:bg-gray-100 text-[#10512D]"
                          title="Baixar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            disabled={deletingAttachment === att.id}
                            className="p-1 rounded hover:bg-red-50 text-red-500 disabled:opacity-50"
                            title="Remover"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History timeline */}
            {project.history && project.history.length > 0 && (
              <div className="bg-white border border-[#EEE] rounded-xl p-6">
                <h2 className="font-ubuntu font-semibold text-base text-[#10512D] mb-4">Histórico</h2>
                <div className="space-y-3">
                  {project.history.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-base">{HISTORY_ICONS[entry.type] || "•"}</span>
                        {idx < project.history!.length - 1 && (
                          <div className="w-px flex-1 bg-[#EEE] mt-1 min-h-[16px]" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-ubuntu text-[#333]">{entry.description}</p>
                        <p className="text-xs text-[#999] mt-0.5">
                          {entry.user_name && `${entry.user_name} • `}
                          {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
