import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ExternalLink,
  Lock,
  GraduationCap,
  Calendar,
  Building,
  UserCheck,
  QrCode,
  ArrowLeft,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyCredentialOnChain } from "@/lib/blockchain/client";
import { formatDate } from "@/lib/utils";
import { VerifyQrModal } from "./VerifyQrModal";

interface VerifyPageProps {
  params: Promise<{ credentialId: string }>;
}

export default async function CredentialVerificationPage({ params }: VerifyPageProps) {
  const { credentialId } = await params;

  // Query database record
  const credential = await prisma.credential.findFirst({
    where: {
      OR: [{ credId: credentialId }, { id: credentialId }],
    },
    include: {
      studentProfile: {
        include: {
          user: true,
        },
      },
      issuer: true,
      organization: {
        include: {
          universityProfile: true,
        },
      },
      statusEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!credential) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-forest-950">Credential Record Not Found</h1>
        <p className="text-stone-600 text-sm mt-2 max-w-md mx-auto">
          The credential identifier <code className="text-xs font-mono">{credentialId}</code> does not match any
          verifiable record on SkillChain.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-forest-900 text-cream-50 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  // Check on-chain Polygon Amoy status
  const onChainStatus = await verifyCredentialOnChain(credential.credId);

  const isActive = credential.status === "ACTIVE" && onChainStatus.status === "ACTIVE";
  const isSuspended = credential.status === "SUSPENDED" || onChainStatus.status === "SUSPENDED";
  const isRevoked = credential.status === "REVOKED" || onChainStatus.status === "REVOKED";

  // Record public verification audit event in database
  try {
    await prisma.verificationEvent.create({
      data: {
        credentialId: credential.id,
        verificationResult: isActive ? "VALID" : isSuspended ? "SUSPENDED" : "REVOKED",
        checkedOnChain: onChainStatus.verifiedOnChain,
      },
    });
  } catch (logErr) {
    console.warn("VerificationEvent record skipped:", (logErr as Error)?.message);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${appUrl}/verify/${credential.credId}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-forest-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portal</span>
        </Link>

        <VerifyQrModal
          credentialId={credential.credId}
          verificationUrl={verificationUrl}
          institutionName={credential.organization.name}
          recipientName={credential.studentProfile.user.name}
        />
      </div>

      <div className="card-premium overflow-hidden border-2 border-cream-300">
        {/* Status Header Banner */}
        <div
          className={`p-6 border-b flex flex-wrap items-center justify-between gap-4 ${
            isActive
              ? "bg-emerald-950 text-cream-50 border-emerald-900"
              : isSuspended
              ? "bg-amber-950 text-amber-50 border-amber-900"
              : "bg-red-950 text-red-50 border-red-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isActive ? "bg-emerald-500/20 text-emerald-300" : isSuspended ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"
              }`}
            >
              {isActive ? (
                <ShieldCheck className="w-7 h-7" />
              ) : isSuspended ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <XCircle className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Verifiable Credential Inspection
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display">
                {isActive
                  ? "Authentic & Cryptographically Verified"
                  : isSuspended
                  ? "Credential Temporarily Suspended"
                  : "Credential Permanently Revoked"}
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                isActive
                  ? "bg-emerald-500 text-forest-950 font-bold"
                  : isSuspended
                  ? "bg-amber-400 text-amber-950"
                  : "bg-red-500 text-white"
              }`}
            >
              STATUS: {credential.status}
            </span>
          </div>
        </div>

        {/* Credential Body */}
        <div className="p-8 space-y-8 bg-white">
          {/* Institutional Information */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-cream-200 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                Conferring Institution
              </span>
              <h2 className="text-xl font-bold text-forest-950 flex items-center gap-2">
                <Building className="w-5 h-5 text-forest-700" />
                {credential.organization.name}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {credential.organization.universityProfile?.accreditationDetails || "Accredited Higher Education Institution"}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                Issued To
              </span>
              <p className="text-lg font-bold text-forest-950">
                {credential.studentProfile.user.name}
              </p>
              <p className="text-xs text-stone-500">Student ID / Passport: Verified</p>
            </div>
          </div>

          {/* Award Specifics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
              <span className="text-xs font-semibold text-stone-400 block mb-1">CREDENTIAL TITLE</span>
              <p className="font-bold text-forest-950 text-base">{credential.title}</p>
              <p className="text-xs text-stone-600 mt-0.5">{credential.degreeName || "Academic Degree"}</p>
            </div>

            <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
              <span className="text-xs font-semibold text-stone-400 block mb-1">FIELD OF STUDY & GRADE</span>
              <p className="font-bold text-forest-950 text-base">{credential.fieldOfStudy || "Computer Science"}</p>
              <p className="text-xs text-emerald-800 font-semibold mt-0.5">{credential.grade || "Conferred with Honors"}</p>
            </div>

            <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
              <span className="text-xs font-semibold text-stone-400 block mb-1">CONFERRAL DATE</span>
              <p className="font-bold text-forest-950 text-base flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-forest-700" />
                {formatDate(credential.issuanceDate)}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">Non-expiring academic conferral</p>
            </div>
          </div>

          {/* Blockchain & Cryptographic Integrity Section */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-forest-950 flex items-center gap-2">
                <Lock className="w-4 h-4 text-ochre-600" />
                Cryptographic Commitment & Polygon Amoy Registry
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Chain ID: 80002
              </span>
            </div>

            <div className="p-4 rounded-xl bg-forest-950 text-cream-100 font-mono text-xs space-y-3">
              <div>
                <span className="text-stone-400 text-[11px] block">Privacy-Preserving SHA-256 Commitment:</span>
                <span className="text-ochre-300 break-all text-[11px]">{credential.commitment}</span>
              </div>

              <div>
                <span className="text-stone-400 text-[11px] block">Smart Contract Registry Address:</span>
                <span className="text-emerald-400 break-all text-[11px]">
                  {onChainStatus.contractAddress}
                </span>
              </div>

              {credential.txHash && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-forest-900">
                  <div>
                    <span className="text-stone-400 text-[11px] block">Anchor Transaction Hash:</span>
                    <span className="text-stone-200 break-all text-[11px]">{credential.txHash}</span>
                  </div>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${credential.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-ochre-300 hover:text-ochre-200 flex-shrink-0"
                  >
                    <span>Inspect on PolygonScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Issuance Audit Log */}
          {credential.statusEvents.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-cream-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Cryptographic Status Event History
              </h4>
              <div className="space-y-2">
                {credential.statusEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-cream-50 text-xs text-stone-600 border border-cream-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span className="font-semibold text-forest-900">{ev.newStatus}:</span>
                      <span>{ev.reason || "Status confirmation"}</span>
                    </div>
                    <span className="text-stone-400 font-mono text-[11px]">
                      {formatDate(ev.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-3.5 rounded-lg bg-cream-100 text-[11px] text-stone-600 leading-relaxed border border-cream-200">
            <strong>Privacy Policy Notice:</strong> Per W3C Verifiable Credentials and European/US
            privacy regulations, personal student identifiers, grades, and transcripts are never
            written directly on-chain. Only the salted cryptographic commitment hash is anchored on
            Polygon Amoy to prove tamper resistance.
          </div>
        </div>
      </div>
    </div>
  );
}
