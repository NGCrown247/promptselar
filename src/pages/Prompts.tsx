import React, { useState, useMemo } from "react";
import { PromptItem, Category } from "../types";
import { PromptCard } from "../components/PromptCard";
import { Search, Sparkles, Plus } from "lucide-react";

interface PromptsProps {
  prompts: PromptItem[];
  categories: Category[];
  purchasedPromptIds: Set<string>;
  onSelectPrompt: (id: string) => void;
  isAdmin?: boolean;
  onCreatePrompt?: () => void;
}

const DEFAULT_CATEGORIES = [
  "All",
  "Babies",
  "Dogs",
  "Family",
  "Comedy",
  "Action",
  "Realistic",
];

export const Prompts: React.FC<PromptsProps> = ({
  prompts,
  categories,
  purchasedPromptIds,
  onSelectPrompt,
  isAdmin,
  onCreatePrompt,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Filter categories combining defaults + any dynamic ones
  const filterCategories = useMemo(() => {
    const list = [...DEFAULT_CATEGORIES];
    categories.forEach((cat) => {
      if (!list.includes(cat.name)) {
        list.push(cat.name);
      }
    });
    return list;
  }, [categories]);

  // Filter prompts by search query and category
  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const matchesCategory =
        selectedCategory === "All" ||
        prompt.categoryName.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        prompt.title.toLowerCase().includes(q) ||
        prompt.description.toLowerCase().includes(q) ||
        prompt.categoryName.toLowerCase().includes(q) ||
        prompt.recommendedModel.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [prompts, selectedCategory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1.5 block">
            Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI Video Prompts
          </h1>
          <p className="mt-2 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Ready-to-use prompts for creating realistic, funny and engaging AI videos.
          </p>
        </div>
        {isAdmin && onCreatePrompt && (
          <div className="shrink-0">
            <button
              id="catalog-create-prompt-card-btn"
              onClick={onCreatePrompt}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-md shadow-violet-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Prompt Card</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Bar & Category Filters */}
      <div className="space-y-5 mb-10">
        {/* Simple Search Bar */}
        <div className="relative max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" />
          <input
            id="prompts-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, model, genre..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-900/90 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filterCategories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                id={`filter-${category.toLowerCase()}`}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500/30 font-semibold shadow-xs shadow-violet-500/25"
                    : "bg-zinc-900/80 text-zinc-400 border-white/[0.06] hover:border-violet-500/30 hover:text-white"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Prompts */}
      {filteredPrompts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onSelect={onSelectPrompt}
              isPurchased={purchasedPromptIds.has(prompt.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-zinc-900/30 rounded-xl border border-dashed border-white/[0.08]">
          <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No prompts found</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-violet-300 bg-violet-950/40 border border-violet-500/30 rounded-lg hover:bg-violet-900/50 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
