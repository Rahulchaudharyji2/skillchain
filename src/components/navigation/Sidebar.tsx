"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  Award,
  Sparkles,
  BookOpenCheck,
  Briefcase,
  Send,
  Video,
  User,
  Settings,
  School,
  FilePlus,
  Layers,
  Users,
  ShieldCheck,
  FileText,
  Search,
  Building2,
  FileCode2,
} from "lucide-react";

interface SidebarProps {
  role: string;
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    headline?: string | null;
    organizationName?: string | null;
  };
}

export function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname();

  const getLinks = () => {
    if (pathname.startsWith("/university") || role === "ISSUER" || role === "UNIVERSITY_ADMIN") {
      return [
        { label: "Dashboard", href: "/university/dashboard", icon: LayoutDashboard },
        { label: "Issue Credential", href: "/university/credentials/issue", icon: FilePlus, highlight: true },
        { label: "All Credentials", href: "/university/credentials", icon: Award },
        { label: "Issuance Batches", href: "/university/issuance-batches", icon: Layers },
        { label: "Students Directory", href: "/university/students", icon: Users },
        { label: "Department Issuers", href: "/university/issuers", icon: School },
        { label: "Cryptographic Audit", href: "/university/audit", icon: ShieldCheck },
        { label: "Token Wallet", href: "/wallet", icon: Award },
      ];
    }

    if (pathname.startsWith("/recruiter") || role === "RECRUITER") {
      return [
        { label: "Recruiter Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
        { label: "Create Job with AI", href: "/recruiter/jobs/new", icon: Sparkles, highlight: true },
        { label: "Job Postings", href: "/recruiter/jobs", icon: Briefcase },
        { label: "Job Applicants & Marks", href: "/recruiter/applications", icon: Send, highlight: true },
        { label: "Candidate Discovery", href: "/recruiter/candidates", icon: Search },
        { label: "1:1 Interviews", href: "/recruiter/interviews", icon: Video },
        { label: "AI Interview Reports", href: "/recruiter/reports", icon: FileText },
        { label: "Token Wallet", href: "/wallet", icon: Sparkles },
        { label: "Settings", href: "/recruiter/settings", icon: Settings },
      ];
    }

    if (pathname.startsWith("/admin") || role === "ADMIN") {
      return [
        { label: "Admin Control", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Organizations", href: "/admin/organizations", icon: Building2 },
        { label: "User Accounts", href: "/admin/users", icon: Users },
        { label: "Skill Ontology", href: "/admin/skills", icon: Sparkles },
        { label: "Assessment Bank", href: "/admin/assessments", icon: BookOpenCheck },
        { label: "Issuer Verification", href: "/admin/issuers", icon: School },
        { label: "Token Wallet Hub", href: "/wallet", icon: Award },
        { label: "System Audit Logs", href: "/admin/audit", icon: ShieldCheck },
        { label: "Platform Settings", href: "/admin/settings", icon: Settings },
      ];
    }

    // Default to Student Portal
    return [
      { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "Skill Passport & QR", href: "/student/passport", icon: QrCode, highlight: true },
      { label: "My Credentials", href: "/student/credentials", icon: Award },
      { label: "Token Wallet", href: "/wallet", icon: Sparkles },
      { label: "Skills & Evidence", href: "/student/skills", icon: Sparkles },
      { label: "Skill Assessments", href: "/student/assessments", icon: BookOpenCheck },
      { label: "Explore Jobs", href: "/student/jobs", icon: Briefcase },
      { label: "My Applications", href: "/student/applications", icon: Send },
      { label: "Interviews", href: "/student/interviews", icon: Video },
      { label: "Profile", href: "/student/profile", icon: User },
      { label: "Settings", href: "/student/settings", icon: Settings },
    ];
  };

  const links = getLinks();

  return (
    <aside className="w-64 border-r border-cream-300 bg-cream-50/70 p-4 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3 rounded-xl bg-white border border-cream-300 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-forest-950 truncate">{user.name}</p>
              <p className="text-[11px] text-stone-500 truncate">
                {user.organizationName || user.headline || user.email}
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-cream-100 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-forest-800 uppercase tracking-wider">
              {role.replace("_", " ")}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              Verified Session
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-forest-900 text-cream-50 shadow-sm"
                    : link.highlight
                    ? "bg-ochre-100/70 text-ochre-900 border border-ochre-300/60 hover:bg-ochre-100"
                    : "text-stone-600 hover:bg-cream-200/60 hover:text-forest-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent
                    className={`w-4 h-4 ${
                      isActive ? "text-ochre-300" : link.highlight ? "text-ochre-700" : "text-stone-400"
                    }`}
                  />
                  <span>{link.label}</span>
                </div>
                {link.highlight && !isActive && (
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-ochre-200 text-ochre-900 font-bold">
                    New
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-lg bg-cream-200/50 border border-cream-300/70 text-[11px] text-stone-500">
        <div className="flex items-center gap-1.5 font-semibold text-forest-900 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Polygon Amoy Connected</span>
        </div>
        <p className="text-[10px] leading-relaxed">
          Non-transferable soulbound credentials secured via SHA-256 commitments.
        </p>
      </div>
    </aside>
  );
}
