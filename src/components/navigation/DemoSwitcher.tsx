"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, ChevronDown, Check, Shield, School, Briefcase, GraduationCap } from "lucide-react";

interface DemoSwitcherProps {
  currentRole: string;
  userName: string;
  userEmail: string;
}

export function DemoSwitcher({ currentRole, userName, userEmail }: DemoSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const personas = [
    {
      role: "STUDENT",
      name: "Alex Rivera",
      title: "MIT CS Graduate & Candidate",
      email: "alex.rivera@student.mit.edu",
      icon: GraduationCap,
      path: "/student/dashboard",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
    {
      role: "ISSUER",
      name: "Dr. Sarah Jenkins",
      title: "MIT Dean of Academic Records",
      email: "issuer@mit.edu",
      icon: School,
      path: "/university/dashboard",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    },
    {
      role: "RECRUITER",
      name: "Elena Rostova",
      title: "Stripe Talent Acquisition Lead",
      email: "recruiter@stripe.com",
      icon: Briefcase,
      path: "/recruiter/dashboard",
      badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    },
    {
      role: "ADMIN",
      name: "Marcus Vance",
      title: "Platform & Dispute Auditor",
      email: "admin@skillchain.org",
      icon: Shield,
      path: "/admin/dashboard",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    },
  ];

  const handleSwitch = async (persona: (typeof personas)[0]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: persona.role }),
      });
      const data = await res.json();
      setIsOpen(false);
      router.push(data.redirectPath || persona.path);
      router.refresh();
    } catch (err) {
      console.error("Demo switch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const activePersona = personas.find((p) => p.role === currentRole) || personas[0];
  const IconComponent = activePersona.icon;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-forest-600/30 bg-forest-900/5 hover:bg-forest-900/10 transition-colors text-xs font-medium text-forest-900 shadow-sm"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
        </span>
        <IconComponent className="w-3.5 h-3.5 text-forest-700" />
        <span className="font-semibold">{activePersona.name}</span>
        <span className="text-forest-600/70 border-l border-forest-300 pl-2">
          {activePersona.role}
        </span>
        <ChevronDown className="w-3 h-3 text-forest-500 ml-1" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white p-2 shadow-xl border border-cream-300 z-50 animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-cream-200 mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-forest-600">
                Demo Persona Switcher
              </p>
              <p className="text-xs text-stone-500">
                Instant role-based testing for judges & evaluators
              </p>
            </div>

            <div className="space-y-1">
              {personas.map((p) => {
                const isSelected = p.role === currentRole;
                const PIcon = p.icon;
                return (
                  <button
                    key={p.role}
                    onClick={() => handleSwitch(p)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-cream-100 border border-cream-300 text-forest-950 font-medium"
                        : "hover:bg-cream-50 text-stone-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-md ${p.badgeColor}`}>
                        <PIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-forest-900 flex items-center gap-1.5">
                          {p.name}
                          <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                            {p.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 truncate max-w-[170px]">
                          {p.title}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 ml-2 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
