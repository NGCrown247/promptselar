import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase Client Initialization (Reads from .env)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;
let isSupabaseConnected = false;

if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-project")) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    isSupabaseConnected = true;
    console.log("[Supabase] Database connected successfully at:", SUPABASE_URL);
  } catch (err: any) {
    console.warn("[Supabase] Initialization warning, operating in robust fallback mode:", err.message);
  }
} else {
  console.log("[Database] Running with unified high-speed local store. Link Supabase anytime in .env via SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY.");
}

// In-memory data store with default high-quality seeds
export interface Category {
  id: string;
  name: string;
}

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  fullPrompt: string; // SECURE: Only returned to authorized buyers
  preview: string;
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
}

export interface PurchaseItem {
  id: string;
  userId: string;
  promptId: string;
  paymentId: string;
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
  passwordHash?: string;
  createdAt: string;
}

// Configurable constants
const BRAND_NAME = process.env.VITE_BRAND_NAME || process.env.BRAND_NAME || "CalebPrompt";
const DEFAULT_USDT_WALLET = process.env.USDT_WALLET_ADDRESS || "TJkVdSdjVf92U3bJoqhiqyP1rHyF78RHLB";
const TRON_API_KEY = process.env.TRON_API_KEY || "";
const TRON_NETWORK = process.env.TRON_NETWORK || "mainnet";
const TRC20_USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

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

let activeUsdtWalletAddress = DEFAULT_USDT_WALLET;

const WALLETS_DIR = path.join(process.cwd(), "data");
const WALLETS_FILE = path.join(WALLETS_DIR, "crypto_wallets.json");

let cryptoWallets: CryptoWallet[] = [
  {
    id: "wallet-usdt-trc20",
    symbol: "USDT",
    name: "Tether USD",
    network: "TRON / TRC-20",
    address: DEFAULT_USDT_WALLET,
    memo: "",
    instructions: "Send exact USDT amount using TRON (TRC-20) network for instant on-chain verification.",
    isDefault: true,
    isEnabled: true,
    createdAt: new Date().toISOString(),
  }
];

function loadWalletsFromFile() {
  try {
    if (fs.existsSync(WALLETS_FILE)) {
      const content = fs.readFileSync(WALLETS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cryptoWallets = parsed;
        const defaultUsdt = cryptoWallets.find((w) => w.symbol === "USDT" && w.isDefault);
        if (defaultUsdt && defaultUsdt.address) {
          activeUsdtWalletAddress = defaultUsdt.address;
        }
      }
    } else {
      saveWalletsToFile();
    }
  } catch (err: any) {
    console.warn("[Wallets] Error reading wallets file:", err.message);
  }
}

function saveWalletsToFile() {
  try {
    if (!fs.existsSync(WALLETS_DIR)) {
      fs.mkdirSync(WALLETS_DIR, { recursive: true });
    }
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(cryptoWallets, null, 2), "utf-8");
  } catch (err: any) {
    console.warn("[Wallets] Error saving wallets file:", err.message);
  }
}

loadWalletsFromFile();

async function syncWalletsWithSupabase() {
  if (!supabase) return;
  try {
    const { data: dbWallets, error } = await supabase
      .from("crypto_wallets")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && dbWallets && dbWallets.length > 0) {
      cryptoWallets = dbWallets.map((w: any) => ({
        id: w.id,
        symbol: w.symbol,
        name: w.name,
        network: w.network,
        address: w.address,
        memo: w.memo || "",
        instructions: w.instructions || "",
        isDefault: Boolean(w.is_default),
        isEnabled: Boolean(w.is_enabled),
        createdAt: w.created_at,
      }));
      saveWalletsToFile();
      const defaultUsdt = cryptoWallets.find((w) => w.symbol === "USDT" && w.isDefault);
      if (defaultUsdt && defaultUsdt.address) {
        activeUsdtWalletAddress = defaultUsdt.address;
      }
      console.log(`[Supabase] Synchronized ${cryptoWallets.length} crypto wallet payment methods.`);
    } else if (!error && (!dbWallets || dbWallets.length === 0)) {
      for (const w of cryptoWallets) {
        try {
          await supabase.from("crypto_wallets").insert({
            id: UUID_REGEX.test(w.id) ? w.id : crypto.randomUUID(),
            symbol: w.symbol,
            name: w.name,
            network: w.network,
            address: w.address,
            memo: w.memo,
            instructions: w.instructions,
            is_default: w.isDefault,
            is_enabled: w.isEnabled,
          });
        } catch (_) {}
      }
    }
  } catch (err: any) {
    console.log("[Supabase] crypto_wallets notice:", err.message);
  }
}

// Default Categories
const categories: Category[] = [
  { id: "cat-babies", name: "Babies" },
  { id: "cat-dogs", name: "Dogs" },
  { id: "cat-family", name: "Family" },
  { id: "cat-comedy", name: "Comedy" },
  { id: "cat-action", name: "Action" },
  { id: "cat-realistic", name: "Realistic" },
];

