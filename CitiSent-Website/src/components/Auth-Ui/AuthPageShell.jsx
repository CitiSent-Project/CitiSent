import { motion, useReducedMotion } from 'framer-motion'

const MotionDiv = motion.div

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
  variant = 'admin-login',
  layout = 'split',
}) {
  const isAdminLogin = variant === 'admin-login'
  const isSplitLayout = isAdminLogin && layout !== 'stack'
  const prefersReduced = useReducedMotion()

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-white">
      {isSplitLayout ? (
        <div className="relative min-h-screen w-full flex flex-col lg:flex-row">
          {/* ======================================================== */}
          {/* DESKTOP SPLIT BACKGROUND: login-background-1.svg         */}
          {/* ======================================================== */}
          <img
            src="/assets/login-background-1.svg"
            alt=""
            className="hidden lg:block absolute inset-0 h-full w-full object-cover pointer-events-none select-none z-0"
            aria-hidden="true"
          />

          {/* ======================================================== */}
          {/* LEFT SIDE: Pure White Background with CitiSent Logo Only */}
          {/* ======================================================== */}
          <section className="relative z-10 flex flex-1 flex-col items-center justify-center bg-white lg:bg-transparent px-6 py-12 sm:py-16 lg:min-h-screen lg:px-12 xl:px-16">
            <MotionDiv
              initial={prefersReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center text-center select-none"
            >
              {/* Mobile Logo (<lg): Stacked Lockup (logo-2.png) */}
              <img
                src="/assets/logo-2.png"
                alt="CitiSent Logo"
                className="block lg:hidden w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              />

              {/* Desktop Logo (lg+): Horizontal Lockup (logo-left.png) */}
              <img
                src="/assets/logo-left.png"
                alt="CitiSent Logo"
                className="hidden lg:block w-72 lg:w-80 xl:w-96 max-w-full h-auto object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              />
            </MotionDiv>
          </section>

          {/* Mobile/Tablet Horizontal Curved Divider (visible on <lg, hidden on lg+) */}
          <div className="block lg:hidden relative z-20 w-full -mt-2 -mb-px pointer-events-none">
            <MotionDiv
              initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <svg
                viewBox="0 0 1000 80"
                preserveAspectRatio="none"
                className="w-full h-12 sm:h-16 block"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="softTransitionMobile" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.95" />
                  </linearGradient>
                </defs>

                {/* Soft Light Transition Wave */}
                <path
                  d="M 0 80 L 0 32 C 320 -6, 680 62, 1000 24 L 1000 80 Z"
                  fill="url(#softTransitionMobile)"
                />

                {/* Main Navy Blue Wave */}
                <path
                  d="M 0 80 L 0 52 C 320 12, 680 78, 1000 44 L 1000 80 Z"
                  fill="#173f75"
                />
              </svg>
            </MotionDiv>
          </div>

          {/* ======================================================== */}
          {/* RIGHT SIDE: CitiSent Navy Blue with Centered Login Form  */}
          {/* ======================================================== */}
          <section className="relative z-10 flex flex-1 flex-col items-center justify-center bg-[#173f75] lg:bg-transparent px-6 py-10 sm:p-12 lg:min-h-screen lg:px-12 xl:px-16">
            <MotionDiv
              initial={prefersReduced ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="w-full max-w-md mx-auto"
            >
              <header className="mb-6 sm:mb-8 text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed">
                    {subtitle}
                  </p>
                ) : null}
              </header>

              {children}

              {footer ? (
                <footer className="mt-7 border-t border-white/20 pt-5 text-sm text-blue-100/85">
                  {footer}
                </footer>
              ) : null}
            </MotionDiv>
          </section>
        </div>
      ) : (
        /* Fallback for stacked card layout if explicitly requested */
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-100">
          <div className="w-full max-w-md rounded-2xl bg-[#173f75] p-6 sm:p-8 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-center">
              <img src="/assets/logo-left.png" alt="CitiSent" className="h-10 w-auto object-contain" />
            </div>
            <header className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm text-blue-100/80">{subtitle}</p> : null}
            </header>
            {children}
            {footer ? <footer className="mt-6 border-t border-white/20 pt-4 text-xs text-blue-100/70">{footer}</footer> : null}
          </div>
        </div>
      )}
    </main>
  )
}
