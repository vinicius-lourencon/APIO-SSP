import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { m } from "motion/react";
import {
  BadgeCheck,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Info,
  PencilLine,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { PageHeading, PageShell, surface } from "@/components/layout/PageShell";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/PageStates";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EASE, fadeUp } from "@/lib/motion";
import type { Notification } from "@shared/api";

const TYPE_STYLES: Record<
  string,
  { icon: LucideIcon; chip: string; wash: string; tag: string; label: string }
> = {
  success: {
    icon: BadgeCheck,
    chip: "bg-gradient-to-br from-[#2EA866] to-[#1F8F52] text-white",
    wash: "from-folha-claro",
    tag: "bg-folha-claro text-mata",
    label: "Aprovação",
  },
  warning: {
    icon: PencilLine,
    chip: "bg-gradient-to-br from-[#FB8A3C] to-[#EA580C] text-white",
    wash: "from-orange-50",
    tag: "bg-orange-100 text-orange-800",
    label: "Atenção",
  },
  error: {
    icon: XCircle,
    chip: "bg-gradient-to-br from-red-500 to-red-600 text-white",
    wash: "from-red-50",
    tag: "bg-red-100 text-red-700",
    label: "Reprovação",
  },
  info: {
    icon: Info,
    chip: "bg-gradient-to-br from-sky-500 to-sky-600 text-white",
    wash: "from-sky-50",
    tag: "bg-sky-100 text-sky-800",
    label: "Informação",
  },
};

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mata/15 disabled:opacity-50";

type Filter = "all" | "unread";

export default function NotificacoesPage() {
  const confirm = useConfirm();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchNotifications = useCallback(async () => {
    setError("");
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Erro ao carregar notificações.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const retry = () => {
    setLoading(true);
    fetchNotifications();
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: 1 as const } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // fail silently
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 as const })));
      setUnreadCount(0);
    } catch {
      // fail silently
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Excluir notificação",
      description:
        "A notificação será removida da sua lista. Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      variant: "danger",
    });
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await deleteNotification(id);
      const removed = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (removed && !removed.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success("Notificação excluída.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  };

  const displayed =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const filters: { value: Filter; label: string; count?: number }[] = [
    { value: "all", label: "Todas" },
    { value: "unread", label: "Não lidas", count: unreadCount },
  ];

  return (
    <PageShell
      width="max-w-3xl"
      hero={
        <PageHeading
          title="Notificações"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} não lida${unreadCount !== 1 ? "s" : ""}`
              : "Você está em dia."
          }
          action={
            unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ipe/60"
              >
                <CheckCheck className="h-4 w-4" aria-hidden />
                Marcar todas como lidas
              </button>
            )
          }
        />
      }
    >
      <m.div
        className="inline-flex rounded-full border border-linha bg-white p-1 shadow-sm"
        role="tablist"
        {...fadeUp(0.08)}
      >
        {filters.map(({ value, label, count }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(value)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mata/15",
                active ? "bg-mata text-white" : "text-apoio hover:text-mata",
              )}
            >
              {label}
              {count != null && count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-red-100 text-red-700",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </m.div>

      <section className="mt-6" aria-live="polite">
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={filter === "unread" ? BellOff : Bell}
            title={
              filter === "unread"
                ? "Nenhuma notificação não lida"
                : "Nenhuma notificação"
            }
            description="Os avisos sobre seus projetos aparecem aqui."
          />
        ) : (
          <ul className="space-y-3">
            {displayed.map((notif, index) => {
              const style = TYPE_STYLES[notif.type] ?? TYPE_STYLES.info;
              return (
                <m.li
                  key={notif.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: EASE,
                    delay: Math.min(index, 6) * 0.05,
                  }}
                  className={cn(
                    "relative flex items-start gap-3.5 p-4 sm:p-5",
                    surface,
                    !notif.read &&
                      cn(
                        "bg-gradient-to-r via-white via-50% to-white",
                        style.wash,
                      ),
                    notif.read && "opacity-75",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
                      notif.read ? "bg-fundo text-apoio" : style.chip,
                    )}
                  >
                    <style.icon className="h-5 w-5" aria-hidden />
                    {!notif.read && (
                      <span
                        className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-ipe ring-2 ring-white"
                        aria-label="Não lida"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-tinta">
                      {notif.message}
                    </p>
                    {notif.project_title && (
                      <p className="mt-1 text-xs text-apoio">
                        Projeto:{" "}
                        {notif.project_id ? (
                          <Link
                            to={`/projetos/${notif.project_id}`}
                            className="font-medium text-mata hover:underline"
                          >
                            {notif.project_title}
                          </Link>
                        ) : (
                          notif.project_title
                        )}
                      </p>
                    )}
                    <p className="mt-2 flex items-center gap-3 text-xs text-fraco">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-medium",
                          style.tag,
                        )}
                      >
                        {TYPE_STYLES[notif.type]?.label ?? notif.type}
                      </span>
                      {new Date(notif.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className={cn(iconButton, "text-mata hover:bg-mata/10")}
                        title="Marcar como lida"
                        aria-label="Marcar como lida"
                      >
                        <Check className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      disabled={deletingId === notif.id}
                      className={cn(
                        iconButton,
                        "text-red-600/80 hover:bg-red-50 hover:text-red-600",
                      )}
                      title="Excluir notificação"
                      aria-label="Excluir notificação"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
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
