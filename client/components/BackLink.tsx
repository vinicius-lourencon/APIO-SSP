import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/** Link de voltar, pensado para ficar sobre a faixa verde do topo */
export function BackLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1.5 pl-2.5 pr-3.5 text-sm font-medium text-white/90 ring-1 ring-white/15 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ipe/60"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}