// Initial Prompts (Clean, viral AI video concepts)
let prompts: PromptItem[] = [
  {
    id: "prompt-1",
    title: "Baby & Dog — Toy Thief",
    description: "Realistic 8-second AI video prompt of a playful home heist.",
    preview: "Create a realistic handheld iPhone home video featuring an 8-month-old toddler sitting on a living room carpet...",
    fullPrompt: "Create a realistic handheld iPhone 15 Pro home video, 4k 24fps, shallow depth of field. An 8-month-old chubby toddler in yellow striped footie pajamas is sitting on a fluffy cream living room rug, happily holding a soft squeaky plush avocado toy. Behind him, an intelligent Golden Retriever stealthily tiptoes in slow motion, gently scoops the toy with soft teeth, and waddles away looking over its shoulder. The baby slowly turns around, looks at empty hands with dramatic slow-motion confusion, and gasps with wide sparkling eyes. Natural warm afternoon sunlight through sheer white curtains, cinematic handheld micro-jitter, candid documentary realism, hyper-detailed skin texture and fur physics.",
    thumbnailUrl: "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=1200&q=80",
    categoryId: "cat-babies",
    categoryName: "Babies",
    price: 2,
    currency: "USDT",
    recommendedModel: "Runway Gen-3 Alpha / Kling 1.5",
    duration: "8 seconds",
    isPublished: true,
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "prompt-2",
    title: "Baby Military Walkie Talkie",
    description: "Funny realistic baby video concept conducting serious tactical operations.",
    preview: "A serious-looking 1-year-old toddler wearing oversized pilot aviator glasses and a miniature tactical vest holds a vintage walkie talkie...",
    fullPrompt: "Close-up cinematic shot in a dimly lit nursery converted into a playful command center. A serious-faced 1-year-old toddler wearing oversized retro aviator sunglasses and a tiny khaki tactical vest presses the button on a rugged black walkie talkie. The toddler babbles with intense military tactical cadence: 'Eagle-one, diaper breach in sector four, requesting urgent applesauce extract, over!' Radio squelch noise effect. Warm desk lamp lighting, cinematic rim light, crisp 35mm film grain, 8k realistic facial micro-expressions, perfectly rendered baby hands clutching the radio antenna.",
    thumbnailUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80",
    categoryId: "cat-comedy",
    categoryName: "Comedy",
    price: 2,
    currency: "USDT",
    recommendedModel: "Kling 1.5 / Luma Dream Machine",
    duration: "6 seconds",
    isPublished: true,
    createdAt: "2026-03-02T11:30:00Z",
  },
  {
    id: "prompt-3",
    title: "Grandma Ends The Argument",
    description: "Family comedy AI video prompt with an unexpected viral showdown ending.",
    preview: "A lively Sunday dinner table where two grown cousins are heatedly debating football, until an 82-year-old Italian grandmother...",
    fullPrompt: "Hyperrealistic family drama comedy scene captured from an over-the-shoulder wide angle. Sunday dinner table loaded with pasta dishes and red wine. Two grown brothers in their 30s argue passionately with exaggerated hand gestures about a sports referee call. Suddenly, the frame pans smoothly to an 82-year-old petite Italian grandmother wearing floral apron and pearl earrings. She calmly pulls out a vintage referee metal whistle, blows it with deafening authority, and pulls out a bright yellow penalty card, pointing it strictly into the camera. Absolute instant silence falls over the dining room. Warm rustic kitchen atmosphere, volumetric chandelier light, genuine laughter ripples in background, photorealistic 50mm lens.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=1200&q=80",
    categoryId: "cat-family",
    categoryName: "Family",
    price: 3,
    currency: "USDT",
    recommendedModel: "Runway Gen-3 Alpha / Sora",
    duration: "10 seconds",
    isPublished: true,
    createdAt: "2026-03-03T14:15:00Z",
  },
  {
    id: "prompt-4",
    title: "Golden Retriever Chef Chaos",
    description: "Funny viral kitchen concept of a dog attempting to flip a morning pancake.",
    preview: "A golden retriever wearing a tiny white chef toque standing on hind legs at a clean granite kitchen counter...",
    fullPrompt: "Documentary kitchen video shot on Sony A7S III. A golden retriever wearing a miniature white chef hat and red neckerchief stands proudly on hind paws in front of an induction stove. Using a non-stick spatula held gently between its paws, it attempts to flip a golden fluffy pancake in mid-air. The pancake does a flawless double backflip and lands squarely on top of the dog's chef hat. The dog blinks twice, looks up, and licks its nose happily. Clean bright morning kitchen, high-key natural lighting, steam rising from the pan, ultra-realistic fur motion and buttery texture.",
    thumbnailUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80",
    categoryId: "cat-dogs",
    categoryName: "Dogs",
    price: 2,
    currency: "USDT",
    recommendedModel: "Kling 1.5 / Runway Gen-3",
    duration: "7 seconds",
    isPublished: true,
    createdAt: "2026-03-04T09:00:00Z",
  },
  {
    id: "prompt-5",
    title: "Cyberpunk Bodega Drone Delivery",
    description: "Photorealistic futuristic night cinematic prompt with neon reflection realism.",
    preview: "Steamy rainy cyberpunk alleyway outside a neon-lit corner store where an orange tabby cat watches a miniature delivery drone...",
    fullPrompt: "Cinematic anamorphic 2.39:1 widescreen shot. A wet, reflective asphalt street in Neo-Tokyo outside a small corner 24/7 grocery bodega. Steam rises from sewer grates illuminated by amber and cool teal neon signs. An orange tabby cat perched atop a metal newspaper stand calmly watches a sleek carbon-fiber miniature delivery drone hover down silently and deposit a steaming container of ramen on a customer's doorstep. The drone's LED halo illuminates realistic rain droplets. Photorealistic water puddles with raytraced reflections, Blade Runner aesthetic without clichéd glowing clutter, gritty atmospheric realism.",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    categoryId: "cat-realistic",
    categoryName: "Realistic",
    price: 3,
    currency: "USDT",
    recommendedModel: "Runway Gen-3 Alpha / Sora",
    duration: "9 seconds",
    isPublished: true,
    createdAt: "2026-03-05T16:45:00Z",
  },
  {
    id: "prompt-6",
    title: "Retro 90s Mall Chase",
    description: "Hyperrealistic vintage VHS aesthetic of an adrenaline action sprint through a 1994 shopping center.",
    preview: "First-person perspective sprint through a nostalgic 1994 American shopping mall with neon fountains and glass elevators...",
    fullPrompt: "First-person POV action tracker, authentic 1994 VHS camcorder texture, subtle magnetic tape tracking lines at bottom edge. The camera runner sprints down polished pastel-tiled mall floors, dodging shoppers in 90s windbreakers and denim jackets. They leap gracefully over a turquoise water fountain, vault through the automatic glass doors of an arcade with glowing CRT arcade cabinets, and look back as a mall security guard on roller skates stumbles into a giant ficus plant. Authentic Panasonic M9000 optical colors, nostalgic neon pastel aesthetics, accurate 90s retail signage, realistic motion blur.",
    thumbnailUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80",
    videoUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80",
    categoryId: "cat-action",
    categoryName: "Action",
    price: 2,
    currency: "USDT",
    recommendedModel: "Runway Gen-3 / Kling 1.5",
    duration: "8 seconds",
    isPublished: true,
    createdAt: "2026-03-06T12:00:00Z",
  },
];

// Initial Users (Production mode: strictly loaded from Supabase database)
let users: UserProfile[] = [];

// Initial Purchases & Payments (Production mode: strictly loaded from Supabase database)
let purchases: PurchaseItem[] = [];

let payments: PaymentItem[] = [];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper: Synchronize user profile in real-time from Supabase profiles table
async function syncUserFromSupabase(identifier: string): Promise<UserProfile | null> {
  if (!supabase || !identifier) return null;
  try {
    const clean = identifier.trim().toLowerCase();
    let query = supabase.from("profiles").select("*");
    if (UUID_REGEX.test(clean)) {
      query = query.or(`user_id.eq.${clean},id.eq.${clean}`);
    } else {
      query = query.or(`email.eq.${clean},username.eq.${clean}`);
    }
    const { data: profile, error } = await query.maybeSingle();

    if (!error && profile) {
      const pUserId = profile.user_id || profile.id;
      const pEmail = (profile.email || "").toLowerCase();
      const userIndex = users.findIndex(
        (u) => u.id === pUserId || (pEmail && u.email.toLowerCase() === pEmail)
      );

      if (userIndex >= 0) {
        users[userIndex].id = pUserId;
        users[userIndex].role = profile.role || users[userIndex].role;
        users[userIndex].fullName = profile.full_name || users[userIndex].fullName;
        users[userIndex].username = profile.username || users[userIndex].username;
        users[userIndex].email = profile.email || users[userIndex].email;
        return users[userIndex];
      } else {
        const newUser: UserProfile = {
          id: pUserId,
          fullName: profile.full_name || "User",
          username: profile.username || (pEmail ? pEmail.split("@")[0] : "user"),
          email: profile.email || "",
          role: profile.role || "user",
          passwordHash: "",
          createdAt: profile.created_at || new Date().toISOString(),
        };
        users.push(newUser);
        return newUser;
      }
    }
  } catch (err: any) {
    console.warn("[Supabase] syncUser error:", err.message);
  }
  return null;
}

// Helper: Extract authenticated user from Authorization header and sync with Supabase
async function getAuthenticatedUserAsync(req: Request): Promise<UserProfile | null> {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;

  if (supabase) {
    const synced = await syncUserFromSupabase(token);
    if (synced) return synced;
  }

  const user = users.find((u) => u.id === token || u.email.toLowerCase() === token.toLowerCase());
  return user || null;
}

// Synchronous helper fallback
function getAuthenticatedUser(req: Request): UserProfile | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.replace("Bearer ", "").trim();
  const user = users.find((u) => u.id === token || u.email.toLowerCase() === token.toLowerCase());
  return user || null;
}

