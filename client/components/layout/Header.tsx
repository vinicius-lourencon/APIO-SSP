import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getNotifications, markAllNotificationsRead } from "@/lib/api";
import type { Notification } from "@shared/api";

const LOGO_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/ed1ee9a31b22bdde676872eef7ab1779ba3043b1?width=124";

const notifTypeBg: Record<string, string> = {
  success: "bg-green-50 border-l-4 border-green-500",
  warning: "bg-orange-50 border-l-4 border-orange-400",
  error: "bg-red-50 border-l-4 border-red-400",
  info: "bg-blue-50 border-l-4 border-blue-400",
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getNotifications()
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }, [user, location.pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 as const })));
    setUnreadCount(0);
  };

  const isStudent = user?.role === "aluno";
  const isProfessor = user?.role === "professor";

  return (
    <header className="bg-white border-b border-[#CCC] sticky top-0 z-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] h-[72px] flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <img src={LOGO_URL} alt="SISAPA logo" className="w-10 h-10 object-contain" />
          <span className="text-[#10512D] font-ubuntu font-bold text-xl leading-none">SISAPA</span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {isStudent && (
            <>
              <Link
                to="/meus-projetos"
                className={`font-ubuntu text-sm transition-colors ${
                  location.pathname.startsWith("/meus-projetos") || location.pathname === "/novo-projeto"
                    ? "text-[#10512D] font-semibold"
                    : "text-[#5A5858] hover:text-[#10512D]"
                }`}
              >
                Área do Estudante
              </Link>
            </>
          )}
          {isProfessor && (
            <Link
              to="/avaliador"
              className={`font-ubuntu text-sm transition-colors ${
                location.pathname.startsWith("/avaliador")
                  ? "text-[#10512D] font-semibold"
                  : "text-[#5A5858] hover:text-[#10512D]"
              }`}
            >
              Área do Avaliador
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {/* Notifications bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((s) => !s)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Notificações"
            >
              <svg className="w-5 h-5 text-[#5A5858]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E6E6E6] rounded-lg shadow-lg z-30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEE]">
                  <span className="font-ubuntu font-semibold text-sm text-black">Notificações</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#10512D] hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[#5A5858]">
                      Nenhuma notificação.
                    </p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-[#F5F5F5] last:border-0 ${
                          n.read ? "opacity-60" : ""
                        } ${notifTypeBg[n.type] || ""}`}
                      >
                        <p className="text-sm text-[#333] font-ubuntu">{n.message}</p>
                        <p className="text-xs text-[#999] mt-1">
                          {new Date(n.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  to="/notificacoes"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center text-xs text-[#10512D] hover:underline py-2 border-t border-[#EEE]"
                >
                  Ver todas
                </Link>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative flex items-center" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((s) => !s)}
              className="flex items-center gap-2 hover:bg-gray-50 rounded px-2 py-1 transition-colors"
            >
              <div className="w-8 h-8 bg-[#10512D] text-white rounded-full flex items-center justify-center font-ubuntu font-bold text-sm">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block font-ubuntu font-medium text-sm text-[#5A5858] max-w-[120px] truncate">
                {user?.name}
              </span>
              <svg className="w-4 h-4 text-[#5A5858]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#E6E6E6] rounded-lg shadow-md z-30 overflow-hidden">
                <Link
                  to="/perfil"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#5A5858] hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Ver Perfil
                </Link>
                <Link
                  to="/notificacoes"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#5A5858] hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notificações
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full px-1.5">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <hr className="border-[#EEE]" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
