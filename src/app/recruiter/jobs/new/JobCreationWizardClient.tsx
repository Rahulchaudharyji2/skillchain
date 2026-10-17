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
} from "lucide-react";

export function JobCreationWizardClient() {
  const router = useRouter();

  const [prompt, setPrompt] = useState(
    "Create a job for a junior React developer with JavaScript, React hooks, REST APIs, Git, testing, and basic TypeScript. Require one year of relevant experience or equivalent projects."
  );
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

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
        setTitle(data.draft.title);
        setOverview(data.draft.overview);
        setResponsibilities(data.draft.responsibilities || []);
        setRequiredSkills(data.draft.requiredSkills || []);
        setPreferredSkills(data.draft.preferredSkills || []);
        setSeniorityLevel(data.draft.seniorityLevel || "MID");
        setLocation(data.draft.location || "Remote");
        setWorkArrangement(data.draft.workArrangement || "REMOTE");
        setCompensationRange(data.draft.compensationRange || "$110,000 - $140,000");
      }
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
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
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/recruiter/jobs");
      }
    } catch (err) {
      console.error("Job publish failed:", err);
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
    if (newReqSkill.trim() && !requiredSkills.includes(newReqSkill.trim())) {
      setRequiredSkills([...requiredSkills, newReqSkill.trim()]);
      setNewReqSkill("");
    }
  };

  const removeReqSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  return (
    <div className="space-y-8">
      {/* Natural Language Prompt Input */}
      <div className="card-premium p-6 bg-forest-950 text-cream-50 border-forest-900 space-y-4">
        <div className="flex items-center gap-2 text-ochre-400">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-sm uppercase font-bold tracking-wider">
            Natural Language AI Job Generator
          </h2>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          Type your requirements in plain language. The AI synthesizes job requirements, mandatory
          skill verification thresholds, and candidate matching criteria.
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
                <span>Synthesizing Draft...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-forest-950" />
                <span>Generate Job Draft</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editable Draft Review Form */}
      <form onSubmit={handlePublish} className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
        <div className="border-b border-cream-200 pb-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-forest-700 bg-cream-100 px-2 py-0.5 rounded">
            Editable Job Specification
          </span>
          <h3 className="text-lg font-bold text-forest-950 mt-1">Review & Publish Job Posting</h3>
          <p className="text-xs text-stone-500">
            Review AI suggestions. Every field can be customized prior to publication.
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

        {/* Required Skills with Tags */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-700 block">
            Required Skills (Mandatory for Candidate Match Calculation)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {requiredSkills.map((sk) => (
              <span
                key={sk}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold"
              >
                <span>{sk}</span>
                <button
                  type="button"
                  onClick={() => removeReqSkill(sk)}
                  className="text-emerald-700 hover:text-emerald-950"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newReqSkill}
              onChange={(e) => setNewReqSkill(e.target.value)}
              placeholder="Add skill (e.g. Next.js, Python)..."
              className="p-2 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none flex-1"
            />
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

        {/* Publication Action */}
        <div className="pt-4 border-t border-cream-200 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Publishing makes this posting discoverable and activates candidate matching.
          </span>

          <button
            type="submit"
            disabled={publishing}
            className="px-6 py-3 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-ochre-300" />
                <span>Publishing to SkillChain...</span>
              </>
            ) : (
              <>
                <span>Approve & Publish Job Posting</span>
                <ArrowRight className="w-4 h-4 text-ochre-300" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
