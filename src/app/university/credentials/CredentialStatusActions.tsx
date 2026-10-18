"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, XCircle, Check, Loader2, Lock, Sparkles, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";

interface CredentialStatusActionsProps {
  credentialId: string;
  currentStatus: string;
  studentName?: string;
  studentWallet?: string | null;
}

export function CredentialStatusActions({
  credentialId,
  currentStatus,
  studentName,
  studentWallet,
}: CredentialStatusActionsProps) {
  const [loading, setLoading] = useState(false);
  const [sealedTx, setSealedTx] = useState<string | null>(null);
  const router = useRouter();

  const handleSimulateAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/credentials/${credentialId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: studentWallet || "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        alert(data.error || "Failed to confirm student acceptance.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to record acceptance.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeal = async () => {
    const confirmMessage = studentWallet
      ? `Confer permanent Soulbound Seal on Polygon Amoy for ${studentName || "student"}?\n\nWallet: ${studentWallet}\n\nOnce sealed, this degree will be permanently minted and CANNOT be transferred to any other wallet.`
      : `Confer permanent Soulbound Seal on Polygon Amoy for ${studentName || "student"}?\n\nOnce sealed, this degree will be permanently minted and non-transferable.`;

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/university/credentials/${credentialId}/seal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSealedTx(data.txHash);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        alert(data.error || "Failed to seal credential on-chain.");
      }
    } catch (err: any) {
      alert(err.message || "Network error while conferring seal.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "SUSPEND" | "RESTORE" | "REVOKE") => {
    const reason = window.prompt(`Enter administrative reason for ${action}:`);
    if (!reason) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/university/credentials/${credentialId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {loading ? (
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
          <span>Processing...</span>
        </div>
      ) : (
        <>
          {/* Step 3: University confers permanent Soulbound seal after Student Acceptance */}
          {currentStatus === "STUDENT_ACCEPTED" && (
            <button
              onClick={handleSeal}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 animate-pulse"
              title="Student has accepted! Click to permanently seal and soulbound-lock degree on Polygon Amoy"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Confer Soulbound Seal</span>
              <Sparkles className="w-3 h-3 text-emerald-200" />
            </button>
          )}

          {/* Initiated state: Waiting for student */}
          {(currentStatus === "INITIATED" || currentStatus === "OFFERED") && (
            <div className="flex items-center gap-1.5">
              <span
                className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md font-medium"
                title="Awaiting student to review and accept the conferral request with MetaMask"
              >
                ⏳ Awaiting Student Accept
              </span>
              <button
                onClick={handleSimulateAccept}
                className="px-2 py-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-900 text-[10px] font-bold border border-sky-300 transition-colors"
                title="Confirm student acceptance immediately for testing or verified approval"
              >
                Confirm Accept
              </button>
            </div>
          )}

          {/* Active state actions */}
          {currentStatus === "ACTIVE" && (
            <button
              onClick={() => handleAction("SUSPEND")}
              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold"
              title="Suspend Credential"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStatus === "SUSPENDED" && (
            <button
              onClick={() => handleAction("RESTORE")}
              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold"
              title="Restore Credential"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStatus !== "REVOKED" && (
            <button
              onClick={() => handleAction("REVOKE")}
              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold"
              title="Revoke Credential"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}

      {sealedTx && (
        <a
          href={`https://amoy.polygonscan.com/tx/${sealedTx}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-emerald-700 hover:text-emerald-800"
          title="View Proof on PolygonScan"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
