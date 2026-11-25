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
                done && "bg-white/20 text-white",
                active && "bg-ipe text-tinta ring-4 ring-ipe/25",
                !done &&
                  !active &&
                  "bg-white/10 text-white/60 ring-1 ring-white/20",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : step}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-semibold text-white" : "text-white/70",
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
            {index > 0 && <span className="h-px w-8 bg-white/30" aria-hidden />}
            {done && detailsHref ? (
              <Link
                to={detailsHref}
                className="flex items-center gap-2 rounded-full underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ipe/60"
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
