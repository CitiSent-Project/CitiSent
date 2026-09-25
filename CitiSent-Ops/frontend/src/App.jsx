import React, { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import { opsApiClient } from "./services/opsApiClient";
import { Navbar } from "./components/Navbar";
import { MunicipalDepartmentSeeder } from "./components/MunicipalDepartmentSeeder";
import { SuperadminDirectory } from "./components/SuperadminDirectory";
import { ProvisionSuperadminModal } from "./components/ProvisionSuperadminModal";
import { AuditLogViewer } from "./components/AuditLogViewer";
import { Button } from "./components/common/Button";
import { useToast } from "./context/ToastContext";
import {
  IoCubeOutline,
  IoKeyOutline,
  IoListOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";

export function App() {
  const { showToast } = useToast();
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState("directory"); // 'directory' | 'seeder' | 'audit'
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);

  // Login / Register form state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    setRegisterSuccess(null);

    try {
      if (isRegisterMode) {
        // Register Developer Account via Ops Backend
        const res = await opsApiClient.registerDeveloper({ email, password });
        setRegisterSuccess(res.message);

        // Auto sign-in immediately after registration
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSession(data.session);

        showToast({
          type: "success",
          title: "Developer Registered",
          message: "Welcome! Your account has been provisioned and signed in.",
        });
      } else {
        // Standard Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSession(data.session);

        showToast({
          type: "success",
          title: "Authenticated",
          message: `Signed in as ${email}`,
        });
      }
    } catch (err) {
      const errorMsg = err.message || "Authentication failed.";
      setLoginError(errorMsg);
      showToast({
        type: "error",
        title: "Auth Failed",
        message: errorMsg,
      });
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    showToast({
      type: "info",
      title: "Signed Out",
      message: "Developer session ended.",
    });
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying developer session...</span>
        </div>
      </div>
    );
  }

  // Developer Login Screen
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 p-4 sm:p-6 selection:bg-cyan-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3 shadow-inner">
              <IoShieldCheckmarkOutline className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              CitiSent<span className="text-cyan-400">-Ops</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 uppercase font-semibold tracking-wider">
              Control Plane Authorization
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setLoginError(null);
                setRegisterSuccess(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${!isRegisterMode
                  ? "bg-slate-800 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setLoginError(null);
                setRegisterSuccess(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isRegisterMode
                  ? "bg-slate-800 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              First-Time Setup
            </button>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs font-medium">
              {loginError}
            </div>
          )}

          {registerSuccess && (
            <div className="mb-5 p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs font-medium">
              {registerSuccess}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Developer Whitelisted Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="madriagajohneduard@gmail.com"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none transition-colors"
              />
              {isRegisterMode && (
                <p className="text-[11px] text-slate-500 mt-1">
                  * Must match an email listed in <code>DEVELOPER_ALLOWED_EMAILS</code>.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {isRegisterMode ? "Choose Password" : "Password"}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm placeholder-slate-500 focus:outline-none transition-colors"
              />
              {isRegisterMode && (
                <p className="text-[11px] text-slate-500 mt-1">
                  * Minimum 8 characters.
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loginLoading}
              className="w-full mt-2 py-3"
            >
              {isRegisterMode ? "Register Developer Account" : "Sign In to Ops Console"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
            🔒 Air-Gapped Network. Access is strictly audited and restricted to whitelisted engineering accounts.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        developerEmail={session.user.email}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "directory"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
          >
            <IoKeyOutline className="w-4 h-4" />
            Superadmin Directory
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("seeder")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "seeder"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
          >
            <IoCubeOutline className="w-4 h-4" />
            Department Seeder
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "audit"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
          >
            <IoListOutline className="w-4 h-4" />
            Audit Trail
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === "directory" && (
          <SuperadminDirectory
            onOpenProvisionModal={() => setIsProvisionModalOpen(true)}
          />
        )}

        {activeTab === "seeder" && <MunicipalDepartmentSeeder />}

        {activeTab === "audit" && <AuditLogViewer />}
      </main>

      {/* Provisioning Modal */}
      <ProvisionSuperadminModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onSuccess={() => {
          // If directory is open, it auto-refreshes on open/action
        }}
      />
    </div>
  );
}

export default App;
