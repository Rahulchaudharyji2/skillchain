"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Copy, Check, ChevronDown, LogOut } from "lucide-react";
import { POLYGON_AMOY_CHAIN_ID } from "@/lib/blockchain/client";

export function MetaMaskWalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAmoy = chainId === "0x" + POLYGON_AMOY_CHAIN_ID.toString(16) || chainId === String(POLYGON_AMOY_CHAIN_ID);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      // Check already connected accounts
      ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) setAddress(accounts[0]);
      }).catch(() => {});

      ethereum.request({ method: "eth_chainId" }).then((cId: string) => {
        setChainId(cId);
      }).catch(() => {});

      // Event listeners
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) setAddress(accounts[0]);
        else setAddress(null);
      };

      const handleChainChanged = (cId: string) => {
        setChainId(cId);
      };

      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);

      return () => {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("MetaMask was not detected. Please install the MetaMask browser extension to connect your Web3 wallet.");
      return;
    }

    setConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setAddress(accounts[0]);

        // Prompt switch to Polygon Amoy if needed
        const amoyHex = "0x" + POLYGON_AMOY_CHAIN_ID.toString(16);
        const currentCId = await ethereum.request({ method: "eth_chainId" });
        setChainId(currentCId);

        if (currentCId !== amoyHex) {
          try {
            await ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: amoyHex }],
            });
            setChainId(amoyHex);
          } catch (switchError: any) {
            if (switchError.code === 4902) {
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
              setChainId(amoyHex);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("Wallet connect cancelled or failed:", err);
    } finally {
      setConnecting(false);
    }
  };

  const switchToAmoy = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const ethereum = (window as any).ethereum;
    const amoyHex = "0x" + POLYGON_AMOY_CHAIN_ID.toString(16);

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: amoyHex }],
      });
      setChainId(amoyHex);
    } catch (err: any) {
      if (err.code === 4902) {
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
        setChainId(amoyHex);
      }
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!address) {
    return (
      <button
        onClick={connectWallet}
        disabled={connecting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
      >
        <span className="text-sm">🦊</span>
        <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
      </button>
    );
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="relative">
      {!isAmoy ? (
        <button
          onClick={switchToAmoy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold hover:bg-rose-200 transition-all shadow-xs animate-pulse"
        >
          <span>⚠️</span>
          <span>Switch to Amoy</span>
        </button>
      ) : (
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-forest-700 bg-forest-900 text-cream-50 text-xs font-mono font-medium hover:bg-forest-800 transition-all shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{shortAddress}</span>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-stone-200 shadow-xl p-3 z-50 text-xs text-stone-800 space-y-3 animate-in fade-in-50 zoom-in-95">
          <div className="pb-2 border-b border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Connected Wallet</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono text-xs text-forest-950 font-bold">{shortAddress}</span>
              <button
                onClick={copyAddress}
                className="p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-900"
                title="Copy address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Network</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Polygon Amoy (80002)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <a
              href={`https://amoy.polygonscan.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-forest-800 hover:underline flex items-center gap-1"
            >
              <span>PolygonScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => {
                setAddress(null);
                setShowDropdown(false);
              }}
              className="text-[11px] font-medium text-stone-500 hover:text-rose-600 flex items-center gap-1"
            >
              <span>Disconnect</span>
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
