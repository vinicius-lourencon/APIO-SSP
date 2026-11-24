import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { m } from "motion/react";
import {
  ArrowRight,
  FolderPlus,
  MessageSquareText,
  Pencil,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ConfirmDialog";
import { getProjects, deleteProject, submitProject } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import type { Project, ProjectStatus } from "@shared/api";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  firstName,
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

function ProjectSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-black/5 bg-white/90 p-6"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-4">
        <div className="h-5 w-1/2 rounded-full bg-black/5" />
        <div className="h-6 w-20 rounded-full bg-black/5" />
      </div>
      <div className="mt-4 h-3 w-1/3 rounded-full bg-black/5" />
      <div className="mt-6 h-2 w-full rounded-full bg-black/5" />
    </div>
  );
}

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

  return (
    <PageShell>
      <PageHeading
        title={`Olá, ${firstName(user?.name ?? "")}`}
        subtitle="Acompanhe o andamento de cada proposta."
      />

      {hasProjects && (
        <m.div
          className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
        >
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar por status"
          >
            {[
              { value: "" as const, label: "Todos", count: projects.length },
              ...STATUS_ORDER.map((status) => ({
                value: status,
                label: STATUS_LABELS[status],
                count: countByStatus(status),
              })).filter((f) => f.count > 0 || f.value === statusFilter),
            ].map(({ value, label, count }) => {
              const active = statusFilter === value;
              return (
                <button
                  key={value || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10512D]/15",
                    active
                      ? "border-[#10512D] bg-[#10512D] text-white"
                      : "border-black/10 bg-white/80 text-[#4A4848] hover:border-[#10512D]/40 hover:text-[#10512D]",
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      active ? "text-white/70" : "text-[#8A8888]",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="relative block w-full md:w-72">
            <span className="sr-only">Buscar projeto</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8888]"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Buscar projeto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-full border border-black/10 bg-white/90 pl-10 pr-4 text-base text-[#333] outline-none transition-shadow placeholder:text-[#8A8888] focus:border-[#10512D]/50 focus:ring-4 focus:ring-[#10512D]/10"
            />
          </label>
        </m.div>
      )}

      <section className="mt-6" aria-live="polite">
        {loading ? (
          <div className="space-y-4">
            <ProjectSkeleton />
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-black/5 bg-white/90 px-6 py-16 text-center">
            <p role="alert" className="text-red-600">
              {error}
            </p>
            <button
              onClick={retry}
              className="h-11 rounded-full bg-[#10512D] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0c3f23]"
            >
              Tentar novamente
            </button>
          </div>
        ) : !hasProjects ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-black/5 bg-white/90 px-6 py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10512D]/10 text-[#10512D]">
              <FolderPlus className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <p className="text-xl font-semibold text-[#10231A]">
                Seu primeiro projeto começa aqui
              </p>
              <p className="mt-1 text-[#5A5858]">
                Crie uma proposta e envie para avaliação quando estiver pronta.
              </p>
            </div>
            <Link
              to="/novo-projeto"
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-[#10512D] px-6 text-sm font-medium text-white shadow-[0_10px_24px_-12px_rgb(16_81_45/0.7)] transition-colors hover:bg-[#0c3f23]"
            >
              Criar projeto
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-black/5 bg-white/90 px-6 py-14 text-center">
            <p className="text-lg font-semibold text-[#10231A]">
              Nada por aqui com esse filtro
            </p>
            {isFiltering && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-[#10512D] underline-offset-4 hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-4">
            {visible.map((project, index) => {
              const statusStyle = STATUS_COLORS[project.status];
              const canEdit =
                project.status === "rascunho" ||
                project.status === "ajustes_solicitados";
              const canSubmit = canEdit;
              const canDelete = project.status === "rascunho";
              const isActing = actionLoading === project.id;
              const meta = [
                project.proposal_type,
                project.professor_name
                  ? professorLabel(project.professor_name)
                  : "",
                new Date(project.created_at).toLocaleDateString("pt-BR"),
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
                  className="lift rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-[#10231A] sm:truncate sm:text-xl">
                        <Link
                          to={`/projetos/${project.id}`}
                          className="rounded-sm outline-none transition-colors hover:text-[#10512D] focus-visible:ring-4 focus-visible:ring-[#10512D]/15"
                        >
                          {project.title}
                        </Link>
                      </h2>
                      <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-[#6B6868]">
                        {meta.map((item, i) => (
                          <span key={item}>
                            {item}
                            {i < meta.length - 1 && <span aria-hidden> ·</span>}
                          </span>
                        ))}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium",
                        statusStyle.bg,
                        statusStyle.text,
                      )}
                    >
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>

                  {project.progress > 0 && (
                    <div
                      className="mt-5 flex items-center gap-3"
                      role="img"
                      aria-label={`Avaliação ${project.progress}% concluída`}
                    >
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
                        <div
                          className="h-full origin-left rounded-full bg-[#10512D]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs tabular-nums text-[#6B6868]">
                        {project.progress}%
                      </span>
                    </div>
                  )}

                  {project.latest_feedback && (
                    <div className="mt-4 flex gap-3 rounded-xl bg-amber-50/80 p-3 text-sm text-[#5A4A20]">
                      <MessageSquareText
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                        aria-hidden
                      />
                      <p className="line-clamp-2">{project.latest_feedback}</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {canSubmit && (
                      <button
                        onClick={() => handleSubmit(project)}
                        disabled={isActing}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#10512D] px-5 text-sm font-medium text-white transition-colors hover:bg-[#0c3f23] disabled:opacity-60"
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
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-sm font-medium text-[#10512D] transition-colors hover:bg-[#10512D]/5"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        Editar
                      </Link>
                    )}
                    <Link
                      to={`/projetos/${project.id}`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[#5A5858] transition-colors hover:bg-black/5"
                    >
                      Ver detalhes
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(project)}
                        disabled={isActing}
                        aria-label={`Excluir rascunho ${project.title}`}
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
