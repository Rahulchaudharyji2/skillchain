export interface MatchedSkillDetail {
  skillName: string;
  evidenceType: "UNIVERSITY_DEGREE" | "ASSESSMENT" | "PROJECT" | "SELF_DECLARED" | "MISSING";
  evidenceBadge: string;
  weight: number;
  score: number;
  details: string;
  verified: boolean;
}

export interface SkillGapItem {
  skillName: string;
  gapType: "MISSING" | "UNVERIFIED_SELF_DECLARED";
  weight: number;
  impactScore: number; // Score potential lost due to gap
  recommendation: string;
  recommendedAssessmentId?: string;
  recommendedAssessment?: {
    slug: string;
    title: string;
  };
}

export interface CandidateMatchResult {
  overallScore: number;
  matchTier: "STRONG_MATCH" | "MODERATE_MATCH" | "DEVELOPING_MATCH";
  matchingSkills: MatchedSkillDetail[];
  missingSkills: string[];
  selfDeclaredOnly: string[];
  skillGaps: SkillGapItem[];
  evidenceBreakdown: {
    universityVerifiedCount: number;
    assessmentVerifiedCount: number;
    projectEvidenceCount: number;
    projectVerifiedCount: number;
    selfDeclaredCount: number;
    missingCount: number;
  };
  rationale: string;
}

const ASSESSMENT_MAP: Record<string, { slug: string; title: string }> = {
  react: { slug: "react-assessment", title: "React & Modern Component Architecture" },
  javascript: { slug: "javascript-assessment", title: "JavaScript ES6+ & Asynchronous Architecture" },
  typescript: { slug: "typescript-assessment", title: "TypeScript Advanced Type Systems" },
  python: { slug: "python-assessment", title: "Python Systems & Concurrency" },
};

/**
 * Calculates deterministic, explainable candidate alignment against job requirements.
 * Strictly separates university-verified degrees, proctored assessments, project artifacts,
 * and self-declared claims. Never treats unverified self-declarations as verified evidence.
 */
