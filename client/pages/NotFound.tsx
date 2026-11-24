import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { primaryButton } from "@/components/layout/PageShell";
import { fadeUp } from "@/lib/motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F6F8F6] px-6 font-ubuntu">
          <div
            className="pointer-events-none absolute -left-[10%] -top-[30%] h-[70vmax] w-[70vmax] animate-blob-drift motion-reduce:animate-none bg-[radial-gradient(closest-side,rgb(16_81_45/0.13),transparent)]"
            aria-hidden
          />
          <m.div className="relative text-center" {...fadeUp()}>
            <p className="text-7xl font-bold tracking-tight text-[#10512D] sm:text-8xl">
              404
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-[#10231A]">
              Página não encontrada
            </h1>
            <p className="mt-2 text-[#5A5858]">
              O endereço que você tentou abrir não existe ou foi movido.
            </p>
            <Link to="/" className={`${primaryButton} mt-8`}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Voltar para o início
            </Link>
          </m.div>
        </main>
      </MotionConfig>
    </LazyMotion>
  );
};

export default NotFound;
