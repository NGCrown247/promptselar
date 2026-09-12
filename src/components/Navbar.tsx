import React, { useState } from "react";
import { BRAND_CONFIG } from "../config/brand";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Shield, Sparkles } from "lucide-react";

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo with colorful gradient icon */}
        <div className="flex items-center gap-8">
          <button
            id="brand-logo-btn"
            onClick={() => handleNav("/")}
            className="text-left group cursor-pointer focus:outline-hidden flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 fill-white/20" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              {BRAND_CONFIG.name}
            </span>
          </button>

          {/* Desktop Navigation Left Items */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              id="nav-prompts-btn"
              onClick={() => handleNav("/prompts")}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                currentPath === "/prompts"
                  ? "text-violet-400 font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Prompts
            </button>

            {!isAuthenticated ? (
              <button
                id="nav-how-it-works-btn"
                onClick={() => handleNav("/how-it-works")}
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  currentPath === "/how-it-works"
                    ? "text-violet-400 font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                How It Works
              </button>
            ) : (
              <button
                id="nav-my-purchases-btn"
                onClick={() => handleNav("/purchases")}
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  currentPath === "/purchases"
                    ? "text-violet-400 font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                My Purchases
              </button>
            )}

            {isAdmin && (
              <button
                id="nav-admin-btn"
                onClick={() => handleNav("/admin")}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                  currentPath === "/admin"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : "bg-zinc-900 text-zinc-300 border-white/[0.08] hover:bg-zinc-850 hover:text-white"
                }`}
              >
                <Shield className="w-3 h-3 text-amber-400" />
                Admin
              </button>
            )}
          </nav>
        </div>

        {/* Desktop Right Auth Actions */}
        <div className="hidden md:flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <button
                id="nav-login-btn"
                onClick={() => handleNav("/login")}
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer px-3 py-1.5"
              >
                Login
              </button>
              <button
                id="nav-signup-btn"
                onClick={() => handleNav("/signup")}
                className="text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-sm shadow-violet-500/25 transition-all cursor-pointer px-4 py-2 rounded-lg"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              <button
                id="nav-profile-btn"
                onClick={() => handleNav("/profile")}
                className={`text-sm font-medium transition-colors cursor-pointer px-3 py-1.5 ${
                  currentPath === "/profile"
                    ? "text-violet-400 font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Profile ({user?.username || "Account"})
              </button>
              <button
                id="nav-logout-btn"
                onClick={() => {
                  logout();
                  handleNav("/");
                }}
                className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer px-3 py-1.5"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center">
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-md"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.06] bg-zinc-950 px-4 pt-2 pb-6 space-y-3">
          <button
            onClick={() => handleNav("/prompts")}
            className="block w-full text-left py-2 text-base font-medium text-zinc-200 hover:text-white"
          >
            Prompts
          </button>

          {!isAuthenticated ? (
            <>
              <button
                onClick={() => handleNav("/how-it-works")}
                className="block w-full text-left py-2 text-base font-medium text-zinc-200 hover:text-white"
              >
                How It Works
              </button>
              <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                <button
                  onClick={() => handleNav("/login")}
                  className="w-full text-center py-2.5 rounded-lg border border-white/[0.08] text-sm font-medium text-zinc-200 hover:bg-zinc-900"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNav("/signup")}
                  className="w-full text-center py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 shadow-sm shadow-violet-500/25"
                >
                  Sign Up
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNav("/purchases")}
                className="block w-full text-left py-2 text-base font-medium text-zinc-200 hover:text-white"
              >
                My Purchases
              </button>
              <button
                onClick={() => handleNav("/profile")}
                className="block w-full text-left py-2 text-base font-medium text-zinc-200 hover:text-white"
              >
                Profile ({user?.username})
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleNav("/admin")}
                  className="block w-full text-left py-2 text-base font-medium text-amber-300 font-semibold"
                >
                  Admin Panel
                </button>
              )}
              <div className="pt-3 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    logout();
                    handleNav("/");
                  }}
                  className="w-full text-center py-2.5 rounded-lg border border-white/[0.08] text-sm font-medium text-zinc-400 hover:bg-zinc-900"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
