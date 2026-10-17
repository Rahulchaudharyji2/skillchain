"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, XCircle, Check, Loader2 } from "lucide-react";

interface CredentialStatusActionsProps {
  credentialId: string;
  currentStatus: string;
}

export function CredentialStatusActions({
  credentialId,
  currentStatus,
}: CredentialStatusActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        router.refresh();
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
      ) : (
        <>
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
    </div>
  );
}
