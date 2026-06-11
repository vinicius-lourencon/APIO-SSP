import { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getProject, createEvaluation } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Project, EvaluationDecision } from "@shared/api";

const DECISION_OPTIONS: { value: EvaluationDecision; label: string; color: string }[] = [
  { value: "aprovado", label: "Aprovado", color: "border-green-500 bg-green-50 text-green-700" },
  { value: "ajustes_solicitados", label: "Ajustes Solicitados", color: "border-orange-400 bg-orange-50 text-orange-700" },
  { value: "reprovado", label: "Reprovado", color: "border-red-500 bg-red-50 text-red-700" },
];

export default function AvaliacaoForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const projectId = id ? Number(id) : null;

  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [opinion, setOpinion] = useState("");
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState<EvaluationDecision | "">("");
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId)
      .then((p) => {
        if (p.status !== "em_analise") {
          setLoadError("Este projeto não está em análise.");
          return;
        }
        if (p.professor_id !== user?.id) {
          setLoadError("Você não é o avaliador responsável por este projeto.");
          return;
        }
        setProject(p);
      })
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : "Projeto não encontrado.");
      })
      .finally(() => setLoadingProject(false));
  }, [projectId, user?.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!decision) {
      setFormError("Selecione uma decisão de avaliação.");
      return;
    }
    if (!feedback.trim()) {
      setFormError("O feedback é obrigatório.");
      return;
    }
    if (
      (decision === "reprovado" || decision === "ajustes_solicitados") &&
      !justification.trim()
    ) {
      setFormError("A justificativa é obrigatória para reprovação ou solicitação de ajustes.");
      return;
    }
    if (!projectId) return;

    setFormError("");
    setSubmitting(true);
    try {
      await createEvaluation({
        project_id: projectId,
        opinion: opinion.trim(),
        feedback: feedback.trim(),
        decision,
        justification: justification.trim() || undefined,
      });
      navigate("/avaliador");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erro ao enviar avaliação.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-white font-ubuntu">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#10512D] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="min-h-screen bg-white font-ubuntu">
        <Header />
        <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-16 text-center">
          <p className="text-red-600 font-ubuntu mb-4">{loadError || "Projeto não encontrado."}</p>
          <Link to="/avaliador" className="bg-[#10512D] text-white font-ubuntu px-6 py-2 rounded hover:bg-green-800">
            Voltar ao Painel
          </Link>
        </div>
      </div>
    );
  }

  const requiresJustification = decision === "reprovado" || decision === "ajustes_solicitados";

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-ubuntu">
      <Header />
      <main className="max-w-[900px] mx-auto px-4 sm:px-8 py-8">
        {/* Back */}
        <Link
          to={`/projetos/${projectId}`}
          className="flex items-center gap-1 text-sm text-[#5A5858] hover:text-[#10512D] mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Ver projeto
        </Link>

        {/* Project summary */}
        <div className="bg-white border border-[#EEE] rounded-xl p-6 mb-6">
          <p className="text-xs text-[#999] uppercase tracking-wide mb-1">Avaliando</p>
          <h1 className="font-ubuntu font-bold text-xl sm:text-2xl text-black">{project.title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5A5858]">
            {project.student_name && <span>Aluno: {project.student_name}</span>}
            {project.proposal_type && <span>• {project.proposal_type}</span>}
          </div>
        </div>

        {/* Evaluation form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-[#EEE] rounded-xl p-6 sm:p-8 space-y-6">
            <h2 className="font-ubuntu font-bold text-2xl text-black">Formulário de Avaliação</h2>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {formError}
              </div>
            )}

            {/* Opinion */}
            <div>
              <label className="block font-ubuntu text-base font-medium text-[#5A5858] mb-2">
                Parecer Técnico
              </label>
              <textarea
                value={opinion}
                onChange={(e) => setOpinion(e.target.value)}
                placeholder="Descreva sua análise técnica do projeto..."
                maxLength={4000}
                rows={5}
                className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D] resize-none"
              />
              <p className="text-xs text-[#999] mt-1 text-right">{opinion.length}/4000</p>
            </div>

            {/* Feedback */}
            <div>
              <label className="block font-ubuntu text-base font-medium text-[#5A5858] mb-2">
                Feedback para o Aluno *
              </label>
              <textarea
                required
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Escreva um feedback claro e construtivo para o aluno..."
                maxLength={2000}
                rows={4}
                className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D] resize-none"
              />
              <p className="text-xs text-[#999] mt-1 text-right">{feedback.length}/2000</p>
            </div>

            {/* Decision */}
            <div>
              <label className="block font-ubuntu text-base font-medium text-[#5A5858] mb-3">
                Decisão de Avaliação *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DECISION_OPTIONS.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDecision(value)}
                    className={`py-3 px-4 rounded-lg border-2 font-ubuntu font-medium text-sm transition-all ${
                      decision === value
                        ? `${color} border-current`
                        : "border-[#CCC] bg-white text-[#5A5858] hover:border-gray-400"
                    }`}
                  >
                    {decision === value && (
                      <span className="mr-1">✓ </span>
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Justification (required for reprovado/ajustes_solicitados) */}
            {requiresJustification && (
              <div>
                <label className="block font-ubuntu text-base font-medium text-[#5A5858] mb-2">
                  Justificativa *{" "}
                  <span className="text-xs font-normal text-[#999]">
                    (obrigatória para {decision === "reprovado" ? "reprovação" : "ajustes solicitados"})
                  </span>
                </label>
                <textarea
                  required
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder={
                    decision === "reprovado"
                      ? "Explique detalhadamente os motivos da reprovação..."
                      : "Descreva claramente quais ajustes são necessários..."
                  }
                  maxLength={2000}
                  rows={4}
                  className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D] resize-none"
                />
              </div>
            )}

            {/* Warning for irreversibility */}
            {decision && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm flex gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>
                  Atenção: a avaliação <strong>não pode ser alterada</strong> após o envio. Revise todas as informações antes de confirmar.
                </p>
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <Link
                to={`/projetos/${projectId}`}
                className="flex items-center justify-center border border-[#CCC] bg-white rounded h-[43px] min-w-[140px] font-ubuntu text-[18px] text-black hover:bg-gray-50 transition-colors px-6"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={submitting || !decision}
                className="bg-[#10512D] text-white rounded h-[43px] min-w-[200px] font-ubuntu text-[18px] hover:bg-[#0d4325] disabled:opacity-60 transition-colors px-6"
              >
                {submitting ? "Enviando..." : "Confirmar Avaliação"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
