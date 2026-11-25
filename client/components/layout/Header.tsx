import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  FolderKanban,
  LogOut,
  Plus,
  User,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getNotifications, markAllNotificationsRead } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Notification } from "@shared/api";
import { firstName } from "@shared/api";

const LOGO_URL = "/logo-sisapa.png";

const NOTIFICATION_ACCENT: Record<string, string> = {
  success: "border-l-folha",
  warning: "border-l-ipe",
  error: "border-l-red-500",
  info: "border-l-blue-400",
};

const POPOVER =
  "absolute right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-linha bg-white text-tinta shadow-[0_20px_50px_-20px_rgb(0_0_0/0.25)] animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none";

function NavItem({
  to,
  active,
  icon: Icon,
  label,
}: {
  to: string;
  active: boolean;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-3 font-sans text-sm font-medium transition-colors sm:px-4",
        "relative focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ipe/60",
        active
          ? "bg-white/15 text-white after:absolute after:inset-x-4 after:-bottom-[15px] after:h-[3px] after:rounded-full after:bg-ipe"
          : "text-white/75 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

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
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
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
    <header className="border-b border-white/10">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8 lg:px-[53px]">
        <Link
          to={isProfessor ? "/avaliador" : "/meus-projetos"}
          className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ipe/60"
          aria-label="SISAPA, página inicial"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
            <img
              src={LOGO_URL}
              alt=""
              className="h-full w-full object-contain"
            />
          </span>
          <span className="hidden font-sans font-display text-xl font-bold leading-none tracking-tight text-white min-[400px]:block">
            SISAPA
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Principal">
          {isStudent && (
            <>
              <NavItem
                to="/meus-projetos"
                label="Meus projetos"
                icon={FolderKanban}
                active={location.pathname.startsWith("/meus-projetos")}
              />
              <NavItem
                to="/novo-projeto"
                label="Novo projeto"
                icon={Plus}
                active={location.pathname === "/novo-projeto"}
              />
            </>
          )}
          {isProfessor && (
            <NavItem
              to="/avaliador"
              label="Avaliações"
              icon={ClipboardCheck}
              active={location.pathname.startsWith("/avaliador")}
            />
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((s) => !s)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ipe/60"
              aria-label={
                unreadCount > 0
                  ? `Notificações, ${unreadCount} não lidas`
                  : "Notificações"
              }
              aria-expanded={notifOpen}
              aria-haspopup="true"
            >
              <Bell className="h-5 w-5 text-white" aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ipe px-1 text-[10px] font-bold text-tinta ring-2 ring-mata">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className={cn(POPOVER, "w-80 max-w-[calc(100vw-2rem)]")}>
                <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                  <span className="font-sans text-sm font-semibold text-tinta">
                    Notificações
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-mata hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-apoio">
                      Nenhuma notificação.
                    </p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "border-b border-l-4 border-b-black/5 px-4 py-3 last:border-b-0",
                          NOTIFICATION_ACCENT[n.type] ?? "border-l-transparent",
                          n.read && "opacity-60",
                        )}
                      >
                        <p className="font-sans text-sm text-tinta">
                          {n.message}
                        </p>
                        <p className="mt-1 text-xs text-fraco">
                          {new Date(n.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  to="/notificacoes"
                  onClick={() => setNotifOpen(false)}
                  className="block border-t border-black/5 py-2.5 text-center text-xs font-medium text-mata hover:bg-mata/5"
                >
                  Ver todas
                </Link>
              </div>
            )}
          </div>

          <div className="relative flex items-center" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((s) => !s)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ipe/60"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="Menu do perfil"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ipe font-sans text-sm font-bold text-tinta">
                {firstName(user?.name ?? "")
                  .charAt(0)
                  .toUpperCase()}
              </span>
              <span className="hidden max-w-[120px] truncate font-sans text-sm font-medium text-white sm:block">
                {user?.name}
              </span>
              <ChevronDown className="h-4 w-4 text-white/70" aria-hidden />
            </button>

            {profileOpen && (
              <div className={cn(POPOVER, "w-48")}>
                <Link
                  to="/perfil"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 font-sans text-sm text-apoio hover:bg-black/[0.03]"
                >
                  <User className="h-4 w-4" aria-hidden />
                  Ver perfil
                </Link>
                <Link
                  to="/notificacoes"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 font-sans text-sm text-apoio hover:bg-black/[0.03]"
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  Notificações
                  {unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 border-t border-black/5 px-4 py-3 font-sans text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
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
