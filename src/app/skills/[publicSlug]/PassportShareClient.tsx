"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Copy, Check, X, Github, Share2, ExternalLink } from "lucide-react";

interface PassportShareClientProps {
  publicUrl: string;
  candidateName: string;
  publicSlug: string;
}

export function PassportShareClient({
  publicUrl,
  candidateName,
  publicSlug,
}: PassportShareClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  useEffect(() => {
    if (isOpen && !qrDataUrl) {
      QRCode.toDataURL(publicUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: "#16382C",
          light: "#FBF9F5",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [isOpen, publicUrl, qrDataUrl]);

  const copyToClipboard = async (text: string, type: "link" | "badge") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedBadge(true);
        setTimeout(() => setCopiedBadge(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const badgeMarkdown = `[![SkillChain Verified](https://img.shields.io/badge/SkillChain-Verified_Passport-16382C?style=for-the-badge&logo=shield)](${publicUrl})`;

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
      >
        <Share2 className="w-3.5 h-3.5 text-ochre-300" />
        <span>Share Passport & QR</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-cream-300 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-cream-100 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-full bg-forest-900 text-ochre-300 flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-forest-950">
                Share Verifiable Skill Passport
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Scan or share {candidateName}&apos;s cryptographic proof
              </p>
            </div>

            {/* QR Code Graphic */}
            <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 flex flex-col items-center justify-center mb-6">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Passport QR Code" className="w-48 h-48 rounded-lg shadow-sm" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-stone-400">
                  Generating cryptographic QR...
                </div>
              )}
              <span className="text-[10px] font-mono text-stone-500 mt-2">
                Slug: {publicSlug}
              </span>
            </div>

            {/* Share Link Actions */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                  Public Verification URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="w-full text-xs font-mono p-2 rounded-lg bg-cream-50 border border-cream-300 text-stone-700 focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(publicUrl, "link")}
                    className="p-2 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 flex-shrink-0 text-xs font-semibold flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* GitHub README Badge Snippet */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                    <Github className="w-3.5 h-3.5" />
                    GitHub README Badge Markdown
                  </label>
                  <span className="text-[10px] text-stone-400">For profile repo</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={badgeMarkdown}
                    className="w-full text-xs font-mono p-2 rounded-lg bg-cream-50 border border-cream-300 text-stone-700 focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(badgeMarkdown, "badge")}
                    className="p-2 rounded-lg bg-white border border-cream-300 hover:bg-cream-100 flex-shrink-0 text-xs font-semibold text-forest-900 flex items-center gap-1"
                  >
                    {copiedBadge ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
