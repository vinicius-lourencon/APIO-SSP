import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

export function PageShell({
  children,
  width = "max-w-5xl",
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-screen overflow-x-clip bg-[#F6F8F6] font-ubuntu">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_50%,transparent)]"
            aria-hidden
          >
            <div className="absolute -left-[10%] -top-[30%] h-[70vmax] w-[70vmax] animate-blob-drift motion-reduce:animate-none bg-[radial-gradient(closest-side,rgb(16_81_45/0.13),transparent)]" />
            <div className="absolute -right-[15%] -top-[45%] h-[60vmax] w-[60vmax] animate-blob-drift motion-reduce:animate-none bg-[radial-gradient(closest-side,rgb(120_190_90/0.14),transparent)] [animation-delay:-12s]" />
          </div>
          <div className="relative">
            <Header />
            <main
              className={cn("mx-auto px-4 pb-24 pt-10 sm:px-8 sm:pt-14", width)}
            >
              {children}
            </main>
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

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
        <h1 className="text-3xl font-bold tracking-tight text-[#10231A] sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-base text-[#5A5858] sm:text-lg">{subtitle}</p>
        )}
      </div>
      {action}
    </m.div>
  );
}

export const surface =
  "rounded-2xl border border-black/5 bg-white/90 shadow-[0_1px_2px_rgb(0_0_0/0.04)]";
export const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#10512D] px-6 text-sm font-medium text-white shadow-[0_10px_24px_-14px_rgb(16_81_45/0.7)] transition-colors hover:bg-[#0c3f23] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10512D]/20 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white/80 px-5 text-sm font-medium text-[#10512D] transition-colors hover:bg-[#10512D]/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10512D]/15 disabled:cursor-not-allowed disabled:opacity-60";
export const fieldClass =
  "w-full rounded-xl border border-black/10 bg-white/90 px-4 py-2.5 text-base text-[#222] outline-none transition-shadow placeholder:text-[#8A8888] focus:border-[#10512D]/50 focus:ring-4 focus:ring-[#10512D]/10 disabled:bg-black/[0.03]";
