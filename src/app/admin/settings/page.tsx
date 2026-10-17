import { Settings, ShieldCheck, Server, Lock, Cpu, Database } from "lucide-react";
import {
  POLYGON_AMOY_CHAIN_ID,
  POLYGON_AMOY_RPC,
  REGISTRY_CONTRACT_ADDRESS,
} from "@/lib/blockchain/client";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ochre-700">
          <Settings className="w-3.5 h-3.5" />
          <span>System Parameters</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-forest-950 mt-1">
          Platform Architecture & Contract Settings
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl">
          Core infrastructure parameters, Polygon Amoy smart contract addresses, and execution runner
          configurations.
        </p>
      </div>

      <div className="space-y-6">
        {/* Blockchain Registry Parameters */}
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <h2 className="font-bold text-sm text-forest-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Smart Contract Credential Registry</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              POLYGON AMOY
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
              <span className="text-stone-400 text-[10px] block font-sans font-semibold">
                CONTRACT ADDRESS
              </span>
              <span className="text-forest-950 break-all">{REGISTRY_CONTRACT_ADDRESS}</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
                <span className="text-stone-400 text-[10px] block font-sans font-semibold">
                  CHAIN ID
                </span>
                <span className="text-forest-950">{POLYGON_AMOY_CHAIN_ID} (Amoy Testnet)</span>
              </div>

              <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
                <span className="text-stone-400 text-[10px] block font-sans font-semibold">
                  RPC ENDPOINT
                </span>
                <span className="text-forest-950 truncate block">{POLYGON_AMOY_RPC}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Code Execution Sandbox Settings */}
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <h2 className="font-bold text-sm text-forest-950 flex items-center gap-2">
              <Server className="w-4 h-4 text-forest-700" />
              <span>Sandboxed Execution Engine</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-forest-900 text-cream-50">
              ISOLATED V8
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
              <span className="text-stone-400 text-[10px] block font-semibold">EXECUTION TIMEOUT</span>
              <span className="font-bold text-forest-950 text-sm">2,500 ms</span>
            </div>

            <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
              <span className="text-stone-400 text-[10px] block font-semibold">MEMORY LIMIT</span>
              <span className="font-bold text-forest-950 text-sm">64 MB Max Old Space</span>
            </div>

            <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
              <span className="text-stone-400 text-[10px] block font-semibold">NETWORK & FS ACCESS</span>
              <span className="font-bold text-red-700 text-sm">Disabled / Sandboxed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
