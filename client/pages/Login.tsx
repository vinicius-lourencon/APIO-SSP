import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { GraduationCap, Presentation, type LucideIcon } from "lucide-react";
import { fieldClass, primaryButton } from "@/components/layout/PageShell";
import { FormField } from "@/components/FormField";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EASE, fadeUp } from "@/lib/motion";
import {
  ROLE_EMAIL_DOMAINS,
  emailMatchesRole,
  type UserRole,
} from "@shared/api";

const LOGO_URL = "/logo-sisapa.png";

const DEMO_EMAILS: Record<UserRole, string> = {
  aluno: "joao.silva@estudante.ifms.edu.br",
  professor: "ana.costa@ifms.edu.br",
};

/** Como um projeto anda no SISAPA (mesma trilha mostrada dentro do sistema) */
const JOURNEY = [
  { title: "Rascunho", desc: "Você escreve a proposta e anexa os documentos." },
  { title: "Enviado", desc: "Os professores recebem o projeto." },
  { title: "Em análise", desc: "Um professor assume e avalia." },
  {
    title: "Resultado",
    desc: "Você recebe o parecer: aprovado ou com ajustes.",
  },
] as const;

function RoleCard({
  icon: Icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mata/20",
        active
          ? "border-mata bg-mata-claro"
          : "border-linha bg-white hover:border-mata/30",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          active ? "bg-mata text-white" : "bg-fundo text-apoio",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-tinta">{label}</span>
        <span className="hidden truncate text-xs text-apoio min-[420px]:block">
          {hint}
        </span>
      </span>
    </button>
  );
}

