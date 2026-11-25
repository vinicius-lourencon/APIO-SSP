import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_THEME,
  TRAIL_STOPS,
  currentStopLabel,
  trailIndex,
  type NextStep,
} from "@/lib/status-theme";
import type { ProjectStatus } from "@shared/api";

/**
 * Trilha visual do projeto: Rascunho → Enviado → Em análise → Resultado.
 * Substitui a barra de porcentagem por algo que diz em que etapa o projeto está.
 */
export function ProjectTrail({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const current = trailIndex(status);
  const theme = STATUS_THEME[status];
  const finished = status === "aprovado" || status === "reprovado";

  return (
    <ol
      className={cn("grid grid-cols-4", className)}
      aria-label="Etapas do projeto"
    >
      {TRAIL_STOPS.map((label, index) => {
        const done =
          index < current ||
          (finished && index === current && status === "aprovado");
        const active = index === current;
        const shownLabel = active ? (currentStopLabel(status) ?? label) : label;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="relative flex flex-col items-center gap-2 text-center"
          >
            {/* trilho entre as paradas */}
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute right-1/2 top-[9px] h-[3px] w-full",
                  index <= current ? "bg-folha" : "bg-linha",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-[21px] w-[21px] items-center justify-center rounded-full",
                active
                  ? cn(
                      theme.dot,
                      "ring-4 ring-white shadow-[0_0_0_6px_rgb(0_0_0/0.04)]",
                    )
                  : done
                    ? "bg-folha"
                    : "border-2 border-linha bg-white",
              )}
            >
              {done && !active && (
                <Check
                  className="h-3 w-3 text-white"
                  strokeWidth={3}
                  aria-hidden
                />
              )}
              {active && status === "aprovado" && (
                <Check
                  className="h-3 w-3 text-white"
                  strokeWidth={3}
                  aria-hidden
                />
              )}
              {active && status !== "aprovado" && (
                <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
              )}
            </span>
            <span
              className={cn(
                "text-[0.75rem] leading-tight",
                active
                  ? cn("font-semibold", theme.text)
                  : done
                    ? "text-apoio"
                    : "text-fraco",
              )}
            >
              {shownLabel}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Frase de "próximo passo"; destaca em amarelo quando é a vez de quem está vendo */
export function NextStepNote({
  step,
  className,
}: {
  step: NextStep;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm",
        step.yourTurn
          ? "bg-ipe-claro text-tinta ring-1 ring-inset ring-ipe/40"
          : step.tone === "success"
            ? "bg-folha-claro font-medium text-mata"
            : step.tone === "danger"
              ? "bg-red-50 text-red-700"
              : "bg-[#E6F3E9] text-mata-escuro",
        className,
      )}
    >
      {step.yourTurn && (
        <span className="mt-px shrink-0 rounded-full bg-ipe px-2 py-0.5 text-[0.7rem] font-bold text-tinta">
          Sua vez
        </span>
      )}
      <span className={step.yourTurn ? "font-medium" : undefined}>
        {step.text}
      </span>
    </p>
  );
}
