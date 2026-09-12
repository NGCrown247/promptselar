import React from "react";
import { PurchaseItem } from "../types";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

interface MyPurchasesProps {
  purchases: PurchaseItem[];
  onOpenPrompt: (promptId: string) => void;
  onBrowsePrompts: () => void;
}

export const MyPurchases: React.FC<MyPurchasesProps> = ({
  purchases,
  onOpenPrompt,
  onBrowsePrompts,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1 block">
          Library
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          My Purchases
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Access the full prompts and parameters for your unlocked video concepts.
        </p>
      </div>

      {purchases.length > 0 ? (
        <div className="space-y-4">
          {purchases.map((item) => (
            <div
              key={item.id}
              id={`purchase-item-${item.id}`}
              className="p-4 sm:p-5 rounded-xl border border-white/[0.07] bg-zinc-900/90 hover:border-violet-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
            >
              {/* Thumbnail + Title info */}
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={
                    item.thumbnailUrl ||
                    "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=400&q=80"
                  }
                  alt={item.promptTitle}
                  className="w-16 h-16 rounded-lg object-cover border border-white/[0.08] shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Unlocked
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white truncate">
                    {item.promptTitle || "AI Video Prompt"}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {item.categoryName ? `${item.categoryName} • ` : ""}
                    <span className="text-emerald-400 font-semibold">{item.amount} {item.currency}</span>
                  </p>
                </div>
              </div>

              {/* Status & Open Prompt Button */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.06]">
                <div className="text-right hidden md:block">
                  <span className="text-[11px] text-zinc-500 block uppercase tracking-wider">Status</span>
                  <span className="text-xs font-semibold text-emerald-400 capitalize">
                    {item.status}
                  </span>
                </div>

                <button
                  id={`btn-open-prompt-${item.promptId}`}
                  onClick={() => onOpenPrompt(item.promptId)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-violet-500/20 group"
                >
                  <span>Open Prompt</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-zinc-900/30 rounded-xl border border-dashed border-white/[0.08]">
          <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No purchases yet</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            Browse our viral AI video prompt collection and unlock your first creative concept.
          </p>
          <button
            onClick={onBrowsePrompts}
            className="mt-5 px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg cursor-pointer transition-all shadow-md shadow-violet-500/20"
          >
            Browse Prompts
          </button>
        </div>
      )}
    </div>
  );
};
