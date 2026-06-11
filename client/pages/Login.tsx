import { useState, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

const LOGO_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/ed1ee9a31b22bdde676872eef7ab1779ba3043b1?width=124";

type Tab = "entrar" | "cadastrar";
type UserRole = "aluno" | "professor";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || null;

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
      const redirect = from || (role === "professor" ? "/avaliador" : "/meus-projetos");
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
      navigate(role === "professor" ? "/avaliador" : "/meus-projetos", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-ubuntu">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#10512D] text-white p-12">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="SISAPA" className="w-14 h-14 object-contain brightness-0 invert" />
          <span className="font-bold text-2xl">SISAPA</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Sistema Integrado de Submissão e Avaliação de Projetos Acadêmicos
          </h1>
          <p className="text-green-200 text-lg">Instituto Federal de Mato Grosso do Sul — IFMS</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["Submissão", "Envie projetos acadêmicos com facilidade"],
            ["Avaliação", "Acompanhe o status em tempo real"],
            ["Transparência", "Feedback detalhado dos professores"],
            ["Segurança", "Autenticação integrada e protegida"],
          ].map(([title, desc]) => (
            <div key={title} className="bg-white/10 rounded-lg p-3">
              <p className="font-semibold">{title}</p>
              <p className="text-green-200 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <img src={LOGO_URL} alt="SISAPA" className="w-10 h-10 object-contain" />
            <span className="text-[#10512D] font-bold text-2xl">SISAPA</span>
          </div>

          <h2 className="text-2xl font-bold text-black mb-1">
            {tab === "entrar" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p className="text-[#5A5858] mb-6 text-sm">
            {tab === "entrar"
              ? "Entre com suas credenciais para acessar o sistema."
              : "Preencha os dados para criar sua conta no SISAPA."}
          </p>

          {/* Tabs */}
          <div className="flex rounded-lg border border-[#CCC] overflow-hidden mb-5">
            {(["entrar", "cadastrar"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  tab === t ? "bg-[#10512D] text-white" : "bg-white text-[#5A5858] hover:bg-gray-50"
                }`}
              >
                {t === "entrar" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          {/* Role selector */}
          <div className="flex rounded-lg border border-[#CCC] overflow-hidden mb-5">
            {(["aluno", "professor"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  role === r ? "bg-[#008000] text-white" : "bg-white text-[#5A5858] hover:bg-gray-50"
                }`}
              >
                {r === "aluno" ? "Aluno" : "Professor"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* ── Login Form ── */}
          {tab === "entrar" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5A5858] mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={role === "aluno" ? "aluno@ifms.edu.br" : "professor@ifms.edu.br"}
                  className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5A5858] mb-1">Senha</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#10512D] text-white rounded-lg h-10 font-semibold text-sm hover:bg-[#0d4325] transition-colors disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
              <p className="text-center text-xs text-[#999]">
                Demo: clique em{" "}
                <button
                  type="button"
                  className="text-[#10512D] hover:underline"
                  onClick={() => {
                    setLoginEmail(
                      role === "aluno"
                        ? "joao.silva@aluno.ifms.edu.br"
                        : "ana.costa@ifms.edu.br"
                    );
                    setLoginPassword("senha123");
                  }}
                >
                  preencher dados de demo
                </button>
              </p>
            </form>
          )}

          {/* ── Register Form ── */}
          {tab === "cadastrar" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#5A5858] mb-1">Nome completo *</label>
                <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}
                  placeholder="Seu nome" className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5A5858] mb-1">E-mail *</label>
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="seunome@ifms.edu.br" className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5A5858] mb-1">CPF</label>
                <input type="text" value={regCpf} onChange={(e) => setRegCpf(e.target.value)}
                  placeholder="Apenas dígitos" maxLength={14} className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]" />
              </div>
              {role === "aluno" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#5A5858] mb-1">Matrícula</label>
                    <input type="text" value={regMatricula} onChange={(e) => setRegMatricula(e.target.value)}
                      placeholder="Ex: 2023001" className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A5858] mb-1">Curso</label>
                    <input type="text" value={regCurso} onChange={(e) => setRegCurso(e.target.value)}
                      placeholder="Ex: TADS" className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]" />
                  </div>
                </div>
              )}
              {role === "professor" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#5A5858] mb-1">SIAPE</label>
                    <input type="text" value={regSiape} onChange={(e) => setRegSiape(e.target.value)}
                      placeholder="Número SIAPE" className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A5858] mb-1">Departamento</label>
                    <input type="text" value={regDepartamento} onChange={(e) => setRegDepartamento(e.target.value)}
                      placeholder="Ex: TI" className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5A5858] mb-1">Senha *</label>
                  <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 6 caracteres" className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5A5858] mb-1">Confirmar *</label>
                  <input type="password" required value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="Repita a senha" className="w-full border border-[#CCC] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D]" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#10512D] text-white rounded-lg h-10 font-semibold text-sm hover:bg-[#0d4325] transition-colors disabled:opacity-60 mt-2">
                {loading ? "Cadastrando..." : "Criar conta"}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-[#999] mt-5">
            Ao acessar, você concorda com os termos de uso do IFMS.
          </p>
        </div>
      </div>
    </div>
  );
}
