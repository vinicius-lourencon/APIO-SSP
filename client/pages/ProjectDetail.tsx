import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { m } from "motion/react";
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  Download,
  FileText,
  Pencil,
  Send,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  PageShell,
  primaryButton,
  secondaryButton,
  surface,
} from "@/components/layout/PageShell";
import { BackLink } from "@/components/BackLink";
import { ErrorState, ListSkeleton } from "@/components/PageStates";
import { StatusBadge } from "@/components/StatusBadge";
import MeetingRequestDialog from "@/components/MeetingRequestDialog";
import { useConfirm } from "@/components/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProject,
  deleteAttachment,
  submitProject,
  downloadAttachment,
} from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import type { Attachment, MeetingRequestResponse, Project } from "@shared/api";
import { isValidEmail, professorLabel } from "@shared/api";

const HISTORY_ICONS: Record<string, LucideIcon> = {
  criacao: FileText,
  submissao: Send,
  avaliacao: ClipboardCheck,
  ajuste: Pencil,
  notificacao: Bell,
  reuniao: CalendarClock,
};

const DECISION_STYLES = {
  aprovado: { label: "Aprovado", box: "bg-green-50 text-green-800" },
  reprovado: { label: "Reprovado", box: "bg-red-50 text-red-800" },
  ajustes_solicitados: {
    label: "Ajustes solicitados",
    box: "bg-orange-50 text-orange-800",
  },
} as const;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("p-6", surface, className)}>
      <h2 className="mb-4 text-base font-semibold text-[#10512D]">{title}</h2>
      {children}
    </section>
  );
}

