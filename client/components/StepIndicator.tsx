import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Detalhes", "Informações gerais"] as const;

export function StepIndicator({
  current,
  detailsHref,
}: {
  current: 1 | 2;
  detailsHref?: string;
}) {
  return (
    <ol className="flex items-center gap-3" aria-label="Etapas do cadastro">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        const content = (
          <>
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                done && "bg-[#10512D]/15 text-[#10512D]",
                active && "bg-[#10512D] text-white",
                !done && !active && "bg-black/5 text-[#8A8888]",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : step}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-[#10512D]" : "text-[#6B6868]",
              )}
            >
              {label}
            </span>
          </>
        );
        return (
          <li
            key={label}
            className="flex items-center gap-3"
            aria-current={active ? "step" : undefined}
          >
            {index > 0 && <span className="h-px w-6 bg-black/15" aria-hidden />}
            {done && detailsHref ? (
              <Link
                to={detailsHref}
                className="flex items-center gap-2 hover:underline"
              >
                {content}
              </Link>
            ) : (
              <span className="flex items-center gap-2">{content}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
