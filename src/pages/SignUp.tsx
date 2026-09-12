import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { BRAND_CONFIG } from "../config/brand";
import { Mail, Lock, User, AtSign } from "lucide-react";

interface SignUpProps {
  onNavigateLogin: () => void;
  onSuccess: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onNavigateLogin, onSuccess }) => {
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !username || !email || !password || !confirmPassword) {
      showToast("Please fill in all registration fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }

    setIsLoading(true);
    try {
      await signup(fullName.trim(), username.trim(), email.trim(), password);
      showToast(`Account created successfully! Welcome to ${BRAND_CONFIG.name}.`, "success");
      onSuccess();
    } catch (err: any) {
      showToast(err.message || "Registration failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1 block">
          Get Started
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Join {BRAND_CONFIG.name} to unlock and manage viral AI video prompts.
        </p>
      </div>

      <div className="bg-zinc-900/90 rounded-2xl border border-white/[0.07] shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="signup-fullname-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sarah Jenkins"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="signup-username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sarah_creative"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="signup-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="signup-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="signup-confirm-password-input"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              id="btn-signup-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 shadow-md shadow-violet-500/25"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-400">
          Already have an account?{" "}
          <button
            onClick={onNavigateLogin}
            className="text-violet-400 font-semibold hover:text-violet-300 cursor-pointer"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};
