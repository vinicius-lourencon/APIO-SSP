import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  // Form state mirrors current user (read-only for now; update endpoint can be added later)
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white font-ubuntu flex items-center justify-center">
        <p className="text-[#5A5858]">Carregando...</p>
      </div>
    );
  }

  const isStudent = user.role === "aluno";
  const isProfessor = user.role === "professor";
  const initial = user.name.charAt(0).toUpperCase();
  const roleLabel = isStudent ? "Aluno" : "Professor";
  const backPath = isStudent ? "/meus-projetos" : "/avaliador";

  const fields: { label: string; value: string | null | undefined }[] = isStudent
    ? [
        { label: "Nome completo", value: user.name },
        { label: "E-mail", value: user.email },
        { label: "Matrícula", value: user.matricula },
        { label: "Curso", value: user.curso },
        { label: "Perfil", value: roleLabel },
        { label: "Instituição", value: "IFMS — Instituto Federal de Mato Grosso do Sul" },
      ]
    : [
        { label: "Nome completo", value: user.name },
        { label: "E-mail", value: user.email },
        { label: "SIAPE", value: user.siape },
        { label: "Departamento", value: user.departamento },
        { label: "Perfil", value: roleLabel },
        { label: "Instituição", value: "IFMS — Instituto Federal de Mato Grosso do Sul" },
      ];

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-ubuntu">
      <Header />
      <main className="max-w-[900px] mx-auto px-4 sm:px-8 py-10">
        {/* Back link */}
        <Link
          to={backPath}
          className="flex items-center gap-1 text-sm text-[#5A5858] hover:text-[#10512D] mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>

        {/* Profile header */}
        <div className="bg-white border border-[#EEE] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#10512D] text-white flex items-center justify-center font-ubuntu font-bold text-3xl sm:text-4xl shrink-0">
            {initial}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-ubuntu font-bold text-2xl sm:text-3xl text-black">{user.name}</h1>
            <p className="text-[#5A5858] mt-1">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-block bg-green-100 text-green-700 text-xs font-ubuntu font-medium px-3 py-1 rounded-full">
                {roleLabel}
              </span>
              <span className="inline-block bg-gray-100 text-gray-600 text-xs font-ubuntu px-3 py-1 rounded-full">
                IFMS
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
              <Link
                to={backPath}
                className="bg-[#10512D] text-white font-ubuntu text-sm px-4 py-2 rounded hover:bg-[#0d4325] transition-colors"
              >
                {isStudent ? "Meus Projetos" : "Área do Avaliador"}
              </Link>
              <button
                onClick={handleLogout}
                className="border border-red-200 text-red-600 font-ubuntu text-sm px-4 py-2 rounded hover:bg-red-50 transition-colors"
              >
                Sair da conta
              </button>
            </div>
          </div>
        </div>

        {/* Information section */}
        <div className="mt-6 bg-white border border-[#EEE] rounded-xl p-6 sm:p-8">
          <h2 className="font-ubuntu font-semibold text-lg text-[#10512D] mb-6">
            Informações do Perfil
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-ubuntu text-[#999] uppercase tracking-wide mb-1">{label}</p>
                <p className="font-ubuntu font-medium text-black">
                  {value || <span className="text-[#CCC] font-normal italic">Não informado</span>}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Security section */}
        <div className="mt-6 bg-white border border-[#EEE] rounded-xl p-6 sm:p-8">
          <h2 className="font-ubuntu font-semibold text-lg text-[#10512D] mb-4">
            Segurança
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-ubuntu font-medium text-black">Senha</p>
              <p className="text-sm text-[#5A5858] mt-0.5">Última atualização não registrada</p>
            </div>
            <button
              type="button"
              disabled
              className="border border-[#CCC] bg-white text-[#5A5858] font-ubuntu text-sm px-4 py-2 rounded opacity-50 cursor-not-allowed"
              title="Funcionalidade em desenvolvimento"
            >
              Alterar Senha
            </button>
          </div>
          <hr className="my-4 border-[#EEE]" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-ubuntu font-medium text-black">Sessões ativas</p>
              <p className="text-sm text-[#5A5858] mt-0.5">Gerencie seus tokens de acesso</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="border border-red-200 text-red-600 font-ubuntu text-sm px-4 py-2 rounded hover:bg-red-50 transition-colors"
            >
              Encerrar sessão atual
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
