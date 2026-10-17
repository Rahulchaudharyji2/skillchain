"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  Sliders,
  DollarSign,
  MapPin,
  Briefcase,
  FileText,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export function JobCreationWizardClient() {
  const router = useRouter();

  const [prompt, setPrompt] = useState(
    "Create a job for a junior React developer with JavaScript, React hooks, REST APIs, Git, testing, and basic TypeScript. Require one year of relevant experience or equivalent projects."
  );
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draftSource, setDraftSource] = useState<string>("default");

  // Explicit Recruiter Approval Gate
  const [recruiterApproved, setRecruiterApproved] = useState(false);

  // Editable Form State
  const [title, setTitle] = useState("Junior React Developer — Web Systems");
  const [overview, setOverview] = useState(
    "We are seeking a junior React developer passionate about component lifecycle, state management, and building clean web interfaces."
  );
  const [responsibilities, setResponsibilities] = useState<string[]>([
    "Develop modular React UI components using modern hooks and clean state isolation",
    "Integrate with backend REST APIs and handle loading and error states smoothly",
    "Collaborate on automated testing using Vitest and React Testing Library",
    "Participate in code reviews and Git version control workflows",
  ]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([
    "React",
    "TypeScript",
    "Data Structures & Algorithms",
  ]);
  const [skillWeights, setSkillWeights] = useState<Record<string, number>>({
    React: 3.0,
    TypeScript: 2.5,
    "Data Structures & Algorithms": 2.0,
  });
  const [preferredSkills, setPreferredSkills] = useState<string[]>([
    "Next.js",
    "Docker",
    "PostgreSQL & SQL",
  ]);
  const [seniorityLevel, setSeniorityLevel] = useState<"ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD">(
    "JUNIOR"
  );
  const [location, setLocation] = useState("San Francisco, CA / Remote");
  const [workArrangement, setWorkArrangement] = useState<"REMOTE" | "HYBRID" | "ONSITE">("REMOTE");
  const [compensationRange, setCompensationRange] = useState("$95,000 - $125,000");

  const [newResp, setNewResp] = useState("");
  const [newReqSkill, setNewReqSkill] = useState("");
  const [newReqWeight, setNewReqWeight] = useState("2.0");

  const handleGenerateFromAI = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/job-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.draft) {
        applyDraft(data.draft, data.isManualFallback ? "Manual Fallback Template (AI Offline)" : "AI Synthesizer");
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      // Fallback locally
      handleLoadFallbackTemplate("fullstack");
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadFallbackTemplate = async (domain: "frontend" | "backend" | "fullstack") => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/job-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualFallback: true, template: domain }),
      });
      const data = await res.json();
      if (data.draft) {
        applyDraft(data.draft, `Manual Fallback Template: ${domain.toUpperCase()}`);
      }
    } catch (err) {
      console.error("Fallback load failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const applyDraft = (draft: any, sourceName: string) => {
    setTitle(draft.title);
    setOverview(draft.overview);
    setResponsibilities(draft.responsibilities || []);
    setRequiredSkills(draft.requiredSkills || []);
    setPreferredSkills(draft.preferredSkills || []);
    setSeniorityLevel(draft.seniorityLevel || "MID");
    setLocation(draft.location || "Remote");
    setWorkArrangement(draft.workArrangement || "REMOTE");
    setCompensationRange(draft.compensationRange || "$110,000 - $140,000");
    if (draft.skillWeights) {
      setSkillWeights(draft.skillWeights);
    }
    setDraftSource(sourceName);
    setRecruiterApproved(false); // Reset explicit approval for edited/new draft
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiterApproved) {
      alert("Explicit recruiter approval is required before publishing.");
      return;
    }

    setPublishing(true);

    try {
      const res = await fetch("/api/recruiter/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          overview,
          responsibilities,
          requiredSkills,
          preferredSkills,
          seniorityLevel,
          location,
          workArrangement,
          compensationRange,
          aiPromptUsed: prompt,
          skillWeights,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/recruiter/jobs");
      } else {
        alert(data.error || "Publication failed");
      }
    } catch (err: any) {
      console.error("Job publish failed:", err);
      alert("Publication failed: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const addResp = () => {
    if (newResp.trim()) {
      setResponsibilities([...responsibilities, newResp.trim()]);
      setNewResp("");
    }
  };

  const removeResp = (idx: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== idx));
  };

  const addReqSkill = () => {
    const s = newReqSkill.trim();
    if (s && !requiredSkills.includes(s)) {
      setRequiredSkills([...requiredSkills, s]);
      setSkillWeights({ ...skillWeights, [s]: parseFloat(newReqWeight) || 2.0 });
      setNewReqSkill("");
    }
  };

  const removeReqSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
    const copy = { ...skillWeights };
    delete copy[skill];
    setSkillWeights(copy);
  };

  const updateSkillWeight = (skill: string, weight: number) => {
    setSkillWeights({ ...skillWeights, [skill]: weight });
  };

  return (
    <div className="space-y-8">
      {/* Natural Language Prompt Input & Fallback Selector */}
      <div className="card-premium p-6 bg-forest-950 text-cream-50 border-forest-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-ochre-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-sm uppercase font-bold tracking-wider">
              Natural Language AI Job Generator
            </h2>
          </div>

          {draftSource !== "default" && (
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-forest-900 text-ochre-300 border border-forest-800">
              Source: {draftSource}
            </span>
          )}
        </div>

        <p className="text-xs text-stone-300 leading-relaxed">
          Describe the role requirements in natural language. The AI synthesizes structured requirements,
          evidence weights, and candidate matching criteria. Or use a manual fallback template below if the AI provider is unavailable.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-forest-900 border border-forest-800 text-xs text-cream-50 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-ochre-400 resize-none"
            placeholder="Describe the job role, required skills, and seniority..."
          />
          <button
            onClick={handleGenerateFromAI}
            disabled={generating}
            className="px-5 py-3 rounded-xl bg-ochre-400 hover:bg-ochre-300 disabled:opacity-50 text-forest-950 text-xs font-bold flex items-center justify-center gap-2 transition-all flex-shrink-0 shadow-md"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-forest-950" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-forest-950" />
                <span>Generate with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Manual Fallback Presets */}
        <div className="pt-2 border-t border-forest-900/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-stone-400 font-medium">Manual Fallback Templates:</span>
          <button
            type="button"
            onClick={() => handleLoadFallbackTemplate("frontend")}
            className="px-2.5 py-1 rounded-lg bg-forest-900 hover:bg-forest-800 text-[11px] font-semibold text-cream-100 border border-forest-800 transition-colors"
          >
            Frontend React
          </button>
          <button
            type="button"
            onClick={() => handleLoadFallbackTemplate("backend")}
            className="px-2.5 py-1 rounded-lg bg-forest-900 hover:bg-forest-800 text-[11px] font-semibold text-cream-100 border border-forest-800 transition-colors"
          >
            Backend Systems
          </button>
          <button
            type="button"
            onClick={() => handleLoadFallbackTemplate("fullstack")}
            className="px-2.5 py-1 rounded-lg bg-forest-900 hover:bg-forest-800 text-[11px] font-semibold text-cream-100 border border-forest-800 transition-colors"
          >
            Full Stack Node/React
          </button>
        </div>
      </div>

      {/* Editable Draft Review Form */}
      <form onSubmit={handlePublish} className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
        <div className="border-b border-cream-200 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-forest-700 bg-cream-100 px-2 py-0.5 rounded">
              Editable Draft Specifications
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Status: Draft (Pending Recruiter Approval)
            </span>
          </div>
          <h3 className="text-lg font-bold text-forest-950 mt-1">Review & Publish Job Listing</h3>
          <p className="text-xs text-stone-500">
            Customize all parameters before giving explicit recruiter approval.
          </p>
        </div>

        {/* Title & Seniority */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-900 focus:outline-none font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Seniority Tier
            </label>
            <select
              value={seniorityLevel}
              onChange={(e: any) => setSeniorityLevel(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-900 focus:outline-none"
            >
              <option value="ENTRY">Entry Level</option>
              <option value="JUNIOR">Junior (1-2 yrs)</option>
              <option value="MID">Mid Level (2-4 yrs)</option>
              <option value="SENIOR">Senior (5+ yrs)</option>
              <option value="LEAD">Staff / Lead</option>
            </select>
          </div>
        </div>

        {/* Location, Arrangement & Compensation */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-900 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Work Arrangement
            </label>
            <select
              value={workArrangement}
              onChange={(e: any) => setWorkArrangement(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-900 focus:outline-none"
            >
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-Site</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Compensation Range
            </label>
            <input
              type="text"
              value={compensationRange}
              onChange={(e) => setCompensationRange(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Overview */}
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Role Overview</label>
          <textarea
            rows={3}
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-900 focus:outline-none leading-relaxed"
            required
          />
        </div>

        {/* Required Skills with Individual Weights */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-700 block">
              Required Skills & Match Weights (Deterministic Evidence Scoring)
            </label>
            <p className="text-[11px] text-stone-500">
              Set custom weights (1.0 to 5.0). Higher weights prioritize skills with verified proctored assessment credentials.
            </p>
          </div>

          <div className="space-y-2">
            {requiredSkills.map((sk) => {
              const currentWeight = skillWeights[sk] ?? 2.0;
              return (
                <div
                  key={sk}
                  className="p-3 rounded-xl bg-cream-50 border border-cream-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-forest-950 text-sm">{sk}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      Mandatory
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-500 font-mono">Weight:</span>
                      <select
                        value={currentWeight}
                        onChange={(e) => updateSkillWeight(sk, parseFloat(e.target.value))}
                        className="p-1 rounded bg-white border border-cream-300 font-mono text-xs font-bold text-forest-900"
                      >
                        <option value="1.0">1.0 (Standard)</option>
                        <option value="2.0">2.0 (Important)</option>
                        <option value="3.0">3.0 (Critical)</option>
                        <option value="4.0">4.0 (Core Pillar)</option>
                        <option value="5.0">5.0 (Must Have)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeReqSkill(sk)}
                      className="text-stone-400 hover:text-red-600 p-1"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newReqSkill}
              onChange={(e) => setNewReqSkill(e.target.value)}
              placeholder="Add skill requirement (e.g. Next.js, Python)..."
              className="p-2 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none flex-1"
            />
            <select
              value={newReqWeight}
              onChange={(e) => setNewReqWeight(e.target.value)}
              className="p-2 rounded-lg bg-cream-50 border border-cream-300 text-xs font-mono"
            >
              <option value="1.0">Weight: 1.0</option>
              <option value="2.0">Weight: 2.0</option>
              <option value="3.0">Weight: 3.0</option>
              <option value="4.0">Weight: 4.0</option>
              <option value="5.0">Weight: 5.0</option>
            </select>
            <button
              type="button"
              onClick={addReqSkill}
              className="px-3 py-2 rounded-lg bg-cream-200 hover:bg-cream-300 text-forest-900 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Responsibilities list */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-700 block">Key Responsibilities</label>
          <div className="space-y-2">
            {responsibilities.map((resp, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-cream-50 border border-cream-200 text-xs text-stone-800"
              >
                <span>• {resp}</span>
                <button
                  type="button"
                  onClick={() => removeResp(i)}
                  className="text-stone-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newResp}
              onChange={(e) => setNewResp(e.target.value)}
              placeholder="Add responsibility item..."
              className="p-2 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none flex-1"
            />
            <button
              type="button"
              onClick={addResp}
              className="px-3 py-2 rounded-lg bg-cream-200 hover:bg-cream-300 text-forest-900 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Explicit Recruiter Approval Gate */}
        <div className="p-4 rounded-xl bg-cream-100 border border-cream-300 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={recruiterApproved}
              onChange={(e) => setRecruiterApproved(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-cream-400 text-forest-900 focus:ring-forest-800"
            />
            <div className="text-xs text-stone-800 space-y-0.5">
              <span className="font-bold text-forest-950 block">
                Explicit Recruiter Review & Publication Approval
              </span>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                I affirm that I have personally reviewed this job specification, skill requirements, and weighting hierarchy. Under SkillChain's human-in-the-loop policy, AI drafts are never published without explicit human recruiter confirmation.
              </p>
            </div>
          </label>
        </div>

        {/* Publication Action */}
        <div className="pt-4 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-stone-500">
            Publishing activates candidate matching and public job discovery.
          </span>

          <button
            type="submit"
            disabled={publishing || !recruiterApproved}
            className="px-6 py-3 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-ochre-300" />
                <span>Publishing to SkillChain...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-ochre-300" />
                <span>Approve & Publish Job Listing</span>
                <ArrowRight className="w-4 h-4 text-ochre-300" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
