import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS, type ProjectStatus } from "@shared/api";

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const { bg, text } = STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium",
        bg,
        text,
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
