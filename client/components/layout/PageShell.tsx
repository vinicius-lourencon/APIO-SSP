import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

/**
 * Estrutura comum das páginas autenticadas.
 * A faixa verde do topo reúne o cabeçalho e o `hero` (título, voltar, etapas);
 * o conteúdo sobe um pouco por cima da faixa para as duas partes se ligarem.
 */
export function PageShell({
  children,
  hero,
  width = "max-w-5xl",
}: {
  children: ReactNode;
  hero?: ReactNode;
  width?: string;
}) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="fundo-vivo min-h-screen overflow-x-clip font-sans text-tinta">
          <div className="faixa text-white">
            <Header />
            <div
              className={cn(
                "mx-auto px-4 sm:px-8",
                width,
                hero ? "pb-20 pt-8 sm:pb-24 sm:pt-10" : "pb-16",
              )}
            >
              {hero}
            </div>
          </div>
          <main
            className={cn(
              "relative mx-auto px-4 pb-24 sm:px-8",
              width,
              hero ? "-mt-12 sm:-mt-14" : "-mt-10",
            )}
          >
            {children}
          </main>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

/** Título da página, pensado para ficar sobre a faixa verde */
export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <m.div
      className="flex flex-wrap items-end justify-between gap-4"
      {...fadeUp()}
    >
      <div className="min-w-0">
        <h1 className="text-[2rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[2.75rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-[60ch] text-base text-white/80 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </m.div>
  );
}

export {
  accentButton,
  fieldClass,
  primaryButton,
  secondaryButton,
  surface,
} from "@/lib/styles";