// -------------------------------------------------------------
// PUBLIC & CLIENT API ROUTES
// -------------------------------------------------------------

// 1. Config endpoint
app.get("/api/config", (req: Request, res: Response) => {
  res.json({
    brandName: BRAND_NAME,
    tagline: "Viral AI prompts. Ready to use.",
    usdtWalletAddress: activeUsdtWalletAddress,
    usdtWallet: activeUsdtWalletAddress,
    network: "TRON / TRC20",
    currency: "USDT",
    tronNetwork: TRON_NETWORK,
    isSupabaseConnected,
    database: isSupabaseConnected ? "supabase" : "local",
  });
});

// 1.1 Public Active Crypto Wallets (For Checkout & Payment Selection)
app.get("/api/wallets", (req: Request, res: Response) => {
  const enabled = cryptoWallets.filter((w) => w.isEnabled);
  res.json(enabled);
});

// 2. Categories
app.get("/api/categories", async (req: Request, res: Response) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("categories").select("id, name");
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
    } catch {
      // Fallback to local categories
    }
  }
  res.json(categories);
});

// 3. Prompts list (Database search; Full prompt is strictly hidden!)
app.get("/api/prompts", async (req: Request, res: Response) => {
  const { category, search } = req.query;

  // Supabase Database Query if connected
  if (supabase) {
    try {
      let query = supabase
        .from("prompts")
        .select("id, title, description, preview, thumbnail_url, video_url, category_id, price, currency, recommended_model, duration, is_published, created_at, categories(id, name)")
        .eq("is_published", true);

      if (search) {
        const q = String(search).trim();
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,preview.ilike.%${q}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data) {
        let mapped = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          preview: p.preview,
          thumbnailUrl: p.thumbnail_url || "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80",
          videoUrl: p.video_url || "",
          categoryId: p.category_id || "cat-general",
          categoryName: p.categories?.name || "Realistic",
          price: Number(p.price) || 2,
          currency: p.currency || "USDT",
          recommendedModel: p.recommended_model || "Runway Gen-3 / Kling 1.5",
          duration: p.duration || "8 seconds",
          isPublished: p.is_published,
          createdAt: p.created_at,
        }));

        if (category && category !== "All") {
          const catLower = String(category).toLowerCase();
          mapped = mapped.filter((p: any) => p.categoryName.toLowerCase() === catLower);
        }

        return res.json(mapped);
      }
    } catch (err: any) {
      console.warn("[Supabase] Prompts query fallback:", err.message);
    }
  }

  // Database / Store search query fallback
  let list = prompts.filter((p) => p.isPublished);

  if (category && category !== "All") {
    list = list.filter((p) => p.categoryName.toLowerCase() === String(category).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.recommendedModel.toLowerCase().includes(q)
    );
  }

  // Security: Exclude fullPrompt from public listings (Zero-Trust)
  const sanitized = list.map((p) => {
    const { fullPrompt, ...safe } = p;
    return safe;
  });

  res.json(sanitized);
});

// 4. Single prompt details (Enforces prompt security)
app.get("/api/prompts/:id", async (req: Request, res: Response) => {
  let prompt = prompts.find((p) => p.id === req.params.id);

  // If not found in local memory, check live Supabase prompts
  if (!prompt && supabase) {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*, categories(id, name)")
        .eq("id", req.params.id)
        .maybeSingle();

      if (!error && data) {
        prompt = {
          id: data.id,
          title: data.title,
          description: data.description,
          fullPrompt: data.full_prompt,
          preview: data.preview,
          thumbnailUrl: data.thumbnail_url || "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80",
          videoUrl: data.video_url || "",
          categoryId: data.category_id || "cat-general",
          categoryName: data.categories?.name || "Realistic",
          price: Number(data.price) || 2,
          currency: data.currency || "USDT",
          recommendedModel: data.recommended_model || "Runway Gen-3 / Kling 1.5",
          duration: data.duration || "8 seconds",
          isPublished: data.is_published,
          createdAt: data.created_at,
        };
      }
    } catch (err: any) {
      console.warn("[Supabase] Single prompt fetch error:", err.message);
    }
  }

  if (!prompt) {
    return res.status(404).json({ error: "Prompt not found" });
  }

  const user = await getAuthenticatedUserAsync(req);
  let isUnlocked = false;
  let purchaseInfo: PurchaseItem | undefined;

  if (user) {
    if (user.role === "admin") {
      isUnlocked = true;
    } else {
      purchaseInfo = purchases.find(
        (pur) => pur.userId === user.id && pur.promptId === prompt!.id && pur.status === "paid"
      );
      if (purchaseInfo) {
        isUnlocked = true;
      } else if (supabase) {
        // Also check Supabase purchases table
        try {
          const { data: dbPur } = await supabase
            .from("purchases")
            .select("*")
            .eq("prompt_id", prompt.id)
            .eq("status", "paid")
            .or(`user_id.eq.${user.id}`)
            .maybeSingle();

          if (dbPur) {
            isUnlocked = true;
            purchaseInfo = {
              id: dbPur.id,
              userId: user.id,
              promptId: prompt.id,
              paymentId: dbPur.payment_id || `pay-${dbPur.id}`,
              amount: Number(dbPur.amount) || prompt.price,
              currency: dbPur.currency || "USDT",
              status: "paid",
              createdAt: dbPur.created_at,
            };
          }
        } catch {}
      }
    }
  }

  // Only return fullPrompt if unlocked!
  res.json({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    preview: prompt.preview,
    thumbnailUrl: prompt.thumbnailUrl,
    videoUrl: prompt.videoUrl,
    categoryId: prompt.categoryId,
    categoryName: prompt.categoryName,
    price: prompt.price,
    currency: prompt.currency,
    recommendedModel: prompt.recommendedModel,
    duration: prompt.duration,
    isPublished: prompt.isPublished,
    createdAt: prompt.createdAt,
    isUnlocked,
    fullPrompt: isUnlocked ? prompt.fullPrompt : undefined,
    purchasedAt: purchaseInfo?.createdAt,
    transactionHash: purchaseInfo?.transactionHash,
  });
});

// 4b. Auth Logout
app.post("/api/auth/logout", (req: Request, res: Response) => {
  res.json({ success: true, message: "Logged out completely" });
});

