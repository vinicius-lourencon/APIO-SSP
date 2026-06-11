import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Notification } from "@shared/api";

const TYPE_STYLES: Record<string, { bg: string; border: string; dot: string }> = {
  success: { bg: "bg-green-50", border: "border-l-4 border-l-green-500", dot: "bg-green-500" },
  warning: { bg: "bg-orange-50", border: "border-l-4 border-l-orange-400", dot: "bg-orange-400" },
  error: { bg: "bg-red-50", border: "border-l-4 border-l-red-500", dot: "bg-red-500" },
  info: { bg: "bg-blue-50", border: "border-l-4 border-l-blue-400", dot: "bg-blue-400" },
};

const TYPE_LABELS: Record<string, string> = {
  success: "Aprovação",
  warning: "Atenção",
  error: "Reprovação",
  info: "Informação",
};

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: 1 as const } : n))
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
    if (!confirm("Deseja excluir esta notificação?")) return;
    setDeletingId(id);
    try {
      await deleteNotification(id);
      const removed = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (removed && !removed.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  };

  const displayed =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-ubuntu">
      <Header />
      <main className="max-w-[800px] mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-ubuntu font-bold text-3xl text-black">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-[#5A5858] mt-1">
                {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-[#10512D] hover:underline font-ubuntu"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-ubuntu transition-colors ${
                filter === f
                  ? "bg-white text-[#10512D] font-medium shadow-sm"
                  : "text-[#5A5858] hover:text-[#333]"
              }`}
            >
              {f === "all" ? "Todas" : "Não lidas"}
              {f === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#10512D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 font-ubuntu mb-4">{error}</p>
            <button onClick={fetchNotifications} className="bg-[#10512D] text-white px-4 py-2 rounded">
              Tentar novamente
            </button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <svg className="w-16 h-16 text-[#CCC] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="font-ubuntu text-xl text-[#5A5858]">
              {filter === "unread" ? "Nenhuma notificação não lida." : "Nenhuma notificação."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((notif) => {
              const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
              const isDeleting = deletingId === notif.id;
              return (
                <div
                  key={notif.id}
                  className={`rounded-lg border border-[#EEE] overflow-hidden transition-opacity ${
                    notif.read ? "opacity-70" : ""
                  } ${style.bg} ${style.border}`}
                >
                  <div className="p-4 flex items-start gap-3">
                    {/* Unread dot */}
                    <div className="mt-1.5 shrink-0">
                      {!notif.read ? (
                        <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-transparent" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-ubuntu text-[#333]">{notif.message}</p>
                          {notif.project_title && (
                            <p className="text-xs text-[#5A5858] mt-1">
                              Projeto:{" "}
                              {notif.project_id ? (
                                <Link
                                  to={`/projetos/${notif.project_id}`}
                                  className="text-[#10512D] hover:underline"
                                >
                                  {notif.project_title}
                                </Link>
                              ) : (
                                notif.project_title
                              )}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs font-ubuntu px-2 py-0.5 rounded-full ${style.bg} font-medium`}>
                              {TYPE_LABELS[notif.type] || notif.type}
                            </span>
                            <span className="text-xs text-[#999]">
                              {new Date(notif.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkRead(notif.id)}
                              className="p-1.5 rounded hover:bg-white/50 text-[#5A5858]"
                              title="Marcar como lida"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notif.id)}
                            disabled={isDeleting}
                            className="p-1.5 rounded hover:bg-red-100 text-[#5A5858] hover:text-red-600 disabled:opacity-50"
                            title="Excluir notificação"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
