"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Copy,
  Check,
  Github,
  Globe,
  Lock,
  Eye,
  ExternalLink,
  ShieldCheck,
  Download,
} from "lucide-react";

interface PassportManagerClientProps {
  publicUrl: string;
  publicSlug: string;
  initialIsPublic: boolean;
  candidateName: string;
}

export function PassportManagerClient({
  publicUrl,
  publicSlug,
  initialIsPublic,
  candidateName,
}: PassportManagerClientProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#16382C",
        light: "#FFFFFF",
      },
    }).then(setQrDataUrl);
  }, [publicUrl]);

  const toggleVisibility = async () => {
    setSavingVisibility(true);
    try {
      const newStatus = !isPublic;
      setIsPublic(newStatus);
      await fetch("/api/student/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPassportPublic: newStatus }),
      });
    } catch (err) {
      console.error("Visibility toggle failed:", err);
    } finally {
      setSavingVisibility(false);
    }
  };

  const copyText = async (text: string, type: "link" | "badge") => {
    await navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedBadge(true);
      setTimeout(() => setCopiedBadge(false), 2000);
    }
  };

  const badgeMarkdown = `[![SkillChain Verified](https://img.shields.io/badge/SkillChain-Verified_Passport-16382C?style=for-the-badge&logo=shield)](${publicUrl})`;

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Left Column: QR Code & Share Controls (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="card-premium p-6 bg-white border border-cream-300 text-center">
          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 inline-block mb-4">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Passport QR Code" className="w-56 h-56 rounded-lg shadow-sm" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-stone-400">
                Generating QR code...
              </div>
            )}
          </div>

          <h3 className="font-bold text-base text-forest-950">{candidateName}&apos;s Skill Passport</h3>
          <p className="text-xs text-stone-500 mt-0.5">Scan to verify cryptographic credentials</p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href={qrDataUrl}
              download={`${publicSlug}-qr-code.png`}
              className="px-3.5 py-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </a>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-ochre-300" />
              <span>Live Preview</span>
            </a>
          </div>
        </div>

        {/* Privacy & Visibility Switch */}
        <div className="card-premium p-5 bg-white border border-cream-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cream-100 text-forest-900">
                {isPublic ? <Eye className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
              </div>
              <div>
                <h4 className="font-bold text-xs text-forest-950">Public Passport Visibility</h4>
                <p className="text-[11px] text-stone-500">
                  {isPublic ? "Visible to anyone with your link" : "Restricted to authorized parties"}
                </p>
              </div>
            </div>

            <button
              onClick={toggleVisibility}
              disabled={savingVisibility}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? "bg-emerald-600" : "bg-stone-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Copyable Links & GitHub Badge (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Verification Link */}
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-3">
          <h3 className="font-bold text-sm text-forest-950">Shareable Verification Link</h3>
          <p className="text-xs text-stone-600">
            Share this link on your resume, LinkedIn profile, or job applications. Recruiters can inspect
            your university degree commitment on Polygon Amoy and review proctored test evidence.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-stone-700 focus:outline-none"
            />
            <button
              onClick={() => copyText(publicUrl, "link")}
              className="px-4 py-2.5 rounded-lg bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* GitHub README Badge Exporter */}
        <div className="card-premium p-6 bg-white border border-cream-300 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-forest-950 flex items-center gap-2">
              <Github className="w-4 h-4 text-stone-800" />
              GitHub Profile README Badge
            </h3>
            <span className="text-[10px] uppercase font-bold text-ochre-700 bg-ochre-100 px-2 py-0.5 rounded">
              Embeddable
            </span>
          </div>

          <p className="text-xs text-stone-600">
            Add this verified badge to your GitHub profile README. Clicking the badge takes visitors
            directly to your verifiable passport on SkillChain.
          </p>

          {/* Live Badge Preview */}
          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Live Badge Preview:</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.shields.io/badge/SkillChain-Verified_Passport-16382C?style=for-the-badge&logo=shield"
              alt="SkillChain Badge Preview"
              className="h-7"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={badgeMarkdown}
              className="w-full text-xs font-mono p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-stone-700 focus:outline-none"
            />
            <button
              onClick={() => copyText(badgeMarkdown, "badge")}
              className="px-4 py-2.5 rounded-lg bg-white border border-cream-300 hover:bg-cream-100 text-forest-900 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
            >
              {copiedBadge ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedBadge ? "Copied Markdown" : "Copy Markdown"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
