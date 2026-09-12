import React from "react";
import { PromptItem } from "../types";
import { PromptCard } from "../components/PromptCard";
import { ArrowRight, Sparkles, Compass, CreditCard, Copy } from "lucide-react";

interface HomeProps {
  prompts: PromptItem[];
  purchasedPromptIds: Set<string>;
  onNavigate: (path: string) => void;
  onSelectPrompt: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  prompts,
  purchasedPromptIds,
  onNavigate,
  onSelectPrompt,
}) => {
  const popularPrompts = prompts.slice(0, 6);

  return (
    <div className="flex flex-col bg-zinc-950 relative overflow-hidden">
      {/* Subtle colorful ambient backdrop lighting */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-br from-violet-600/12 via-indigo-500/10 to-cyan-500/10 blur-3xl pointer-events-none rounded-full"
      />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 text-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Subtle colored pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/40 border border-violet-500/30 text-violet-300 text-xs font-medium mb-6 shadow-xs shadow-violet-950/50">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Curated AI Video Prompts</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Viral AI prompts.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Ready to use.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Get the prompts behind my AI video concepts and start creating your own.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-browse-btn"
              onClick={() => onNavigate("/prompts")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 group"
            >
              <span>Browse Prompts</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              id="hero-how-it-works-btn"
              onClick={() => {
                const el = document.getElementById("how-it-works-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else {
                  onNavigate("/how-it-works");
                }
              }}
              className="w-full sm:w-auto px-5 py-3 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* Popular Prompts Section */}
      <section className="py-14 border-t border-white/[0.06] bg-zinc-950 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                <h2 className="text-2xl font-bold text-white">Popular Prompts</h2>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Hand-crafted concepts designed for maximum engagement
              </p>
            </div>

            <button
              onClick={() => onNavigate("/prompts")}
              className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors inline-flex items-center gap-1 cursor-pointer group"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSelect={onSelectPrompt}
                isPurchased={purchasedPromptIds.has(prompt.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="py-16 sm:py-20 bg-zinc-900/30 border-t border-white/[0.06] px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1.5 block">
              Instant Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How It Works</h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-2">
              Three simple steps to generate viral AI videos with proven camera angles and motion parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div className="bg-zinc-900/80 p-6 sm:p-7 rounded-xl border border-white/[0.06] hover:border-violet-500/30 transition-all flex flex-col group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-black font-mono bg-gradient-to-br from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  01
                </span>
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Compass className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                Browse
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Find a prompt you want to use. Preview concepts, runtimes, and recommended AI models.
              </p>
            </div>

            {/* Step 02 */}
            <div className="bg-zinc-900/80 p-6 sm:p-7 rounded-xl border border-white/[0.06] hover:border-emerald-500/30 transition-all flex flex-col group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-black font-mono bg-gradient-to-br from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  02
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Pay
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Pay securely with USDT via the TRON (TRC20) network. Instant and ultra-low fees.
              </p>
            </div>

            {/* Step 03 */}
            <div className="bg-zinc-900/80 p-6 sm:p-7 rounded-xl border border-white/[0.06] hover:border-cyan-500/30 transition-all flex flex-col group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-black font-mono bg-gradient-to-br from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  03
                </span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Copy className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Copy
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Once payment is confirmed, copy the full prompt. Paste directly into Runway, Kling, Seedance, Sora.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