type Tab = "entrar" | "cadastrar";

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      className="flex rounded-full border border-linha bg-white p-1"
      role="tablist"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 flex-1 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mata/15",
              active ? "bg-mata text-white" : "text-apoio hover:text-mata",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || null;

  const [tab, setTab] = useState<Tab>("entrar");
  const [role, setRole] = useState<UserRole>("aluno");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regCpf, setRegCpf] = useState("");
  const [regMatricula, setRegMatricula] = useState("");
  const [regCurso, setRegCurso] = useState("");
  const [regSiape, setRegSiape] = useState("");
  const [regDepartamento, setRegDepartamento] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      const redirect =
        from || (role === "professor" ? "/avaliador" : "/meus-projetos");
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (regPassword !== regConfirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!emailMatchesRole(regEmail, role)) {
      setError(
        role === "professor"
          ? `Professores devem usar um e-mail ${ROLE_EMAIL_DOMAINS.professor}.`
          : `Alunos devem usar um e-mail ${ROLE_EMAIL_DOMAINS.aluno}.`,
      );
      return;
    }
    setLoading(true);
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role,
        cpf: regCpf.replace(/\D/g, "") || undefined,
        matricula: regMatricula || undefined,
        curso: regCurso || undefined,
        siape: regSiape || undefined,
        departamento: regDepartamento || undefined,
      });
      navigate(role === "professor" ? "/avaliador" : "/meus-projetos", {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  const input = cn(fieldClass, "h-11");

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-screen font-sans">
          <aside className="faixa relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
            <m.div className="relative flex items-center gap-3" {...fadeUp()}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm">
                <img
                  src={LOGO_URL}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="font-display text-2xl font-bold tracking-tight">
                SISAPA
              </span>
            </m.div>

            <m.div className="relative" {...fadeUp(0.1)}>
              <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                Sistema Integrado de Submissão e Avaliação de Projetos
                Acadêmicos
              </h1>
              <p className="mt-4 text-lg text-white/75">
                Instituto Federal de Mato Grosso do Sul — IFMS
              </p>
            </m.div>

            <div className="relative">
              <p className="mb-4 text-sm font-medium text-ipe">
                Como seu projeto anda por aqui
              </p>
              <ol className="relative space-y-1 text-sm">
                {JOURNEY.map(({ title, desc }, i) => (
                  <m.li
                    key={title}
                    className="relative flex gap-4 pb-4 last:pb-0"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.6,
                      ease: EASE,
                      delay: 0.25 + i * 0.12,
                    }}
                  >
                    {i < JOURNEY.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-white/25"
                      />
                    )}
                    <span
                      className={cn(
                        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                        i === JOURNEY.length - 1
                          ? "bg-ipe text-tinta"
                          : "bg-white/15 text-white ring-1 ring-white/25",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-1">
                      <span className="block font-semibold">{title}</span>
                      <span className="block text-white/70">{desc}</span>
                    </span>
                  </m.li>
                ))}
              </ol>
            </div>
          </aside>

          <main className="fundo-vivo flex flex-1 items-center justify-center p-6 sm:p-12">
            <m.div className="w-full max-w-md" {...fadeUp(0.05)}>
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <img
                  src={LOGO_URL}
                  alt=""
                  className="h-10 w-10 object-contain"
                />
                <span className="font-display text-2xl font-bold tracking-tight text-mata">
                  SISAPA
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-tinta sm:text-3xl">
                {tab === "entrar" ? "Bem-vindo de volta" : "Criar conta"}
              </h2>
              <p className="mb-6 mt-1 text-sm text-apoio">
                {tab === "entrar"
                  ? "Entre com suas credenciais para acessar o sistema."
                  : "Preencha os dados para criar sua conta no SISAPA."}
              </p>

              <div className="mb-3">
                <Segmented<Tab>
                  label="Ação"
                  value={tab}
                  onChange={(value) => {
                    setTab(value);
                    setError("");
                  }}
                  options={[
                    { value: "entrar", label: "Entrar" },
                    { value: "cadastrar", label: "Cadastrar" },
                  ]}
                />
              </div>
              <div
                className="mb-6 mt-5 flex gap-3"
                role="radiogroup"
                aria-label="Perfil"
              >
                <RoleCard
                  icon={GraduationCap}
                  label="Aluno"
                  hint="@estudante.ifms.edu.br"
                  active={role === "aluno"}
                  onClick={() => setRole("aluno")}
                />
                <RoleCard
                  icon={Presentation}
                  label="Professor"
                  hint="@ifms.edu.br"
                  active={role === "professor"}
                  onClick={() => setRole("professor")}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {tab === "entrar" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <FormField label="E-mail">
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={`seunome${ROLE_EMAIL_DOMAINS[role]}`}
                      className={input}
                    />
                  </FormField>
                  <FormField label="Senha">
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Sua senha"
                      className={input}
                    />
                  </FormField>
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(primaryButton, "w-full")}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                  <p className="text-center text-xs text-fraco">
                    Demo:{" "}
                    <button
                      type="button"
                      className="font-medium text-mata underline-offset-4 hover:underline"
                      onClick={() => {
                        setLoginEmail(DEMO_EMAILS[role]);
                        setLoginPassword("senha123");
                      }}
                    >
                      preencher dados de demo
                    </button>
                  </p>
                </form>
              )}

              {tab === "cadastrar" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <FormField label="Nome completo" required>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Seu nome"
                      className={input}
                    />
                  </FormField>
                  <FormField
                    label="E-mail"
                    required
                    hint={`use seu e-mail institucional ${ROLE_EMAIL_DOMAINS[role]}`}
                  >
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder={`seunome${ROLE_EMAIL_DOMAINS[role]}`}
                      className={input}
                    />
                  </FormField>
                  <FormField label="CPF">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={regCpf}
                      onChange={(e) => setRegCpf(e.target.value)}
                      placeholder="Apenas dígitos"
                      maxLength={14}
                      className={input}
                    />
                  </FormField>
                  {role === "aluno" && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Matrícula">
                        <input
                          type="text"
                          value={regMatricula}
                          onChange={(e) => setRegMatricula(e.target.value)}
                          placeholder="Ex: 2023001"
                          className={input}
                        />
                      </FormField>
                      <FormField label="Curso">
                        <input
                          type="text"
                          value={regCurso}
                          onChange={(e) => setRegCurso(e.target.value)}
                          placeholder="Ex: TADS"
                          className={input}
                        />
                      </FormField>
                    </div>
                  )}
                  {role === "professor" && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="SIAPE">
                        <input
                          type="text"
                          value={regSiape}
                          onChange={(e) => setRegSiape(e.target.value)}
                          placeholder="Número SIAPE"
                          className={input}
                        />
                      </FormField>
                      <FormField label="Departamento">
                        <input
                          type="text"
                          value={regDepartamento}
                          onChange={(e) => setRegDepartamento(e.target.value)}
                          placeholder="Ex: TI"
                          className={input}
                        />
                      </FormField>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Senha" required>
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mín. 6 caracteres"
                        className={input}
                      />
                    </FormField>
                    <FormField label="Confirmar" required>
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        placeholder="Repita a senha"
                        className={input}
                      />
                    </FormField>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(primaryButton, "mt-2 w-full")}
                  >
                    {loading ? "Cadastrando..." : "Criar conta"}
                  </button>
                </form>
              )}

              <p className="mt-6 text-center text-xs text-fraco">
                Ao acessar, você concorda com os termos de uso do IFMS.
              </p>
            </m.div>
          </main>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
