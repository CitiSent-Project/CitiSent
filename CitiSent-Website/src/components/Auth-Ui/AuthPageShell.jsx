import { motion } from "framer-motion";
import CitiSentLogo from "/assets/CitiSentLogo.svg";

const MotionSection = motion.section;

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
  variant = "default",
}) {
  const isAdminLogin = variant === "admin-login";

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden p-4 ${
        isAdminLogin
          ? "bg-linear-to-br from-[#9cbce0] via-[#5f8fd3] to-[#84a8d1]"
          : "bg-linear-to-br from-[#dbe9ff] via-[#a8c5f1] to-[#87ade4]"
      }`}
    >
      <div
        className="absolute inset-0 z-0 bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/Untitled_design-removebg-preview 1 (1).png')",
          backgroundPosition: "center 5%",
          backgroundSize: "100% auto",
        }}
      />
      <div
        className={`pointer-events-none absolute -top-44 right-0 h-96 w-96 rounded-full blur-3xl ${
          isAdminLogin ? "bg-cyan-100/24" : "bg-cyan-100/35"
        }`}
      />
      <div
        className={`pointer-events-none absolute -bottom-44 left-0 h-96 w-96 rounded-full blur-3xl ${
          isAdminLogin ? "bg-blue-100/30" : "bg-blue-100/35"
        }`}
      />

      <MotionSection
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative w-full rounded-3xl p-7 backdrop-blur md:p-9 ${
          isAdminLogin
            ? "max-w-lg border border-white/72 bg-[#3c73c8]/52 text-white shadow-[0_18px_50px_rgba(23,56,110,0.28)] md:pb-12"
            : "max-w-xl border border-white/60 bg-white/86 shadow-xl"
        }`}
      >
        <div
          className={`mb-6 ${isAdminLogin ? "flex justify-center" : "flex items-center gap-3"}`}
        >
          <div
            className={`flex items-center ${isAdminLogin ? "gap-4 md:gap-5" : "gap-3"}`}
          >
            <p
              className={`text-2xl font-bold ${isAdminLogin ? "text-[#1f3f73] md:text-[52px]" : "text-slate-900"}`}
            >
              CitiSent
            </p>
            <img
              src={CitiSentLogo}
              alt="CitiSent"
              className={`${isAdminLogin ? "h-19 w-19 md:h-21 md:w-21" : "h-13 w-13"}`}
            />
          </div>

          {!isAdminLogin ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Admin Portal
              </p>
            </div>
          ) : null}
        </div>

        <header className={`mb-6 ${isAdminLogin ? "mt-2 md:mt-4" : ""}`}>
          <h1
            className={`font-semibold ${isAdminLogin ? "text-5xl text-white md:text-[54px]" : "text-3xl text-slate-900"}`}
          >
            {title}
          </h1>
          <p
            className={`mt-1 text-sm ${isAdminLogin ? "text-white/85" : "text-slate-600"}`}
          >
            {subtitle}
          </p>
        </header>

        {children}

        {footer ? (
          <footer
            className={`mt-6 text-sm ${isAdminLogin ? "text-white/90" : "text-slate-600"}`}
          >
            {footer}
          </footer>
        ) : null}
      </MotionSection>
    </main>
  );
}
