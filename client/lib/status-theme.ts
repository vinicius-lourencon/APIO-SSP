import {
  BadgeCheck,
  FileText,
  Hourglass,
  PencilLine,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Project, ProjectStatus } from "@shared/api";
import { professorLabel } from "@shared/api";

/** Cores de cada status (só apresentação; as regras continuam no back-end) */
export const STATUS_THEME: Record<
  ProjectStatus,
  {
    badge: string;
    dot: string;
    stripe: string;
    soft: string;
    text: string;
    wash: string;
    tile: string;
    icon: string;
    solid: string;
  }
> = {
  rascunho: {
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
    stripe: "bg-slate-300",
    soft: "bg-slate-50",
    text: "text-slate-700",
    wash: "from-slate-200/70",
    tile: "bg-slate-50 ring-slate-200",
    icon: "bg-slate-500 text-white",
    solid: "from-slate-500 to-slate-600 text-white",
  },
  submetido: {
    badge: "bg-sky-50 text-sky-800 ring-sky-200",
    dot: "bg-sky-500",
    stripe: "bg-sky-500",
    soft: "bg-sky-50",
    text: "text-sky-800",
    wash: "from-sky-100",
    tile: "bg-sky-50 ring-sky-200",
    icon: "bg-sky-500 text-white",
    solid: "from-sky-500 to-sky-600 text-white",
  },
  em_analise: {
    badge: "bg-ipe-claro text-ipe-escuro ring-ipe/40",
    dot: "bg-ipe",
    stripe: "bg-ipe",
    soft: "bg-ipe-claro",
    text: "text-ipe-escuro",
    wash: "from-[#FFEDB0]",
    tile: "bg-ipe-claro ring-ipe/40",
    icon: "bg-ipe text-tinta",
    solid: "from-[#FFD23F] to-[#F2A900] text-tinta",
  },
  ajustes_solicitados: {
    badge: "bg-orange-50 text-orange-800 ring-orange-200",
    dot: "bg-orange-500",
    stripe: "bg-orange-500",
    soft: "bg-orange-50",
    text: "text-orange-800",
    wash: "from-orange-100",
    tile: "bg-orange-50 ring-orange-200",
    icon: "bg-orange-500 text-white",
    solid: "from-[#FB8A3C] to-[#EA580C] text-white",
  },
  aprovado: {
    badge: "bg-folha-claro text-mata ring-folha/40",
    dot: "bg-folha",
    stripe: "bg-folha",
    soft: "bg-folha-claro",
    text: "text-mata",
    wash: "from-[#CDEFDB]",
    tile: "bg-folha-claro ring-folha/40",
    icon: "bg-folha text-white",
    solid: "from-[#2EA866] to-[#1F8F52] text-white",
  },
  reprovado: {
    badge: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
    stripe: "bg-red-500",
    soft: "bg-red-50",
    text: "text-red-700",
    wash: "from-red-100",
    tile: "bg-red-50 ring-red-200",
    icon: "bg-red-500 text-white",
    solid: "from-red-500 to-red-600 text-white",
  },
};

export const STATUS_ICONS: Record<ProjectStatus, LucideIcon> = {
  rascunho: FileText,
  submetido: Send,
  em_analise: Hourglass,
  ajustes_solicitados: PencilLine,
  aprovado: BadgeCheck,
  reprovado: XCircle,
};

/** As quatro paradas que o aluno e o professor enxergam na trilha */
export const TRAIL_STOPS = ["Rascunho", "Enviado", "Em análise", "Resultado"];

export function trailIndex(status: ProjectStatus): number {
  switch (status) {
    case "rascunho":
      return 0;
    case "submetido":
      return 1;
    case "em_analise":
    case "ajustes_solicitados":
      return 2;
    default:
      return 3;
  }
}

/** Nome da parada atual quando ela difere do nome padrão */
export function currentStopLabel(status: ProjectStatus): string | null {
  if (status === "ajustes_solicitados") return "Ajustes pedidos";
  if (status === "aprovado") return "Aprovado";
  if (status === "reprovado") return "Não aprovado";
  return null;
}

export interface NextStep {
  text: string;
  /** true quando quem está vendo é quem precisa agir */
  yourTurn: boolean;
  tone?: "success" | "danger";
}

/** Frase curta dizendo o que acontece agora com o projeto */
export function nextStep(
  project: Pick<Project, "status" | "professor_id" | "professor_name">,
  viewer: { role?: string; id?: number } | null | undefined,
): NextStep {
  const isProfessor = viewer?.role === "professor";
  const isMine = isProfessor && project.professor_id === viewer?.id;
  const evaluator = project.professor_name
    ? professorLabel(project.professor_name)
    : "O avaliador";

  if (isProfessor) {
    switch (project.status) {
      case "submetido":
        return project.professor_id
          ? { text: "Aguardando o avaliador.", yourTurn: false }
          : {
              text: "Disponível. Assuma para começar a avaliar.",
              yourTurn: true,
            };
      case "em_analise":
        return isMine
          ? { text: "Aguardando o seu parecer.", yourTurn: true }
          : { text: `${evaluator} está avaliando.`, yourTurn: false };
      case "ajustes_solicitados":
        return {
          text: "Aguardando o aluno fazer os ajustes.",
          yourTurn: false,
        };
      case "aprovado":
      case "reprovado":
        return { text: "Avaliação concluída.", yourTurn: false };
      default:
        return { text: "Ainda em rascunho.", yourTurn: false };
    }
  }

  switch (project.status) {
    case "rascunho":
      return {
        text: "Complete as informações e envie para avaliação.",
        yourTurn: true,
      };
    case "submetido":
      return {
        text: "Enviado. Aguardando um professor assumir a avaliação.",
        yourTurn: false,
      };
    case "em_analise":
      return { text: `${evaluator} está avaliando.`, yourTurn: false };
    case "ajustes_solicitados":
      return {
        text: "Faça os ajustes pedidos e reenvie para avaliação.",
        yourTurn: true,
      };
    case "aprovado":
      return {
        text: "Projeto aprovado. Parabéns!",
        yourTurn: false,
        tone: "success",
      };
    case "reprovado":
      return {
        text: "Projeto não aprovado. Leia o parecer do avaliador.",
        yourTurn: false,
        tone: "danger",
      };
  }
}
