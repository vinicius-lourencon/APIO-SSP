import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { primaryButton, surface } from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse p-6", surface, className)} aria-hidden>
      <div className="flex items-center justify-between gap-4">
        <div className="h-5 w-1/2 rounded-full bg-black/5" />
        <div className="h-6 w-20 rounded-full bg-black/5" />
      </div>
      <div className="mt-4 h-3 w-1/3 rounded-full bg-black/5" />
      <div className="mt-6 h-2 w-full rounded-full bg-black/5" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Carregando">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 px-6 py-16 text-center",
        surface,
        "rounded-3xl",
      )}
    >
      <p role="alert" className="text-red-600">
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className={primaryButton}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 px-6 py-16 text-center",
        surface,
        "rounded-3xl",
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mata/10 text-mata">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <div>
        <p className="text-xl font-semibold text-tinta">{title}</p>
        {description && <p className="mt-1 text-apoio">{description}</p>}
      </div>
      {action}
    </div>
  );
}
