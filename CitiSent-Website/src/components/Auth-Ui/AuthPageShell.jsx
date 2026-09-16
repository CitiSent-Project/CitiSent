import { motion } from "framer-motion";
import CitiSentLogo from "/assets/CitiSentLogo.svg";

const MotionSection = motion.section;

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
  variant = "default",
  layout = "stack",
}) {
  const isAdminLogin = variant === "admin-login";
  const isSplitLayout = isAdminLogin && layout === "split";

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden p-3 sm:p-6 ${
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
          isAdminLogin ? "bg-blue-100/24" : "bg-blue-100/35"
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
        className={`relative w-full rounded-2xl backdrop-blur-sm sm:rounded-3xl ${
          isSplitLayout
            ? "max-w-6xl overflow-hidden border border-white/72 bg-[#3c73c8]/52 text-white shadow-[0_18px_50px_rgba(23,56,110,0.28)]"
            : isAdminLogin
              ? "max-w-lg border border-white/72 bg-[#3c73c8]/58 p-6 text-white shadow-[0_18px_50px_rgba(23,56,110,0.32)] sm:p-8 md:p-9 md:pb-10"
              : "max-w-xl border border-white/60 bg-white/86 p-7 shadow-xl md:p-9"
        }`}
      >
        {isSplitLayout ? (
          <div className="grid md:grid-cols-[minmax(0,1.02fr)_minmax(0,1.18fr)]">
            <div className="relative p-7 md:p-10 lg:p-12">
              <div className="absolute inset-0 bg-linear-to-br from-white/12 via-white/6 to-transparent" />
              <div className="relative flex h-full flex-col justify-between gap-12">
                <div>
                  <div className="mb-8 flex items-center gap-4 md:gap-5">
                    <p className="text-2xl font-bold text-[#1f3f73] md:text-[52px]">
                      CitiSent
                    </p>
                    <img
                      src={CitiSentLogo}
                      alt="CitiSent"
                      className="h-19 w-19 md:h-21 md:w-21"
                    />
                  </div>

                  <header className="max-w-md">
                    <h1 className="text-4xl font-semibold text-white md:text-[52px] md:leading-[1.05]">
                      {title}
                    </h1>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-white/85 md:text-base">
                      {subtitle}
                    </p>
                  </header>
                </div>

                <div className="hidden items-center gap-3 md:flex">
                  <span className="h-px w-18 bg-white/32" />
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-200" />
                  <span className="h-px w-28 bg-white/18" />
                </div>
              </div>
            </div>

            <div className="relative border-t border-white/14 bg-white/6 p-7 md:border-t-0 md:border-l md:border-white/14 md:p-10 lg:p-12">
              <div className="absolute inset-y-8 left-0 hidden w-px bg-white/18 md:block" />
              {children}
              {footer ? (
                <footer className="mt-6 text-sm text-white/90">
                  {footer}
                </footer>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div
              className={`mb-8 ${isAdminLogin ? "flex justify-center" : "flex items-center gap-3"}`}
            >
              <div
                className={`flex items-center ${isAdminLogin ? "gap-4 md:gap-5" : "gap-3"}`}
              >
                <p
                  className={`text-3xl font-bold tracking-[-0.035em] ${isAdminLogin ? "text-[#1f3f73] sm:text-4xl md:text-[52px]" : "text-slate-900"}`}
                >
                  CitiSent
                </p>
                <img
                  src={CitiSentLogo}
                  alt="CitiSent"
                  className={`${isAdminLogin ? "h-16 w-16 sm:h-19 sm:w-19 md:h-21 md:w-21" : "h-13 w-13"}`}
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

            <header className={`mb-8 ${isAdminLogin ? "mt-1 sm:mt-2 md:mt-4" : ""}`}>
              <h1
                className={`font-semibold tracking-[-0.035em] ${isAdminLogin ? "max-w-[10ch] text-4xl leading-[0.98] text-white sm:text-5xl md:text-[54px]" : "text-3xl text-slate-900"}`}
              >
                {title}
              </h1>
              <p
                className={`mt-3 max-w-md text-base leading-6 ${isAdminLogin ? "text-white/90" : "text-slate-600"}`}
              >
                {subtitle}
              </p>
            </header>

            {children}

            {footer ? (
              <footer
                className={`mt-7 border-t pt-5 text-sm ${isAdminLogin ? "border-white/20 text-white/90" : "border-slate-200 text-slate-600"}`}
              >
                {footer}
              </footer>
            ) : null}
          </>
        )}
      </MotionSection>
    </main>
  );
}
