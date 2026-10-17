import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getEvidenceBadgeStyle(type: string): { label: string; className: string; icon: string } {
  switch (type) {
    case "UNIVERSITY_DEGREE":
      return {
        label: "University Verified",
        className: "bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-200",
        icon: "GraduationCap",
      };
    case "ASSESSMENT":
      return {
        label: "Assessment Verified",
        className: "bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-200",
        icon: "ShieldCheck",
      };
    case "PROJECT":
      return {
        label: "Project Evidence",
        className: "bg-sky-50 text-sky-900 border-sky-300 ring-1 ring-sky-200",
        icon: "FolderGit2",
      };
    case "SELF_DECLARED":
    default:
      return {
        label: "Self-Declared",
        className: "bg-stone-50 text-stone-700 border-stone-200",
        icon: "User",
      };
  }
}
