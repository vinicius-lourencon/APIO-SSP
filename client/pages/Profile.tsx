import { Link, useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { LogOut } from "lucide-react";
import {
  PageShell,
  primaryButton,
  secondaryButton,
  surface,
} from "@/components/layout/PageShell";
import { BackLink } from "@/components/BackLink";
import { ListSkeleton } from "@/components/PageStates";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { firstName } from "@shared/api";

// Read-only profile: there is no endpoint to update profile data or the password yet
export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <PageShell width="max-w-3xl">
        <ListSkeleton count={2} />
      </PageShell>
    );
  }

  const isStudent = user.role === "aluno";
  const initial = firstName(user.name).charAt(0).toUpperCase();
  const roleLabel = isStudent ? "Aluno" : "Professor";
  const backPath = isStudent ? "/meus-projetos" : "/avaliador";

  const fields: { label: string; value: string | null | undefined }[] =
    isStudent
      ? [
          { label: "Nome completo", value: user.name },
          { label: "E-mail", value: user.email },
          { label: "Matrícula", value: user.matricula },
          { label: "Curso", value: user.curso },
          {
            label: "Instituição",
            value: "IFMS — Instituto Federal de Mato Grosso do Sul",
          },
        ]
      : [
          { label: "Nome completo", value: user.name },
          { label: "E-mail", value: user.email },
          { label: "SIAPE", value: user.siape },
          { label: "Departamento", value: user.departamento },
          {
            label: "Instituição",
            value: "IFMS — Instituto Federal de Mato Grosso do Sul",
          },
        ];

  return (
    <PageShell width="max-w-3xl">
      <BackLink to={backPath}>Voltar</BackLink>

      <m.div
        className={cn(
          "flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8",
          surface,
        )}
        {...fadeUp()}
      >
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#10512D] text-4xl font-bold text-white">
          {initial}
        </span>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-[#10231A] sm:text-3xl">
            {user.name}
          </h1>
          <p className="mt-1 text-[#5A5858]">{user.email}</p>
          <span className="mt-3 inline-flex rounded-full bg-[#10512D]/10 px-3 py-1 text-xs font-medium text-[#10512D]">
            {roleLabel}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link to={backPath} className={primaryButton}>
            {isStudent ? "Meus projetos" : "Avaliações"}
          </Link>
          <button
            onClick={handleLogout}
            className={cn(
              secondaryButton,
              "border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-100",
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sair da conta
          </button>
        </div>
      </m.div>

      <m.section className={cn("mt-6 p-6 sm:p-8", surface)} {...fadeUp(0.1)}>
        <h2 className="mb-6 text-base font-semibold text-[#10512D]">
          Informações do perfil
        </h2>
        <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-[#8A8888]">
                {label}
              </dt>
              <dd className="mt-1 font-medium text-[#2B2A2A]">
                {value || (
                  <span className="font-normal italic text-[#B5B3B3]">
                    Não informado
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </m.section>

      <m.section className={cn("mt-6 p-6 sm:p-8", surface)} {...fadeUp(0.16)}>
        <h2 className="mb-4 text-base font-semibold text-[#10512D]">
          Segurança
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium text-[#2B2A2A]">Senha</p>
            <p className="mt-0.5 text-sm text-[#6B6868]">
              A troca de senha ainda não está disponível.
            </p>
          </div>
          <button
            type="button"
            disabled
            className={secondaryButton}
            title="Funcionalidade em desenvolvimento"
          >
            Alterar senha
          </button>
        </div>
      </m.section>
    </PageShell>
  );
}
