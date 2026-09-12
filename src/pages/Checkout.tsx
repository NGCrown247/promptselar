import React, { useState, useEffect, useRef } from "react";
import { PromptItem, VerificationResult, CryptoWallet } from "../types";
import { BRAND_CONFIG } from "../config/brand";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import QRCode from "qrcode";
import {
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Info,
  Coins,
} from "lucide-react";

interface CheckoutProps {
  prompt: PromptItem;
  onBack: () => void;
  onSuccess: (updatedPrompt: PromptItem) => void;
  onNavigateLogin: () => void;
}

type PaymentStatus = "pending" | "confirming" | "confirmed" | "failed";

export const Checkout: React.FC<CheckoutProps> = ({
  prompt,
  onBack,
  onSuccess,
  onNavigateLogin,
}) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [availableWallets, setAvailableWallets] = useState<CryptoWallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");

  const [walletAddress, setWalletAddress] = useState(BRAND_CONFIG.defaultUsdtWallet);
  const [network, setNetwork] = useState(BRAND_CONFIG.network);
  const [currencySymbol, setCurrencySymbol] = useState("USDT");
  const [currencyName, setCurrencyName] = useState("Tether USD");
  const [memo, setMemo] = useState("");
  const [instructions, setInstructions] = useState("");

  const [txHash, setTxHash] = useState("");
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [statusMessage, setStatusMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 1. Fetch enabled crypto wallets
    api.getWallets().then((wallets) => {
      if (wallets && wallets.length > 0) {
        setAvailableWallets(wallets);
        const defaultWallet = wallets.find((w) => w.isDefault && w.symbol === "USDT") || wallets[0];
        if (defaultWallet) {
          setSelectedWalletId(defaultWallet.id);
          setWalletAddress(defaultWallet.address);
          setNetwork(defaultWallet.network);
          setCurrencySymbol(defaultWallet.symbol);
          setCurrencyName(defaultWallet.name);
          setMemo(defaultWallet.memo || "");
          setInstructions(defaultWallet.instructions || "");
        }
      }
    }).catch((err) => {
      console.warn("Failed to fetch wallets list:", err);
    });

    // 2. Fetch config as fallback
    api.getConfig().then((cfg) => {
      if (cfg?.usdtWallet && availableWallets.length === 0) {
        setWalletAddress(cfg.usdtWallet);
      }
      if (cfg?.network && availableWallets.length === 0) {
        setNetwork(cfg.network);
      }
    }).catch(() => {});
  }, []);

  const handleSelectWallet = (wallet: CryptoWallet) => {
    setSelectedWalletId(wallet.id);
    setWalletAddress(wallet.address);
    setNetwork(wallet.network);
    setCurrencySymbol(wallet.symbol);
    setCurrencyName(wallet.name);
    setMemo(wallet.memo || "");
    setInstructions(wallet.instructions || "");
  };

  // Generate QR Code for wallet address
  useEffect(() => {
    if (canvasRef.current && walletAddress) {
      QRCode.toCanvas(
        canvasRef.current,
        walletAddress,
        {
          width: 148,
          margin: 1,
          color: {
            dark: "#09090b",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error);
        }
      );
    }
  }, [walletAddress]);

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedWallet(true);
    showToast("Wallet address copied to clipboard!", "success");
    setTimeout(() => setCopiedWallet(false), 2500);
  };

  const handleUseDemoHash = () => {
    const chars = "abcdef0123456789";
    let mockHash = "";
    for (let i = 0; i < 64; i++) {
      mockHash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTxHash(mockHash);
    showToast("Sample TRON hash populated for testing!", "info");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast("Please log in or sign up before completing checkout.", "error");
      onNavigateLogin();
      return;
    }

    const cleanHash = txHash.trim();
    if (!cleanHash) {
      showToast("Please enter a transaction hash.", "error");
      return;
    }

    setIsVerifying(true);
    setStatus("confirming");
    setStatusMessage("Validating transaction on TRON blockchain...");
    showToast("Payment submitted. Waiting for confirmation.", "info");

    try {
      const result: VerificationResult = await api.verifyPayment(prompt.id, cleanHash);

      if (result.success && result.status === "confirmed") {
        setStatus("confirmed");
        setStatusMessage("Payment confirmed! Your prompt is now unlocked.");
        showToast("Payment confirmed. Your prompt is now unlocked.", "success");

        setTimeout(() => {
          onSuccess({
            ...prompt,
            isUnlocked: true,
            fullPrompt: result.fullPrompt,
            purchasedAt: result.purchasedAt || new Date().toISOString(),
            transactionHash: cleanHash,
          });
        }, 1500);
      } else {
        setStatus("failed");
        setStatusMessage(result.error || "Payment verification failed. Please check the transaction hash.");
        showToast(result.error || "Verification failed.", "error");
      }
    } catch (err: any) {
      setStatus("failed");
      setStatusMessage(err.message || "Unable to verify transaction. Please check your hash and retry.");
      showToast(err.message || "Verification failed", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-violet-300 transition-colors mb-6 cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to prompt details</span>
      </button>

      <div className="bg-zinc-900/90 rounded-2xl border border-white/[0.07] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/[0.06]">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1 block">
            Checkout
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Unlock this prompt
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Complete the one-time USDT payment to permanently unlock the full prompt text and camera parameters.
          </p>
        </div>

        {/* Selected Prompt Summary Bar */}
        <div className="p-6 sm:p-8 bg-zinc-950/60 border-b border-white/[0.06] flex items-center gap-4">
          <img
            src={prompt.thumbnailUrl}
            alt={prompt.title}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-white/[0.08] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Item to unlock
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {prompt.title}
            </h2>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {prompt.categoryName} &bull; {prompt.recommendedModel}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] text-zinc-500 block uppercase font-medium">Price</span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
              {prompt.price} <span className="text-sm font-semibold">{prompt.currency}</span>
            </span>
          </div>
        </div>

        {/* Payment Details & Transfer Box */}
        <div className="p-6 sm:p-8 space-y-7">
          {/* Multi-Crypto Selector if multiple wallets are enabled */}
          {availableWallets.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Select Crypto Payment Asset:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableWallets.map((w) => {
                  const isSelected = selectedWalletId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSelectWallet(w)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 border ${
                        isSelected
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500 shadow-sm shadow-violet-500/25"
                          : "bg-zinc-900 text-zinc-400 border-white/[0.08] hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      <span>{w.symbol}</span>
                      <span className="text-[10px] opacity-75 font-normal">({w.network})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Network & Coin Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15">
              <span className="text-xs text-emerald-400/80 block font-medium">Payment Currency</span>
              <span className="text-base font-bold text-emerald-300 mt-1 block">
                {currencyName} ({currencySymbol})
              </span>
            </div>
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/15">
              <span className="text-xs text-cyan-400/80 block font-medium">Network</span>
              <span className="text-base font-bold text-cyan-300 mt-1 block">
                {network}
              </span>
            </div>
          </div>

          {/* Receiving Wallet Address + QR Code */}
          <div className="p-6 rounded-xl border border-white/[0.07] bg-zinc-950/70 flex flex-col md:flex-row items-center gap-6">
            {/* QR Code Container */}
            <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0">
              <canvas ref={canvasRef} className="rounded-sm block" />
              <span className="text-[10px] text-zinc-700 text-center block mt-1.5 font-semibold">
                Scan with {currencySymbol} Wallet
              </span>
            </div>

            {/* Wallet Address String */}
            <div className="flex-1 w-full text-center md:text-left">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Receiving Wallet Address ({currencySymbol})
              </label>
              <div className="p-3 bg-zinc-900 rounded-lg border border-white/[0.08] font-mono text-xs sm:text-sm text-zinc-200 break-all select-all flex items-center justify-between gap-2">
                <span>{walletAddress}</span>
                <button
                  id="copy-wallet-address-btn"
                  type="button"
                  onClick={handleCopyWallet}
                  className="p-1.5 rounded-md hover:bg-violet-500/15 text-zinc-400 hover:text-violet-300 transition-colors shrink-0 cursor-pointer"
                  title="Copy address"
                >
                  {copiedWallet ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Memo/Tag if present */}
              {memo && (
                <div className="mt-3 p-2.5 bg-zinc-900/90 rounded-lg border border-white/[0.08] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Destination Tag / Memo:</span>
                    <span className="font-mono text-xs text-amber-300 font-bold">{memo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(memo);
                      setCopiedMemo(true);
                      showToast("Memo copied to clipboard!", "success");
                      setTimeout(() => setCopiedMemo(false), 2000);
                    }}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                {instructions || `Only send ${currencySymbol} on ${network}. Sending any other token or network may result in permanent loss.`}
              </p>
            </div>
          </div>

          {/* 3 Simple Instructions */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-zinc-950/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-3">
              Payment Instructions
            </h3>
            <ol className="space-y-2.5 text-sm text-zinc-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Send the exact amount of <strong className="text-emerald-400">{prompt.price} USDT</strong> to the wallet address above.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Paste your <strong className="text-white">transaction hash (TXID)</strong> below.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Click <strong className="text-white">Verify Payment</strong>. Once confirmed by the backend, your prompt is immediately unlocked.
                </span>
              </li>
            </ol>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="tx-hash-input"
                  className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
                >
                  Transaction hash
                </label>
                {/* <button
                  type="button"
                  onClick={handleUseDemoHash}
                  className="text-xs text-violet-400 hover:text-violet-300 underline font-medium cursor-pointer"
                >
                  Fill Sample Hash (Testing)
                </button> */}
              </div>

              <input
                id="tx-hash-input"
                type="text"
                required
                value={txHash}
                onChange={(e) => {
                  setTxHash(e.target.value);
                  if (status === "failed") setStatus("pending");
                }}
                placeholder="e.g. 7b8f9e0a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f"
                className="w-full px-4 py-3 rounded-lg border border-white/[0.08] bg-zinc-950 font-mono text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
              />
            </div>

            {/* Status Feedback Indicator */}
            {status !== "pending" && (
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
                  status === "confirming"
                    ? "bg-zinc-950 border-white/[0.08] text-zinc-300"
                    : status === "confirmed"
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                    : "bg-red-950/60 border-red-500/40 text-red-200"
                }`}
              >
                {status === "confirming" && (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400 shrink-0" />
                )}
                {status === "confirmed" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {status === "failed" && (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div className="flex-1 leading-snug">
                  <span className="font-semibold capitalize block text-xs tracking-wider mb-0.5">
                    Status: {status}
                  </span>
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                id="btn-verify-payment"
                type="submit"
                disabled={isVerifying || status === "confirmed"}
                className={`w-full py-3.5 px-6 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  status === "confirmed"
                    ? "bg-emerald-500 text-zinc-950 cursor-default shadow-md shadow-emerald-500/20"
                    : isVerifying
                    ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-lg shadow-emerald-500/25 font-bold"
                }`}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Verifying on TRON Blockchain...</span>
                  </>
                ) : status === "confirmed" ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Payment Confirmed &bull; Unlocked!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Verify Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
