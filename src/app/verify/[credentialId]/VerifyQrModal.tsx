"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Copy, Check, Download, ShieldCheck } from "lucide-react";

interface VerifyQrModalProps {
  credentialId: string;
  verificationUrl: string;
  institutionName: string;
  recipientName: string;
}

export function VerifyQrModal({
  credentialId,
  verificationUrl,
  institutionName,
  recipientName,
}: VerifyQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(verificationUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#16382C",
        light: "#FFFFFF",
      },
    }).then(setQrDataUrl);
  }, [verificationUrl]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold transition-colors border border-cream-300"
      >
        <QrCode className="w-3.5 h-3.5 text-forest-700" />
        <span>{isOpen ? "Hide QR Code" : "Public QR Verification"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 p-5 rounded-2xl bg-cream-50 border border-cream-300 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in duration-200">
          <div className="p-3 bg-white rounded-xl border border-cream-200 shadow-sm flex-shrink-0">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR code for ${recipientName} credential`}
                className="w-40 h-40 rounded"
              />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-xs text-stone-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="space-y-2.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-forest-900 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Instant Mobile Verification</span>
            </div>
            <p className="text-xs text-stone-600">
              Scan with any mobile camera or QR reader to verify this {institutionName} credential
              authenticity and on-chain Polygon Amoy commitment hash directly.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                onClick={copyUrl}
                className="px-3 py-1.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied Link" : "Copy Link"}</span>
              </button>

              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`skillchain-verify-${credentialId.slice(0, 10)}.png`}
                  className="px-3 py-1.5 rounded-lg bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download QR PNG</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
