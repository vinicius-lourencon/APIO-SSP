import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import {
  ClipboardCheck,
  MessageSquareText,
  Send,
  ShieldCheck,
} from "lucide-react";
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

const HIGHLIGHTS = [
  {
    icon: Send,
    title: "Submissão",
    desc: "Envie projetos acadêmicos com facilidade",
  },
  {
    icon: ClipboardCheck,
    title: "Avaliação",
    desc: "Acompanhe o status em tempo real",
  },
  {
    icon: MessageSquareText,
    title: "Transparência",
    desc: "Feedback detalhado dos professores",
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    desc: "Autenticação integrada e protegida",
  },
] as const;

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
      className="flex rounded-full border border-black/10 bg-white/80 p-1"
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
              "h-9 flex-1 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10512D]/15",
              active
                ? "bg-[#10512D] text-white"
                : "text-[#4A4848] hover:text-[#10512D]",
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
        <div className="flex min-h-screen font-ubuntu">
          <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0C3F23] p-12 text-white lg:flex">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute -left-[20%] -top-[20%] h-[60vmax] w-[60vmax] animate-blob-drift motion-reduce:animate-none bg-[radial-gradient(closest-side,rgb(120_190_90/0.35),transparent)]" />
              <div className="absolute -bottom-[30%] -right-[20%] h-[55vmax] w-[55vmax] animate-blob-drift motion-reduce:animate-none bg-[radial-gradient(closest-side,rgb(255_255_255/0.12),transparent)] [animation-delay:-14s]" />
            </div>

            <m.div className="relative flex items-center gap-3" {...fadeUp()}>
              <img
                src={LOGO_URL}
                alt=""
                className="h-14 w-14 object-contain brightness-0 invert"
              />
              <span className="text-2xl font-bold">SISAPA</span>
            </m.div>

            <m.div className="relative" {...fadeUp(0.1)}>
              <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                Sistema Integrado de Submissão e Avaliação de Projetos
                Acadêmicos
              </h1>
              <p className="mt-4 text-lg text-green-100/80">
                Instituto Federal de Mato Grosso do Sul — IFMS
              </p>
            </m.div>

            <ul className="relative grid grid-cols-2 gap-3 text-sm">
              {HIGHLIGHTS.map(({ icon: Icon, title, desc }, i) => (
                <m.li
                  key={title}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    ease: EASE,
                    delay: 0.2 + i * 0.08,
                  }}
                >
                  <Icon className="h-5 w-5 text-green-200" aria-hidden />
                  <p className="mt-3 font-semibold">{title}</p>
                  <p className="mt-1 text-green-100/75">{desc}</p>
                </m.li>
              ))}
            </ul>
          </aside>

          <main className="flex flex-1 items-center justify-center bg-[#F6F8F6] p-6 sm:p-12">
            <m.div className="w-full max-w-md" {...fadeUp(0.05)}>
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <img
                  src={LOGO_URL}
                  alt=""
                  className="h-10 w-10 object-contain"
                />
                <span className="text-2xl font-bold text-[#10512D]">
                  SISAPA
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-[#10231A] sm:text-3xl">
                {tab === "entrar" ? "Bem-vindo de volta" : "Criar conta"}
              </h2>
              <p className="mb-6 mt-1 text-sm text-[#5A5858]">
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
              <div className="mb-6">
                <Segmented<UserRole>
                  label="Perfil"
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: "aluno", label: "Aluno" },
                    { value: "professor", label: "Professor" },
                  ]}
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
                  {/* Demo users only exist in `pnpm dev`; the production build drops this block */}
                  {import.meta.env.DEV && (
                    <p className="text-center text-xs text-[#8A8888]">
                      Demo:{" "}
                      <button
                        type="button"
                        className="font-medium text-[#10512D] underline-offset-4 hover:underline"
                        onClick={() => {
                          setLoginEmail(DEMO_EMAILS[role]);
                          setLoginPassword("senha123");
                        }}
                      >
                        preencher dados de demo
                      </button>
                    </p>
                  )}
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

              <p className="mt-6 text-center text-xs text-[#8A8888]">
                Ao acessar, você concorda com os termos de uso do IFMS.
              </p>
            </m.div>
          </main>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
