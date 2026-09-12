import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Mail, Lock } from "lucide-react";

interface LoginProps {
  onNavigateSignUp: () => void;
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateSignUp, onSuccess }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please provide both email and password.", "error");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      showToast("Logged in successfully!", "success");
      onSuccess();
    } catch (err: any) {
      showToast(err.message || "Invalid credentials", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1 block">
          Welcome
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Login to access your purchased AI video prompts.
        </p>
      </div>

      <div className="bg-zinc-900/90 rounded-2xl border border-white/[0.07] shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <button
                type="button"
                onClick={() => showToast("Password reset email sent to your inbox.", "info")}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 shadow-md shadow-violet-500/25"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-400">
          Don't have an account?{" "}
          <button
            onClick={onNavigateSignUp}
            className="text-violet-400 font-semibold hover:text-violet-300 cursor-pointer"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};
