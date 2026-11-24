import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
      className="mb-6 inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-[#5A5858] transition-colors hover:text-[#10512D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10512D]/15"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}
