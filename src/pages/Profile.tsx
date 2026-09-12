import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { User, Mail, AtSign, Shield } from "lucide-react";

export const Profile: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      showToast("Name and username cannot be empty.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(fullName.trim(), username.trim());
      showToast("Profile updated successfully.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1 block">
          Account
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          User Profile
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="bg-zinc-900/90 rounded-2xl border border-white/[0.07] shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="profile-full-name-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-sm text-zinc-100 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
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
                id="profile-username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-sm text-zinc-100 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Email Address (Fixed)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                readOnly
                disabled
                value={user?.email || ""}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.05] bg-zinc-950/60 text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Account Role Badge */}
          <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Role: <strong className="capitalize text-zinc-200">{user?.role}</strong>
            </span>
            <span>
              Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "2026"}
            </span>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <button
              id="btn-save-profile"
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-violet-500/20 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
