import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { m } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Inbox,
  Paperclip,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  PageHeading,
  PageShell,
  primaryButton,
  secondaryButton,
  surface,
} from "@/components/layout/PageShell";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/PageStates";
import { StatusBadge } from "@/components/StatusBadge";
import { NextStepNote, ProjectTrail } from "@/components/ProjectTrail";
import { STATUS_THEME, nextStep } from "@/lib/status-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/components/ConfirmDialog";
import { getProjects, assignProject, getEvaluationStats } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { EASE, fadeUp } from "@/lib/motion";
import type { EvaluationStats, Project } from "@shared/api";
import { firstName } from "@shared/api";

type Tab = "pendentes" | "todos";

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 shadow-[0_14px_30px_-18px_rgb(20_38_28/0.6)] sm:gap-4 sm:p-5",
        tone,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15"
      />
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="relative">
        <p className="font-display text-3xl font-bold leading-none tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-sm font-medium opacity-90">{label}</p>
      </div>
    </div>
  );
}

export default function Avaliador() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<EvaluationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    adjustments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [assignLoading, setAssignLoading] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("pendentes");
  const debouncedSearch = useDebouncedValue(search.trim());

  const fetchData = useCallback(async () => {
    setError("");
    try {
      const [projectsData, statsData] = await Promise.all([
        getProjects({ search: debouncedSearch || undefined }),
        getEvaluationStats(),
      ]);
      setProjects(projectsData);
      setStats(statsData);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao carregar dados.",
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = () => {
    setLoading(true);
    fetchData();
  };

  const handleAssign = async (project: Project) => {
    const confirmed = await confirm({
      title: "Assumir avaliação",
      description: (
        <>
          Você será o avaliador responsável por <strong>{project.title}</strong>
          {project.student_name ? (
            <> e {project.student_name} será notificado(a)</>
          ) : null}
          . Outro professor não poderá mais assumir este projeto.
        </>
      ),
      confirmLabel: "Assumir avaliação",
    });
    if (!confirmed) return;
    setAssignLoading(project.id);
    try {
      await assignProject(project.id);
      toast.success("Projeto assumido. Boa avaliação!");
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao assumir projeto.",
      );
    } finally {
      setAssignLoading(null);
    }
  };

  const pendentes = projects.filter(
    (p) => p.status === "submetido" && !p.professor_id,
  );
  // Inclui projetos reenviados após ajustes: voltam a em_analise com o mesmo avaliador
  const emAnalise = projects.filter(
    (p) => p.status === "em_analise" && p.professor_id === user?.id,
  );
  const displayedProjects =
    tab === "pendentes" ? [...pendentes, ...emAnalise] : projects;

  const query = search.trim().toLowerCase();
  const filtered = displayedProjects.filter((p) =>
    query ? p.title.toLowerCase().includes(query) : true,
  );

  const tabs: { value: Tab; label: string; count?: number }[] = [
    {
      value: "pendentes",
      label: "Para avaliar",
      count: pendentes.length + emAnalise.length,
    },
    { value: "todos", label: "Todos os projetos" },
  ];

  return (
    <PageShell
      hero={
        <PageHeading
          title={`Olá, Prof. ${firstName(user?.name ?? "")}`}
          subtitle={
            pendentes.length + emAnalise.length > 0
              ? `${pendentes.length + emAnalise.length} ${pendentes.length + emAnalise.length === 1 ? "projeto aguarda" : "projetos aguardam"} você.`
              : "Nenhum projeto aguardando você agora."
          }
        />
      }
    >
      <m.div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        {...fadeUp(0.08)}
      >
        <StatTile
          icon={ClipboardList}
          label="Avaliados"
          value={stats.total}
          tone="bg-gradient-to-br from-[#0B4D2D] to-[#17864D] text-white"
        />
        <StatTile
          icon={Clock}
          label="Pendentes"
          value={stats.pending}
          tone="bg-gradient-to-br from-[#FFD23F] to-[#F2A900] text-tinta"
        />
        <StatTile
          icon={CheckCircle2}
          label="Aprovados"
          value={stats.approved}
          tone="bg-gradient-to-br from-[#2EA866] to-[#1F8F52] text-white"
        />
        <StatTile
          icon={AlertTriangle}
          label="Ajustes"
          value={stats.adjustments}
          tone="bg-gradient-to-br from-[#FB8A3C] to-[#EA580C] text-white"
        />
      </m.div>

      <m.div
        className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        {...fadeUp(0.14)}
      >
        <div
          className="inline-flex w-fit rounded-full border border-linha bg-white p-1"
          role="tablist"
        >
          {tabs.map(({ value, label, count }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(value)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mata/15",
                  active
                    ? "bg-mata text-white"
                    : "text-apoio hover:bg-mata-claro hover:text-mata",
                )}
              >
                {label}
                {count != null && count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      active ? "bg-white/20 text-white" : "bg-ipe text-tinta",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <label className="relative block w-full md:w-72">
          <span className="sr-only">Buscar projeto pelo título</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fraco"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar projeto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-linha bg-white pl-10 pr-4 text-base text-tinta outline-none transition-shadow placeholder:text-fraco focus:border-mata/50 focus:ring-4 focus:ring-mata/10"
          />
        </label>
      </m.div>

      <section className="mt-6" aria-live="polite">
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={tab === "pendentes" ? ClipboardCheck : Inbox}
            title={
              tab === "pendentes"
                ? "Nada aguardando avaliação"
                : "Nenhum projeto encontrado"
            }
            description={
              tab === "pendentes"
                ? "Quando um aluno enviar um projeto, ele aparece aqui."
                : undefined
            }
          />
        ) : (
          <ul className="space-y-4">
            {filtered.map((project, index) => {
              const canAssign =
                project.status === "submetido" && !project.professor_id;
              const isMyProject = project.professor_id === user?.id;
              const canEvaluate =
                project.status === "em_analise" && isMyProject;
              const isAssigning = assignLoading === project.id;
              const attachments = project.attachment_count ?? 0;
              const meta = [
                project.proposal_type,
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
                      <h2 className="text-lg font-semibold text-tinta sm:truncate sm:text-xl">
                        <Link
                          to={`/projetos/${project.id}`}
                          className="rounded-sm outline-none transition-colors hover:text-mata focus-visible:ring-4 focus-visible:ring-mata/15"
                        >
                          {project.title}
                        </Link>
                      </h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-apoio">
                        {project.student_name && (
                          <span className="inline-flex items-center gap-1.5">
                            <User className="h-4 w-4" aria-hidden />
                            {project.student_name}
                          </span>
                        )}
                        {meta.map((item, i) => (
                          <span key={item}>
                            {item}
                            {i < meta.length - 1 && <span aria-hidden> ·</span>}
                          </span>
                        ))}
                        {attachments > 0 && (
                          <span className="inline-flex items-center gap-1.5 text-mata">
                            <Paperclip className="h-4 w-4" aria-hidden />
                            {attachments}{" "}
                            {attachments === 1 ? "arquivo" : "arquivos"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                      <StatusBadge status={project.status} />
                      {isMyProject && (
                        <span className="text-xs font-semibold text-mata">
                          Sob sua avaliação
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
                    <ProjectTrail status={project.status} />
                    <NextStepNote step={nextStep(project, user)} />
                  </div>

                  {project.latest_feedback && (
                    <p className="mt-4 line-clamp-2 rounded-xl bg-[#F1F8F3] p-3 text-sm text-tinta ring-1 ring-inset ring-[#DDEDE1]">
                      <span className="font-medium">Último feedback: </span>
                      {project.latest_feedback}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-linha pt-4">
                    {canAssign && (
                      <button
                        onClick={() => handleAssign(project)}
                        disabled={isAssigning}
                        className={cn(primaryButton, "h-10 px-5")}
                      >
                        {isAssigning ? "Assumindo..." : "Assumir avaliação"}
                      </button>
                    )}
                    {canEvaluate && (
                      <Link
                        to={`/avaliacao/${project.id}`}
                        className={cn(primaryButton, "h-10 px-5")}
                      >
                        Avaliar projeto
                      </Link>
                    )}
                    <Link
                      to={`/projetos/${project.id}`}
                      className={cn(
                        canAssign || canEvaluate
                          ? "text-apoio hover:bg-black/5"
                          : secondaryButton,
                        "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
                      )}
                    >
                      Ver detalhes
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
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
