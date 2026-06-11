import { useState, useEffect, KeyboardEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { getProject, updateProject, submitProject } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { KNOWLEDGE_AREAS } from "@shared/api";

export default function GeneralInfo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [objectives, setObjectives] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [knowledgeArea, setKnowledgeArea] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [schedule, setSchedule] = useState("");
  const [resources, setResources] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(!!projectId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    setLoadingProject(true);
    getProject(projectId)
      .then((project) => {
        setObjectives(project.objectives || "");
        setDescription(project.description || "");
        setImpact(project.impact || "");
        setKnowledgeArea(project.area || "");
        setKeywords(Array.isArray(project.keywords) ? project.keywords : []);
        setSchedule(project.schedule || "");
        setResources(project.resources || "");
      })
      .catch(() => setError("Não foi possível carregar o projeto."))
      .finally(() => setLoadingProject(false));
  }, [projectId]);

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw) && keywords.length < 10) {
      setKeywords((prev) => [...prev, kw]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (idx: number) => {
    setKeywords((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSave = async (andSubmit = false) => {
    if (!projectId) {
      setError("ID do projeto não encontrado. Volte ao passo anterior.");
      return;
    }
    if (andSubmit && !description.trim()) {
      setError("A descrição é obrigatória para enviar o projeto para avaliação.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await updateProject(projectId, {
        objectives: objectives.trim() || undefined,
        description: description.trim() || undefined,
        impact: impact.trim() || undefined,
        area: knowledgeArea || undefined,
        keywords,
        schedule: schedule.trim() || undefined,
        resources: resources.trim() || undefined,
      });

      if (andSubmit) {
        await submitProject(projectId);
      }

      navigate("/meus-projetos");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar projeto.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-white font-ubuntu">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#10512D] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-white font-ubuntu">
        <Header />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] py-16 text-center">
          <p className="text-[#5A5858] mb-4">Nenhum projeto em andamento. Inicie pelo primeiro passo.</p>
          <Link to="/novo-projeto" className="bg-[#008000] text-white font-ubuntu px-6 py-2.5 rounded hover:bg-green-800">
            Começar do início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-ubuntu">
      <Header />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] py-8">
        <h1 className="font-ubuntu font-bold text-3xl sm:text-[36px] text-black">
          Informações Gerais do Projeto
        </h1>
        <p className="font-ubuntu text-lg sm:text-[20px] text-[#5A5858] mt-2">
          Passo 2 de 2 — Complete as informações gerais
        </p>

        {/* Tab bar */}
        <div className="mt-8 rounded border border-[#CCC] bg-[rgba(204,204,204,0.80)] px-4 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 min-h-[67px]">
          <div className="flex items-center">
            <Link
              to="/meus-projetos"
              className="font-ubuntu text-[20px] text-[#5A5858]/60 px-4 py-4 sm:py-0 hover:opacity-100 transition-opacity"
            >
              Meus Projetos
            </Link>
            <span className="font-ubuntu text-[20px] font-semibold text-[#5A5858] px-4 py-4 sm:py-0">
              Novo Projeto
            </span>
          </div>
          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-[#5A5858]">
            <Link to={`/novo-projeto?id=${projectId}`} className="flex items-center gap-1 hover:underline">
              <span className="w-6 h-6 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-xs">✓</span>
              <span>Detalhes</span>
            </Link>
            <svg className="w-4 h-4 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="w-6 h-6 rounded-full bg-[#10512D] text-white flex items-center justify-center font-bold text-xs">2</span>
            <span className="font-medium text-[#10512D]">Informações Gerais</span>
          </div>
        </div>

        <div className="border border-[#CCC] rounded-lg mt-1 bg-white px-4 sm:px-8 lg:px-[50px] py-8 lg:py-10">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <h2 className="font-ubuntu font-bold text-2xl sm:text-[32px] text-black mb-8">
            Informações Gerais
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            {/* Objectives */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Objetivos
              </label>
              <textarea
                placeholder="Descreva os objetivos principais do projeto"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                maxLength={2000}
                className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D] resize-none h-[120px]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Descrição
              </label>
              <textarea
                placeholder="Descreva o projeto detalhadamente"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={4000}
                className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D] resize-none h-[120px]"
              />
            </div>

            {/* Impact */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Impacto Esperado
              </label>
              <textarea
                placeholder="Descreva o impacto esperado do projeto na comunidade"
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                maxLength={2000}
                className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D] resize-none h-[120px]"
              />
            </div>

            {/* Knowledge area */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Área de Conhecimento
              </label>
              <select
                value={knowledgeArea}
                onChange={(e) => setKnowledgeArea(e.target.value)}
                className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]"
              >
                <option value="">Selecione a área</option>
                {KNOWLEDGE_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Schedule */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Cronograma
              </label>
              <textarea
                placeholder="Descreva o cronograma de atividades"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                maxLength={2000}
                className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D] resize-none h-[120px]"
              />
            </div>

            {/* Resources */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Recursos Necessários
              </label>
              <textarea
                placeholder="Liste os recursos humanos, materiais e financeiros"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                maxLength={2000}
                className="w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D] resize-none h-[120px]"
              />
            </div>
          </div>

          {/* Keywords */}
          <div className="mt-8">
            <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-4">
              Palavras-chave
            </label>
            <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full font-ubuntu text-sm"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(i)}
                    className="text-green-700 hover:text-green-900 font-bold leading-none"
                    aria-label={`Remover ${kw}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {keywords.length === 0 && (
                <span className="text-sm text-[#5A5858]/60 font-ubuntu self-center">
                  Nenhuma palavra-chave adicionada
                </span>
              )}
            </div>
            {keywords.length < 10 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Digite uma palavra-chave e pressione Enter"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  maxLength={50}
                  className="flex-1 border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  disabled={!newKeyword.trim()}
                  className="flex items-center justify-center gap-2 px-6 h-[49px] border border-[#CCC] rounded bg-white font-ubuntu text-base text-[#5A5858] hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-10">
            <Link
              to={`/novo-projeto?id=${projectId}`}
              className="flex items-center justify-center gap-2 border border-[#CCC] bg-white rounded h-[43px] min-w-[160px] font-ubuntu text-[18px] text-black hover:bg-gray-50 transition-colors px-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={loading}
                className="border border-[#CCC] bg-white rounded h-[43px] min-w-[200px] font-ubuntu text-[18px] text-black hover:bg-gray-50 disabled:opacity-60 transition-colors px-6"
              >
                {loading ? "Salvando..." : "Salvar como Rascunho"}
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={loading}
                className="bg-[#008000] text-white rounded h-[43px] min-w-[220px] font-ubuntu text-[18px] hover:bg-green-800 disabled:opacity-60 transition-colors px-6"
              >
                {loading ? "Enviando..." : "Salvar e Enviar para Avaliação"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
