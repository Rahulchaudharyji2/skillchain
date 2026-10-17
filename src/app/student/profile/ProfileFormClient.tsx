"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Check, Loader2, Save } from "lucide-react";

interface ProfileFormClientProps {
  initialData: {
    name: string;
    email: string;
    headline: string;
    bio: string;
    universityName: string;
    degree: string;
    githubUrl: string;
    linkedinUrl: string;
    portfolioUrl: string;
  };
}

export function ProfileFormClient({ initialData }: ProfileFormClientProps) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Profile update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-premium p-6 sm:p-8 bg-white border border-cream-300 space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Email Address</label>
          <input
            type="email"
            value={formData.email}
            readOnly
            className="w-full p-2.5 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-stone-700 block mb-1.5">Professional Headline</label>
        <input
          type="text"
          value={formData.headline}
          onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
          className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
          placeholder="e.g. Full-Stack Engineer & Smart Contract Researcher"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-stone-700 block mb-1.5">Bio</label>
        <textarea
          rows={3}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
          placeholder="Brief summary of your background and technical interests..."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">University Name</label>
          <input
            type="text"
            value={formData.universityName}
            onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Degree / Major</label>
          <input
            type="text"
            value={formData.degree}
            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">GitHub URL</label>
          <input
            type="url"
            value={formData.githubUrl}
            onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">LinkedIn URL</label>
          <input
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1.5">Portfolio URL</label>
          <input
            type="url"
            value={formData.portfolioUrl}
            onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
            className="w-full p-2.5 rounded-lg bg-cream-50 border border-cream-300 text-xs text-stone-800 focus:outline-none"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-cream-200 flex items-center justify-between">
        {saved ? (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile changes saved successfully!</span>
          </span>
        ) : (
          <span className="text-xs text-stone-400">All fields update your public skill passport.</span>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 disabled:opacity-50 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-ochre-300" />
          ) : (
            <Save className="w-4 h-4 text-ochre-300" />
          )}
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
