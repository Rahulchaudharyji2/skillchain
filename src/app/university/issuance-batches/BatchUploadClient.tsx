"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, Loader2, Download, AlertCircle } from "lucide-react";

export function BatchUploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);

  const sampleCsv = `name,email,degree,major,grade,issuanceDate
Alex Rivera,alex.rivera@student.mit.edu,Bachelor of Science,Computer Science,Summa Cum Laude,2025-06-05
Maya Chen,maya.chen@berkeley.edu,Bachelor of Science,Electrical Engineering,Magna Cum Laude,2025-06-05
Jordan Taylor,jordan.taylor@dev.io,Associate Degree,Web Development,With Honors,2025-06-05`;

  const downloadSample = () => {
    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skillchain_graduation_batch_sample.csv";
    a.click();
  };

  const handleProcess = () => {
    setParsing(true);
    setTimeout(() => {
      setParsing(false);
      setBatchResult({
        batchId: "BATCH-2025-SPRING-004",
        totalRecords: 3,
        validated: 3,
        failed: 0,
        txBatchHash: "0x39a8c1481729bcae819283746192837461928374619283746192837461928374",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-forest-950">CSV Batch Credential Import</h2>
          <button
            onClick={downloadSample}
            className="text-xs font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-ochre-700" />
            <span>Download Sample CSV Template</span>
          </button>
        </div>

        <div className="p-8 border-2 border-dashed border-cream-300 rounded-xl bg-cream-50/50 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-forest-900 text-ochre-300 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-forest-950">
              Drag & Drop your graduation records CSV file
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Supports UTF-8 CSV with validated headers: name, email, degree, major, grade, issuanceDate
            </p>
          </div>

          <button
            onClick={handleProcess}
            disabled={parsing}
            className="px-5 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 text-xs font-semibold flex items-center gap-2 mx-auto shadow-sm transition-all"
          >
            {parsing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-ochre-300" />
                <span>Reconciling & Generating Commitments...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-ochre-300" />
                <span>Process Sample 2025 Graduation Batch</span>
              </>
            )}
          </button>
        </div>

        {batchResult && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Batch {batchResult.batchId} Successfully Reconciled</span>
            </div>
            <p className="text-stone-600">
              Validated {batchResult.validated} of {batchResult.totalRecords} records. On-chain commitment batch submitted to Polygon Amoy.
            </p>
            <span className="font-mono text-[10px] text-emerald-950 block truncate">
              TxHash: {batchResult.txBatchHash}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
