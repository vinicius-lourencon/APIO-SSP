import { useState } from "react";
import { Link } from "react-router-dom";

const LOGO_URL =
  "https://api.builder.io/api/v1/image/assets/TEMP/ed1ee9a31b22bdde676872eef7ab1779ba3043b1?width=124";

type AuthTab = "entrar" | "cadastrar";

export default function Login() {
  const [activeTab, setActiveTab] = useState<AuthTab>("entrar");

  return (
    <div className="min-h-screen bg-white font-ubuntu flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-[#CCC]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[53px] h-[99px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="SISAPA logo" className="w-[62px] h-[62px] object-contain" />
            <span className="text-[#10512D] font-ubuntu font-bold text-xl leading-none">
              SISAPA
            </span>
          </div>

          <a
            href="https://www.ifms.edu.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-ubuntu text-sm text-[#5A5858] border-b border-[#CCC] pb-0.5 hover:text-[#10512D] transition-colors"
          >
            Site do IFMS
          </a>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex">
        {/* Left: branding panel */}
        <div className="hidden lg:flex flex-col justify-center items-start flex-1 px-16 xl:px-24 bg-white border-r border-[#CCC]">
          <div className="max-w-md">
            <img src={LOGO_URL} alt="SISAPA" className="w-24 h-24 object-contain mb-6" />
            <h1 className="font-ubuntu font-bold text-4xl text-[#10512D] mb-4">SISAPA</h1>
            <p className="font-ubuntu text-xl text-[#5A5858] mb-3">
              Sistema de Projetos de Extensão
            </p>
            <p className="font-ubuntu text-base text-[#5A5858]/80 leading-relaxed">
              Gerencie seus projetos de extensão universitária, acompanhe o status de avaliação e
              colabore com professores e a comunidade.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Submissão de propostas de extensão",
                "Acompanhamento do status de avaliação",
                "Feedback direto dos professores orientadores",
                "Upload e gestão de documentos",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 w-5 h-5 rounded-full bg-[#10512D]/10 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-[#10512D]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="font-ubuntu text-base text-[#5A5858]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: login form */}
        <div className="flex flex-col justify-center items-center w-full lg:w-[560px] xl:w-[620px] shrink-0 px-6 py-12">
          <div className="w-full max-w-[440px]">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <img src={LOGO_URL} alt="SISAPA" className="w-12 h-12 object-contain" />
              <span className="text-[#10512D] font-ubuntu font-bold text-2xl">SISAPA</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#CCC] mb-8">
              <button
                onClick={() => setActiveTab("entrar")}
                className={`flex-1 py-3 font-ubuntu font-bold text-base tracking-wider transition-all ${
                  activeTab === "entrar"
                    ? "text-black border-b-2 border-[#008000] -mb-px"
                    : "text-[#5A5858]/60 hover:text-[#5A5858]"
                }`}
              >
                ENTRAR
              </button>
              <button
                onClick={() => setActiveTab("cadastrar")}
                className={`flex-1 py-3 font-ubuntu font-bold text-base tracking-wider transition-all ${
                  activeTab === "cadastrar"
                    ? "text-black border-b-2 border-[#008000] -mb-px"
                    : "text-[#5A5858]/60 hover:text-[#5A5858]"
                }`}
              >
                CADASTRAR
              </button>
            </div>

            {activeTab === "entrar" && (
              <div className="space-y-6">
                {/* Estudante */}
                <div>
                  <p className="font-ubuntu text-base text-[#5A5858] mb-3">
                    Se você é <strong className="font-bold text-black">ESTUDANTE</strong>:
                  </p>
                  <Link
                    to="/meus-projetos"
                    className="flex items-center justify-center w-full h-[52px] border border-[#CCC] rounded bg-white hover:bg-gray-50 transition-colors gap-2"
                  >
                    <span className="font-ubuntu text-base text-[#5A5858]">Entrar com</span>
                    {/* gov.br logo */}
                    <span className="font-bold text-lg leading-none">
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
                  <button className="flex items-center justify-center w-full h-[52px] border border-[#CCC] rounded bg-white hover:bg-gray-50 transition-colors">
                    <span className="font-ubuntu text-base text-[#10512D]">
                      Acesso administrativo
                    </span>
                  </button>
                </div>

                {/* Forgot password */}
                <div className="text-center pt-4">
                  <a
                    href="#"
                    className="font-ubuntu text-base text-[#10512D] hover:underline"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>

                {/* Terms */}
                <div className="text-center space-y-2 pt-2">
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

            {activeTab === "cadastrar" && (
              <div className="space-y-5">
                <div>
                  <label className="block font-ubuntu text-base text-[#5A5858] mb-2">Nome completo</label>
                  <input
                    type="text"
                    placeholder="Insira seu nome completo"
                    className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                  />
                </div>
                <div>
                  <label className="block font-ubuntu text-base text-[#5A5858] mb-2">E-mail institucional</label>
                  <input
                    type="email"
                    placeholder="seu.email@ifms.edu.br"
                    className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                  />
                </div>
                <div>
                  <label className="block font-ubuntu text-base text-[#5A5858] mb-2">Matrícula</label>
                  <input
                    type="text"
                    placeholder="Número de matrícula"
                    className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                  />
                </div>
                <div>
                  <label className="block font-ubuntu text-base text-[#5A5858] mb-2">Senha</label>
                  <input
                    type="password"
                    placeholder="Crie uma senha"
                    className="w-full border border-[#CCC] rounded h-[49px] px-3 font-ubuntu text-base text-[#5A5858] placeholder:text-[#5A5858]/60 focus:outline-none focus:ring-1 focus:ring-[#10512D]"
                  />
                </div>
                <Link
                  to="/meus-projetos"
                  className="flex items-center justify-center w-full h-[49px] bg-[#008000] rounded font-ubuntu text-base text-white hover:bg-green-800 transition-colors mt-2"
                >
                  Criar conta
                </Link>

                <div className="text-center space-y-2 pt-2">
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
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

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
