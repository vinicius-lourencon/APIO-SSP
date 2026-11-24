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
    <div className="flex items-center gap-4 p-5">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          tone,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-3xl font-bold tabular-nums text-[#10231A]">
          {value}
        </p>
        <p className="text-sm text-[#6B6868]">{label}</p>
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
    <PageShell>
      <PageHeading
        title={`Olá, Prof. ${firstName(user?.name ?? "")}`}
        subtitle="Veja o que aguarda a sua avaliação."
      />

      <m.div
        className={cn("mt-8 grid grid-cols-2 lg:grid-cols-4", surface)}
        {...fadeUp(0.08)}
      >
        <StatTile
          icon={ClipboardList}
          label="Avaliados"
          value={stats.total}
          tone="bg-[#10512D]/10 text-[#10512D]"
        />
        <StatTile
          icon={Clock}
          label="Pendentes"
          value={stats.pending}
          tone="bg-yellow-100 text-yellow-700"
        />
        <StatTile
          icon={CheckCircle2}
          label="Aprovados"
          value={stats.approved}
          tone="bg-green-100 text-green-700"
        />
        <StatTile
          icon={AlertTriangle}
          label="Ajustes"
          value={stats.adjustments}
          tone="bg-orange-100 text-orange-600"
        />
      </m.div>

      <m.div
        className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        {...fadeUp(0.14)}
      >
        <div
          className="inline-flex w-fit rounded-full border border-black/10 bg-white/80 p-1"
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
                  "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10512D]/15",
                  active
                    ? "bg-[#10512D] text-white"
                    : "text-[#4A4848] hover:text-[#10512D]",
                )}
              >
                {label}
                {count != null && count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-yellow-100 text-yellow-800",
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
                  className={cn("lift p-5 sm:p-6", surface)}
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
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6B6868]">
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
                          <span className="inline-flex items-center gap-1.5 text-[#10512D]">
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
                        <span className="text-xs font-medium text-[#10512D]">
                          Meu projeto
                        </span>
                      )}
                    </div>
                  </div>

                  {project.latest_feedback && (
                    <p className="mt-4 line-clamp-2 rounded-xl bg-amber-50/80 p-3 text-sm text-[#5A4A20]">
                      <span className="font-medium">Último feedback: </span>
                      {project.latest_feedback}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2">
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
                          ? "text-[#5A5858] hover:bg-black/5"
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
