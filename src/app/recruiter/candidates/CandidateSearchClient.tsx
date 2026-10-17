"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Award,
  ArrowRight,
  ExternalLink,
  FolderGit2,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { calculateCandidateMatch } from "@/lib/matching/engine";

interface CandidateItem {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  universityName: string | null;
  degree: string | null;
  publicPassportSlug: string;
  credentialsCount: number;
  hasDegree: boolean;
  skills: {
    skillName: string;
    verifiedByAssessment: boolean;
    verifiedByDegree: boolean;
    isSelfDeclared: boolean;
    evidences: {
      evidenceType: string;
      title: string;
      score?: number | null;
    }[];
  }[];
  projectsCount: number;
}

interface JobRequirementItem {
  id: string;
  title: string;
  requirements: {
    skillName: string;
    weight: number;
    mustBeVerified: boolean;
  }[];
}

interface CandidateSearchClientProps {
  candidates: CandidateItem[];
  jobs: JobRequirementItem[];
}

export function CandidateSearchClient({ candidates, jobs }: CandidateSearchClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedSkill, setSelectedSkill] = useState<string>("ALL");
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || "NONE");

  // Extract all unique skills across candidates for filter dropdown
  const allAvailableSkills = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => c.skills.forEach((s) => set.add(s.skillName)));
    return Array.from(set).sort();
  }, [candidates]);

  // Selected job for live match scoring
  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  // Filtered & scored candidates
  const processedCandidates = useMemo(() => {
    return candidates
      .map((c) => {
        let matchScore: number | null = null;
        let matchTier: string | null = null;

        if (selectedJob && selectedJob.requirements.length > 0) {
          const matchResult = calculateCandidateMatch(selectedJob.requirements, c.skills);
          matchScore = matchResult.overallScore;
          matchTier = matchResult.matchTier;
        }

        return {
          ...c,
          matchScore,
          matchTier,
        };
      })
      .filter((c) => {
        // 1. Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesText =
            c.name.toLowerCase().includes(q) ||
            (c.headline && c.headline.toLowerCase().includes(q)) ||
            (c.bio && c.bio.toLowerCase().includes(q)) ||
            (c.universityName && c.universityName.toLowerCase().includes(q)) ||
            c.skills.some((s) => s.skillName.toLowerCase().includes(q));

          if (!matchesText) return false;
        }

        // 2. Evidence Tier Filter
        if (selectedTier === "DEGREE" && !c.hasDegree) return false;
        if (
          selectedTier === "ASSESSMENT" &&
          !c.skills.some((s) => s.verifiedByAssessment)
        )
          return false;
        if (selectedTier === "PROJECT" && c.projectsCount === 0) return false;

        // 3. Specific Skill Filter
        if (selectedSkill !== "ALL") {
          const hasSkill = c.skills.some(
            (s) => s.skillName.toLowerCase() === selectedSkill.toLowerCase()
          );
          if (!hasSkill) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.matchScore !== null && b.matchScore !== null) {
          return b.matchScore - a.matchScore;
        }
        return 0;
      });
  }, [candidates, searchQuery, selectedTier, selectedSkill, selectedJob]);

  return (
    <div className="space-y-6">
      {/* Search Bar & Multi-Criteria Filter Bar */}
      <div className="card-premium p-4 sm:p-5 bg-white border border-cream-300 space-y-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates by name, university, degree, or skill..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-xs text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {/* Evidence Tier Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
              Evidence Tier
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full p-2 rounded-lg bg-cream-50 border border-cream-200 text-forest-950 focus:outline-none font-medium"
            >
              <option value="ALL">All Evidence Tiers</option>
              <option value="DEGREE">Tier 1: University Degree Verified</option>
              <option value="ASSESSMENT">Tier 2: Proctored Assessment Verified</option>
              <option value="PROJECT">Tier 3: Public Code Projects</option>
            </select>
          </div>

          {/* Skill Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
              Filter By Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full p-2 rounded-lg bg-cream-50 border border-cream-200 text-forest-950 focus:outline-none font-medium"
            >
              <option value="ALL">All Skills</option>
              {allAvailableSkills.map((sk) => (
                <option key={sk} value={sk}>
                  {sk}
                </option>
              ))}
            </select>
          </div>

          {/* Job Alignment Live Match Scoring */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ochre-700 block mb-1">
              Live Job Alignment Match
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full p-2 rounded-lg bg-cream-100 border border-cream-300 text-forest-950 font-semibold focus:outline-none"
            >
              <option value="NONE">No Job Selected (Default)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-cream-100">
          <span>
            Showing <strong>{processedCandidates.length}</strong> of {candidates.length} candidates
          </span>
          {selectedJob && (
            <span className="text-forest-900 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-ochre-500" />
              Scored against: {selectedJob.title}
            </span>
          )}
        </div>
      </div>

      {/* Candidate Cards List */}
      <div className="space-y-4">
        {processedCandidates.length === 0 ? (
          <div className="card-premium p-10 bg-white border border-cream-300 text-center space-y-2">
            <Filter className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="font-bold text-sm text-forest-950">No Candidates Match Filters</h3>
            <p className="text-xs text-stone-500">
              Try broadening your search term or selecting &quot;All Evidence Tiers&quot;.
            </p>
          </div>
        ) : (
          processedCandidates.map((cand) => {
            const verifiedSkills = cand.skills.filter(
              (s) => s.verifiedByAssessment || s.verifiedByDegree
            );
            const selfDeclaredOnly = cand.skills.filter((s) => s.isSelfDeclared);

            return (
              <div
                key={cand.id}
                className="card-premium p-6 bg-white border border-cream-300 space-y-4 hover:border-forest-700/30 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {cand.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-forest-950">
                          {cand.name}
                        </h2>
                        {cand.hasDegree && (
                          <span className="seal-badge text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            DEGREE VERIFIED
                          </span>
                        )}
                        {cand.skills.some((s) => s.verifiedByAssessment) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ochre-100 text-ochre-900 border border-ochre-200">
                            ASSESSMENT VERIFIED
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-forest-800 mt-0.5">
                        {cand.headline}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {cand.universityName || "Self-Taught"} {cand.degree && `• ${cand.degree}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Live Match Score Indicator */}
                    {cand.matchScore !== null && (
                      <div className="text-right mr-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                          MATCH SCORE
                        </span>
                        <span
                          className={`text-base font-extrabold font-mono px-2.5 py-0.5 rounded-full border ${
                            cand.matchScore >= 80
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : cand.matchScore >= 55
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : "bg-stone-100 text-stone-700 border-stone-200"
                          }`}
                        >
                          {cand.matchScore}%
                        </span>
                      </div>
                    )}

                    <Link
                      href={`/skills/${cand.publicPassportSlug}`}
                      target="_blank"
                      className="p-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Passport</span>
                    </Link>

                    <Link
                      href={`/recruiter/candidates/${cand.id}`}
                      className="px-4 py-2 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>Match Deep Dive</span>
                      <ArrowRight className="w-3.5 h-3.5 text-ochre-300" />
                    </Link>
                  </div>
                </div>

                {/* Skills & Evidence Breakdown Row */}
                <div className="pt-3 border-t border-cream-100 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-stone-400 mr-1">
                      Verified Skills:
                    </span>
                    {verifiedSkills.length > 0 ? (
                      verifiedSkills.map((vs) => (
                        <span
                          key={vs.skillName}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-semibold"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{vs.skillName}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-stone-400 text-[11px] italic">
                        No assessment-verified skills yet
                      </span>
                    )}

                    {selfDeclaredOnly.length > 0 && (
                      <>
                        <span className="text-[10px] uppercase font-bold text-stone-400 ml-2 mr-1">
                          Self-Declared:
                        </span>
                        {selfDeclaredOnly.map((sd) => (
                          <span
                            key={sd.skillName}
                            className="px-2 py-0.5 rounded bg-cream-100 text-stone-600 text-[10px]"
                          >
                            {sd.skillName}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
