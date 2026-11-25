import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { accentButton } from "@/components/layout/PageShell";
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
        <main className="faixa relative flex min-h-screen items-center justify-center overflow-hidden px-6 font-sans text-white">
          <m.div className="relative text-center" {...fadeUp()}>
            <p className="font-display text-7xl font-bold tracking-tight text-ipe sm:text-8xl">
              404
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-white">
              Página não encontrada
            </h1>
            <p className="mt-2 text-white/75">
              O endereço que você tentou abrir não existe ou foi movido.
            </p>
            <Link to="/" className={`${accentButton} mt-8`}>
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
