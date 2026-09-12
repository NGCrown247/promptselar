import {
  Category,
  PromptItem,
  PurchaseItem,
  PaymentItem,
  UserProfile,
  AdminStats,
  CryptoWallet,
  VerificationResult,
} from "../types";

const getHeaders = () => {
  const token = localStorage.getItem("calebprompt_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Config
  async getConfig() {
    const res = await fetch("/api/config");
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch("/api/categories");
    return res.json();
  },

  // Prompts (Full prompt excluded by backend for security)
  async getPrompts(category?: string, search?: string): Promise<PromptItem[]> {
    const params = new URLSearchParams();
    if (category && category !== "All") params.append("category", category);
    if (search) params.append("search", search);

    const res = await fetch(`/api/prompts?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load prompts");
    return res.json();
  },

  // Single Prompt (Includes full prompt ONLY if authenticated and purchased)
  async getPromptDetails(id: string): Promise<PromptItem> {
    const res = await fetch(`/api/prompts/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load prompt details");
    return res.json();
  },

  // Verify USDT payment on TRON network
  async verifyPayment(promptId: string, txHash: string): Promise<VerificationResult> {
    const res = await fetch("/api/verify-payment", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ promptId, txHash }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Payment verification failed");
    }
    return data;
  },

  // User Purchases
  async getPurchases(): Promise<PurchaseItem[]> {
    const res = await fetch("/api/purchases", {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load purchases");
    return res.json();
  },

  // Auth: Login
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },

  // Auth: Signup
  async signup(
    fullName: string,
    username: string,
    email: string,
    password: string
  ): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return data;
  },

  // Auth: Me
  async getProfile(): Promise<UserProfile> {
    const res = await fetch("/api/auth/me", {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },

  // Auth: Update Profile
  async updateProfile(fullName: string, username: string): Promise<UserProfile> {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ fullName, username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update profile");
    return data;
  },

  // Admin APIs
  async adminGetOverview(): Promise<AdminStats> {
    const res = await fetch("/api/admin/overview", {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Admin overview unauthorized");
    return res.json();
  },

  async adminGetPrompts(): Promise<PromptItem[]> {
    const res = await fetch("/api/admin/prompts", {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch admin prompts");
    return res.json();
  },

  async adminCreatePrompt(data: Partial<PromptItem>): Promise<PromptItem> {
    const res = await fetch("/api/admin/prompts", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to create prompt");
    return resData;
  },

  async adminEditPrompt(id: string, data: Partial<PromptItem>): Promise<PromptItem> {
    const res = await fetch(`/api/admin/prompts/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to edit prompt");
    return resData;
  },

  async adminDeletePrompt(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/prompts/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete prompt");
    return res.json();
  },

  async adminGetPayments(): Promise<PaymentItem[]> {
    const res = await fetch("/api/admin/payments", {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch payments");
    return res.json();
  },

  async adminApprovePayment(paymentId: string): Promise<{ success: boolean; payment: PaymentItem }> {
    const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
      method: "POST",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to approve payment");
    return data;
  },

  async adminGetUsers(): Promise<UserProfile[]> {
    const res = await fetch("/api/admin/users", {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },

  async adminCreateUser(userData: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    role: "user" | "admin";
  }): Promise<UserProfile> {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create user");
    return data;
  },

  async adminUpdateUserRole(userId: string, role: "user" | "admin"): Promise<UserProfile> {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update user role");
    return data;
  },

  async adminDeleteUser(userId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete user");
    return data;
  },

  async getWallets(): Promise<CryptoWallet[]> {
    const res = await fetch("/api/wallets");
    if (!res.ok) return [];
    return res.json();
  },

  async adminGetWallets(): Promise<CryptoWallet[]> {
    const res = await fetch("/api/admin/wallets", {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch crypto wallets");
    return res.json();
  },

  async adminCreateWallet(walletData: Partial<CryptoWallet>): Promise<CryptoWallet> {
    const res = await fetch("/api/admin/wallets", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(walletData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create crypto wallet");
    return data;
  },

  async adminUpdateWallet(id: string, walletData: Partial<CryptoWallet>): Promise<CryptoWallet> {
    const res = await fetch(`/api/admin/wallets/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(walletData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update crypto wallet");
    return data;
  },

  async adminDeleteWallet(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/wallets/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete crypto wallet");
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: getHeaders(),
      });
    } catch {
      // Ignore network errors during logout
    }
  },
};
