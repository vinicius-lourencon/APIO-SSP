import { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { m } from "motion/react";
import { AlertTriangle, Check } from "lucide-react";
import {
  PageShell,
  fieldClass,
  primaryButton,
  secondaryButton,
  surface,
} from "@/components/layout/PageShell";
import { BackLink } from "@/components/BackLink";
import { FormField } from "@/components/FormField";
import { ErrorState, ListSkeleton } from "@/components/PageStates";
import { useAuth } from "@/contexts/AuthContext";
import { getProject, createEvaluation } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import type { Project, EvaluationDecision } from "@shared/api";

const DECISION_OPTIONS: {
  value: EvaluationDecision;
  label: string;
  color: string;
}[] = [
  {
    value: "aprovado",
    label: "Aprovado",
    color: "border-green-500 bg-green-50 text-green-700",
  },
  {
    value: "ajustes_solicitados",
    label: "Ajustes solicitados",
    color: "border-orange-400 bg-orange-50 text-orange-700",
  },
  {
    value: "reprovado",
    label: "Reprovado",
    color: "border-red-500 bg-red-50 text-red-700",
  },
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
        setLoadError(
          err instanceof ApiError ? err.message : "Projeto não encontrado.",
        );
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
      setFormError(
        "A justificativa é obrigatória para reprovação ou solicitação de ajustes.",
      );
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
      setFormError(
        err instanceof ApiError ? err.message : "Erro ao enviar avaliação.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProject) {
    return (
      <PageShell width="max-w-3xl">
        <ListSkeleton count={2} />
      </PageShell>
    );
  }

  if (loadError || !project) {
    return (
      <PageShell width="max-w-3xl">
        <ErrorState message={loadError || "Projeto não encontrado."} />
        <div className="mt-6 flex justify-center">
          <Link to="/avaliador" className={secondaryButton}>
            Voltar ao painel
          </Link>
        </div>
      </PageShell>
    );
  }

  const requiresJustification =
    decision === "reprovado" || decision === "ajustes_solicitados";

  return (
    <PageShell width="max-w-3xl">
      <BackLink to={`/projetos/${projectId}`}>Ver projeto</BackLink>

      <m.div {...fadeUp()}>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#10512D]">
          Avaliando
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#10231A] sm:text-4xl">
          {project.title}
        </h1>
        <p className="mt-2 text-sm text-[#6B6868]">
          {[
            project.student_name && `Aluno: ${project.student_name}`,
            project.proposal_type,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </m.div>

      <m.form
        onSubmit={handleSubmit}
        className={cn("mt-8 space-y-6 rounded-3xl p-6 sm:p-8", surface)}
        {...fadeUp(0.1)}
      >
        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {formError}
          </div>
        )}

        <FormField label="Parecer técnico" counter={`${opinion.length}/4000`}>
          <textarea
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            placeholder="Descreva sua análise técnica do projeto..."
            maxLength={4000}
            rows={5}
            className={cn(fieldClass, "resize-none")}
          />
        </FormField>

        <FormField
          label="Feedback para o aluno"
          required
          counter={`${feedback.length}/2000`}
        >
          <textarea
            required
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Escreva um feedback claro e construtivo para o aluno..."
            maxLength={2000}
            rows={4}
            className={cn(fieldClass, "resize-none")}
          />
        </FormField>

        <fieldset>
          <legend className="mb-3 text-sm font-medium text-[#3D3B3B]">
            Decisão <span className="text-[#10512D]">*</span>
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DECISION_OPTIONS.map(({ value, label, color }) => {
              const active = decision === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDecision(value)}
                  className={cn(
                    "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10512D]/15",
                    active
                      ? color
                      : "border-black/10 bg-white/80 text-[#5A5858] hover:border-black/25",
                  )}
                >
                  {active && <Check className="h-4 w-4" aria-hidden />}
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {requiresJustification && (
          <FormField
            label="Justificativa"
            required
            hint={`obrigatória para ${decision === "reprovado" ? "reprovação" : "ajustes solicitados"}`}
          >
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
              className={cn(fieldClass, "resize-none")}
            />
          </FormField>
        )}

        {decision && (
          <p className="flex gap-3 rounded-xl bg-amber-50/80 p-3 text-sm text-[#5A4A20]">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              aria-hidden
            />
            <span>
              A avaliação <strong>não pode ser alterada</strong> depois de
              enviada. Revise tudo antes de confirmar.
            </span>
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Link to={`/projetos/${projectId}`} className={secondaryButton}>
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting || !decision}
            className={primaryButton}
          >
            {submitting ? "Enviando..." : "Confirmar avaliação"}
          </button>
        </div>
      </m.form>
    </PageShell>
  );
}
