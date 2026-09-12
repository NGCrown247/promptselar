import React from "react";
import { PromptItem } from "../types";
import { ArrowRight, Check } from "lucide-react";

interface PromptCardProps {
  prompt: PromptItem;
  onSelect: (promptId: string) => void;
  isPurchased?: boolean;
}

// Visual color badges for different video genres
const CATEGORY_COLORS: Record<string, string> = {
  Babies: "bg-pink-500/15 text-pink-300 border-pink-500/25",
  Dogs: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Family: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Comedy: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  Action: "bg-red-500/15 text-red-300 border-red-500/25",
  Realistic: "bg-teal-500/15 text-teal-300 border-teal-500/25",
};

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onSelect, isPurchased = false }) => {
  const badgeClass = CATEGORY_COLORS[prompt.categoryName] || "bg-violet-500/15 text-violet-300 border-violet-500/25";

  return (
    <div
      id={`prompt-card-${prompt.id}`}
      className="group bg-zinc-900/90 rounded-xl border border-white/[0.07] overflow-hidden hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-950/20 transition-all duration-300 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative aspect-16/10 bg-zinc-950 overflow-hidden">
        <img
          src={prompt.thumbnailUrl}
          alt={prompt.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />
        {/* Subtle pill overlay for category and status */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={`px-2.5 py-0.5 text-xs font-medium backdrop-blur-md rounded-md border shadow-xs ${badgeClass}`}>
            {prompt.categoryName}
          </span>
          {isPurchased && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-zinc-950 rounded-md shadow-xs flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[2.5]" /> Unlocked
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors leading-snug">
            {prompt.title}
          </h3>
          <p className="text-sm text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
            {prompt.description}
          </p>
        </div>

        {/* Footer info: Price & Action */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-500 block font-normal uppercase tracking-wider">Price</span>
            <div className="text-base font-bold text-emerald-400 flex items-center gap-1">
              <span>{prompt.price}</span>
              <span className="text-xs font-semibold text-emerald-500/80">{prompt.currency}</span>
            </div>
          </div>

          <button
            id={`btn-view-${prompt.id}`}
            onClick={() => onSelect(prompt.id)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-violet-500/10 group/btn"
          >
            <span>{isPurchased ? "Open Prompt" : "View Prompt"}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
