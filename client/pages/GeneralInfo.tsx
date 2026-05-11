import { useState } from "react";

const LOGO_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/ed1ee9a31b22bdde676872eef7ab1779ba3043b1?width=124";
const USER_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/2b1f027b183eac34a0782d4010d0eb328f426ce0?width=48";
const CHEVRON_DOWN_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/560802e90b02771944b7ee22c5cd82aeadd8c486?width=60";
const PLUS_ICON_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/daea9e21b833fcf90c8c7be5ec176e8f8cb7ef5a?width=56";

export default function GeneralInfo() {
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [description, setDescription] = useState("");
  const [knowledgeArea, setKnowledgeArea] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["Inovação"]);
  const [newKeyword, setNewKeyword] = useState("");

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setKeywords([...keywords, newKeyword]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

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
            <button className="border border-[#CCC] bg-white rounded px-4 py-2 font-kumbh font-semibold text-sm text-black hover:bg-gray-50 transition-colors">
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
          <div className="flex items-center">
            <button className="font-ubuntu text-[20px] text-[#5A5858]/60 px-4 py-4 sm:py-0 opacity-60 hover:opacity-100">
              Meus Projetos
            </button>
            <button className="font-ubuntu text-[20px] text-[#5A5858] px-4 py-4 sm:py-0">
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
              className="w-full outline-none font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-transparent"
            />
          </div>
        </div>

        {/* ── Form Content ── */}
        <div className="border border-[#CCC] rounded mt-1 bg-white px-4 sm:px-8 lg:px-[50px] py-8 lg:py-10">
          <h2 className="font-ubuntu font-bold text-2xl sm:text-[32px] text-black mb-8">
            Informações Gerais
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            {/* Título */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">Título</label>
              <input
                type="text"
                placeholder="Insira o Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-1 focus:ring-[#10512D]"
              />
            </div>

            {/* Objetivos */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">Objetivos</label>
              <textarea
                placeholder="Insira os objetivos"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-1 focus:ring-[#10512D] resize-none h-[120px]"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">Descrição</label>
              <textarea
                placeholder="Insira a descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-1 focus:ring-[#10512D] resize-none h-[120px]"
              />
            </div>

            {/* Área de Conhecimento */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Área de Conhecimento
              </label>
              <div className="relative">
                <select
                  value={knowledgeArea}
                  onChange={(e) => setKnowledgeArea(e.target.value)}
                  className="w-full appearance-none border border-[#CCC] rounded h-[49px] px-3 pr-10 font-ubuntu text-base text-[#5A5858] bg-white focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                >
                  <option value="">Insira sua área de conhecimento</option>
                  <option value="tech">Tecnologia</option>
                  <option value="edu">Educação</option>
                  <option value="health">Saúde</option>
                  <option value="other">Outro</option>
                </select>
                <img
                  src={CHEVRON_DOWN_URL}
                  alt=""
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-[30px] h-[30px] opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Palavras-chave */}
          <div className="mt-8">
            <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-4">
              Palavras-chave
            </label>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-2 font-ubuntu text-base"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(index)}
                    className="text-green-700 hover:text-green-900 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add keyword input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Digite uma palavra-chave"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                className="flex-1 border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-1 focus:ring-[#10512D]"
              />
              <button
                onClick={addKeyword}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-[#CCC] rounded bg-white font-ubuntu text-[20px] text-[#5A5858] hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <img src={PLUS_ICON_URL} alt="" className="w-7 h-7" />
                Adicionar Palavra-chave
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
