import { motion, useReducedMotion } from 'framer-motion'
import CitiSentLogo from '/assets/CitiSentLogo.svg'

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
          {/* LEFT SIDE: Pure White Background with CitiSent Logo Only */}
          {/* ======================================================== */}
          <section className="relative z-10 flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:py-16 lg:min-h-screen lg:px-12 xl:px-16">
            <MotionDiv
              initial={prefersReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center gap-4 sm:gap-6 text-center select-none"
            >
              <img
                src={CitiSentLogo}
                alt="CitiSent Logo"
                className="h-28 w-28 sm:h-36 sm:w-36 lg:h-44 lg:w-44 xl:h-52 xl:w-52 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              />
              <span className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-[#173f75] block leading-tight">
                CitiSent
              </span>
            </MotionDiv>
          </section>

          {/* ======================================================== */}
          {/* CENTER COLOR TRANSITION: White -> Soft Sky Blue -> Navy  */}
          {/* ======================================================== */}

          {/* Desktop Vertical Curved Divider (hidden on mobile, visible on lg+) */}
          <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-full w-24 sm:w-32 lg:w-36 xl:w-44 z-20 pointer-events-none overflow-visible">
            <MotionDiv
              initial={prefersReduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="h-full w-full"
            >
              <svg
                viewBox="0 0 100 1000"
                preserveAspectRatio="none"
                className="h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  {/* Soft light transition gradient */}
                  <linearGradient id="softTransitionDesktop" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                {/* Soft Light Transition Wave (White -> Soft Transition) */}
                <path
                  d="M 100 0 L 52 0 C 8 260, 88 640, 28 1000 L 100 1000 Z"
                  fill="url(#softTransitionDesktop)"
                />

                {/* Main Navy Blue Wave (Soft Transition -> Navy Blue) */}
                <path
                  d="M 100 0 L 72 0 C 30 260, 98 640, 48 1000 L 100 1000 Z"
                  fill="#173f75"
                />
              </svg>
            </MotionDiv>
          </div>

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
          <section className="relative z-10 flex flex-1 flex-col items-center justify-center bg-[#173f75] px-6 py-10 sm:p-12 lg:min-h-screen lg:px-12 xl:px-16">
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
            <div className="mb-6 flex items-center justify-center gap-3">
              <img src={CitiSentLogo} alt="CitiSent" className="h-12 w-12" />
              <span className="text-2xl font-bold text-white">CitiSent</span>
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
