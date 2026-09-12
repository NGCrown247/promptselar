import React, { useState, useEffect } from "react";
import { ToastProvider, useToast } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Prompts } from "./pages/Prompts";
import { PromptDetails } from "./pages/PromptDetails";
import { Checkout } from "./pages/Checkout";
import { MyPurchases } from "./pages/MyPurchases";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { Admin } from "./pages/Admin";
import { api } from "./services/api";
import { PromptItem, Category, PurchaseItem } from "./types";
import { BRAND_CONFIG } from "./config/brand";
import { Loader2 } from "lucide-react";

function MainApp() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined" && window.location.pathname) {
      return window.location.pathname;
    }
    return "/";
  });
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [adminInitialTab, setAdminInitialTab] = useState<
    "overview" | "prompts" | "users" | "payments" | "settings"
  >("overview");
  const [adminAutoOpenCreate, setAdminAutoOpenCreate] = useState<boolean>(false);

  // Sync browser document title with brand config
  useEffect(() => {
    document.title = `${BRAND_CONFIG.name} — ${BRAND_CONFIG.tagline}`;
  }, []);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        setCurrentPath(window.location.pathname || "/");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Redirect authenticated user away from login/signup pages
  useEffect(() => {
    if (isAuthenticated && (currentPath === "/login" || currentPath === "/signup")) {
      const destination = isAdmin ? "/admin" : "/prompts";
      handleNavigate(destination);
    }
  }, [isAuthenticated, isAdmin, currentPath]);

  // Load prompts & categories
  const loadMarketplaceData = async () => {
    try {
      const [promptsData, categoriesData] = await Promise.all([
        api.getPrompts(),
        api.getCategories().catch(() => []),
      ]);
      setPrompts(promptsData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Marketplace fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load user purchases
  const loadUserPurchases = async () => {
    if (!isAuthenticated) {
      setPurchases([]);
      return;
    }
    try {
      const userPurchases = await api.getPurchases();
      setPurchases(userPurchases);
    } catch (err: any) {
      console.warn("Could not load user purchases:", err);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  useEffect(() => {
    loadUserPurchases();
  }, [isAuthenticated, user?.id]);

  // Set of purchased prompt IDs
  const purchasedPromptIds = new Set(purchases.map((p) => p.promptId));

  // Handle URL changes & back/forward navigation
  const handleNavigate = (path: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (path !== "/admin") {
      setAdminAutoOpenCreate(false);
    }
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
    setCurrentPath(path);
  };

  const handleOpenCreatePromptModal = () => {
    setAdminInitialTab("prompts");
    setAdminAutoOpenCreate(true);
    handleNavigate("/admin");
  };

  // Select a prompt to view details
  const handleSelectPrompt = async (id: string) => {
    try {
      const details = await api.getPromptDetails(id);
      setSelectedPrompt(details);
      handleNavigate(`/prompts/${id}`);
    } catch (err: any) {
      showToast(err.message || "Failed to load prompt", "error");
    }
  };

  // Initiate unlock / checkout flow
  const handleUnlockPrompt = (promptId: string) => {
    if (!selectedPrompt || selectedPrompt.id !== promptId) {
      const p = prompts.find((item) => item.id === promptId);
      if (p) setSelectedPrompt(p);
    }
    handleNavigate(`/checkout/${promptId}`);
  };

  // On payment success from checkout
  const handlePaymentSuccess = (updatedPrompt: PromptItem) => {
    setSelectedPrompt(updatedPrompt);
    loadUserPurchases();
    handleNavigate(`/prompts/${updatedPrompt.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-violet-500/30 selection:text-violet-200">
      {/* Global Minimal Navbar */}
      <Navbar currentPath={currentPath} onNavigate={handleNavigate} />

      {/* Main View Area */}
      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
            <p className="text-sm font-medium">Loading {BRAND_CONFIG.name}...</p>
          </div>
        ) : (
          <>
            {currentPath === "/" && (
              <Home
                prompts={prompts}
                purchasedPromptIds={purchasedPromptIds}
                onNavigate={handleNavigate}
                onSelectPrompt={handleSelectPrompt}
              />
            )}

            {currentPath === "/prompts" && (
              <Prompts
                prompts={prompts}
                categories={categories}
                purchasedPromptIds={purchasedPromptIds}
                onSelectPrompt={handleSelectPrompt}
                isAdmin={isAdmin}
                onCreatePrompt={handleOpenCreatePromptModal}
              />
            )}

            {currentPath === "/how-it-works" && (
              <Home
                prompts={prompts}
                purchasedPromptIds={purchasedPromptIds}
                onNavigate={handleNavigate}
                onSelectPrompt={handleSelectPrompt}
              />
            )}

            {currentPath.startsWith("/prompts/") && selectedPrompt && (
              <PromptDetails
                prompt={selectedPrompt}
                onBack={() => handleNavigate("/prompts")}
                onUnlock={handleUnlockPrompt}
              />
            )}

            {currentPath.startsWith("/checkout/") && selectedPrompt && (
              <Checkout
                prompt={selectedPrompt}
                onBack={() => handleNavigate(`/prompts/${selectedPrompt.id}`)}
                onSuccess={handlePaymentSuccess}
                onNavigateLogin={() => handleNavigate("/login")}
              />
            )}

            {currentPath === "/purchases" && (
              <MyPurchases
                purchases={purchases}
                onOpenPrompt={handleSelectPrompt}
                onBrowsePrompts={() => handleNavigate("/prompts")}
              />
            )}

            {currentPath === "/profile" && <Profile />}

            {currentPath === "/login" && (
              <Login
                onNavigateSignUp={() => handleNavigate("/signup")}
                onSuccess={() => handleNavigate(isAdmin ? "/admin" : "/prompts")}
              />
            )}

            {currentPath === "/signup" && (
              <SignUp
                onNavigateLogin={() => handleNavigate("/login")}
                onSuccess={() => handleNavigate(isAdmin ? "/admin" : "/prompts")}
              />
            )}

            {currentPath === "/admin" && (
              <Admin
                onBackToSite={() => {
                  loadMarketplaceData();
                  handleNavigate("/prompts");
                }}
                initialTab={adminInitialTab}
                autoOpenCreate={adminAutoOpenCreate}
              />
            )}
          </>
        )}
      </main>

      {/* Global Minimal Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
