import { useState, useEffect, KeyboardEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { m } from "motion/react";
import { ArrowLeft, FolderPlus, Plus, Send, X } from "lucide-react";
import {
  PageHeading,
  PageShell,
  fieldClass,
  primaryButton,
  secondaryButton,
  surface,
} from "@/components/layout/PageShell";
import { EmptyState, ListSkeleton } from "@/components/PageStates";
import { FormField } from "@/components/FormField";
import { StepIndicator } from "@/components/StepIndicator";
import { getProject, updateProject, submitProject } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { KNOWLEDGE_AREAS } from "@shared/api";

const textarea = cn(fieldClass, "min-h-32 resize-y");

export default function GeneralInfo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id")
    ? Number(searchParams.get("id"))
    : null;

  const [objectives, setObjectives] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [knowledgeArea, setKnowledgeArea] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [schedule, setSchedule] = useState("");
  const [resources, setResources] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(!!projectId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    setLoadingProject(true);
    getProject(projectId)
      .then((project) => {
        setObjectives(project.objectives || "");
        setDescription(project.description || "");
        setImpact(project.impact || "");
        setKnowledgeArea(project.area || "");
        setKeywords(Array.isArray(project.keywords) ? project.keywords : []);
        setSchedule(project.schedule || "");
        setResources(project.resources || "");
      })
      .catch(() => setError("Não foi possível carregar o projeto."))
      .finally(() => setLoadingProject(false));
  }, [projectId]);

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw) && keywords.length < 10) {
      setKeywords((prev) => [...prev, kw]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (idx: number) => {
    setKeywords((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSave = async (andSubmit = false) => {
    if (!projectId) {
      setError("ID do projeto não encontrado. Volte ao passo anterior.");
      return;
    }
    if (andSubmit && !description.trim()) {
      setError(
        "A descrição é obrigatória para enviar o projeto para avaliação.",
      );
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Empty strings (not undefined) so clearing a field actually clears it
      await updateProject(projectId, {
        objectives: objectives.trim(),
        description: description.trim(),
        impact: impact.trim(),
        area: knowledgeArea,
        keywords,
        schedule: schedule.trim(),
        resources: resources.trim(),
      });

      if (andSubmit) {
        await submitProject(projectId);
      }

      navigate("/meus-projetos");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao salvar projeto.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProject) {
    return (
      <PageShell width="max-w-3xl">
        <ListSkeleton count={2} />
      </PageShell>
    );
  }

  if (!projectId) {
    return (
      <PageShell width="max-w-3xl">
        <EmptyState
          icon={FolderPlus}
          title="Nenhum projeto em andamento"
          description="Inicie pelo primeiro passo para criar o rascunho."
          action={
            <Link to="/novo-projeto" className={primaryButton}>
              Começar do início
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      width="max-w-3xl"
      hero={
        <>
          <PageHeading
            title="Informações gerais"
            subtitle="Último passo: conte mais sobre o projeto."
          />
          <m.div className="mt-6" {...fadeUp(0.06)}>
            <StepIndicator
              current={2}
              detailsHref={`/novo-projeto?id=${projectId}`}
            />
          </m.div>
        </>
      }
    >
      <m.div
        className={cn(
          "relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#E3F2E7] to-[#F6FBF7] p-6 pt-8 sm:p-8 sm:pt-10 before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-gradient-to-r before:from-mata before:via-folha before:to-ipe",
          surface,
        )}
        {...fadeUp(0.12)}
      >
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="space-y-6">
          <FormField label="Descrição" counter={`${description.length}/4000`}>
            <textarea
              placeholder="Descreva o projeto detalhadamente"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              className={textarea}
            />
          </FormField>

          <FormField label="Objetivos" counter={`${objectives.length}/2000`}>
            <textarea
              placeholder="Descreva os objetivos principais do projeto"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              maxLength={2000}
              className={textarea}
            />
          </FormField>

          <FormField label="Impacto esperado" counter={`${impact.length}/2000`}>
            <textarea
              placeholder="Descreva o impacto esperado do projeto na comunidade"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              maxLength={2000}
              className={textarea}
            />
          </FormField>

          <FormField label="Área de conhecimento">
            <select
              value={knowledgeArea}
              onChange={(e) => setKnowledgeArea(e.target.value)}
              className={cn(fieldClass, "h-12")}
            >
              <option value="">Selecione a área</option>
              {KNOWLEDGE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Cronograma" counter={`${schedule.length}/2000`}>
              <textarea
                placeholder="Descreva o cronograma de atividades"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                maxLength={2000}
                className={textarea}
              />
            </FormField>

            <FormField
              label="Recursos necessários"
              counter={`${resources.length}/2000`}
            >
              <textarea
                placeholder="Liste os recursos humanos, materiais e financeiros"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                maxLength={2000}
                className={textarea}
              />
            </FormField>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-apoio">
              Palavras-chave{" "}
              <span className="text-xs font-normal text-fraco">até 10</span>
            </p>
            {keywords.length > 0 && (
              <ul className="mb-3 flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <li
                    key={kw}
                    className="inline-flex items-center gap-1.5 rounded-full bg-mata/10 py-1 pl-3 pr-1.5 text-sm font-medium text-mata"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(i)}
                      className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-mata/15"
                      aria-label={`Remover ${kw}`}
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {keywords.length < 10 && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  aria-label="Nova palavra-chave"
                  placeholder="Digite uma palavra-chave e pressione Enter"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  maxLength={50}
                  className={cn(fieldClass, "h-12 flex-1")}
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  disabled={!newKeyword.trim()}
                  className={secondaryButton}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Adicionar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={`/novo-projeto?id=${projectId}`}
            className={cn(secondaryButton, "sm:w-auto")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </Link>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={loading}
              className={secondaryButton}
            >
              {loading ? "Salvando..." : "Salvar rascunho"}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={loading}
              className={primaryButton}
            >
              <Send className="h-4 w-4" aria-hidden />
              {loading ? "Enviando..." : "Salvar e enviar para avaliação"}
            </button>
          </div>
        </div>
      </m.div>
    </PageShell>
  );
}
