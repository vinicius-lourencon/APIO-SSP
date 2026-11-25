import { cn } from "@/lib/utils";
import { STATUS_THEME } from "@/lib/status-theme";
import { STATUS_LABELS, type ProjectStatus } from "@shared/api";

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const theme = STATUS_THEME[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        theme.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
