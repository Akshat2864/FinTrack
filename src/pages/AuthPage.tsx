import React, { useState } from "react";
import { supabase } from "../services/supabase";
import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";


export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error, data } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Authentication Error Details:", {
        message: error.message,
        status: (error as any).status,
        code: (error as any).code,
      });

      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError(
          "Please check your inbox to confirm your email before logging in.",
        );
      } else if (
        error.message.toLowerCase().includes("invalid login credentials")
      ) {
        setError(
          'Invalid identifier or passkey. If you haven\'t joined yet, please "Request Access" first.',
        );
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      if (!isLogin && !data.session) {
        // Sign up successful but no session = email confirmation required
        setError(
          "Entry recorded. Please confirm your email address to activate your access.",
        );
        setIsLogin(true);
        setLoading(false);
      } else {
        console.log("Authentication Successful:", {
          email: data.user?.email,
          hasSession: !!data.session,
          token: data.session?.access_token?.substring(0, 10) + "...",
        });
        // Force a page reload to ensure auth state is fresh across all components
        window.location.assign("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_1px_1px,#00000005_1px,transparent_0)] bg-[size:40px_40px] font-sans">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-sm p-12 shadow-2xl shadow-black/5 border border-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <div className="text-[10px] uppercase tracking-[0.4em] font-bold text-black/10 origin-bottom-right rotate-90 translate-x-4">
              Est. 2026
            </div>
          </div>

          <div className="flex flex-col items-center mb-12">
            <div className="w-16 h-16 border border-black rounded-full overflow-hidden flex items-center justify-center mb-8">
              <img
                src="./cropped_icon.png"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl font-serif text-[#1A1A1A]">
              {isLogin ? "Access Portal" : "Register Entry"}
            </h1>
            <p className="text-black/40 mt-3 text-center text-xs uppercase tracking-widest font-bold">
              {isLogin
                ? "Personal Finance Management"
                : "Join the Financial Audit"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 ml-1">
                Universal Identifier
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@institution.com"
                  className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm py-4 px-5 outline-none transition-all duration-300 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 ml-1">
                Secure Passkey
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#F9FAFB] border border-black/10 focus:border-black rounded-sm py-4 px-5 outline-none transition-all duration-300 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-red-600 border border-red-600/20 bg-red-50 p-5 rounded-sm"
              >
                <AlertCircle size={16} />
                <p>{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "w-full py-5 rounded-sm font-bold text-[10px] uppercase tracking-[0.3em] transition-all duration-500 shadow-xl",
                loading
                  ? "bg-black/20 cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/90 shadow-black/10 active:scale-[0.98]",
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <span>{isLogin ? "Authenticate" : "Comfirm Entry"}</span>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-black/5 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-black/30 text-[10px] font-bold uppercase tracking-widest hover:text-black transition-colors"
            >
              {isLogin ? (
                <>
                  New User?{" "}
                  <span className="text-black border-b border-black ml-2">
                    Request Access
                  </span>
                </>
              ) : (
                <>
                  Existing Member?{" "}
                  <span className="text-black border-b border-black ml-2">
                    Portal Entrance
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-black/10 text-[10px] mt-12 uppercase tracking-[0.5em] font-bold">
          Encrypted Ledger System • v1.0.1.1
        </p>
      </motion.div>
    </div>
  );
};