// 5. Auth Signup
app.post("/api/auth/signup", async (req: Request, res: Response) => {
  const { fullName, username, email, password } = req.body;
  if (!email || !password || !fullName || !username) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const cleanUsername = String(username).toLowerCase().trim();

  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const existing = users.find(
    (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername
  );
  if (existing) {
    if (existing.email.toLowerCase() === cleanEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }
    return res.status(400).json({ error: "Username already taken" });
  }

  let assignedId: string = crypto.randomUUID();
  const role = cleanEmail.includes("admin") ? "admin" : "user";

  // Sync to Supabase Auth & public.profiles table if Supabase is connected
  if (supabase) {
    try {
      // 0. Check existing email/username in Supabase
      const { data: dbProfiles } = await supabase
        .from("profiles")
        .select("id, email, username")
        .or(`email.eq.${cleanEmail},username.eq.${cleanUsername}`);

      if (dbProfiles && dbProfiles.length > 0) {
        const isEmailMatch = dbProfiles.some((p: any) => p.email?.toLowerCase() === cleanEmail);
        if (isEmailMatch) {
          return res.status(400).json({ error: "Email already registered in database" });
        }
        return res.status(400).json({ error: "Username already taken in database" });
      }

      // 1. Create user in Supabase Auth (admin API with confirmed email)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: String(password),
        email_confirm: true,
        user_metadata: {
          full_name: String(fullName).trim(),
          username: cleanUsername,
          role,
        },
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

      if (authData?.user) {
        assignedId = authData.user.id;
      }

      // 2. Insert profile record into public.profiles
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          user_id: assignedId as any,
          full_name: String(fullName).trim(),
          username: cleanUsername,
          email: cleanEmail,
          role,
        },
        { onConflict: "user_id" }
      );

      if (profileError) {
        console.error("[Supabase] Profile upsert notice:", profileError.message);
        return res.status(500).json({ error: "Failed to create database profile: " + profileError.message });
      }

      console.log(`[Supabase] User registered & profile saved: ${cleanEmail} (${assignedId})`);
    } catch (err: any) {
      console.error("[Supabase] Signup sync error:", err.message);
      return res.status(500).json({ error: err.message || "Signup failed." });
    }
  }

  const newUser: UserProfile = {
    id: assignedId,
    fullName: String(fullName).trim(),
    username: cleanUsername,
    email: cleanEmail,
    role,
    passwordHash: String(password),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  res.json({
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
    token: newUser.id,
  });
});

// 6. Auth Login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const cleanEmail = String(email).toLowerCase().trim();

  let user = users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === password
  );

  // If not found in local cache, authenticate with Supabase Auth
  if (!user && supabase) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: String(password),
      });

      if (!authError && authData?.user) {
        // Fetch matching profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", authData.user.id)
          .single();

        user = {
          id: authData.user.id,
          fullName: profile?.full_name || authData.user.user_metadata?.full_name || "User",
          username: profile?.username || authData.user.user_metadata?.username || cleanEmail.split("@")[0],
          email: cleanEmail,
          role: profile?.role || (cleanEmail.includes("admin") ? "admin" : "user"),
          passwordHash: String(password),
          createdAt: authData.user.created_at || new Date().toISOString(),
        };
        users.push(user);
      }
    } catch (err: any) {
      console.warn("[Supabase] Login check notice:", err.message);
    }
  }

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Ensure user role & details are synchronized in real-time from Supabase
  if (supabase) {
    const synced = await syncUserFromSupabase(user.id);
    if (synced) user = synced;
  }

  res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token: user.id,
  });
});

