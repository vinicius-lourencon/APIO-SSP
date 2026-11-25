import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { m } from "motion/react";
import {
  ArrowRight,
  FolderPlus,
  LayoutGrid,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import {
  PageHeading,
  PageShell,
  accentButton,
  primaryButton,
  secondaryButton,
  surface,
} from "@/components/layout/PageShell";
import { NextStepNote, ProjectTrail } from "@/components/ProjectTrail";
import { STATUS_ICONS, STATUS_THEME, nextStep } from "@/lib/status-theme";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/PageStates";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ConfirmDialog";
import { getProjects, deleteProject, submitProject } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import type { Project, ProjectStatus } from "@shared/api";
import {
  STATUS_LABELS,
  firstName,
  isProjectEditable,
  professorLabel,
} from "@shared/api";

const STATUS_ORDER: ProjectStatus[] = [
  "rascunho",
  "submetido",
  "em_analise",
  "ajustes_solicitados",
  "aprovado",
  "reprovado",
];

export default function MyProjects() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchProjects = useCallback(async () => {
    setError("");
    try {
      setProjects(await getProjects());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao carregar projetos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const retry = () => {
    setLoading(true);
    fetchProjects();
  };

  const handleDelete = async (project: Project) => {
    const confirmed = await confirm({
      title: "Excluir rascunho",
      description: (
        <>
          O rascunho <strong>{project.title}</strong> e os arquivos anexados
          serão excluídos permanentemente. Esta ação não pode ser desfeita.
        </>
      ),
      confirmLabel: "Excluir rascunho",
      variant: "danger",
    });
    if (!confirmed) return;
    setActionLoading(project.id);
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      toast.success("Rascunho excluído com sucesso.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (project: Project) => {
    const isResubmission = project.status === "ajustes_solicitados";
    const confirmed = await confirm({
      title: isResubmission
        ? "Reenviar para avaliação"
        : "Enviar para avaliação",
      description: isResubmission ? (
        <>
          <strong>{project.title}</strong> volta para o mesmo avaliador, que
          será notificado. O projeto não poderá ser editado durante a nova
          avaliação.
        </>
      ) : (
        <>
          <strong>{project.title}</strong> será enviado aos professores para
          avaliação. O projeto não poderá ser editado enquanto estiver em
          avaliação.
        </>
      ),
      confirmLabel: isResubmission ? "Reenviar" : "Enviar para avaliação",
    });
    if (!confirmed) return;
    setActionLoading(project.id);
    try {
      await submitProject(project.id);
      toast.success(
        isResubmission
          ? "Projeto reenviado ao avaliador!"
          : "Projeto enviado para avaliação!",
      );
      fetchProjects();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao enviar projeto.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const countByStatus = (status: ProjectStatus) =>
    projects.filter((p) => p.status === status).length;
  const query = search.trim().toLowerCase();
  const visible = projects.filter(
    (p) =>
      (!statusFilter || p.status === statusFilter) &&
      (!query || p.title.toLowerCase().includes(query)),
  );
  const hasProjects = projects.length > 0;
  const isFiltering = Boolean(statusFilter || query);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  const waitingOnYou = projects.filter(
    (p) => nextStep(p, user).yourTurn,
  ).length;

  return (
    <PageShell
      hero={
        <PageHeading
          title={`Olá, ${firstName(user?.name ?? "")}`}
          subtitle={
            waitingOnYou > 0
              ? `${waitingOnYou} ${waitingOnYou === 1 ? "projeto espera" : "projetos esperam"} uma ação sua.`
              : "Acompanhe em que etapa está cada proposta."
          }
          action={
            <Link to="/novo-projeto" className={accentButton}>
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              Novo projeto
            </Link>
          }
        />
      }
    >
      {hasProjects && (
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
        >
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            role="group"
            aria-label="Filtrar por status"
          >
            {[
              {
                value: "" as const,
                label: "Todos",
                count: projects.length,
              },
              ...STATUS_ORDER.map((status) => ({
                value: status,
                label: STATUS_LABELS[status],
                count: countByStatus(status),
              })).filter((f) => f.count > 0 || f.value === statusFilter),
            ].map(({ value, label, count }) => {
              const active = statusFilter === value;
              const Icon = value ? STATUS_ICONS[value] : LayoutGrid;
              const theme = value ? STATUS_THEME[value] : null;
              return (
                <button
                  key={value || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(active ? "" : value)}
                  className={cn(
                    "relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br p-3.5 text-left shadow-[0_14px_30px_-18px_rgb(20_38_28/0.6)] transition-[opacity,transform,box-shadow] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ipe/70 motion-reduce:hover:translate-y-0 sm:gap-4 sm:p-4",
                    value
                      ? theme!.solid
                      : "from-[#0B4D2D] to-[#17864D] text-white",
                    active &&
                      "ring-4 ring-white/90 ring-offset-2 ring-offset-mata/40",
                    statusFilter && !active && "opacity-60 hover:opacity-100",
                  )}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15"
                  />
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="relative min-w-0">
                    <span className="block font-display text-2xl font-bold leading-none tabular-nums">
                      {count}
                    </span>
                    <span className="mt-1 block text-xs font-medium leading-tight opacity-90 sm:text-sm">
                      {label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-apoio">
              {statusFilter ? (
                <>
                  Mostrando{" "}
                  <strong className="text-tinta">
                    {STATUS_LABELS[statusFilter]}
                  </strong>{" "}
                  <button
                    type="button"
                    onClick={() => setStatusFilter("")}
                    className="ml-1 font-semibold text-mata underline-offset-4 hover:underline"
                  >
                    ver todos
                  </button>
                </>
              ) : (
                <>
                  {projects.length}{" "}
                  {projects.length === 1 ? "projeto" : "projetos"}
                </>
              )}
            </p>
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">Buscar projeto</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fraco"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Buscar projeto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-full border border-linha bg-white pl-10 pr-4 text-base text-tinta shadow-sm outline-none transition-shadow placeholder:text-fraco focus:border-mata/50 focus:ring-4 focus:ring-mata/10"
              />
            </label>
          </div>
        </m.div>
      )}

      <section className={hasProjects ? "mt-4" : undefined} aria-live="polite">
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : !hasProjects ? (
          <EmptyState
            icon={FolderPlus}
            title="Seu primeiro projeto começa aqui"
            description="Crie uma proposta e envie para avaliação quando estiver pronta."
            action={
              <Link to="/novo-projeto" className={primaryButton}>
                Criar projeto
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />
        ) : visible.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center gap-3 px-6 py-14 text-center",
              surface,
            )}
          >
            <p className="font-display text-lg font-semibold text-tinta">
              Nenhum projeto com esse filtro
            </p>
            {isFiltering && (
              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-mata underline-offset-4 hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-4">
            {visible.map((project, index) => {
              const canEdit = isProjectEditable(project.status);
              const canSubmit = canEdit;
              const canDelete = project.status === "rascunho";
              const isActing = actionLoading === project.id;
              const step = nextStep(project, user);
              const meta = [
                project.proposal_type,
                project.professor_name
                  ? professorLabel(project.professor_name)
                  : "",
                `Criado em ${new Date(project.created_at).toLocaleDateString("pt-BR")}`,
              ].filter(Boolean);

              return (
                <m.li
                  key={project.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    ease: EASE,
                    delay: Math.min(index, 6) * 0.06,
                  }}
                  className={cn(
                    "lift relative overflow-hidden bg-gradient-to-b to-white to-[62%] p-5 pl-6 sm:p-6 sm:pl-7",
                    surface,
                    STATUS_THEME[project.status].wash,
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 w-1.5",
                      STATUS_THEME[project.status].stripe,
                    )}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold leading-snug text-tinta sm:text-xl">
                        <Link
                          to={`/projetos/${project.id}`}
                          className="rounded-sm outline-none transition-colors hover:text-mata focus-visible:ring-4 focus-visible:ring-mata/15"
                        >
                          {project.title}
                        </Link>
                      </h2>
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-apoio">
                        {meta.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
                    <ProjectTrail status={project.status} />
                    <NextStepNote step={step} />
                  </div>

                  {project.latest_feedback && (
                    <div className="mt-4 flex gap-3 rounded-xl bg-[#F1F8F3] p-3 text-sm text-tinta ring-1 ring-inset ring-[#DDEDE1]">
                      <MessageSquareText
                        className="mt-0.5 h-4 w-4 shrink-0 text-mata"
                        aria-hidden
                      />
                      <p className="line-clamp-2">
                        <span className="font-semibold">Parecer: </span>
                        {project.latest_feedback}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-linha pt-4">
                    {canSubmit && (
                      <button
                        onClick={() => handleSubmit(project)}
                        disabled={isActing}
                        className={cn(primaryButton, "h-10 px-5")}
                      >
                        <Send className="h-4 w-4" aria-hidden />
                        {isActing
                          ? "Enviando..."
                          : project.status === "ajustes_solicitados"
                            ? "Reenviar para avaliação"
                            : "Enviar para avaliação"}
                      </button>
                    )}
                    {canEdit && (
                      <Link
                        to={`/novo-projeto?id=${project.id}`}
                        className={cn(secondaryButton, "h-10 px-4")}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        Editar
                      </Link>
                    )}
                    <Link
                      to={`/projetos/${project.id}`}
                      className={cn(
                        canEdit
                          ? "inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-apoio transition-colors hover:bg-fundo hover:text-mata"
                          : cn(secondaryButton, "h-10 px-4"),
                      )}
                    >
                      Ver detalhes
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(project)}
                        disabled={isActing}
                        aria-label={`Excluir rascunho ${project.title}`}
                        title="Excluir rascunho"
                        className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-red-600/80 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </m.li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
