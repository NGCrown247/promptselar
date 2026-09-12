export interface Category {
  id: string;
  name: string;
}

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  preview: string;
  fullPrompt?: string; // Only provided when unlocked/purchased
  thumbnailUrl: string;
  videoUrl?: string;
  categoryId: string;
  categoryName: string;
  price: number;
  currency: string;
  recommendedModel: string;
  duration: string;
  isPublished: boolean;
  createdAt: string;
  isUnlocked?: boolean;
  purchasedAt?: string;
  transactionHash?: string;
}

export interface PurchaseItem {
  id: string;
  userId: string;
  promptId: string;
  promptTitle?: string;
  promptDescription?: string;
  thumbnailUrl?: string;
  categoryName?: string;
  recommendedModel?: string;
  fullPrompt?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
  transactionHash?: string;
}

export interface PaymentItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  promptId: string;
  promptTitle: string;
  purchaseId?: string;
  amount: number;
  currency: string;
  network: string;
  walletAddress: string;
  transactionHash: string;
  status: "pending" | "confirming" | "confirmed" | "failed";
  confirmedAt?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPrompts: number;
  totalPurchases: number;
  totalRevenue: number;
}

export interface CryptoWallet {
  id: string;
  symbol: string;
  name: string;
  network: string;
  address: string;
  memo?: string;
  instructions?: string;
  isDefault?: boolean;
  isEnabled: boolean;
  createdAt?: string;
}

export interface VerificationResult {
  success: boolean;
  status: "pending" | "confirming" | "confirmed" | "failed";
  message: string;
  purchase?: PurchaseItem;
  fullPrompt?: string;
  transactionHash?: string;
  purchasedAt?: string;
  error?: string;
}
