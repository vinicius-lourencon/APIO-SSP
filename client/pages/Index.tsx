import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { m } from "motion/react";
import { ArrowRight, FileText, UploadCloud, X } from "lucide-react";
import {
  PageHeading,
  PageShell,
  fieldClass,
  primaryButton,
  secondaryButton,
  surface,
} from "@/components/layout/PageShell";
import { FormField } from "@/components/FormField";
import { ListSkeleton } from "@/components/PageStates";
import { StepIndicator } from "@/components/StepIndicator";
import {
  createProject,
  updateProject,
  uploadFiles,
  getProject,
} from "@/lib/api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { PROPOSAL_TYPES } from "@shared/api";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

function validateFile(file: File): string | null {
  if (
    !ALLOWED_TYPES.includes(file.type) &&
    !ALLOWED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext))
  ) {
    return "Formato inválido. Use PDF, DOC ou DOCX.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Arquivo muito grande. Máximo 25MB.";
  }
  return null;
}

export default function NovoProjeto() {
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
  // Keeps the id of a project created in this screen, so retrying after a failed upload
  // updates it instead of creating a duplicate draft
  const createdIdRef = useRef<number | null>(null);

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
    const errs: string[] = [];
    const valid: File[] = [];
    for (const f of Array.from(incoming)) {
      const err = validateFile(f);
      if (err) {
        errs.push(`${f.name}: ${err}`);
      } else {
        valid.push(f);
      }
    }
    setFileErrors(errs);
    setFiles((prev) => [...prev, ...valid].slice(0, 2)); // max 2 files
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleAddFiles(e.dataTransfer.files);
  };

  const handleSave = async (
    andNavigateTo: "meus-projetos" | "informacoes-gerais",
  ) => {
    if (!title.trim()) {
      setError("O título do projeto é obrigatório.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let projectId = editId ?? createdIdRef.current;

      // Empty strings (not undefined) so clearing a field actually clears it on update
      const payload = {
        title: title.trim(),
        proposal_type: proposalType,
        public_target: targetAudience.trim(),
        duration: duration.trim(),
      };

      if (projectId) {
        await updateProject(projectId, payload);
      } else {
        const created = await createProject(payload);
        projectId = created.id;
        createdIdRef.current = created.id;
      }

      if (files.length > 0) {
        await uploadFiles(projectId!, files);
        setFiles([]);
      }

      if (andNavigateTo === "informacoes-gerais") {
        navigate(`/informacoes-gerais?id=${projectId}`);
      } else {
        navigate("/meus-projetos");
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao salvar projeto.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProject) {
    return (
      <PageShell width="max-w-3xl">
        <ListSkeleton count={2} />
      </PageShell>
    );
  }

  return (
    <PageShell width="max-w-3xl">
      <PageHeading
        title={editId ? "Editar projeto" : "Novo projeto"}
        subtitle="Comece pelo básico. Você completa o resto no próximo passo."
      />

      <m.div className="mt-6" {...fadeUp(0.06)}>
        <StepIndicator current={1} />
      </m.div>

      <m.div
        className={cn("mt-6 rounded-3xl p-6 sm:p-8", surface)}
        {...fadeUp(0.12)}
      >
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="space-y-6">
          <FormField label="Título do projeto" required>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Informe o título do seu projeto"
              className={cn(fieldClass, "h-12")}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Tipo de proposta">
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className={cn(fieldClass, "h-12")}
              >
                <option value="">Selecione o tipo</option>
                {PROPOSAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Duração prevista">
              <input
                type="text"
                maxLength={100}
                placeholder="Ex: 6 meses, 1 semestre"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={cn(fieldClass, "h-12")}
              />
            </FormField>
          </div>

          <FormField label="Público-alvo">
            <input
              type="text"
              maxLength={200}
              placeholder="Ex: crianças, idosos, comunidade local"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className={cn(fieldClass, "h-12")}
            />
          </FormField>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-[#10231A]">Documentos</h2>
          <p className="mt-1 text-sm text-[#6B6868]">
            Até 2 arquivos (PDF, DOC ou DOCX, máx. 25MB cada).
          </p>

          {fileErrors.length > 0 && (
            <div
              role="alert"
              className="mt-4 space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {fileErrors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-3 rounded-xl bg-[#10512D]/5 p-3"
                >
                  <FileText
                    className="h-5 w-5 shrink-0 text-[#10512D]"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-[#2B2A2A]">
                    {f.name}
                  </span>
                  <span className="text-xs text-[#8A8888]">
                    {(f.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-red-600/80 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remover ${f.name}`}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {files.length < 2 && (
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              className={cn(
                "mt-4 flex cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#10512D]/15",
                drag
                  ? "border-[#10512D] bg-[#10512D]/5"
                  : "border-black/15 bg-white/60 hover:bg-[#10512D]/[0.03]",
              )}
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
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10512D]/10 text-[#10512D]">
                <UploadCloud className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-base text-[#3D3B3B]">
                Clique para selecionar ou arraste os arquivos aqui
              </p>
              <p className="text-sm text-[#8A8888]">
                Ainda cabem {2 - files.length}{" "}
                {2 - files.length === 1 ? "arquivo" : "arquivos"}
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to="/meus-projetos" className={secondaryButton}>
            Cancelar
          </Link>
          <button
            type="button"
            onClick={() => handleSave("meus-projetos")}
            disabled={loading}
            className={secondaryButton}
          >
            {loading ? "Salvando..." : "Salvar rascunho"}
          </button>
          <button
            type="button"
            onClick={() => handleSave("informacoes-gerais")}
            disabled={loading}
            className={primaryButton}
          >
            {loading ? "Salvando..." : "Próximo passo"}
            {!loading && <ArrowRight className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </m.div>
    </PageShell>
  );
}
