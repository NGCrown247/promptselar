import React, { useState } from "react";
import { PromptItem } from "../types";
import { useToast } from "../context/ToastContext";
import { Lock, Copy, Check, ArrowLeft, Play, Sparkles, Clock, Layers } from "lucide-react";

interface PromptDetailsProps {
  prompt: PromptItem;
  onBack: () => void;
  onUnlock: (promptId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Babies: "bg-pink-500/15 text-pink-300 border-pink-500/25",
  Dogs: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Family: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Comedy: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  Action: "bg-red-500/15 text-red-300 border-red-500/25",
  Realistic: "bg-teal-500/15 text-teal-300 border-teal-500/25",
};

export const PromptDetails: React.FC<PromptDetailsProps> = ({
  prompt,
  onBack,
  onUnlock,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const handleCopy = () => {
    if (!prompt.fullPrompt) return;
    navigator.clipboard.writeText(prompt.fullPrompt);
    setCopied(true);
    showToast("Prompt copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const isUnlocked = Boolean(prompt.isUnlocked && prompt.fullPrompt);
  const badgeClass = CATEGORY_COLORS[prompt.categoryName] || "bg-violet-500/15 text-violet-300 border-violet-500/25";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Back navigation */}
      <button
        id="btn-back-to-prompts"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-violet-300 transition-colors mb-6 cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to prompts</span>
      </button>

      {/* Main Container */}
      <div className="bg-zinc-900/90 rounded-2xl border border-white/[0.07] overflow-hidden shadow-xl">
        {/* Large Media Preview */}
        <div className="relative aspect-16/9 bg-zinc-950 overflow-hidden flex items-center justify-center">
          <img
            src={prompt.thumbnailUrl}
            alt={prompt.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isPlayingVideo ? "opacity-30" : "opacity-90"
            }`}
          />
          {!isPlayingVideo ? (
            <button
              onClick={() => setIsPlayingVideo(true)}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 text-white flex items-center justify-center hover:scale-108 transition-all shadow-xl shadow-violet-950/60 cursor-pointer"
              title="Preview AI Concept Video"
            >
              <Play className="w-6 h-6 ml-0.5 fill-current" />
            </button>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-black/75 backdrop-blur-xs">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-3 text-violet-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-white">
                AI Video Concept: {prompt.title}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Rendered with {prompt.recommendedModel} &bull; {prompt.duration}
              </p>
              <button
                onClick={() => setIsPlayingVideo(false)}
                className="mt-4 px-3.5 py-1.5 rounded-lg bg-zinc-800/80 border border-white/[0.08] text-xs text-zinc-300 hover:text-white cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          )}

          {/* Badge overlays */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`px-3 py-1 rounded-md text-xs font-semibold backdrop-blur-md border shadow-xs ${badgeClass}`}>
              {prompt.categoryName}
            </span>
            {isUnlocked && (
              <span className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500 text-zinc-950 shadow-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Prompt Unlocked ✓
              </span>
            )}
          </div>
        </div>

        {/* Details section */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-white/[0.06]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {prompt.title}
              </h1>
              <p className="text-base text-zinc-400 mt-2 leading-relaxed max-w-2xl">
                {prompt.description}
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 shrink-0 min-w-36 text-right md:text-left">
              <span className="text-[11px] text-emerald-400/80 font-medium block uppercase tracking-wider">
                Price
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                {prompt.price} <span className="text-sm font-semibold">{prompt.currency}</span>
              </div>
              <span className="text-xs text-emerald-500/60 block mt-1">
                TRON / TRC20
              </span>
            </div>
          </div>

          {/* Metadata Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-5 border-b border-white/[0.06] text-sm">
            <div>
              <span className="text-xs text-zinc-500 block font-normal">Category</span>
              <span className="font-semibold text-zinc-200 mt-0.5 block">{prompt.categoryName}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block font-normal flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-violet-400" /> Recommended AI Model
              </span>
              <span className="font-semibold text-zinc-200 mt-0.5 block">{prompt.recommendedModel}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block font-normal flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Duration
              </span>
              <span className="font-semibold text-zinc-200 mt-0.5 block">{prompt.duration}</span>
            </div>
          </div>

          {/* Prompt Section: Locked vs Unlocked */}
          <div className="mt-8">
            {isUnlocked && prompt.fullPrompt ? (
              /* Unlocked Prompt State */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 stroke-[2.5]" /> Prompt Unlocked ✓
                    </span>
                  </div>

                  <button
                    id="copy-unlocked-prompt-btn"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all cursor-pointer shadow-xs shadow-emerald-500/20"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Prompt Code / Text Box */}
                <div className="p-5 rounded-xl bg-emerald-950/15 border border-emerald-500/25 text-sm sm:text-base text-zinc-100 leading-relaxed font-mono select-all whitespace-pre-wrap">
                  {prompt.fullPrompt}
                </div>

                {/* Purchase metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 pt-2">
                  <span>
                    Purchased on:{" "}
                    <strong className="text-zinc-400 font-normal">
                      {prompt.purchasedAt ? new Date(prompt.purchasedAt).toLocaleDateString() : "Active License"}
                    </strong>
                  </span>
                  {prompt.transactionHash && (
                    <span>
                      Transaction:{" "}
                      <span className="font-mono text-cyan-400">
                        {prompt.transactionHash.slice(0, 10)}...{prompt.transactionHash.slice(-8)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Locked Prompt Preview State */
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                    Prompt Preview
                  </h3>
                </div>

                {/* Visible Preview Text + Blurred Locked Remainder */}
                <div className="relative rounded-xl border border-white/[0.07] p-5 bg-zinc-950/70 overflow-hidden">
                  <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                    "{prompt.preview}"
                  </p>

                  {/* Blurred fake continuation lines */}
                  <div className="mt-3 filter blur-sm select-none opacity-90 text-sm sm:text-base text-zinc-500 leading-relaxed font-mono">
                    cinematic lighting, handheld micro-jitter 4k 24fps shallow depth of field,
                    subtle film grain 35mm anamorphic camera physics, hyper-detailed skin texture,
                    documentary realism, viral pacing...
                  </div>

                  {/* Lock Callout Overlay */}
                  <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-zinc-300">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Full prompt locked
                        </div>
                        <div className="text-xs text-zinc-400">
                          Unlock to reveal complete camera, lighting, and negative prompts
                        </div>
                      </div>
                    </div>

                    <button
                      id="unlock-prompt-btn"
                      onClick={() => onUnlock(prompt.id)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Unlock Prompt — {prompt.price} {prompt.currency}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
