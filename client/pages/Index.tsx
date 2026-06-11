import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { createProject, updateProject, uploadFiles, getProject } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { PROPOSAL_TYPES } from "@shared/api";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    return "Formato inválido. Use PDF, DOC ou DOCX.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Arquivo muito grande. Máximo 25MB.";
  }
  return null;
}

export default function NovoProjeto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [title, setTitle] = useState("");
  const [proposalType, setProposalType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(!!editId);
  const [error, setError] = useState("");

  // Load existing project for editing
  useEffect(() => {
    if (!editId) return;
    setLoadingProject(true);
    getProject(editId)
      .then((project) => {
        setTitle(project.title || "");
        setProposalType(project.proposal_type || "");
        setTargetAudience(project.public_target || "");
        setDuration(project.duration || "");
      })
      .catch(() => {
        setError("Projeto não encontrado ou sem permissão.");
      })
      .finally(() => setLoadingProject(false));
  }, [editId]);

  const handleAddFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const errs: string[] = [];
    const valid: File[] = [];
    for (const f of arr) {
      const err = validateFile(f);
      if (err) {
        errs.push(`${f.name}: ${err}`);
      } else {
        valid.push(f);
      }
    }
    setFileErrors(errs);
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      return combined.slice(0, 2); // max 2 files
    });
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleAddFiles(e.dataTransfer.files);
  };

  const handleSave = async (andNavigateTo: "meus-projetos" | "informacoes-gerais") => {
    if (!title.trim()) {
      setError("O título do projeto é obrigatório.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let projectId = editId;

      const payload = {
        title: title.trim(),
        proposal_type: proposalType || undefined,
        public_target: targetAudience.trim() || undefined,
        duration: duration.trim() || undefined,
      };

      if (projectId) {
        await updateProject(projectId, payload);
      } else {
        const created = await createProject(payload);
        projectId = created.id;
      }

      if (files.length > 0) {
        await uploadFiles(projectId!, files);
      }

      if (andNavigateTo === "informacoes-gerais") {
        navigate(`/informacoes-gerais?id=${projectId}`);
      } else {
        navigate("/meus-projetos");
      }
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

  return (
    <div className="min-h-screen bg-white font-ubuntu">
      <Header />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] py-8">
        <h1 className="font-ubuntu font-bold text-3xl sm:text-[36px] text-black">
          {editId ? "Editar Projeto" : "Novo Projeto de Extensão"}
        </h1>
        <p className="font-ubuntu text-lg sm:text-[20px] text-[#5A5858] mt-2">
          Preencha as informações do seu projeto
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
              {editId ? "Editar Projeto" : "Novo Projeto"}
            </span>
          </div>
          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-[#5A5858]">
            <span className="w-6 h-6 rounded-full bg-[#10512D] text-white flex items-center justify-center font-bold text-xs">1</span>
            <span className="font-medium text-[#10512D]">Detalhes</span>
            <svg className="w-4 h-4 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs">2</span>
            <span>Informações Gerais</span>
          </div>
        </div>

        <div className="border border-[#CCC] rounded-lg mt-1 bg-white px-4 sm:px-8 lg:px-[50px] py-8 lg:py-10">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-8">
            <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
              Título do Projeto *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Informe o título do seu projeto"
              className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]"
            />
          </div>

          <h2 className="font-ubuntu font-bold text-2xl sm:text-[32px] text-black mb-8">
            Detalhes Específicos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Proposal type */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Tipo de Proposta
              </label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full border border-[#CCC] rounded h-[38px] px-3 font-ubuntu text-base text-[#5A5858] bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]"
              >
                <option value="">Selecione o tipo</option>
                {PROPOSAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Target audience */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Público-Alvo
              </label>
              <input
                type="text"
                maxLength={200}
                placeholder="Ex: crianças, idosos, comunidade local"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full border border-[#CCC] rounded h-[39px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block font-ubuntu text-[20px] text-[#5A5858] mb-2">
                Duração Prevista
              </label>
              <input
                type="text"
                maxLength={100}
                placeholder="Ex: 6 meses, 1 semestre"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-[#CCC] rounded h-[39px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]"
              />
            </div>
          </div>

          {/* Documents */}
          <h2 className="font-ubuntu font-medium text-2xl sm:text-[32px] text-black mt-12 mb-2">
            Documentos
          </h2>
          <p className="text-sm text-[#5A5858] mb-6">
            Faça upload de até 2 documentos (PDF, DOC, DOCX — máx. 25MB cada)
          </p>

          {fileErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm space-y-1">
              {fileErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {/* Uploaded files list */}
          {files.length > 0 && (
            <div className="mb-4 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="flex-1 text-sm font-ubuntu text-[#5A5858] truncate">{f.name}</span>
                  <span className="text-xs text-[#999]">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold ml-2"
                    aria-label="Remover arquivo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Drop zone */}
          {files.length < 2 && (
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 py-12 px-6 cursor-pointer select-none transition-colors ${
                drag
                  ? "border-[#10512D] bg-green-50"
                  : "border-[#CCC] bg-white hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleAddFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <svg className="w-12 h-12 text-[#CCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-ubuntu text-[20px] text-[#5A5858] text-center">
                Clique para selecionar ou arraste arquivos aqui
              </p>
              <p className="font-ubuntu text-sm text-[#5A5858]/60">
                PDF, DOC, DOCX — máx. 25MB — até {2 - files.length} arquivo(s)
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="border border-[#CCC] bg-white rounded h-10 px-6 font-ubuntu text-base text-[#5A5858] hover:bg-gray-100 transition-colors"
              >
                Selecionar Arquivo
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-10">
            <Link
              to="/meus-projetos"
              className="flex items-center justify-center border border-[#CCC] bg-white rounded h-[43px] min-w-[180px] font-ubuntu text-[18px] text-black hover:bg-gray-50 transition-colors px-6"
            >
              Cancelar
            </Link>
            <button
              type="button"
              onClick={() => handleSave("meus-projetos")}
              disabled={loading}
              className="border border-[#CCC] bg-white rounded h-[43px] min-w-[200px] font-ubuntu text-[18px] text-black hover:bg-gray-50 disabled:opacity-60 transition-colors px-6"
            >
              {loading ? "Salvando..." : "Salvar Rascunho"}
            </button>
            <button
              type="button"
              onClick={() => handleSave("informacoes-gerais")}
              disabled={loading}
              className="flex items-center justify-center bg-[#008000] rounded h-[43px] min-w-[260px] font-ubuntu text-[18px] text-white hover:bg-green-800 disabled:opacity-60 transition-colors px-6 gap-2"
            >
              {loading ? "Salvando..." : "Próximo: Informações Gerais"}
              {!loading && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
