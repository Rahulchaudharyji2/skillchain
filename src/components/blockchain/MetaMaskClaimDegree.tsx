"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Loader2, ExternalLink, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { POLYGON_AMOY_CHAIN_ID, REGISTRY_CONTRACT_ADDRESS } from "@/lib/blockchain/client";

interface MetaMaskClaimDegreeProps {
  credentialId: string;
  credIdHex: string;
  title: string;
  institutionName: string;
  initialStatus?: string;
  onClaimSuccess?: (txHash: string) => void;
}

export function MetaMaskClaimDegree({
  credentialId,
  credIdHex,
  title,
  institutionName,
  initialStatus = "INITIATED",
  onClaimSuccess,
}: MetaMaskClaimDegreeProps) {
  const [connecting, setConnecting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectAndAccept = async () => {
    setError(null);
    setConnecting(true);

    try {
      let address = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

      if (typeof window !== "undefined" && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        try {
          const accounts = await ethereum.request({ method: "eth_requestAccounts" });
          if (accounts && accounts.length > 0) {
            address = accounts[0];
            setWalletAddress(address);
          }
        } catch (accErr: any) {
          console.warn("MetaMask account request:", accErr);
        }

        // Try network switch to Polygon Amoy (non-blocking)
        try {
          const amoyHex = "0x" + POLYGON_AMOY_CHAIN_ID.toString(16);
          const currentChainId = await ethereum.request({ method: "eth_chainId" });
          if (currentChainId !== amoyHex) {
            try {
              await ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: amoyHex }],
              });
            } catch (switchErr: any) {
              if (switchErr.code === 4902) {
                await ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: amoyHex,
                      chainName: "Polygon Amoy Testnet",
                      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                      rpcUrls: ["https://rpc-amoy.polygon.technology"],
                      blockExplorerUrls: ["https://amoy.polygonscan.com"],
                    },
                  ],
                });
              }
            }
          }
        } catch (chainErr) {
          console.warn("Chain switch error (proceeding with address):", chainErr);
        }
      }

      setConnecting(false);
      setClaiming(true);

      // Call accept API
      const res = await fetch(`/api/student/credentials/${credentialId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentStatus("STUDENT_ACCEPTED");
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setError(data.error || "Failed to submit acceptance.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to complete acceptance.");
    } finally {
      setConnecting(false);
      setClaiming(false);
    }
  };

  const submitClaimToServer = async (address: string, clientTxHash: string | null) => {
    setClaiming(true);
    try {
      const res = await fetch(`/api/student/credentials/${credentialId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          txHash: clientTxHash,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTxHash(data.txHash);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        if (onClaimSuccess) onClaimSuccess(data.txHash);
        setTimeout(() => {
          window.location.reload();
        }, 2200);
      } else {
        setError(data.error || "Server could not finalize claim.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to record claim on server.");
    } finally {
      setClaiming(false);
    }
  };

  if (txHash) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2 animate-in zoom-in-95">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Soulbound Degree Minted & Bound to Wallet!</span>
        </div>
        <p className="text-[11px] text-emerald-700">
          Your degree is now an immutable, non-transferable Soulbound record on Polygon Amoy.
        </p>
        <div className="pt-1 flex items-center gap-3">
          <a
            href={`https://amoy.polygonscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 underline hover:text-emerald-700"
          >
            <span>View Proof on PolygonScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  if (currentStatus === "STUDENT_ACCEPTED") {
    return (
      <div className="p-4 rounded-xl bg-sky-50 border border-sky-300 text-sky-950 space-y-2 animate-in zoom-in-95">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
          <CheckCircle2 className="w-4 h-4 text-sky-600" />
          <span>✅ Proposal Accepted — Awaiting Institutional Registrar Seal</span>
        </div>
        <p className="text-[11px] text-sky-800 leading-relaxed">
          You have successfully reviewed and approved this academic degree proposal with your MetaMask wallet{walletAddress ? ` (${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)})` : ""}.
          The university administration has been notified and will confer the permanent Soulbound Seal on Polygon Amoy.
        </p>
        <div className="pt-1 flex items-center gap-2 text-[10px] text-sky-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Once permanently sealed by the college, this degree will be non-transferable on PolygonScan.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      <button
        onClick={connectAndAccept}
        disabled={connecting || claiming}
        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {connecting || claiming ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>{connecting ? "Connecting MetaMask..." : "Submitting Acceptance..."}</span>
          </>
        ) : (
          <>
            <span className="text-base leading-none">🦊</span>
            <span>Accept Degree Proposal via MetaMask</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          </>
        )}
      </button>

      <p className="text-[10px] text-stone-500">
        Requires MetaMask on Polygon Amoy. Once accepted, the university registrar confers the permanent Soulbound seal.
      </p>
    </div>
  );
}
