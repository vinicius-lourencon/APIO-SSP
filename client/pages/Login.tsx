import { useState } from "react";
import { Link } from "react-router-dom";

const LOGO_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/ed1ee9a31b22bdde676872eef7ab1779ba3043b1?width=124";

type AuthTab = "entrar" | "cadastrar";

export default function Login() {
  const [activeTab, setActiveTab] = useState<AuthTab>("entrar");

  return (
    <div className="min-h-screen bg-white font-ubuntu flex flex-col">
      {/* ── Two-column body ── */}
      <div className="flex flex-1">

        {/* ── LEFT panel ── */}
        <div className="hidden lg:flex flex-col w-[45%] xl:w-[42%] border-r border-[#CCC]">
          {/* "Site do IFMS" at top-left, mirroring the screenshot */}
          <div className="border-b border-[#CCC] px-8 py-5">
            <a
              href="https://www.ifms.edu.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-ubuntu text-sm text-[#5A5858] hover:text-[#10512D] transition-colors"
            >
              Site do IFMS
            </a>
          </div>

          {/* Branding block — centered vertically */}
          <div className="flex-1 flex flex-col justify-center items-start px-16 xl:px-20 pb-16">
            <img src={LOGO_URL} alt="SISAPA" className="w-20 h-20 object-contain mb-6" />
            <h1 className="font-ubuntu font-bold text-4xl text-[#10512D] mb-3">SISAPA</h1>
            <p className="font-ubuntu text-xl text-[#5A5858] mb-3">
              Sistema de Projetos de Extensão
            </p>
            <p className="font-ubuntu text-base text-[#5A5858]/75 leading-relaxed max-w-sm">
              Gerencie seus projetos de extensão universitária, acompanhe o status de avaliação e
              colabore com professores orientadores.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Submissão de propostas de extensão",
                "Acompanhamento do status de avaliação",
                "Feedback direto dos professores",
                "Upload e gestão de documentos",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#10512D]/10 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-[#10512D]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="font-ubuntu text-sm text-[#5A5858]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT panel ── */}
        <div className="flex-1 flex flex-col">
          {/* Mobile: "Site do IFMS" link at top */}
          <div className="lg:hidden border-b border-[#CCC] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="SISAPA" className="w-8 h-8 object-contain" />
              <span className="text-[#10512D] font-ubuntu font-bold text-lg">SISAPA</span>
            </div>
            <a
              href="https://www.ifms.edu.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-ubuntu text-sm text-[#5A5858] border-b border-[#CCC]"
            >
              Site do IFMS
            </a>
          </div>

          {/* Form area — centered vertically */}
          <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
            <div className="w-full max-w-[400px]">

              {/* ── Tabs ── */}
              <div className="flex border-b border-[#CCC] mb-10">
                <button
                  onClick={() => setActiveTab("entrar")}
                  className={`flex-1 pb-3 font-ubuntu font-bold text-sm tracking-widest transition-all ${
                    activeTab === "entrar"
                      ? "text-black border-b-2 border-[#008000] -mb-px"
                      : "text-[#5A5858]/50 hover:text-[#5A5858]"
                  }`}
                >
                  ENTRAR
                </button>
                <button
                  onClick={() => setActiveTab("cadastrar")}
                  className={`flex-1 pb-3 font-ubuntu font-bold text-sm tracking-widest transition-all ${
                    activeTab === "cadastrar"
                      ? "text-black border-b-2 border-[#008000] -mb-px"
                      : "text-[#5A5858]/50 hover:text-[#5A5858]"
                  }`}
                >
                  CADASTRAR
                </button>
              </div>

              {/* ── ENTRAR ── */}
              {activeTab === "entrar" && (
                <div className="space-y-7">
                  {/* Estudante */}
                  <div>
                    <p className="font-ubuntu text-base text-[#5A5858] mb-3">
                      Se você é <strong className="font-bold text-black">ESTUDANTE</strong>:
                    </p>
                    <Link
                      to="/meus-projetos"
                      className="flex items-center justify-center w-full h-[52px] border border-[#CCC] rounded bg-white hover:bg-gray-50 transition-colors gap-2 group"
                    >
                      <span className="font-ubuntu text-base text-[#5A5858] group-hover:text-[#10512D]">
                        Entrar com
                      </span>
                      {/* gov.br wordmark */}
                      <span className="font-bold text-xl leading-none tracking-tight">
                        <span className="text-[#1351B4]">gov</span>
                        <span className="text-[#1351B4]">.</span>
                        <span className="text-[#FFCD07]">b</span>
                        <span className="text-[#168821]">r</span>
                      </span>
                    </Link>
                  </div>

                  {/* Servidor */}
                  <div>
                    <p className="font-ubuntu text-base text-[#5A5858] mb-3">
                      Se você é <strong className="font-bold text-black">SERVIDOR</strong>:
                    </p>
                    <Link
                      to="/meus-projetos"
                      className="flex items-center justify-center w-full h-[52px] border border-[#CCC] rounded bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-ubuntu text-base text-[#10512D]">
                        Acesso administrativo
                      </span>
                    </Link>
                  </div>

                  {/* Forgot password */}
                  <div className="text-center pt-2">
                    <a href="#" className="font-ubuntu text-base text-[#10512D] hover:underline">
                      Esqueceu sua senha?
                    </a>
                  </div>

                  {/* Terms */}
                  <div className="text-center space-y-2">
                    <p className="font-ubuntu text-xs text-[#5A5858] leading-relaxed">
                      Ao continuar, estou de acordo com os{" "}
                      <a href="#" className="text-[#10512D] hover:underline">
                        Termos de Uso
                      </a>{" "}
                      e{" "}
                      <a href="#" className="text-[#10512D] hover:underline">
                        Aviso de Privacidade
                      </a>{" "}
                      do Mobilis.
                    </p>
                    <p className="font-ubuntu text-xs text-[#5A5858] leading-relaxed">
                      This site is protected by reCAPTCHA and the Google{" "}
                      <a href="#" className="text-[#10512D] hover:underline">
                        Privacy Policy
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-[#10512D] hover:underline">
                        Terms of Service
                      </a>{" "}
                      apply.
                    </p>
                  </div>
                </div>
              )}

              {/* ── CADASTRAR ── */}
              {activeTab === "cadastrar" && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-ubuntu text-sm text-[#5A5858] mb-1.5">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      placeholder="Insira seu nome completo"
                      className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/50 focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                    />
                  </div>
                  <div>
                    <label className="block font-ubuntu text-sm text-[#5A5858] mb-1.5">
                      E-mail institucional
                    </label>
                    <input
                      type="email"
                      placeholder="seu.email@ifms.edu.br"
                      className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/50 focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                    />
                  </div>
                  <div>
                    <label className="block font-ubuntu text-sm text-[#5A5858] mb-1.5">
                      Matrícula
                    </label>
                    <input
                      type="text"
                      placeholder="Número de matrícula"
                      className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/50 focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                    />
                  </div>
                  <div>
                    <label className="block font-ubuntu text-sm text-[#5A5858] mb-1.5">
                      Senha
                    </label>
                    <input
                      type="password"
                      placeholder="Crie uma senha"
                      className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/50 focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                    />
                  </div>
                  <Link
                    to="/meus-projetos"
                    className="flex items-center justify-center w-full h-[49px] bg-[#008000] rounded font-ubuntu text-base text-white hover:bg-green-800 transition-colors mt-2"
                  >
                    Criar conta
                  </Link>
                  <p className="text-center font-ubuntu text-xs text-[#5A5858] leading-relaxed pt-1">
                    Ao continuar, estou de acordo com os{" "}
                    <a href="#" className="text-[#10512D] hover:underline">
                      Termos de Uso
                    </a>{" "}
                    e{" "}
                    <a href="#" className="text-[#10512D] hover:underline">
                      Aviso de Privacidade
                    </a>{" "}
                    do Mobilis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#CCC] py-4 px-6">
        <p className="font-ubuntu text-xs text-[#5A5858] text-center">
          Caso ocorra alguma inconsistência favor procurar a Central de Relacionamento (CEREL) do
          seu campus.
        </p>
      </footer>
    </div>
  );
}