function ProgressRing({ value }: { value: number }) {
  return (
    <div
      className="relative h-20 w-20 shrink-0"
      role="img"
      aria-label={`Progresso do projeto: ${value}%`}
    >
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke="rgb(0 0 0 / 0.06)"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke="#10512D"
          strokeWidth="3"
          strokeDasharray={`${value} ${100 - value}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums text-[#10512D]">
        {value}%
      </span>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const projectId = id ? Number(id) : null;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingAttachment, setDeletingAttachment] = useState<number | null>(
    null,
  );
  const [downloadingAttachment, setDownloadingAttachment] = useState<
    number | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  // ISO time until which a new meeting request is blocked (rate limit), null = allowed
  const [meetingCooldownUntil, setMeetingCooldownUntil] = useState<
    string | null
  >(null);

  const applyProject = useCallback((p: Project) => {
    setProject(p);
    setMeetingCooldownUntil(p.meeting_cooldown_until ?? null);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getProject(projectId)
      .then(applyProject)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Projeto não encontrado.",
        );
      })
      .finally(() => setLoading(false));
  }, [projectId, applyProject]);

  // Re-enable "Solicitar reunião" when the cooldown ends
  useEffect(() => {
    if (!meetingCooldownUntil) return;
    const ms = Date.parse(meetingCooldownUntil) - Date.now();
    if (ms <= 0) {
      setMeetingCooldownUntil(null);
      return;
    }
    const timer = setTimeout(() => setMeetingCooldownUntil(null), ms);
    return () => clearTimeout(timer);
  }, [meetingCooldownUntil]);

  const handleMeetingSent = (result: MeetingRequestResponse) => {
    setMeetingCooldownUntil(result.nextAllowedAt);
    // Reload to show the new history entry (and the schedule line, when a date was given)
    if (projectId)
      getProject(projectId)
        .then(applyProject)
        .catch(() => {});
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    const confirmed = await confirm({
      title: "Remover arquivo",
      description: (
        <>
          O arquivo <strong>{attachment.original_name}</strong> será removido do
          projeto. Esta ação não pode ser desfeita.
        </>
      ),
      confirmLabel: "Remover arquivo",
      variant: "danger",
    });
    if (!confirmed) return;
    setDeletingAttachment(attachment.id);
    try {
      await deleteAttachment(attachment.id);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              attachments: prev.attachments?.filter(
                (a) => a.id !== attachment.id,
              ),
            }
          : prev,
      );
      toast.success("Arquivo removido.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao remover arquivo.",
      );
    } finally {
      setDeletingAttachment(null);
    }
  };

  const handleDownload = async (attachmentId: number, filename: string) => {
    setDownloadingAttachment(attachmentId);
    try {
      await downloadAttachment(attachmentId, filename);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao baixar arquivo.",
      );
    } finally {
      setDownloadingAttachment(null);
    }
  };

  const handleSubmit = async () => {
    if (!projectId || !project) return;
    const isResubmission = project.status === "ajustes_solicitados";
    const confirmed = await confirm({
      title: isResubmission
        ? "Reenviar para avaliação"
        : "Enviar para avaliação",
      description: isResubmission
        ? "O projeto volta para o mesmo avaliador, que será notificado. Ele não poderá ser editado durante a nova avaliação."
        : "O projeto será enviado aos professores para avaliação. Ele não poderá ser editado enquanto estiver em avaliação.",
      confirmLabel: isResubmission ? "Reenviar" : "Enviar para avaliação",
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await submitProject(projectId);
      toast.success(
        isResubmission
          ? "Projeto reenviado ao avaliador!"
          : "Projeto enviado para avaliação!",
      );
      navigate("/meus-projetos");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao enviar projeto.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isStudent = user?.role === "aluno";
  const isProfessor = user?.role === "professor";

  if (loading) {
    return (
      <PageShell>
        <ListSkeleton count={2} />
      </PageShell>
    );
  }

  if (error || !project) {
    return (
      <PageShell>
        <ErrorState message={error || "Projeto não encontrado."} />
        <div className="mt-6 flex justify-center">
          <button onClick={() => navigate(-1)} className={secondaryButton}>
            Voltar
          </button>
        </div>
      </PageShell>
    );
  }

  const canEdit =
    isStudent &&
    (project.status === "rascunho" || project.status === "ajustes_solicitados");
  const canSubmit = canEdit;
  const isAssignedProfessor = isProfessor && project.professor_id === user?.id;
  const canEvaluate = isAssignedProfessor && project.status === "em_analise";
  // API rule: only the owner and the assigned evaluator can download attachments
  const canDownload = isStudent || isAssignedProfessor;
  const studentEmailValid = isValidEmail(project.student_email);
  const meetingBlockedReason = !studentEmailValid
    ? "O aluno não possui um e-mail válido cadastrado."
    : meetingCooldownUntil
      ? `Você já solicitou uma reunião recentemente. Nova solicitação disponível às ${formatTime(meetingCooldownUntil)}.`
      : "";
  const hasActions = canSubmit || canEvaluate || canEdit || isAssignedProfessor;
  const backPath = isStudent ? "/meus-projetos" : "/avaliador";

  const meta = [
    project.student_name && `Aluno: ${project.student_name}`,
    project.professor_name &&
      `Avaliador: ${professorLabel(project.professor_name)}`,
    `Criado em ${new Date(project.created_at).toLocaleDateString("pt-BR")}`,
  ].filter(Boolean);

  const details = [
    { label: "Tipo de proposta", value: project.proposal_type },
    { label: "Público-alvo", value: project.public_target },
    { label: "Duração prevista", value: project.duration },
    { label: "Área de conhecimento", value: project.area },
  ].filter((f) => f.value);

  const textSections = [
    { label: "Descrição", value: project.description },
    { label: "Objetivos", value: project.objectives },
    { label: "Impacto esperado", value: project.impact },
    { label: "Cronograma", value: project.schedule },
    { label: "Recursos necessários", value: project.resources },
  ].filter((s) => s.value);

  return (
    <PageShell>
      <BackLink to={backPath}>Voltar</BackLink>

      <m.header className={cn("rounded-3xl p-6 sm:p-8", surface)} {...fadeUp()}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <StatusBadge status={project.status} />
            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-[#10231A] sm:text-3xl">
              {project.title}
            </h1>
            <p className="mt-3 flex flex-wrap gap-x-2 text-sm text-[#6B6868]">
              {meta.map((item, i) => (
                <span key={String(item)}>
                  {item}
                  {i < meta.length - 1 && <span aria-hidden> ·</span>}
                </span>
              ))}
            </p>
          </div>
          <ProgressRing value={project.progress} />
        </div>

        {hasActions && (
          <div className="mt-6 flex flex-wrap gap-2">
            {canSubmit && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={primaryButton}
              >
                <Send className="h-4 w-4" aria-hidden />
                {submitting
                  ? "Enviando..."
                  : project.status === "ajustes_solicitados"
                    ? "Reenviar para avaliação"
                    : "Enviar para avaliação"}
              </button>
            )}
            {canEvaluate && (
              <Link to={`/avaliacao/${project.id}`} className={primaryButton}>
                <ClipboardCheck className="h-4 w-4" aria-hidden />
                Avaliar projeto
              </Link>
            )}
            {canEdit && (
              <Link
                to={`/novo-projeto?id=${project.id}`}
                className={secondaryButton}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Editar projeto
              </Link>
            )}
            {isAssignedProfessor && (
              <button
                type="button"
                onClick={() => setMeetingOpen(true)}
                disabled={!!meetingBlockedReason}
                title={
                  meetingBlockedReason ||
                  "Enviar um e-mail ao aluno solicitando uma reunião"
                }
                aria-describedby={
                  meetingBlockedReason ? "meeting-blocked-reason" : undefined
                }
                className={secondaryButton}
              >
                <CalendarClock className="h-4 w-4" aria-hidden />
                Solicitar reunião
              </button>
            )}
          </div>
        )}
        {isAssignedProfessor && meetingBlockedReason && (
          <p
            id="meeting-blocked-reason"
            className="mt-3 text-xs text-[#6B6868]"
          >
            {meetingBlockedReason}
          </p>
        )}
      </m.header>

      {isAssignedProfessor && project.student_email && (
        <MeetingRequestDialog
          open={meetingOpen}
          onOpenChange={setMeetingOpen}
          projectId={project.id}
          studentName={project.student_name ?? "Aluno"}
          studentEmail={project.student_email}
          onSent={handleMeetingSent}
        />
      )}

      <m.div
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
        {...fadeUp(0.1)}
      >
        <div className="space-y-6 lg:col-span-2">
          {(details.length > 0 || project.keywords?.length > 0) && (
            <Section title="Detalhes do projeto">
              <dl className="grid gap-4 sm:grid-cols-2">
                {details.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wide text-[#8A8888]">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-[#2B2A2A]">{value}</dd>
                  </div>
                ))}
              </dl>
              {project.keywords?.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs uppercase tracking-wide text-[#8A8888]">
                    Palavras-chave
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {project.keywords.map((kw) => (
                      <li
                        key={kw}
                        className="rounded-full bg-[#10512D]/10 px-3 py-1 text-xs font-medium text-[#10512D]"
                      >
                        {kw}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {textSections.map(({ label, value }) => (
            <Section key={label} title={label}>
              <p className="whitespace-pre-wrap leading-relaxed text-[#4A4848]">
                {value}
              </p>
            </Section>
          ))}

          {project.evaluations && project.evaluations.length > 0 && (
            <Section title="Avaliações">
              <ul className="space-y-3">
                {project.evaluations.map((ev) => {
                  const style = DECISION_STYLES[ev.decision];
                  return (
                    <li
                      key={ev.id}
                      className={cn("rounded-2xl p-4", style.box)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {ev.professor_name
                            ? professorLabel(ev.professor_name)
                            : "Avaliador"}
                        </span>
                        <span className="text-xs">
                          <span className="font-medium">{style.label}</span>
                          <span className="opacity-60">
                            {" "}
                            ·{" "}
                            {new Date(ev.created_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </span>
                      </div>
                      {ev.feedback && (
                        <p className="mt-2 text-sm">{ev.feedback}</p>
                      )}
                      {ev.justification && (
                        <p className="mt-2 text-xs opacity-80">
                          Justificativa: {ev.justification}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title={`Documentos (${project.attachments?.length ?? 0})`}>
            {!project.attachments || project.attachments.length === 0 ? (
              <p className="text-sm text-[#6B6868]">Nenhum arquivo anexado.</p>
            ) : (
              <ul className="space-y-2">
                {project.attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/70 p-3"
                  >
                    <FileText
                      className="h-5 w-5 shrink-0 text-[#10512D]"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[#2B2A2A]">
                        {att.original_name}
                      </p>
                      <p className="text-xs text-[#8A8888]">
                        {(att.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    {canDownload && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(att.id, att.original_name)
                        }
                        disabled={downloadingAttachment === att.id}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#10512D] transition-colors hover:bg-[#10512D]/10 disabled:opacity-50"
                        title="Baixar"
                        aria-label={`Baixar ${att.original_name}`}
                      >
                        <Download className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att)}
                        disabled={deletingAttachment === att.id}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-red-600/80 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Remover"
                        aria-label={`Remover ${att.original_name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {project.history && project.history.length > 0 && (
            <Section title="Histórico">
              <ol className="space-y-1">
                {project.history.map((entry, idx) => {
                  const Icon = HISTORY_ICONS[entry.type] ?? FileText;
                  const isLast = idx === project.history!.length - 1;
                  return (
                    <li key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10512D]/10 text-[#10512D]">
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        {!isLast && (
                          <span className="mt-1 min-h-4 w-px flex-1 bg-black/10" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm text-[#2B2A2A]">
                          {entry.description}
                        </p>
                        <p className="mt-0.5 text-xs text-[#8A8888]">
                          {entry.user_name && `${entry.user_name} · `}
                          {new Date(entry.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Section>
          )}
        </div>
      </m.div>
    </PageShell>
  );
}
