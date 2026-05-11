import { Link } from "react-router-dom";

const LOGO_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/ed1ee9a31b22bdde676872eef7ab1779ba3043b1?width=124";
const USER_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/2b1f027b183eac34a0782d4010d0eb328f426ce0?width=48";
const DOCUMENT_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/a0aec7389b59c267fe9e6cb147a75e605ac97963?width=96";
const MESSAGE_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/b11315d687ab21b3c4960c51d262f62987703b07?width=72";
const DOWNLOAD_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/ab3bbb27845bb6cec3d3201f9fda6ce46f5a801a?width=50";
const CHECK_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/4285bdb98890ed76c01d1bc5201a852a17aba661?width=38";

interface Project {
  id: number;
  title: string;
  status: "Aprovado" | "Em Análise" | "Ajustes Solicitados" | "Rejeitado";
  submissionDate: string;
  professor: string;
  progress: number;
  feedback?: string;
  canDownload?: boolean;
  canAdjust?: boolean;
}

const projects: Project[] = [
  {
    id: 1,
    title: "Projeto de Alfabetização Digital para Idosos",
    status: "Aprovado",
    submissionDate: "14/01/2025",
    professor: "Prof. Maria Silva",
    progress: 100,
    feedback: "Excelente proposta! O projeto demonstra grande potencial de impacto social.",
  },
  {
    id: 2,
    title: "Horta Comunitária Sustentável",
    status: "Em Análise",
    submissionDate: "19/01/2025",
    professor: "Prof. João Santos",
    progress: 60,
  },
  {
    id: 3,
    title: "Aplicativo de Mobilidade Urbana",
    status: "Ajustes Solicitados",
    submissionDate: "09/01/2025",
    professor: "Prof. Ana Costa",
    progress: 40,
    feedback:
      "O projeto tem boa base, mas precisa de uma documentação mais detalhada.",
    canAdjust: true,
  },
  {
    id: 4,
    title: "Programa de Mentoria Acadêmica",
    status: "Rejeitado",
    submissionDate: "04/01/2025",
    professor: "Prof. Carlos Lima",
    progress: 0,
    feedback:
      "Infelizmente o projeto não atende aos critérios de extensão estabelecidos. Sugiro reformular a proposta.",
  },
];

const statusColors: Record<Project["status"], { bg: string; text: string; icon?: string }> = {
  Aprovado: { bg: "bg-green-100", text: "text-green-600" },
  "Em Análise": { bg: "bg-yellow-100", text: "text-yellow-600" },
  "Ajustes Solicitados": { bg: "bg-orange-100", text: "text-orange-600" },
  Rejeitado: { bg: "bg-red-100", text: "text-red-600" },
};

const statusIcons: Record<Project["status"], string> = {
  Aprovado: "✓",
  "Em Análise": "⏱",
  "Ajustes Solicitados": "⚠",
  Rejeitado: "✕",
};

