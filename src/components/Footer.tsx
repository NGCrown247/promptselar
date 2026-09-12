import React from "react";
import { BRAND_CONFIG } from "../config/brand";
import { Sparkles } from "lucide-react";

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-white/[0.06] bg-zinc-950 mt-auto py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="text-base font-bold text-white">
                {BRAND_CONFIG.name}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1.5 max-w-sm">
              {BRAND_CONFIG.tagline} Instant prompt unlocking with verified USDT TRC-20 payments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
            <button
              onClick={() => onNavigate("/prompts")}
              className="hover:text-violet-400 transition-colors cursor-pointer"
            >
              Prompts
            </button>
            <button
              onClick={() => onNavigate("/how-it-works")}
              className="hover:text-violet-400 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate("/purchases")}
              className="hover:text-violet-400 transition-colors cursor-pointer"
            >
              My Purchases
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            &copy; {new Date().getFullYear()} {BRAND_CONFIG.name}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