export function calculateCandidateMatch(
  jobRequirements: {
    skillName: string;
    weight: number;
    mustBeVerified: boolean;
    minScoreThreshold?: number | null;
  }[],
  studentSkills: {
    skillName: string;
    verifiedByAssessment: boolean;
    verifiedByDegree: boolean;
    isSelfDeclared: boolean;
    evidences: {
      evidenceType: string;
      title: string;
      description?: string | null;
      score?: number | null;
    }[];
  }[]
): CandidateMatchResult {
  const matchingSkills: MatchedSkillDetail[] = [];
  const missingSkills: string[] = [];
  const selfDeclaredOnly: string[] = [];
  const skillGaps: SkillGapItem[] = [];

  let totalWeightedPossible = 0;
  let totalWeightedEarned = 0;

  let uniCount = 0;
  let assessmentCount = 0;
  let projectCount = 0;
  let selfDeclaredCount = 0;

  for (const req of jobRequirements) {
    const weight = req.weight || 1.0;
    totalWeightedPossible += weight * 100;

    const candidateSkill = studentSkills.find(
      (s) => s.skillName.toLowerCase() === req.skillName.toLowerCase()
    );

    const assessmentMeta = ASSESSMENT_MAP[req.skillName.toLowerCase()];

    if (!candidateSkill) {
      missingSkills.push(req.skillName);
      skillGaps.push({
        skillName: req.skillName,
        gapType: "MISSING",
        weight,
        impactScore: weight * 100,
        recommendation: assessmentMeta
          ? `Complete the "${assessmentMeta.title}" to verify this missing core requirement.`
          : `Add project evidence or take an assessment covering ${req.skillName}.`,
        recommendedAssessmentId: assessmentMeta?.slug,
        recommendedAssessment: assessmentMeta,
      });

      matchingSkills.push({
        skillName: req.skillName,
        evidenceType: "MISSING",
        evidenceBadge: "Missing Requirement",
        weight,
        score: 0,
        details: "No declared or verified evidence found in candidate profile.",
        verified: false,
      });
      continue;
    }

    // Check evidence hierarchy
    const assessmentEvidence = candidateSkill.evidences.find((e) => e.evidenceType === "ASSESSMENT");
    const degreeEvidence = candidateSkill.evidences.find((e) => e.evidenceType === "UNIVERSITY_DEGREE");
    const projectEvidence = candidateSkill.evidences.find((e) => e.evidenceType === "PROJECT");

    if (candidateSkill.verifiedByAssessment && assessmentEvidence) {
      // 100% credit for proctored assessment, scaled by actual score earned
      assessmentCount++;
      const score = assessmentEvidence.score || 90;
      totalWeightedEarned += weight * score;
      matchingSkills.push({
        skillName: req.skillName,
        evidenceType: "ASSESSMENT",
        evidenceBadge: "Assessment Verified",
        weight,
        score,
        details: `Verified via proctored assessment: ${assessmentEvidence.title} (${score}% score).`,
        verified: true,
      });
    } else if (candidateSkill.verifiedByDegree && degreeEvidence) {
      // 95% credit for university accredited degree
      uniCount++;
      const score = 95;
      totalWeightedEarned += weight * score;
      matchingSkills.push({
        skillName: req.skillName,
        evidenceType: "UNIVERSITY_DEGREE",
        evidenceBadge: "University Degree",
        weight,
        score,
        details: `Verified by accredited university credential: ${degreeEvidence.title}.`,
        verified: true,
      });
    } else if (projectEvidence) {
      // 70% credit for project evidence
      projectCount++;
      const score = 70;
      totalWeightedEarned += weight * score;

      if (req.mustBeVerified) {
        skillGaps.push({
          skillName: req.skillName,
          gapType: "UNVERIFIED_SELF_DECLARED",
          weight,
          impactScore: weight * 30, // 100 - 70 = 30 points gap
          recommendation: assessmentMeta
            ? `Take the proctored "${assessmentMeta.title}" to convert project evidence into a verified badge.`
            : `Complete an assessment for ${req.skillName} to satisfy mandatory verification.`,
          recommendedAssessmentId: assessmentMeta?.slug,
          recommendedAssessment: assessmentMeta,
        });
      }

      matchingSkills.push({
        skillName: req.skillName,
        evidenceType: "PROJECT",
        evidenceBadge: "Project Evidence",
        weight,
        score,
        details: `Supported by code project: ${projectEvidence.title}.`,
        verified: false,
      });
    } else {
      // 35% credit for unverified self-declaration
      selfDeclaredCount++;
      selfDeclaredOnly.push(req.skillName);
      const score = 35;
      totalWeightedEarned += weight * score;

      skillGaps.push({
        skillName: req.skillName,
        gapType: "UNVERIFIED_SELF_DECLARED",
        weight,
        impactScore: weight * 65, // 100 - 35 = 65 points gap
        recommendation: assessmentMeta
          ? `Candidate holds unverified self-declaration only. Take "${assessmentMeta.title}" to achieve verified status.`
          : `Self-declared claim only. Objective assessment verification required.`,
        recommendedAssessmentId: assessmentMeta?.slug,
        recommendedAssessment: assessmentMeta,
      });

      matchingSkills.push({
        skillName: req.skillName,
        evidenceType: "SELF_DECLARED",
        evidenceBadge: "Self-Declared",
        weight,
        score,
        details: "Candidate declared proficiency without objective verification proof.",
        verified: false,
      });
    }
  }

  const overallScore =
    totalWeightedPossible > 0
      ? Math.round((totalWeightedEarned / totalWeightedPossible) * 1000) / 10
      : 0;

  let matchTier: "STRONG_MATCH" | "MODERATE_MATCH" | "DEVELOPING_MATCH" = "DEVELOPING_MATCH";
  if (overallScore >= 80) matchTier = "STRONG_MATCH";
  else if (overallScore >= 55) matchTier = "MODERATE_MATCH";

  const rationale =
    matchTier === "STRONG_MATCH"
      ? `Candidate holds verified credentials or proctored assessments covering ${assessmentCount + uniCount} primary requirements. High confidence match with ${skillGaps.length} minor gap(s).`
      : matchTier === "MODERATE_MATCH"
      ? `Candidate exhibits relevant project background but has ${missingSkills.length + selfDeclaredOnly.length} requirement(s) pending assessment or academic verification.`
      : `Candidate lacks verified evidence for key mandatory skills (${skillGaps.length} skill gaps identified). Additional skill assessments recommended.`;

  return {
    overallScore,
    matchTier,
    matchingSkills,
    missingSkills,
    selfDeclaredOnly,
    skillGaps,
    evidenceBreakdown: {
      universityVerifiedCount: uniCount,
      assessmentVerifiedCount: assessmentCount,
      projectEvidenceCount: projectCount,
      projectVerifiedCount: projectCount,
      selfDeclaredCount,
      missingCount: missingSkills.length,
    },
    rationale,
  };
}
