import React, { useState, useEffect } from "react";
import {
  PromptItem,
  PaymentItem,
  UserProfile,
  AdminStats,
  CryptoWallet,
} from "../types";
import { api } from "../services/api";
import { BRAND_CONFIG } from "../config/brand";
import { useToast } from "../context/ToastContext";
import {
  LayoutDashboard,
  Film,
  Users,
  CreditCard,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  Coins,
  Wallet,
  Copy,
  Check,
} from "lucide-react";

interface AdminProps {
  onBackToSite: () => void;
  initialTab?: AdminTab;
  autoOpenCreate?: boolean;
}

type AdminTab = "overview" | "prompts" | "users" | "payments" | "wallets" | "settings";

export const Admin: React.FC<AdminProps> = ({
  onBackToSite,
  initialTab = "overview",
  autoOpenCreate = false,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Data states
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPrompts: 0,
    totalPurchases: 0,
    totalRevenue: 0,
  });
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);

  // Prompt Form Modal State
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptFormId, setPromptFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFullPrompt, setFormFullPrompt] = useState("");
  const [formCategory, setFormCategory] = useState("Babies");
  const [formPrice, setFormPrice] = useState("2");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formModel, setFormModel] = useState("Runway Gen-3 / Kling 1.5");
  const [formDuration, setFormDuration] = useState("8 seconds");
  const [formIsPublished, setFormIsPublished] = useState(true);

  // User Management Modal State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Crypto Wallet Management State
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletFormId, setWalletFormId] = useState<string | null>(null);
  const [walletSymbol, setWalletSymbol] = useState("USDT");
  const [walletName, setWalletName] = useState("Tether USD");
  const [walletNetwork, setWalletNetwork] = useState("TRON / TRC-20");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletMemo, setWalletMemo] = useState("");
  const [walletInstructions, setWalletInstructions] = useState("");
  const [walletIsDefault, setWalletIsDefault] = useState(false);
  const [walletIsEnabled, setWalletIsEnabled] = useState(true);
  const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);
  const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const results = await Promise.allSettled([
        api.adminGetOverview(),
        api.adminGetPrompts(),
        api.adminGetPayments(),
        api.adminGetUsers(),
        api.adminGetWallets(),
      ]);

      if (results[0].status === "fulfilled") setStats(results[0].value);
      if (results[1].status === "fulfilled") setPrompts(results[1].value);
      if (results[2].status === "fulfilled") setPayments(results[2].value);
      if (results[3].status === "fulfilled") setUsers(results[3].value);
      if (results[4].status === "fulfilled") setWallets(results[4].value);
    } catch (err: any) {
      showToast(err.message || "Failed to load admin data", "error");
    }
  };

  useEffect(() => {
    fetchAdminData();
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (autoOpenCreate) {
      handleOpenCreate();
    }
  }, [initialTab, autoOpenCreate]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setPromptFormId(null);
    setFormTitle("");
    setFormDescription("");
    setFormFullPrompt("");
    setFormCategory("Babies");
    setFormPrice("2");
    setFormThumbnail("https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80");
    setFormModel("Runway Gen-3 / Kling 1.5");
    setFormDuration("8 seconds");
    setFormIsPublished(true);
    setIsEditingPrompt(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prompt: PromptItem) => {
    setPromptFormId(prompt.id);
    setFormTitle(prompt.title);
    setFormDescription(prompt.description);
    setFormFullPrompt(prompt.fullPrompt || "");
    setFormCategory(prompt.categoryName);
    setFormPrice(String(prompt.price));
    setFormThumbnail(prompt.thumbnailUrl);
    setFormModel(prompt.recommendedModel);
    setFormDuration(prompt.duration);
    setFormIsPublished(prompt.isPublished);
    setIsEditingPrompt(true);
  };

  // Save Prompt (Create or Update)
  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim() || !formFullPrompt.trim()) {
      showToast("Title, description, and full prompt are required.", "error");
      return;
    }

    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        fullPrompt: formFullPrompt.trim(),
        categoryName: formCategory,
        price: Number(formPrice) || 2,
        thumbnailUrl: formThumbnail.trim() || "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80",
        recommendedModel: formModel.trim(),
        duration: formDuration.trim(),
        isPublished: formIsPublished,
        preview: `${formFullPrompt.slice(0, 90)}...`,
      };

      if (promptFormId) {
        await api.adminEditPrompt(promptFormId, payload);
        showToast("Prompt updated successfully.", "success");
      } else {
        await api.adminCreatePrompt(payload);
        showToast("New prompt created and saved securely.", "success");
      }

      setIsEditingPrompt(false);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to save prompt", "error");
    }
  };

  // Toggle Prompt Publish status
  const handleTogglePublish = async (prompt: PromptItem) => {
    try {
      await api.adminEditPrompt(prompt.id, { isPublished: !prompt.isPublished });
      showToast(`Prompt is now ${!prompt.isPublished ? "Published" : "Draft"}.`, "info");
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to toggle status", "error");
    }
  };

  // Delete Prompt
  const handleDeletePrompt = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this prompt?")) return;
    try {
      await api.adminDeletePrompt(id);
      showToast("Prompt deleted.", "success");
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete prompt", "error");
    }
  };

  // Emergency Manual Payment Approval
  const handleApprovePayment = async (paymentId: string) => {
    if (!window.confirm("Manually approve this payment? This will unlock the prompt for the user.")) {
      return;
    }

    try {
      await api.adminApprovePayment(paymentId);
      showToast("Payment manually approved. Prompt unlocked for customer.", "success");
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Approval failed", "error");
    }
  };

  // User Management Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newUsername || !newEmail || !newPassword) {
      showToast("Please fill in all user fields", "error");
      return;
    }
    setIsSubmittingUser(true);
    try {
      const created = await api.adminCreateUser({
        fullName: newFullName,
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setUsers([created, ...users]);
      setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
      showToast(`User @${created.username} created successfully with role "${created.role}"!`, "success");
      setIsCreatingUser(false);
      setNewFullName("");
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to create user", "error");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleToggleUserRole = async (userId: string, targetRole: "user" | "admin") => {
    try {
      const updated = await api.adminUpdateUserRole(userId, targetRole);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      showToast(`User @${updated.username} role updated to "${updated.role}"`, "success");
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to update role", "error");
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user @${username}?`)) return;
    try {
      await api.adminDeleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      setStats((prev) => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
      showToast(`User @${username} deleted successfully`, "success");
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete user", "error");
    }
  };

  // Wallet Management Handlers
  const handleOpenCreateWallet = () => {
    setWalletFormId(null);
    setWalletSymbol("BTC");
    setWalletName("Bitcoin");
    setWalletNetwork("Bitcoin Mainnet");
    setWalletAddress("");
    setWalletMemo("");
    setWalletInstructions("Send exact amount. 1 network confirmation required.");
    setWalletIsDefault(false);
    setWalletIsEnabled(true);
    setIsEditingWallet(true);
  };

  const handleOpenEditWallet = (w: CryptoWallet) => {
    setWalletFormId(w.id);
    setWalletSymbol(w.symbol);
    setWalletName(w.name);
    setWalletNetwork(w.network);
    setWalletAddress(w.address);
    setWalletMemo(w.memo || "");
    setWalletInstructions(w.instructions || "");
    setWalletIsDefault(Boolean(w.isDefault));
    setWalletIsEnabled(w.isEnabled);
    setIsEditingWallet(true);
  };

  const handleCopyWalletAddress = (id: string, addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedWalletId(id);
    showToast("Wallet address copied to clipboard!", "success");
    setTimeout(() => setCopiedWalletId(null), 2000);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletSymbol.trim() || !walletName.trim() || !walletNetwork.trim() || !walletAddress.trim()) {
      showToast("Symbol, Name, Network, and Deposit Address are required.", "error");
      return;
    }

    setIsSubmittingWallet(true);
    try {
      if (walletFormId) {
        await api.adminUpdateWallet(walletFormId, {
          symbol: walletSymbol.trim().toUpperCase(),
          name: walletName.trim(),
          network: walletNetwork.trim(),
          address: walletAddress.trim(),
          memo: walletMemo.trim(),
          instructions: walletInstructions.trim(),
          isDefault: walletIsDefault,
          isEnabled: walletIsEnabled,
        });
        showToast(`Updated ${walletSymbol} wallet successfully!`, "success");
      } else {
        await api.adminCreateWallet({
          symbol: walletSymbol.trim().toUpperCase(),
          name: walletName.trim(),
          network: walletNetwork.trim(),
          address: walletAddress.trim(),
          memo: walletMemo.trim(),
          instructions: walletInstructions.trim(),
          isDefault: walletIsDefault,
          isEnabled: walletIsEnabled,
        });
        showToast(`Added new ${walletSymbol} payment method!`, "success");
      }
      setIsEditingWallet(false);
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to save wallet.", "error");
    } finally {
      setIsSubmittingWallet(false);
    }
  };

  const handleDeleteWallet = async (id: string, symbol: string) => {
    if (!window.confirm(`Are you sure you want to delete the ${symbol} payment wallet?`)) return;
    try {
      await api.adminDeleteWallet(id);
      showToast(`Deleted ${symbol} wallet.`, "success");
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete wallet.", "error");
    }
  };

  const handleToggleWalletStatus = async (w: CryptoWallet) => {
    try {
      await api.adminUpdateWallet(w.id, { isEnabled: !w.isEnabled });
      showToast(`${w.symbol} is now ${!w.isEnabled ? "enabled" : "disabled"}`, "info");
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to toggle status", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {BRAND_CONFIG.name} Admin
          </h1>
        </div>

        <button
          onClick={onBackToSite}
          className="text-xs font-semibold text-zinc-300 hover:text-white border border-white/[0.08] px-3.5 py-2 rounded-lg hover:bg-zinc-900 transition-colors self-start cursor-pointer"
        >
          &larr; Exit to Storefront
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-4 border-b border-white/[0.06] scrollbar-none mb-8">
        <button
          id="admin-tab-overview"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-xs shadow-violet-500/25"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          id="admin-tab-prompts"
          onClick={() => setActiveTab("prompts")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "prompts"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-xs shadow-violet-500/25"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Prompts ({prompts.length})</span>
        </button>

        <button
          id="admin-tab-users"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "users"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-xs shadow-violet-500/25"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users ({users.length})</span>
        </button>

        <button
          id="admin-tab-payments"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "payments"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-xs shadow-violet-500/25"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payments ({payments.length})</span>
        </button>

        <button
          id="admin-tab-wallets"
          onClick={() => setActiveTab("wallets")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "wallets"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-xs shadow-violet-500/25"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Crypto & Wallets ({wallets.length})</span>
        </button>

        <button
          id="admin-tab-settings"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "settings"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-xs shadow-violet-500/25"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Quick Actions & Live Supabase Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.08] bg-zinc-900/80">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Live Supabase Database Connected</div>
                <div className="text-[11px] text-zinc-400">Users, profiles, prompts, and USDT payments sync directly</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                id="overview-create-prompt-btn"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-sm shadow-violet-500/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Prompt Card</span>
              </button>
              <button
                id="overview-manage-prompts-btn"
                onClick={() => setActiveTab("prompts")}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition-all border border-white/[0.06]"
              >
                Manage Prompts
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-white/[0.07] bg-zinc-900/80">
              <span className="text-xs text-zinc-400 block font-normal">Total users</span>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {stats.totalUsers}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.07] bg-zinc-900/80">
              <span className="text-xs text-zinc-400 block font-normal">Total prompts</span>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {stats.totalPrompts}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.07] bg-zinc-900/80">
              <span className="text-xs text-zinc-400 block font-normal">Total purchases</span>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {stats.totalPurchases}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/15">
              <span className="text-xs text-emerald-400/80 block font-normal">Total revenue</span>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
                {stats.totalRevenue} USDT
              </div>
            </div>
          </div>

          {/* Recent Activity Table Preview */}
          <div className="bg-zinc-900/90 rounded-xl border border-white/[0.07] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Recent Payment Records</h2>
              <button
                onClick={() => setActiveTab("payments")}
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
              >
                View all &rarr;
              </button>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {payments.slice(0, 5).map((pay) => (
                <div key={pay.id} className="p-4 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-semibold text-white block">{pay.promptTitle}</span>
                    <span className="text-zinc-500 text-xs">{pay.userEmail} &bull; {new Date(pay.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 block">{pay.amount} {pay.currency}</span>
                    <span className={`text-xs capitalize font-semibold ${
                      pay.status === "confirmed" ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {pay.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROMPTS */}
      {activeTab === "prompts" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Manage Video Prompts</h2>
            <button
              id="admin-create-prompt-btn"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-violet-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Prompt</span>
            </button>
          </div>

          <div className="bg-zinc-900/90 rounded-xl border border-white/[0.07] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-zinc-950/60 border-b border-white/[0.06] text-zinc-400 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Thumbnail</th>
                    <th className="py-3 px-4">Title & Concept</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {prompts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <img
                          src={p.thumbnailUrl}
                          alt={p.title}
                          className="w-12 h-12 rounded object-cover border border-white/[0.08]"
                        />
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-white">{p.title}</div>
                        <div className="text-zinc-400 text-xs truncate mt-0.5">{p.description}</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{p.categoryName}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400 whitespace-nowrap">
                        {p.price} {p.currency}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublish(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer border ${
                            p.isPublished
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                              : "bg-zinc-800/80 text-zinc-400 border-white/[0.08]"
                          }`}
                        >
                          {p.isPublished ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3" />}
                          <span>{p.isPublished ? "Published" : "Draft"}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                          title="Edit prompt"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(p.id)}
                          className="p-1.5 rounded-md hover:bg-red-950/50 text-zinc-500 hover:text-red-400 cursor-pointer"
                          title="Delete prompt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USERS */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Registered Users & Roles</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage roles (Admin vs. User / Creator) and create new user accounts directly in the database.
              </p>
            </div>
            <button
              id="admin-create-user-btn"
              onClick={() => setIsCreatingUser(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-violet-500/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </button>
          </div>

          <div className="bg-zinc-900/90 rounded-xl border border-white/[0.07] overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-950/60 border-b border-white/[0.06] text-zinc-400 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-semibold text-white">{u.fullName}</td>
                    <td className="py-3 px-4 text-violet-400 font-mono">@{u.username}</td>
                    <td className="py-3 px-4 text-zinc-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleToggleUserRole(u.id, e.target.value as "user" | "admin")}
                        className="bg-zinc-950 border border-white/[0.12] rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-hidden focus:border-violet-500 cursor-pointer font-medium"
                      >
                        <option value="user">User / Creator</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-1.5 rounded-md hover:bg-red-950/50 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        title={`Delete user @${u.username}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">USDT Payment Audit</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatic blockchain verification operates on TRON TRC20. Manual approval available for exceptions.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/90 rounded-xl border border-white/[0.07] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-zinc-950/60 border-b border-white/[0.06] text-zinc-400 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Prompt</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Network</th>
                    <th className="py-3 px-4">Transaction Hash</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Emergency Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-zinc-800/40">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{pay.userName}</span>
                        <span className="text-xs text-zinc-500">{pay.userEmail}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-medium">{pay.promptTitle}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {pay.amount} {pay.currency}
                      </td>
                      <td className="py-3 px-4 text-cyan-400 text-xs font-mono">{pay.network}</td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                        {pay.transactionHash ? `${pay.transactionHash.slice(0, 8)}...${pay.transactionHash.slice(-6)}` : "None"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                          pay.status === "confirmed"
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                            : pay.status === "failed"
                            ? "bg-red-950/60 text-red-300 border border-red-500/30"
                            : "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-xs">
                        {new Date(pay.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {pay.status !== "confirmed" ? (
                          <button
                            onClick={() => handleApprovePayment(pay.id)}
                            className="px-3 py-1 rounded-md bg-emerald-500 text-zinc-950 text-xs font-bold hover:bg-emerald-400 cursor-pointer shadow-xs shadow-emerald-500/20"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-xs font-semibold flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" /> Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CRYPTO WALLETS MANAGEMENT */}
      {activeTab === "wallets" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Crypto Payment Gateways & Wallets</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Update receiving USDT details, delete outdated addresses, and add another crypto payment method for your store.
              </p>
            </div>
            <button
              id="admin-add-crypto-btn"
              onClick={handleOpenCreateWallet}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-sm shadow-violet-500/25 transition-all self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Crypto</span>
            </button>
          </div>

          {/* Featured Primary USDT Card */}
          {(() => {
            const primaryUsdt = wallets.find((w) => w.symbol === "USDT" && w.isDefault) || wallets.find((w) => w.symbol === "USDT");
            const usdtAddr = primaryUsdt ? primaryUsdt.address : BRAND_CONFIG.defaultUsdtWallet;
            return (
              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-zinc-900 to-zinc-950 relative overflow-hidden shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      ₮
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">USDT (Tether USD)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Primary Checkout Asset
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          TRC-20
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 mt-0.5 block">
                        Network: TRON (TRC-20) &bull; Verified in real-time via TRON Grid & Supabase
                      </span>
                    </div>
                  </div>

                  <button
                    id="admin-update-usdt-btn"
                    onClick={() => {
                      if (primaryUsdt) {
                        handleOpenEditWallet(primaryUsdt);
                      } else {
                        handleOpenCreateWallet();
                        setWalletSymbol("USDT");
                        setWalletName("Tether USD");
                        setWalletNetwork("TRON / TRC-20");
                        setWalletAddress(BRAND_CONFIG.defaultUsdtWallet);
                        setWalletIsDefault(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Update USDT Details</span>
                  </button>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Current USDT Receiving Address:
                  </label>
                  <div className="flex items-center justify-between gap-3 p-3 bg-zinc-950 rounded-xl border border-white/[0.08] font-mono text-xs text-emerald-300">
                    <span className="break-all">{usdtAddr}</span>
                    <button
                      onClick={() => handleCopyWalletAddress("primary-usdt", usdtAddr)}
                      className="p-1.5 rounded-md hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-300 transition-colors shrink-0 cursor-pointer"
                      title="Copy address"
                    >
                      {copiedWalletId === "primary-usdt" ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Wallets Table */}
          <div className="bg-zinc-900/90 rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">All Configured Crypto Payment Methods</h3>
                <p className="text-xs text-zinc-400">Total: {wallets.length} active or available gateways</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/60 text-xs text-zinc-400 uppercase border-b border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-4">Crypto Asset</th>
                    <th className="py-3 px-4">Network</th>
                    <th className="py-3 px-4">Receiving Address</th>
                    <th className="py-3 px-4">Memo / Tag</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {wallets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                        No crypto wallets configured yet. Click "Add Another Crypto" above to create one.
                      </td>
                    </tr>
                  ) : (
                    wallets.map((w) => (
                      <tr key={w.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{w.symbol}</span>
                            <span className="text-xs text-zinc-400 hidden sm:inline">({w.name})</span>
                            {w.isDefault && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                                Primary
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-300">
                          {w.network}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 max-w-xs">
                            <span className="font-mono text-xs text-zinc-200 truncate">
                              {w.address}
                            </span>
                            <button
                              onClick={() => handleCopyWalletAddress(w.id, w.address)}
                              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors shrink-0 cursor-pointer"
                              title="Copy"
                            >
                              {copiedWalletId === w.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-400">
                          {w.memo ? (
                            <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded border border-white/[0.06]">
                              {w.memo}
                            </span>
                          ) : (
                            <span className="text-zinc-600">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleWalletStatus(w)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer border transition-colors ${
                              w.isEnabled
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700"
                            }`}
                          >
                            {w.isEnabled ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`edit-wallet-${w.symbol.toLowerCase()}`}
                              onClick={() => handleOpenEditWallet(w)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              title="Edit wallet details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-wallet-${w.symbol.toLowerCase()}`}
                              onClick={() => handleDeleteWallet(w.id, w.symbol)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete wallet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-6">
          <h2 className="text-lg font-bold text-white">Store & Blockchain Settings</h2>

          <div className="bg-zinc-900/90 p-6 rounded-xl border border-white/[0.07] space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  USDT Receiving Wallet Address (TRC20)
                </label>
                <button
                  onClick={() => {
                    const primary = wallets.find((w) => w.symbol === "USDT");
                    if (primary) {
                      handleOpenEditWallet(primary);
                    } else {
                      setActiveTab("wallets");
                    }
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Update Address</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    wallets.find((w) => w.symbol === "USDT" && w.isDefault)?.address ||
                    wallets.find((w) => w.symbol === "USDT")?.address ||
                    BRAND_CONFIG.defaultUsdtWallet
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 font-mono text-xs text-zinc-200"
                />
                <button
                  onClick={() => {
                    const addr =
                      wallets.find((w) => w.symbol === "USDT" && w.isDefault)?.address ||
                      wallets.find((w) => w.symbol === "USDT")?.address ||
                      BRAND_CONFIG.defaultUsdtWallet;
                    handleCopyWalletAddress("settings-usdt", addr);
                  }}
                  className="p-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer transition-colors shrink-0"
                >
                  {copiedWalletId === "settings-usdt" ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <span className="text-xs text-zinc-500 mt-1 block">
                Synchronized with Supabase and TRON grid verification
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                TRON Smart Contract
              </label>
              <input
                type="text"
                readOnly
                value={BRAND_CONFIG.tokenContract}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 font-mono text-xs text-zinc-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Supabase Deployment Status
              </label>
              <div className="p-3 bg-zinc-950 border border-white/[0.08] rounded-lg text-xs text-zinc-400 space-y-1">
                <p>Database schema ready in: <strong className="font-mono text-cyan-300">supabase/schema.sql</strong></p>
                <p>USDT Verification Edge Function ready in: <strong className="font-mono text-cyan-300">supabase/functions/verify-payment/</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Prompt */}
      {isEditingPrompt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.08] shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <h2 className="text-xl font-bold text-white">
                {promptFormId ? "Edit Video Prompt" : "Create New Video Prompt"}
              </h2>
              <button
                onClick={() => setIsEditingPrompt(false)}
                className="text-zinc-400 hover:text-white text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Baby & Dog — Toy Thief"
                  className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="One-line summary for the catalog card"
                  className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] text-sm bg-zinc-950 text-white focus:outline-hidden focus:border-violet-500 transition-all"
                  >
                    <option value="Babies">Babies</option>
                    <option value="Dogs">Dogs</option>
                    <option value="Family">Family</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Action">Action</option>
                    <option value="Realistic">Realistic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Price (USDT)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Recommended AI Model
                  </label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="e.g. Runway Gen-3 Alpha / Kling 1.5"
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 8 seconds"
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  value={formThumbnail}
                  onChange={(e) => setFormThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Full Prompt (Protected &amp; Encrypted)
                  </label>
                  <span className="text-[10px] text-cyan-400">
                    Only revealed upon verified payment
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={formFullPrompt}
                  onChange={(e) => setFormFullPrompt(e.target.value)}
                  placeholder="Enter the complete AI video prompt with camera angles, lighting, FPS, seed..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm font-mono focus:outline-hidden focus:border-violet-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="form-is-published"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="form-is-published" className="text-xs font-medium text-zinc-300 cursor-pointer">
                  Publish to marketplace immediately
                </label>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingPrompt(false)}
                  className="px-4 py-2 rounded-lg border border-white/[0.08] text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-violet-500/25"
                >
                  Save Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.08] shadow-2xl max-w-md w-full p-6 sm:p-8 my-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create New User</h2>
                  <p className="text-xs text-zinc-400">Add an account directly to the database</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingUser(false)}
                className="text-zinc-400 hover:text-white text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. alex"
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "user" | "admin")}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 cursor-pointer"
                  >
                    <option value="user">User / Creator</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set initial password"
                  className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-violet-500 transition-all"
                />
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-4 py-2 rounded-lg border border-white/[0.08] text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-md shadow-violet-500/25"
                >
                  {isSubmittingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Crypto Wallet */}
      {isEditingWallet && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl border border-white/[0.08] shadow-2xl max-w-lg w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {walletFormId ? `Edit ${walletSymbol} Details` : "Add Crypto Payment Method"}
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Saves directly to Supabase and updates customer checkout
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingWallet(false)}
                className="text-zinc-400 hover:text-white text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveWallet} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Asset Symbol *
                  </label>
                  <input
                    type="text"
                    required
                    value={walletSymbol}
                    onChange={(e) => setWalletSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. USDT, BTC, ETH"
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm uppercase focus:outline-hidden focus:border-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder="e.g. Tether USD, Bitcoin"
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Network *
                  </label>
                  <input
                    type="text"
                    required
                    value={walletNetwork}
                    onChange={(e) => setWalletNetwork(e.target.value)}
                    placeholder="e.g. TRON / TRC-20, Mainnet"
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Memo / Destination Tag
                  </label>
                  <input
                    type="text"
                    value={walletMemo}
                    onChange={(e) => setWalletMemo(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Receiving Deposit Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter crypto wallet address"
                  className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-xs font-mono focus:outline-hidden focus:border-amber-500 resize-none break-all"
                />
                <span className="text-[11px] text-zinc-500 mt-0.5 block">
                  All incoming customer payments for {walletSymbol} will be routed to this exact address.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Customer Payment Instructions
                </label>
                <input
                  type="text"
                  value={walletInstructions}
                  onChange={(e) => setWalletInstructions(e.target.value)}
                  placeholder="e.g. Send exact amount. 1 confirmation required."
                  className="w-full px-3.5 py-2 rounded-lg border border-white/[0.08] bg-zinc-950 text-white text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="wallet-is-default"
                    checked={walletIsDefault}
                    onChange={(e) => setWalletIsDefault(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="wallet-is-default" className="text-xs text-zinc-300 cursor-pointer">
                    Set as primary / default address for {walletSymbol}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="wallet-is-enabled"
                    checked={walletIsEnabled}
                    onChange={(e) => setWalletIsEnabled(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="wallet-is-enabled" className="text-xs text-zinc-300 cursor-pointer">
                    Enable for customer checkout immediately
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingWallet(false)}
                  className="px-4 py-2 rounded-lg border border-white/[0.08] text-xs font-medium text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-wallet-btn"
                  type="submit"
                  disabled={isSubmittingWallet}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-zinc-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20"
                >
                  {isSubmittingWallet ? "Saving..." : walletFormId ? "Update Details" : "Save Crypto Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
