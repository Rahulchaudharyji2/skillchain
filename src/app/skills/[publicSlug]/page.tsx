import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  GraduationCap,
  Award,
  FolderGit2,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  CheckCircle2,
  Lock,
  Copy,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getEvidenceBadgeStyle, formatDate } from "@/lib/utils";
import { PassportShareClient } from "./PassportShareClient";

interface PassportPageProps {
  params: Promise<{ publicSlug: string }>;
}

export default async function PublicPassportPage({ params }: PassportPageProps) {
  const { publicSlug } = await params;

  const profile = await prisma.studentProfile.findUnique({
    where: { publicPassportSlug: publicSlug },
    include: {
      user: true,
      credentials: {
        where: { status: "ACTIVE" },
        include: { organization: true },
      },
      studentSkills: {
        include: {
          skill: { include: { category: true } },
          evidences: {
            include: { project: true, credential: true },
          },
        },
      },
      projects: true,
    },
  });

  if (!profile) {
    notFound();
  }

  if (!profile.isPassportPublic) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold font-display text-forest-950">This Skill Passport is Private</h1>
        <p className="text-stone-600 text-xs mt-2">
          The candidate has restricted public visibility for this skill passport.
        </p>
      </div>
    );
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/skills/${profile.publicPassportSlug}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Top Profile Card */}
      <div className="card-premium p-6 sm:p-8 bg-white border-2 border-cream-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-cream-200">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-2xl overflow-hidden shadow-md flex-shrink-0">
              {profile.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.user.avatarUrl} alt={profile.user.name} className="w-full h-full object-cover" />
              ) : (
                profile.user.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold font-display text-forest-950">
                  {profile.user.name}
                </h1>
                <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  VERIFIED PASSPORT
                </span>
              </div>
              <p className="text-sm font-medium text-forest-800 mt-1">{profile.headline}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {profile.universityName} {profile.degree && `• ${profile.degree}`}
              </p>
            </div>
          </div>

          {/* Client Share Actions: QR Code modal & GitHub Readme Badge */}
          <PassportShareClient
            publicUrl={publicUrl}
            candidateName={profile.user.name}
            publicSlug={profile.publicPassportSlug}
          />
        </div>

        {/* Bio & Social Links */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">{profile.bio}</p>

          <div className="flex items-center gap-2 flex-shrink-0">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            )}
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Portfolio</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Verified Academic Credentials Section */}
      {profile.credentials.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-forest-950 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-forest-800" />
              University-Verified Academic Credentials
            </h2>
            <span className="text-xs text-stone-500 font-medium">Polygon Amoy Anchored</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {profile.credentials.map((cred) => (
              <div key={cred.id} className="card-premium p-5 bg-white border border-cream-300">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      {cred.organization.name}
                    </span>
                    <h3 className="font-bold text-forest-950 text-sm mt-0.5">{cred.title}</h3>
                    <p className="text-xs text-stone-600 mt-0.5">{cred.fieldOfStudy} • {cred.grade}</p>
                  </div>
                  <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    CONFIRMED
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between text-[11px]">
                  <span className="text-stone-400 font-mono">
                    Commitment: {cred.commitment.substring(0, 14)}...
                  </span>
                  <Link
                    href={`/verify/${cred.credId}`}
                    className="inline-flex items-center gap-1 text-forest-800 font-semibold hover:text-forest-950"
                  >
                    <span>Inspect On-Chain Proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Skills & Evidence Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-forest-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ochre-600" />
            Verified Skills & Evidence Matrix
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            Categorized by Assessment, Degree, and Project Proof
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {profile.studentSkills.map((ss) => {
            const hasAssessment = ss.verifiedByAssessment;
            const hasDegree = ss.verifiedByDegree;
            const badge = getEvidenceBadgeStyle(
              hasAssessment
                ? "ASSESSMENT"
                : hasDegree
                ? "UNIVERSITY_DEGREE"
                : ss.evidences.length > 0
                ? "PROJECT"
                : "SELF_DECLARED"
            );

            return (
              <div key={ss.id} className="card-premium p-5 bg-white border border-cream-300">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-forest-950 text-sm">{ss.skill.name}</h3>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {ss.skill.category.name} • {ss.proficiencyLevel}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Evidence Items */}
                <div className="space-y-2 mt-2">
                  {ss.evidences.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-lg bg-cream-50 border border-cream-200 text-xs text-stone-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-forest-900">{ev.title}</span>
                        {ev.score && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {ev.score}% Score
                          </span>
                        )}
                      </div>
                      {ev.description && <p className="text-[11px] text-stone-500 mt-1">{ev.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Code Projects */}
      {profile.projects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-display text-forest-950 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-sky-700" />
            Featured Software Projects
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {profile.projects.map((proj) => (
              <div key={proj.id} className="card-premium p-5 bg-white border border-cream-300">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-forest-950 text-sm">{proj.title}</h3>
                  <div className="flex items-center gap-2">
                    {proj.repoUrl && (
                      <a href={proj.repoUrl} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-stone-800">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-stone-400 hover:text-stone-800">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">{proj.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {proj.techStack.split(",").map((tech, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-cream-100 text-forest-800 font-medium">
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
