import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
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
  XCircle,
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
import { getProjects, assignProject } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { EASE, fadeUp } from "@/lib/motion";
import type { Project } from "@shared/api";
import { firstName } from "@shared/api";

type Tab =
  "pendentes" | "aprovado" | "ajustes_solicitados" | "reprovado" | "todos";

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 text-left shadow-[0_14px_30px_-18px_rgb(20_38_28/0.6)] transition-[opacity,transform] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ipe/70 motion-reduce:hover:translate-y-0 sm:gap-4 sm:p-5",
        tone,
        active &&
          "-translate-y-0.5 ring-4 ring-white ring-offset-2 ring-offset-mata/50",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15"
      />
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="relative">
        <span className="block font-display text-3xl font-bold leading-none tabular-nums">
          {value}
        </span>
        <span className="mt-1 block text-sm font-medium opacity-90">
          {label}
        </span>
      </span>
    </button>
  );
}

export default function Avaliador() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [assignLoading, setAssignLoading] = useState<number | null>(null);
  const location = useLocation();
  const initialTab = (location.state as { tab?: Tab } | null)?.tab;
  const [tab, setTab] = useState<Tab>(initialTab ?? "pendentes");
  const debouncedSearch = useDebouncedValue(search.trim());

  const fetchData = useCallback(async () => {
    setError("");
    try {
      setProjects(await getProjects({ search: debouncedSearch || undefined }));
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
  const mine = (status: Project["status"]) =>
    projects.filter((p) => p.status === status && p.professor_id === user?.id);
  const groups: Record<Tab, Project[]> = {
    pendentes: [...pendentes, ...emAnalise],
    aprovado: mine("aprovado"),
    ajustes_solicitados: mine("ajustes_solicitados"),
    reprovado: mine("reprovado"),
    todos: projects,
  };
  const displayedProjects = groups[tab];

  const query = search.trim().toLowerCase();
  const filtered = displayedProjects.filter((p) =>
    query ? p.title.toLowerCase().includes(query) : true,
  );

  const tiles: { value: Tab; label: string; icon: LucideIcon; tone: string }[] =
    [
      {
        value: "pendentes",
        label: "Para avaliar",
        icon: Clock,
        tone: "bg-gradient-to-br from-[#FFD23F] to-[#F2A900] text-tinta",
      },
      {
        value: "aprovado",
        label: "Aprovados",
        icon: CheckCircle2,
        tone: "bg-gradient-to-br from-[#2EA866] to-[#1F8F52] text-white",
      },
      {
        value: "ajustes_solicitados",
        label: "Ajustes",
        icon: AlertTriangle,
        tone: "bg-gradient-to-br from-[#FB8A3C] to-[#EA580C] text-white",
      },
      {
        value: "reprovado",
        label: "Reprovados",
        icon: XCircle,
        tone: "bg-gradient-to-br from-red-500 to-red-700 text-white",
      },
      {
        value: "todos",
        label: "Todos",
        icon: ClipboardList,
        tone: "bg-gradient-to-br from-[#0B4D2D] to-[#17864D] text-white",
      },
    ];
  const describe = (n: number): string => {
    const one = n === 1;
    switch (tab) {
      case "pendentes":
        return `${one ? "projeto aguardando" : "projetos aguardando"} sua avaliação`;
      case "aprovado":
        return `${one ? "projeto aprovado" : "projetos aprovados"} por você`;
      case "ajustes_solicitados":
        return `${one ? "projeto" : "projetos"} com ajustes pedidos por você`;
      case "reprovado":
        return `${one ? "projeto reprovado" : "projetos reprovados"} por você`;
      default:
        return one ? "projeto no total" : "projetos no total";
    }
  };

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
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        role="group"
        aria-label="Filtrar projetos"
        {...fadeUp(0.08)}
      >
        {tiles.map(({ value, label, icon, tone }) => (
          <StatTile
            key={value}
            icon={icon}
            label={label}
            value={groups[value].length}
            tone={tone}
            active={tab === value}
            onClick={() => setTab(value)}
          />
        ))}
      </m.div>

      <m.div
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        {...fadeUp(0.14)}
      >
        <p className="text-sm text-apoio">
          <strong className="text-tinta">{filtered.length}</strong>{" "}
          {describe(filtered.length)}
        </p>

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
                : "Nenhum projeto aqui"
            }
            description={
              tab === "pendentes"
                ? "Quando um aluno enviar um projeto, ele aparece aqui."
                : "Os projetos que você avaliar aparecem no bloco do resultado."
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
