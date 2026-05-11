import { useState, useRef } from "react";
import { Link } from "react-router-dom";

type Tab = "meus-projetos" | "novo-projeto";

const LOGO_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/ed1ee9a31b22bdde676872eef7ab1779ba3043b1?width=124";
const USER_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/2b1f027b183eac34a0782d4010d0eb328f426ce0?width=48";
const CHEVRON_DOWN_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/560802e90b02771944b7ee22c5cd82aeadd8c486?width=60";
const UPLOAD_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/a9c5dbc6a82f4a9fcd563fb584b42dd85e6ab8a9?width=96";
const FILE_UP_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/4f3043d355dbf59896a7dc8dffc419b6e886fe55?width=96";

const mockProjects = [
  {
    id: 1,
    title: "Projeto Saúde Comunitária",
    type: "Congresso científico",
    status: "Em avaliação",
    date: "10/03/2025",
  },
  {
    id: 2,
    title: "Alfabetização Digital para Idosos",
    type: "Projeto de extensão",
    status: "Aprovado",
    date: "20/01/2025",
  },
];

const statusColor: Record<string, string> = {
  "Em avaliação": "bg-yellow-100 text-yellow-800",
  Aprovado: "bg-green-100 text-green-800",
  Rascunho: "bg-gray-100 text-gray-700",
  Reprovado: "bg-red-100 text-red-800",
};

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("novo-projeto");
  const [search, setSearch] = useState("");
  const [proposalType, setProposalType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [knowledgeArea, setKnowledgeArea] = useState("");
  const [file1Name, setFile1Name] = useState<string | null>(null);
  const [file2Name, setFile2Name] = useState<string | null>(null);
  const [drag1, setDrag1] = useState(false);
  const [drag2, setDrag2] = useState(false);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  const handleFile1 = (f: File | null) => {
    if (f) setFile1Name(f.name);
  };
  const handleFile2 = (f: File | null) => {
    if (f) setFile2Name(f.name);
  };

  return (
    <div className="min-h-screen bg-white font-ubuntu">
      {/* ── Header ── */}
      <header className="bg-white border-b border-[#CCC] sticky top-0 z-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[83px] h-[99px] flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <img src={LOGO_URL} alt="SISAPA logo" className="w-[62px] h-[62px] object-contain" />
            <span className="text-[#10512D] font-ubuntu font-bold text-xl leading-none">
              SISAPA
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#"
              className="font-ubuntu text-base text-[#5A5858] hover:text-[#10512D] transition-colors"
            >
              Área do Estudante
            </a>
          </nav>

          {/* User area */}
          <div className="flex items-center gap-3 shrink-0">
            <img src={USER_ICON_URL} alt="user" className="w-6 h-6 object-contain" />
            <span className="hidden sm:block font-kumbh font-semibold text-sm text-[#5A5858]">
              João da Silva
            </span>
            <button className="border border-[#CCC] bg-white rounded px-4 py-2 font-kumbh font-semibold text-sm text-black hover:bg-gray-50 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] py-8">
        {/* Title */}
        <h1 className="font-ubuntu font-bold text-3xl sm:text-[36px] text-black leading-tight">
          Meus Projetos de Extensão
        </h1>
        <p className="font-ubuntu font-normal text-lg sm:text-[20px] text-[#5A5858] mt-2">
          Gerencie seus projetos e acompanhe o status de avaliação
        </p>

        {/* ── Tab bar ── */}
        <div className="mt-8 rounded border border-[#CCC] bg-[rgba(204,204,204,0.80)] px-4 sm:px-6 py-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 min-h-[67px]">
          <div className="flex items-center">
            <Link
              to="/meus-projetos"
              className="font-ubuntu text-[20px] text-[#5A5858]/60 px-4 py-4 sm:py-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              Meus Projetos
            </Link>
            <button
              onClick={() => setActiveTab("novo-projeto")}
              className={`font-ubuntu text-[20px] text-[#5A5858] px-4 py-4 sm:py-0 transition-opacity ${
                activeTab === "novo-projeto" ? "font-medium opacity-100" : "opacity-60"
              }`}
            >
              Novo Projeto
            </button>
          </div>

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-transparent"
            />
          </div>
        </div>

        {/* ── Tab: Meus Projetos ── */}
        {activeTab === "meus-projetos" && (
          <div className="border border-[#CCC] rounded mt-1 bg-white">
            {mockProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <svg className="w-16 h-16 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-ubuntu text-xl text-[#5A5858]">Nenhum projeto encontrado.</p>
                <button
                  onClick={() => setActiveTab("novo-projeto")}
                  className="mt-2 bg-[#008000] text-white font-ubuntu text-base px-6 py-2 rounded hover:bg-green-800 transition-colors"
                >
                  Criar novo projeto
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#CCC] bg-[#F9F9F9]">
                      <th className="text-left font-ubuntu font-medium text-[#5A5858] text-base px-6 py-4">
                        Título
                      </th>
                      <th className="text-left font-ubuntu font-medium text-[#5A5858] text-base px-6 py-4 hidden md:table-cell">
                        Tipo
                      </th>
                      <th className="text-left font-ubuntu font-medium text-[#5A5858] text-base px-6 py-4 hidden sm:table-cell">
                        Data
                      </th>
                      <th className="text-left font-ubuntu font-medium text-[#5A5858] text-base px-6 py-4">
                        Status
                      </th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {mockProjects
                      .filter((p) =>
                        p.title.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((project) => (
                        <tr key={project.id} className="border-b border-[#CCC] last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-ubuntu text-base text-[#5A5858]">
                            {project.title}
                          </td>
                          <td className="px-6 py-4 font-ubuntu text-base text-[#5A5858] hidden md:table-cell">
                            {project.type}
                          </td>
                          <td className="px-6 py-4 font-ubuntu text-base text-[#5A5858] hidden sm:table-cell">
                            {project.date}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-ubuntu font-medium ${
                                statusColor[project.status] ?? "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {project.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="font-ubuntu text-sm text-[#10512D] hover:underline">
                              Ver detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Novo Projeto ── */}
        {activeTab === "novo-projeto" && (
          <div className="border border-[#CCC] rounded mt-1 bg-white px-4 sm:px-8 lg:px-[50px] py-8 lg:py-10">
            {/* Detalhes Específicos */}
            <h2 className="font-ubuntu font-bold text-2xl sm:text-[32px] text-black mb-8">
              Detalhes Específicos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Tipos de proposta */}
              <div>
                <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                  Tipos de proposta
                </label>
                <div className="relative">
                  <select
                    value={proposalType}
                    onChange={(e) => setProposalType(e.target.value)}
                    className="w-full appearance-none border border-[#CCC] rounded h-[38px] px-3 pr-10 font-ubuntu text-base text-[#5A5858] bg-white focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                  >
                    <option value="" disabled>
                      Congresso científico
                    </option>
                    <option value="congresso">Congresso científico</option>
                    <option value="extensao">Projeto de extensão</option>
                    <option value="pesquisa">Pesquisa</option>
                    <option value="curso">Curso</option>
                    <option value="evento">Evento</option>
                  </select>
                  <img
                    src={CHEVRON_DOWN_URL}
                    alt=""
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-[30px] h-[30px] opacity-60"
                  />
                </div>
              </div>

              {/* Público Álvo */}
              <div>
                <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                  Publico Álvo
                </label>
                <input
                  type="text"
                  placeholder="Ex: crianças, idosos, comunidade local"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full border border-[#CCC] rounded h-[39px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                />
              </div>

              {/* Duração Prevista */}
              <div>
                <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                  Duração Prevista
                </label>
                <input
                  type="text"
                  placeholder="Duração prevista para a proposta"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-[#CCC] rounded h-[39px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                />
              </div>

              {/* Área de Conhecimento */}
              <div>
                <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                  Área de Conhecimento
                </label>
                <input
                  type="text"
                  placeholder="Insira sua área de conhecimento"
                  value={knowledgeArea}
                  onChange={(e) => setKnowledgeArea(e.target.value)}
                  className="w-full border border-[#CCC] rounded h-[38px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                />
              </div>
            </div>

            {/* Documentos */}
            <h2 className="font-ubuntu font-medium text-2xl sm:text-[32px] text-black mt-12 mb-6">
              Documentos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload box 1 */}
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && file1Ref.current?.click()}
                onClick={() => file1Ref.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag1(true); }}
                onDragLeave={() => setDrag1(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag1(false);
                  handleFile1(e.dataTransfer.files[0] ?? null);
                }}
                className={`border border-dashed rounded flex flex-col items-center justify-center gap-4 py-10 px-6 cursor-pointer select-none transition-colors ${
                  drag1 ? "border-[#10512D] bg-green-50" : "border-[#CCC] bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  ref={file1Ref}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFile1(e.target.files?.[0] ?? null)}
                />
                <img src={UPLOAD_ICON_URL} alt="" className="w-12 h-12 object-contain" />
                <p className="font-ubuntu text-[20px] text-[#5A5858] text-center leading-snug">
                  {file1Name ?? "Clique para fazer upload ou arraste arquivos aqui"}
                </p>
                <p className="font-ubuntu text-base text-[#5A5858]/60">
                  PDF, DOC, DOCX até 10MB
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); file1Ref.current?.click(); }}
                  className="border border-[#CCC] bg-white rounded h-12 px-8 font-ubuntu text-[20px] text-[#5A5858] hover:bg-gray-100 transition-colors"
                >
                  Selecionar Arquivo
                </button>
              </div>

              {/* Upload box 2 */}
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && file2Ref.current?.click()}
                onClick={() => file2Ref.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag2(true); }}
                onDragLeave={() => setDrag2(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag2(false);
                  handleFile2(e.dataTransfer.files[0] ?? null);
                }}
                className={`border border-dashed rounded flex flex-col items-center justify-center gap-4 py-10 px-6 cursor-pointer select-none transition-colors ${
                  drag2 ? "border-[#10512D] bg-green-50" : "border-[#CCC] bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  ref={file2Ref}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFile2(e.target.files?.[0] ?? null)}
                />
                <img src={FILE_UP_ICON_URL} alt="" className="w-12 h-12 object-contain" />
                <p className="font-ubuntu text-[20px] text-[#5A5858] text-center leading-snug">
                  {file2Name ?? "Upload de documento"}
                </p>
                <p className="font-ubuntu text-base text-[#5A5858]/60">
                  PDF, DOC, DOCX up to 25MB
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); file2Ref.current?.click(); }}
                  className="border border-[#CCC] bg-white rounded h-12 px-8 font-ubuntu text-[20px] text-[#5A5858] hover:bg-gray-100 transition-colors"
                >
                  Selecionar Arquivo
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-10">
              <button
                type="button"
                className="border border-[#CCC] bg-white rounded h-[43px] min-w-[230px] font-ubuntu text-[20px] text-black hover:bg-gray-50 transition-colors px-6"
              >
                Salvar Rascunho
              </button>
              <Link
                to="/informacoes-gerais"
                className="flex items-center justify-center bg-[#008000] rounded h-[43px] min-w-[230px] font-ubuntu text-[20px] text-white hover:bg-green-800 transition-colors px-6"
              >
                Próximo: Informações Gerais
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