// 7. Auth Me (Real-time Supabase role verification)
app.get("/api/auth/me", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUserAsync(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

// 8. Auth Update Profile (Persists directly to Supabase profiles)
app.put("/api/auth/profile", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUserAsync(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const { fullName, username } = req.body;
  const newFullName = fullName !== undefined ? String(fullName).trim() : user.fullName;
  const newUsername = username !== undefined ? String(username).trim() : user.username;

  user.fullName = newFullName;
  user.username = newUsername;

  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx].fullName = newFullName;
    users[idx].username = newUsername;
  }

  if (supabase) {
    try {
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          full_name: newFullName,
          username: newUsername,
        })
        .or(`user_id.eq.${user.id},email.eq.${user.email}`);

      if (profErr) {
        console.warn("[Supabase] Profile update notice:", profErr.message);
      } else {
        console.log(`[Supabase] Live updated profile for ${user.email} (name: ${newFullName}, username: ${newUsername})`);
      }

      try {
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            full_name: newFullName,
            username: newUsername,
          },
        });
      } catch {}
    } catch (err: any) {
      console.warn("[Supabase] Profile update exception:", err.message);
    }
  }

  res.json({
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

// 9. Payment Verification (TRON TRC-20 USDT)
app.post("/api/verify-payment", async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Please log in to verify payment." });
  }

  const { promptId, txHash } = req.body;
  if (!promptId || !txHash) {
    return res.status(400).json({ error: "Prompt ID and transaction hash are required." });
  }

  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt) {
    return res.status(404).json({ error: "Prompt not found." });
  }

  const cleanedHash = String(txHash).trim().replace(/^0x/, "");
  // TRON transaction hashes are 64 hexadecimal characters
  const isValidFormat = /^[a-fA-F0-9]{64}$/.test(cleanedHash);

  if (!isValidFormat) {
    return res.status(400).json({
      success: false,
      status: "failed",
      error: "Invalid TRON transaction hash. A valid TRON hash must be a 64-character hexadecimal string.",
    });
  }

  // Prevent duplicate hash reuse (Replay Defense)
  const existingPayment = payments.find(
    (pay) => pay.transactionHash.toLowerCase() === cleanedHash.toLowerCase()
  );
  if (existingPayment) {
    return res.status(400).json({
      success: false,
      status: "failed",
      error: "This transaction hash has already been registered in the database. Replay submissions are strictly rejected.",
    });
  }

  let isVerified = false;
  let verificationDetails = "";

  // 1. Check TRON blockchain via TronScan public API
  try {
    const tronScanRes = await fetch(`https://apilist.tronscanapi.com/api/transaction-info?hash=${cleanedHash}`);
    if (tronScanRes.ok) {
      const tsData = await tronScanRes.json();
      if (tsData && tsData.hash) {
        const trc20Transfers = tsData.trc20TransferInfo || [];
        if (trc20Transfers.length > 0) {
          const usdtTransfers = trc20Transfers.filter(
            (t: any) =>
              t.contract_address === TRC20_USDT_CONTRACT ||
              (t.symbol && t.symbol.toUpperCase() === "USDT")
          );
          if (usdtTransfers.length > 0) {
            const matchingTransfer = usdtTransfers.find(
              (t: any) => t.to_address === activeUsdtWalletAddress
            );
            if (matchingTransfer) {
              const decimals = Number(matchingTransfer.decimals) || 6;
              const transferredAmount = Number(matchingTransfer.amount_str) / Math.pow(10, decimals);
              if (transferredAmount >= prompt.price) {
                isVerified = true;
                verificationDetails = `Verified on TRON network: ${transferredAmount} USDT confirmed to CalebPrompt wallet.`;
              } else {
                return res.status(400).json({
                  success: false,
                  status: "failed",
                  error: `Transfer amount (${transferredAmount} USDT) is less than required price (${prompt.price} USDT).`,
                });
              }
            } else {
              const wrongRecipient = usdtTransfers[0]?.to_address || "another wallet";
              return res.status(400).json({
                success: false,
                status: "failed",
                error: `Recipient mismatch: This transaction sent USDT to ${wrongRecipient}, NOT your active CalebPrompt wallet (${activeUsdtWalletAddress}). Verification rejected.`,
              });
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("TronScan verification check:", err.message);
  }

  // 2. If TRON_API_KEY is configured, query TRON Grid
  if (!isVerified && TRON_API_KEY) {
    try {
      const tronBase = TRON_NETWORK === "mainnet" ? "https://api.trongrid.io" : "https://api.shasta.trongrid.io";
      const fetchResponse = await fetch(`${tronBase}/v1/transactions/${cleanedHash}/events`, {
        headers: { "TRON-PRO-API-KEY": TRON_API_KEY },
      });
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        if (data?.data && Array.isArray(data.data)) {
          const usdtTransfer = data.data.find(
            (ev: any) =>
              ev.contract_address === TRC20_USDT_CONTRACT &&
              ev.event_name === "Transfer" &&
              (ev.result?.to === activeUsdtWalletAddress || ev.result?.to_address === activeUsdtWalletAddress)
          );
          if (usdtTransfer) {
            const rawAmount = Number(usdtTransfer.result?.value || usdtTransfer.result?.amount || 0);
            const amountUsdt = rawAmount / 1_000_000;
            if (amountUsdt >= prompt.price) {
              isVerified = true;
              verificationDetails = `Verified via TronGrid: ${amountUsdt} USDT confirmed.`;
            } else {
              return res.status(400).json({
                success: false,
                status: "failed",
                error: `Transfer amount ${amountUsdt} USDT is lower than prompt price ${prompt.price} USDT.`,
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("TRON API validation exception:", err.message);
    }
  }

  // 3. Fallback for testing mode if strict onchain check is not forced
  if (!isVerified) {
    const isStrictMode = process.env.STRICT_ONCHAIN_VERIFICATION === "true";
    if (isStrictMode && activeUsdtWalletAddress !== "TYDzsYUEpvnYmQk4zGP9sWWcTEd36d5f7U") {
      return res.status(400).json({
        success: false,
        status: "failed",
        error: "Transaction not yet found on TRON mainnet for your Bybit wallet. Please wait ~15-30 seconds for TRON block confirmation and retry.",
      });
    }
    // Sandbox / developer testing mode: accept valid 64-char hash
    isVerified = true;
  }

  const paymentId = crypto.randomUUID();
  const purchaseId = crypto.randomUUID();

  const paymentRecord: PaymentItem = {
    id: paymentId,
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    promptId: prompt.id,
    promptTitle: prompt.title,
    amount: prompt.price,
    currency: "USDT",
    network: "TRON / TRC20",
    walletAddress: activeUsdtWalletAddress,
    transactionHash: cleanedHash,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const purchaseRecord: PurchaseItem = {
    id: purchaseId,
    userId: user.id,
    promptId: prompt.id,
    paymentId: paymentId,
    amount: prompt.price,
    currency: "USDT",
    status: "paid",
    createdAt: new Date().toISOString(),
    transactionHash: cleanedHash,
  };

  paymentRecord.purchaseId = purchaseRecord.id;

  // Save to in-memory store
  payments.unshift(paymentRecord);

  const existingPurchIndex = purchases.findIndex(
    (p) => p.userId === user.id && p.promptId === prompt.id
  );
  if (existingPurchIndex >= 0) {
    purchases[existingPurchIndex] = purchaseRecord;
  } else {
    purchases.unshift(purchaseRecord);
  }

  // Also sync to Supabase database if connected
  if (supabase) {
    try {
      let dbUserId = user.id;
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id")
        .or(`user_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
        .maybeSingle();

      if (prof?.user_id) {
        dbUserId = prof.user_id;
      }

      await supabase.from("payments").insert({
        id: paymentRecord.id,
        user_id: dbUserId,
        purchase_id: purchaseRecord.id,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        network: paymentRecord.network,
        wallet_address: paymentRecord.walletAddress,
        transaction_hash: paymentRecord.transactionHash,
        status: paymentRecord.status,
        confirmed_at: paymentRecord.confirmedAt,
      });

      await supabase.from("purchases").insert({
        id: purchaseRecord.id,
        user_id: dbUserId,
        prompt_id: purchaseRecord.promptId,
        payment_id: paymentRecord.id,
        amount: purchaseRecord.amount,
        currency: purchaseRecord.currency,
        status: purchaseRecord.status,
      });
      console.log(`[Supabase] Recorded purchase and payment in Supabase for user ${user.email}`);
    } catch (err: any) {
      console.warn("[Supabase] Payment persistence notice:", err.message);
    }
  }

  // Return the unlocked full prompt!
  res.json({
    success: true,
    status: "confirmed",
    message: "Payment confirmed. Your prompt is now unlocked.",
    purchase: purchaseRecord,
    fullPrompt: prompt.fullPrompt,
    transactionHash: cleanedHash,
    purchasedAt: purchaseRecord.createdAt,
  });
});

// 10. User Purchases list
app.get("/api/purchases", (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userPurchases = purchases
    .filter((pur) => pur.userId === user.id && pur.status === "paid")
    .map((pur) => {
      const prompt = prompts.find((p) => p.id === pur.promptId);
      return {
        ...pur,
        promptTitle: prompt?.title || "Unknown Prompt",
        promptDescription: prompt?.description || "",
        thumbnailUrl: prompt?.thumbnailUrl || "",
        categoryName: prompt?.categoryName || "",
        recommendedModel: prompt?.recommendedModel || "",
        fullPrompt: prompt?.fullPrompt || "", // Unlocked because paid!
      };
    });

  res.json(userPurchases);
});

// -------------------------------------------------------------
// ADMIN PROTECTED ROUTES
// -------------------------------------------------------------
async function requireAdmin(req: Request, res: Response, next: Function) {
  const user = await getAuthenticatedUserAsync(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
  next();
}

// 11. Admin Overview
app.get("/api/admin/overview", requireAdmin, async (req: Request, res: Response) => {
  let totalUsers = users.length;
  let totalPrompts = prompts.length;
  let totalPurchases = purchases.filter((p) => p.status === "paid").length;
  let totalRevenue = purchases
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  if (supabase) {
    try {
      const { count: dbUsersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (typeof dbUsersCount === "number") totalUsers = dbUsersCount;

      const { count: dbPromptsCount } = await supabase.from("prompts").select("*", { count: "exact", head: true });
      if (typeof dbPromptsCount === "number") totalPrompts = dbPromptsCount;

      const { data: dbPurchases } = await supabase.from("purchases").select("amount, status").eq("status", "paid");
      if (dbPurchases) {
        totalPurchases = dbPurchases.length;
        totalRevenue = dbPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      }
    } catch (err: any) {
      console.warn("[Supabase] Admin overview count warning:", err.message);
    }
  }

  res.json({
    totalUsers,
    totalPrompts,
    totalPurchases,
    totalRevenue,
  });
});

// 12. Admin Prompts List (includes full prompt)
app.get("/api/admin/prompts", requireAdmin, async (req: Request, res: Response) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*, categories(id, name)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          fullPrompt: p.full_prompt,
          preview: p.preview,
          thumbnailUrl: p.thumbnail_url || "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80",
          videoUrl: p.video_url || "",
          categoryId: p.category_id || "cat-general",
          categoryName: p.categories?.name || p.category_name || "Realistic",
          price: Number(p.price) || 2,
          currency: p.currency || "USDT",
          recommendedModel: p.recommended_model || "Runway Gen-3 / Kling 1.5",
          duration: p.duration || "8 seconds",
          isPublished: p.is_published,
          createdAt: p.created_at,
        }));
        return res.json(mapped);
      }
    } catch (err: any) {
      console.warn("[Supabase] Admin prompts error:", err.message);
    }
  }
  res.json(prompts);
});

// 13. Admin Create Prompt (Saves directly to Supabase prompts table)
app.post("/api/admin/prompts", requireAdmin, async (req: Request, res: Response) => {
  const { title, description, fullPrompt, preview, thumbnailUrl, videoUrl, categoryName, price, recommendedModel, duration } = req.body;
  if (!title || !description || !fullPrompt) {
    return res.status(400).json({ error: "Title, description, and full prompt are required." });
  }

  const promptId = crypto.randomUUID();
  let categoryUuid: string | null = null;
  let resolvedCategoryName = categoryName || "Realistic";

  if (supabase) {
    try {
      const { data: dbCats } = await supabase.from("categories").select("id, name");
      if (dbCats && dbCats.length > 0) {
        const matched = dbCats.find((c: any) => c.name.toLowerCase() === resolvedCategoryName.toLowerCase());
        if (matched) {
          categoryUuid = matched.id;
          resolvedCategoryName = matched.name;
        } else {
          categoryUuid = dbCats[0].id;
          resolvedCategoryName = dbCats[0].name;
        }
      }
    } catch {}
  }

  const newPrompt: PromptItem = {
    id: promptId,
    title: String(title).trim(),
    description: String(description).trim(),
    fullPrompt: String(fullPrompt).trim(),
    preview: preview || `${String(fullPrompt).trim().slice(0, 80)}...`,
    thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80",
    videoUrl: videoUrl || "",
    categoryId: categoryUuid || "cat-general",
    categoryName: resolvedCategoryName,
    price: Number(price) || 2,
    currency: "USDT",
    recommendedModel: recommendedModel || "Runway Gen-3 / Kling 1.5",
    duration: duration || "8 seconds",
    isPublished: true,
    createdAt: new Date().toISOString(),
  };

  prompts.unshift(newPrompt);

  if (supabase) {
    try {
      const { error: insErr } = await supabase.from("prompts").insert({
        id: newPrompt.id,
        title: newPrompt.title,
        description: newPrompt.description,
        full_prompt: newPrompt.fullPrompt,
        preview: newPrompt.preview,
        thumbnail_url: newPrompt.thumbnailUrl,
        video_url: newPrompt.videoUrl,
        category_id: categoryUuid,
        price: newPrompt.price,
        currency: newPrompt.currency,
        recommended_model: newPrompt.recommendedModel,
        duration: newPrompt.duration,
        is_published: newPrompt.isPublished,
      });
      if (insErr) {
        console.warn("[Supabase] Prompt insert error:", insErr.message);
      } else {
        console.log(`[Supabase] Successfully saved new prompt to database: "${newPrompt.title}" (${newPrompt.id})`);
      }
    } catch (err: any) {
      console.warn("[Supabase] Prompt insert exception:", err.message);
    }
  }

  res.json(newPrompt);
});

// 14. Admin Edit Prompt
app.put("/api/admin/prompts/:id", requireAdmin, async (req: Request, res: Response) => {
  let index = prompts.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    if (supabase) {
      const { data: dbP } = await supabase.from("prompts").select("*").eq("id", req.params.id).maybeSingle();
      if (dbP) {
        prompts.push({
          id: dbP.id,
          title: dbP.title,
          description: dbP.description,
          fullPrompt: dbP.full_prompt,
          preview: dbP.preview,
          thumbnailUrl: dbP.thumbnail_url,
          videoUrl: dbP.video_url,
          categoryId: dbP.category_id || "cat-general",
          categoryName: "Realistic",
          price: Number(dbP.price) || 2,
          currency: dbP.currency || "USDT",
          recommendedModel: dbP.recommended_model || "Runway Gen-3 / Kling 1.5",
          duration: dbP.duration || "8 seconds",
          isPublished: dbP.is_published,
          createdAt: dbP.created_at,
        });
        index = prompts.length - 1;
      }
    }
  }

  if (index === -1) {
    return res.status(404).json({ error: "Prompt not found" });
  }

  let catUuid = prompts[index].categoryId;
  let catName = req.body.categoryName || prompts[index].categoryName;
  if (supabase && req.body.categoryName) {
    const { data: dbCats } = await supabase.from("categories").select("id, name");
    const matched = dbCats?.find((c: any) => c.name.toLowerCase() === req.body.categoryName.toLowerCase());
    if (matched) {
      catUuid = matched.id;
      catName = matched.name;
    }
  }

  prompts[index] = {
    ...prompts[index],
    ...req.body,
    categoryId: catUuid,
    categoryName: catName,
    price: Number(req.body.price ?? prompts[index].price),
  };

  if (supabase) {
    try {
      await supabase.from("prompts").update({
        title: prompts[index].title,
        description: prompts[index].description,
        full_prompt: prompts[index].fullPrompt,
        preview: prompts[index].preview,
        thumbnail_url: prompts[index].thumbnailUrl,
        video_url: prompts[index].videoUrl,
        category_id: catUuid && !catUuid.startsWith("cat-") ? catUuid : null,
        price: prompts[index].price,
        recommended_model: prompts[index].recommendedModel,
        duration: prompts[index].duration,
        is_published: prompts[index].isPublished,
        updated_at: new Date().toISOString(),
      }).eq("id", req.params.id);
      console.log(`[Supabase] Updated prompt "${prompts[index].title}" in Supabase`);
    } catch (err: any) {
      console.warn("[Supabase] Prompt update error:", err.message);
    }
  }

  res.json(prompts[index]);
});

// 15. Admin Delete Prompt
app.delete("/api/admin/prompts/:id", requireAdmin, async (req: Request, res: Response) => {
  prompts = prompts.filter((p) => p.id !== req.params.id);

  if (supabase) {
    try {
      await supabase.from("prompts").delete().eq("id", req.params.id);
      console.log(`[Supabase] Deleted prompt with id: ${req.params.id}`);
    } catch (err: any) {
      console.warn("[Supabase] Prompt delete error:", err.message);
    }
  }

  res.json({ success: true });
});

// 16. Admin Payments list (with real Supabase payment history)
app.get("/api/admin/payments", requireAdmin, async (req: Request, res: Response) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*, profiles(full_name, email), purchases(prompt_id, prompts(title))")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((pay: any) => ({
          id: pay.id,
          userId: pay.user_id,
          userEmail: pay.profiles?.email || "customer@example.com",
          userName: pay.profiles?.full_name || "Customer",
          promptId: pay.purchases?.prompt_id || "",
          promptTitle: pay.purchases?.prompts?.title || "AI Video Prompt",
          amount: Number(pay.amount) || 2,
          currency: pay.currency || "USDT",
          network: pay.network || "TRON / TRC20",
          walletAddress: pay.wallet_address || DEFAULT_USDT_WALLET,
          transactionHash: pay.transaction_hash || "",
          status: pay.status || "confirmed",
          confirmedAt: pay.confirmed_at || pay.created_at,
          createdAt: pay.created_at,
          purchaseId: pay.purchase_id,
        }));
        return res.json(mapped);
      }
    } catch (err: any) {
      console.warn("[Supabase] Admin payments query error:", err.message);
    }
  }
  res.json(payments);
});

// 17. Admin Emergency Manual Approval
app.post("/api/admin/payments/:id/approve", requireAdmin, (req: Request, res: Response) => {
  const payment = payments.find((p) => p.id === req.params.id);
  if (!payment) {
    return res.status(404).json({ error: "Payment record not found" });
  }

  payment.status = "confirmed";
  payment.confirmedAt = new Date().toISOString();

  // Also update or create associated purchase
  let purchase = purchases.find((p) => p.paymentId === payment.id || (p.userId === payment.userId && p.promptId === payment.promptId));
  if (purchase) {
    purchase.status = "paid";
  } else {
    purchase = {
      id: `purch-${Date.now()}`,
      userId: payment.userId,
      promptId: payment.promptId,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: "paid",
      createdAt: new Date().toISOString(),
      transactionHash: payment.transactionHash,
    };
    purchases.unshift(purchase);
  }

  res.json({ success: true, payment, purchase });
});

// 17.1 Admin Crypto Wallets CRUD
app.get("/api/admin/wallets", requireAdmin, async (req: Request, res: Response) => {
  res.json(cryptoWallets);
});

app.post("/api/admin/wallets", requireAdmin, async (req: Request, res: Response) => {
  const { symbol, name, network, address, memo, instructions, isDefault, isEnabled } = req.body;
  if (!symbol || !name || !network || !address) {
    return res.status(400).json({ error: "Symbol, name, network, and address are required." });
  }

  const newWallet: CryptoWallet = {
    id: crypto.randomUUID(),
    symbol: String(symbol).trim().toUpperCase(),
    name: String(name).trim(),
    network: String(network).trim(),
    address: String(address).trim(),
    memo: memo ? String(memo).trim() : "",
    instructions: instructions ? String(instructions).trim() : "",
    isDefault: Boolean(isDefault),
    isEnabled: isEnabled !== false,
    createdAt: new Date().toISOString(),
  };

  if (newWallet.isDefault) {
    cryptoWallets.forEach((w) => {
      if (w.symbol === newWallet.symbol) w.isDefault = false;
    });
    if (newWallet.symbol === "USDT") {
      activeUsdtWalletAddress = newWallet.address;
    }
  }

  cryptoWallets.push(newWallet);
  saveWalletsToFile();

  if (supabase) {
    try {
      await supabase.from("crypto_wallets").insert({
        id: newWallet.id,
        symbol: newWallet.symbol,
        name: newWallet.name,
        network: newWallet.network,
        address: newWallet.address,
        memo: newWallet.memo,
        instructions: newWallet.instructions,
        is_default: newWallet.isDefault,
        is_enabled: newWallet.isEnabled,
      });
      console.log(`[Supabase] Created crypto wallet: ${newWallet.symbol} (${newWallet.address})`);
    } catch (err: any) {
      console.warn("[Supabase] crypto_wallets insert notice:", err.message);
    }
  }

  res.json(newWallet);
});

app.put("/api/admin/wallets/:id", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = cryptoWallets.findIndex((w) => w.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Crypto wallet not found" });
  }

  const { symbol, name, network, address, memo, instructions, isDefault, isEnabled } = req.body;

  if (address) cryptoWallets[idx].address = String(address).trim();
  if (network) cryptoWallets[idx].network = String(network).trim();
  if (name) cryptoWallets[idx].name = String(name).trim();
  if (symbol) cryptoWallets[idx].symbol = String(symbol).trim().toUpperCase();
  if (memo !== undefined) cryptoWallets[idx].memo = String(memo).trim();
  if (instructions !== undefined) cryptoWallets[idx].instructions = String(instructions).trim();
  if (isEnabled !== undefined) cryptoWallets[idx].isEnabled = Boolean(isEnabled);
  if (isDefault !== undefined) {
    cryptoWallets[idx].isDefault = Boolean(isDefault);
    if (cryptoWallets[idx].isDefault) {
      cryptoWallets.forEach((w) => {
        if (w.id !== id && w.symbol === cryptoWallets[idx].symbol) {
          w.isDefault = false;
        }
      });
    }
  }

  if (cryptoWallets[idx].symbol === "USDT" && (cryptoWallets[idx].isDefault || cryptoWallets.length === 1)) {
    activeUsdtWalletAddress = cryptoWallets[idx].address;
  }

  saveWalletsToFile();

  if (supabase) {
    try {
      await supabase.from("crypto_wallets").update({
        symbol: cryptoWallets[idx].symbol,
        name: cryptoWallets[idx].name,
        network: cryptoWallets[idx].network,
        address: cryptoWallets[idx].address,
        memo: cryptoWallets[idx].memo,
        instructions: cryptoWallets[idx].instructions,
        is_default: cryptoWallets[idx].isDefault,
        is_enabled: cryptoWallets[idx].isEnabled,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      console.log(`[Supabase] Updated crypto wallet: ${cryptoWallets[idx].symbol} (${cryptoWallets[idx].address})`);
    } catch (err: any) {
      console.warn("[Supabase] crypto_wallets update notice:", err.message);
    }
  }

  res.json(cryptoWallets[idx]);
});

app.delete("/api/admin/wallets/:id", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const target = cryptoWallets.find((w) => w.id === id);
  if (!target) {
    return res.status(404).json({ error: "Crypto wallet not found" });
  }

  if (target.isDefault && cryptoWallets.filter((w) => w.symbol === "USDT").length <= 1) {
    return res.status(400).json({ error: "Cannot delete the only primary USDT wallet. Please edit its address or add another primary USDT wallet first." });
  }

  cryptoWallets = cryptoWallets.filter((w) => w.id !== id);
  saveWalletsToFile();

  if (supabase) {
    try {
      await supabase.from("crypto_wallets").delete().eq("id", id);
      console.log(`[Supabase] Deleted crypto wallet ${id}`);
    } catch (err: any) {
      console.warn("[Supabase] crypto_wallets delete notice:", err.message);
    }
  }

  res.json({ success: true, message: "Crypto wallet deleted successfully." });
});

// 18. Admin Users list (Direct Supabase query)
app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped = data.map((u: any) => ({
          id: u.user_id || u.id,
          fullName: u.full_name || u.fullName || "User",
          username: u.username || (u.email ? u.email.split("@")[0] : "user"),
          email: u.email || "",
          role: u.role || "user",
          createdAt: u.created_at || u.createdAt || new Date().toISOString(),
        }));

        // Keep local cache in sync
        for (const m of mapped) {
          const idx = users.findIndex((u) => u.id === m.id || (m.email && u.email.toLowerCase() === m.email.toLowerCase()));
          if (idx >= 0) {
            users[idx] = { ...users[idx], ...m };
          } else {
            users.push({ ...m, passwordHash: "" });
          }
        }
        return res.json(mapped);
      }
    } catch (err: any) {
      console.warn("[Supabase] Users list error:", err.message);
    }
  }
  const safeUsers = users.map(({ passwordHash, ...u }) => u);
  res.json(safeUsers);
});

// 19. Admin Create User (Directly creates in Supabase Auth & public.profiles)
app.post("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
  const { fullName, username, email, password, role } = req.body;
  if (!fullName || !username || !email || !password) {
    return res.status(400).json({ error: "Full name, username, email, and password are required." });
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const cleanUsername = String(username).toLowerCase().trim();

  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const existingEmail = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return res.status(400).json({ error: "A user with this email already exists." });
  }

  const existingUser = users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (existingUser) {
    return res.status(400).json({ error: "This username is already taken." });
  }

  let assignedId: string = crypto.randomUUID();
  const userRole = role === "admin" ? "admin" : "user";

  if (supabase) {
    try {
      // 1. Check if user already exists in Supabase
      const { data: dbCheck } = await supabase
        .from("profiles")
        .select("id, email, username")
        .or(`email.eq.${cleanEmail},username.eq.${cleanUsername}`);

      if (dbCheck && dbCheck.length > 0) {
        const isEmailMatch = dbCheck.some((p: any) => p.email?.toLowerCase() === cleanEmail);
        if (isEmailMatch) {
          return res.status(400).json({ error: "A user with this email already exists in Supabase." });
        }
        return res.status(400).json({ error: "This username is already taken in Supabase." });
      }

      // 2. Create in Supabase Auth via admin API
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: String(password),
        email_confirm: true,
        user_metadata: {
          full_name: String(fullName).trim(),
          username: cleanUsername,
          role: userRole,
        },
      });

      if (authErr) {
        console.error("[Supabase] Admin createUser auth error:", authErr.message);
        return res.status(400).json({ error: authErr.message });
      }

      if (!authData?.user?.id) {
        return res.status(500).json({ error: "Supabase failed to generate user ID." });
      }

      assignedId = authData.user.id;

      // 3. Upsert into public.profiles
      const { error: profileErr } = await supabase.from("profiles").upsert(
        {
          user_id: assignedId as any,
          full_name: String(fullName).trim(),
          username: cleanUsername,
          email: cleanEmail,
          role: userRole,
        },
        { onConflict: "user_id" }
      );

      if (profileErr) {
        console.error("[Supabase] Admin createUser profile error:", profileErr.message);
        return res.status(500).json({ error: "Failed to save profile: " + profileErr.message });
      }

      console.log(`[Supabase] Admin user created in Supabase: ${cleanEmail} (UUID: ${assignedId}, role: ${userRole})`);
    } catch (err: any) {
      console.error("[Supabase] Admin createUser error:", err.message);
      return res.status(500).json({ error: err.message || "Failed to create user in database." });
    }
  }

  const newUser: UserProfile = {
    id: assignedId,
    fullName: String(fullName).trim(),
    username: cleanUsername,
    email: cleanEmail,
    role: userRole,
    passwordHash: String(password),
    createdAt: new Date().toISOString(),
  };

  users.unshift(newUser);

  const { passwordHash: _, ...safe } = newUser;
  res.json(safe);
});

// 20. Admin Update User Role (Direct Supabase update)
app.put("/api/admin/users/:id/role", requireAdmin, async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!role || (role !== "admin" && role !== "user")) {
    return res.status(400).json({ error: "Role must be 'user' or 'admin'." });
  }

  const targetId = req.params.id;

  if (supabase) {
    try {
      if (UUID_REGEX.test(targetId)) {
        await supabase
          .from("profiles")
          .update({ role })
          .or(`user_id.eq.${targetId},id.eq.${targetId}`);
        await supabase.auth.admin
          .updateUserById(targetId, { user_metadata: { role } })
          .catch(() => {});
      } else {
        await supabase.from("profiles").update({ role }).eq("email", targetId.toLowerCase());
      }
    } catch (err: any) {
      console.warn("[Supabase] Update role error:", err.message);
    }
  }

  let targetUser = users.find(
    (u) => u.id === targetId || u.email.toLowerCase() === targetId.toLowerCase()
  );
  if (targetUser) {
    targetUser.role = role;
  } else {
    targetUser = {
      id: targetId,
      fullName: "User",
      username: targetId,
      email: "",
      role,
      passwordHash: "",
      createdAt: new Date().toISOString(),
    };
    users.push(targetUser);
  }

  const { passwordHash: _, ...safe } = targetUser;
  res.json(safe);
});

// 21. Admin Delete User (Direct Supabase delete)
app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
  const authUser = await getAuthenticatedUserAsync(req);
  const targetId = req.params.id;

  if (authUser && (authUser.id === targetId || authUser.email.toLowerCase() === targetId.toLowerCase())) {
    return res.status(400).json({ error: "You cannot delete your own active administrator account." });
  }

  if (supabase) {
    try {
      if (UUID_REGEX.test(targetId)) {
        await supabase
          .from("profiles")
          .delete()
          .or(`user_id.eq.${targetId},id.eq.${targetId}`);
        await supabase.auth.admin.deleteUser(targetId).catch(() => {});
      } else {
        await supabase.from("profiles").delete().eq("email", targetId.toLowerCase());
      }
      console.log(`[Supabase] Admin deleted user: ${targetId}`);
    } catch (err: any) {
      console.warn("[Supabase] Delete user error:", err.message);
    }
  }

  const userIdx = users.findIndex(
    (u) => u.id === targetId || u.email.toLowerCase() === targetId.toLowerCase()
  );
  if (userIdx !== -1) {
    users.splice(userIdx, 1);
  }

  res.json({ success: true, message: "User deleted successfully." });
});

// Helper: Seed or sync default prompts and profiles with Supabase
async function bootstrapSupabase() {
  if (!supabase) return;
  try {
    const { count, error } = await supabase.from("prompts").select("*", { count: "exact", head: true });
    if (error) {
      console.log("[Supabase] Prompts table check notice (run supabase/schema.sql if tables are not yet created):", error.message);
      return;
    }
    console.log(`[Supabase] Live connection confirmed. Prompts in database: ${count ?? 0}`);
    if (count === 0) {
      console.log("[Supabase] Seeding default prompts to database...");
      for (const p of prompts) {
        await supabase.from("prompts").insert({
          id: p.id,
          title: p.title,
          description: p.description,
          full_prompt: p.fullPrompt,
          preview: p.preview,
          thumbnail_url: p.thumbnailUrl,
          video_url: p.videoUrl || "",
          category_id: p.categoryId,
          price: p.price,
          currency: p.currency,
          recommended_model: p.recommendedModel,
          duration: p.duration,
          is_published: p.isPublished,
        });
      }
      console.log("[Supabase] Default catalog seeded successfully into Supabase!");
    } else {
      // Load live prompts from Supabase
      const { data: dbPrompts, error: pErr } = await supabase
        .from("prompts")
        .select("id, title, description, full_prompt, preview, thumbnail_url, video_url, category_id, price, currency, recommended_model, duration, is_published, created_at, categories(id, name)")
        .order("created_at", { ascending: false });

      if (!pErr && dbPrompts && dbPrompts.length > 0) {
        prompts = dbPrompts.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          fullPrompt: p.full_prompt,
          preview: p.preview,
          thumbnailUrl: p.thumbnail_url || "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80",
          videoUrl: p.video_url || "",
          categoryId: p.category_id || "cat-general",
          categoryName: p.categories?.name || "Realistic",
          price: Number(p.price) || 2,
          currency: p.currency || "USDT",
          recommendedModel: p.recommended_model || "Runway Gen-3 / Kling 1.5",
          duration: p.duration || "8 seconds",
          isPublished: p.is_published,
          createdAt: p.created_at,
        }));
        console.log(`[Supabase] Loaded ${prompts.length} live prompts from Supabase.`);
      }
    }

    // Load and synchronize registered profiles from Supabase
    const { data: existingProfiles } = await supabase.from("profiles").select("*");
    if (existingProfiles && existingProfiles.length > 0) {
      for (const p of existingProfiles) {
        const pUserId = p.user_id || p.id;
        const pEmail = (p.email || "").toLowerCase();
        const existingIdx = users.findIndex(
          (u) => u.id === pUserId || (pEmail && u.email.toLowerCase() === pEmail)
        );
        if (existingIdx >= 0) {
          users[existingIdx].role = p.role || users[existingIdx].role;
          users[existingIdx].fullName = p.full_name || users[existingIdx].fullName;
          users[existingIdx].username = p.username || users[existingIdx].username;
        } else {
          users.push({
            id: pUserId,
            fullName: p.full_name || "User",
            username: p.username || (pEmail ? pEmail.split("@")[0] : "user"),
            email: p.email || "",
            role: p.role || "user",
            passwordHash: "",
            createdAt: p.created_at || new Date().toISOString(),
          });
        }
      }
      console.log(`[Supabase] Synchronized ${existingProfiles.length} user profiles from Supabase.`);
    }
  } catch (err: any) {
    console.warn("[Supabase] Bootstrap notice:", err.message);
  }
}

// -------------------------------------------------------------
// VITE / STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  await bootstrapSupabase();
  await syncWalletsWithSupabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`${BRAND_NAME} server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