export default function MyProjects() {
  const total = projects.length;
  const approved = projects.filter((p) => p.status === "Aprovado").length;
  const inAnalysis = projects.filter((p) => p.status === "Em Análise").length;
  const pending = projects.filter((p) => p.status === "Ajustes Solicitados").length;

  return (
    <div className="min-h-screen bg-white font-ubuntu">
      {/* ── Header ── */}
      <header className="bg-white border-b border-[#CCC] sticky top-0 z-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] h-[99px] flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <img src={LOGO_URL} alt="SISAPA logo" className="w-[62px] h-[62px] object-contain" />
            <span className="text-[#10512D] font-ubuntu font-bold text-xl leading-none">
              SISAPA
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="font-ubuntu text-base text-[#5A5858] hover:text-[#10512D]">
              Área do Estudante
            </a>
          </nav>

          {/* User area */}
          <div className="flex items-center gap-3 shrink-0">
            <img src={USER_ICON_URL} alt="user" className="w-6 h-6 object-contain" />
            <span className="hidden sm:block font-kumbh font-semibold text-sm text-[#5A5858]">
              João da Silva
            </span>
            <button className="border border-[#CCC] bg-white rounded px-4 py-2 font-kumbh font-semibold text-sm text-black hover:bg-gray-50">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] py-8">
        {/* Title */}
        <h1 className="font-ubuntu font-bold text-3xl sm:text-[36px] text-black">
          Meus Projetos de Extensão
        </h1>
        <p className="font-ubuntu font-normal text-lg sm:text-[20px] text-[#5A5858] mt-2">
          Gerencie seus projetos e acompanhe o status de avaliação
        </p>

        {/* ── Tab bar ── */}
        <div className="mt-8 rounded border border-[#CCC] bg-[rgba(204,204,204,0.80)] px-4 sm:px-6 py-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 min-h-[67px]">
          <button className="font-ubuntu text-[20px] text-[#5A5858] px-4 py-4 sm:py-0">
            Meus Projetos
          </button>
          <Link
            to="/"
            className="font-ubuntu text-[20px] text-[#5A5858]/60 px-4 py-4 sm:py-0 opacity-60 hover:opacity-100"
          >
            Novo Projeto
          </Link>

          {/* Search */}
          <div className="border border-[#CCC] bg-white rounded flex items-center px-3 h-[49px] w-full sm:w-80 lg:w-[400px]">
            <svg
              className="w-4 h-4 text-[#5A5858] opacity-50 mr-2 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar projeto..."
              className="w-full outline-none font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-transparent"
            />
          </div>
        </div>

        {/* ── Status Cards ── */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-[#CCC] rounded p-6 bg-white">
            <p className="font-ubuntu text-[20px] text-[#5A5858] mb-3">Total</p>
            <p className="font-ubuntu text-4xl font-bold text-black">{total}</p>
            <img src={DOCUMENT_ICON_URL} alt="document" className="w-12 h-12 mt-3 opacity-30" />
          </div>
          <div className="border border-[#CCC] rounded p-6 bg-white">
            <p className="font-ubuntu text-[20px] text-[#5A5858] mb-3">Aprovados</p>
            <p className="font-ubuntu text-4xl font-bold text-green-600">{approved}</p>
            <svg className="w-6 h-6 mt-3 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
          <div className="border border-[#CCC] rounded p-6 bg-white">
            <p className="font-ubuntu text-[20px] text-[#5A5858] mb-3">Em Análise</p>
            <p className="font-ubuntu text-4xl font-bold text-yellow-500">{inAnalysis}</p>
            <svg className="w-6 h-6 mt-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8m3.5-9c.8 0 1.5-.7 1.5-1.5S16.3 8 15.5 8 14 8.7 14 9.5s.7 1.5 1.5 1.5m-7 0c.8 0 1.5-.7 1.5-1.5S9.3 8 8.5 8 7 8.7 7 9.5 7.7 11 8.5 11m3.5 6.5c2.3 0 4.3-1.5 5-3.7H6c.7 2.2 2.7 3.7 5 3.7z" />
            </svg>
          </div>
          <div className="border border-[#CCC] rounded p-6 bg-white">
            <p className="font-ubuntu text-[20px] text-[#5A5858] mb-3">Pendentes</p>
            <p className="font-ubuntu text-4xl font-bold text-orange-500">{pending}</p>
            <svg className="w-6 h-6 mt-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
          </div>
        </div>

        {/* ── Projects List ── */}
        <div className="mt-8 border border-[#CCC] rounded bg-white">
          <div className="divide-y divide-[#CCC]">
            {projects.map((project) => (
              <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-ubuntu font-bold text-2xl sm:text-[32px] text-black mb-2">
                      {project.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[#5A5858]">
                      <span className="flex items-center gap-2 font-ubuntu text-base">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                        </svg>
                        Enviado em {project.submissionDate}
                      </span>
                      <span className="flex items-center gap-2 font-ubuntu text-base">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        {project.professor}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-ubuntu font-medium whitespace-nowrap ${
                        statusColors[project.status].bg
                      } ${statusColors[project.status].text}`}
                    >
                      {project.status === "Aprovado" && "✓ "}
                      {project.status === "Em Análise" && "⏱ "}
                      {project.status === "Ajustes Solicitados" && "⚠ "}
                      {project.status === "Rejeitado" && "✕ "}
                      {project.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <p className="font-ubuntu text-base text-[#5A5858] mb-2">Progresso da Avaliação</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-black h-2.5 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="text-right text-[#5A5858] font-ubuntu text-sm mt-1">
                    {project.progress}%
                  </p>
                </div>

                {/* Feedback */}
                {project.feedback && (
                  <div className="mb-4 flex gap-3">
                    <img src={MESSAGE_ICON_URL} alt="feedback" className="w-9 h-9 flex-shrink-0" />
                    <div>
                      <p className="font-ubuntu font-medium text-black">Feedback do Professor</p>
                      <p className="font-ubuntu text-base text-[#5A5858] mt-1">{project.feedback}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button className="flex items-center justify-center gap-2 px-4 py-2 border border-[#CCC] bg-white rounded font-ubuntu text-base text-black hover:bg-gray-50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar Projeto
                  </button>
                  {project.canAdjust && (
                    <button className="px-4 py-2 bg-[#008000] text-white rounded font-ubuntu text-base hover:bg-green-800">
                      Enviar Ajustes
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
