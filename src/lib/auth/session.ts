import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type Role = "STUDENT" | "UNIVERSITY_ADMIN" | "ISSUER" | "RECRUITER" | "ADMIN";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  walletAddress: string | null;
  avatarUrl: string | null;
  studentProfile?: {
    id: string;
    headline: string | null;
    universityName: string | null;
    degree: string | null;
    publicPassportSlug: string;
    tokenBalance?: number;
  } | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    verified: boolean;
    tokenBalance?: number;
  } | null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionRole = cookieStore.get("skillchain_demo_role")?.value as Role | undefined;
  const sessionEmail = cookieStore.get("skillchain_demo_email")?.value;

  let queryEmail = sessionEmail;
  if (!queryEmail) {
    if (sessionRole === "ISSUER" || sessionRole === "UNIVERSITY_ADMIN") {
      queryEmail = "issuer@mit.edu";
    } else if (sessionRole === "RECRUITER") {
      queryEmail = "recruiter@stripe.com";
    } else if (sessionRole === "ADMIN") {
      queryEmail = "admin@skillchain.org";
    } else {
      // Default demo role is Student (Alex Rivera)
      queryEmail = "alex.rivera@student.mit.edu";
    }
  }

  const user = await prisma.user.findUnique({
    where: { email: queryEmail },
    include: {
      studentProfile: {
        select: {
          id: true,
          headline: true,
          universityName: true,
          degree: true,
          publicPassportSlug: true,
          tokenBalance: true,
        },
      },
      organizationMembers: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              verified: true,
              tokenBalance: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    // Fallback: query first student user
    const firstUser = await prisma.user.findFirst({
      include: {
        studentProfile: {
          select: {
            id: true,
            headline: true,
            universityName: true,
            degree: true,
            publicPassportSlug: true,
            tokenBalance: true,
          },
        },
        organizationMembers: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                verified: true,
                tokenBalance: true,
              },
            },
          },
        },
      },
    });

    if (!firstUser) return null;

    return {
      id: firstUser.id,
      email: firstUser.email,
      name: firstUser.name,
      role: firstUser.role as Role,
      walletAddress: firstUser.walletAddress,
      avatarUrl: firstUser.avatarUrl,
      studentProfile: firstUser.studentProfile,
      organization: firstUser.organizationMembers[0]?.organization || null,
    };
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    walletAddress: user.walletAddress,
    avatarUrl: user.avatarUrl,
    studentProfile: user.studentProfile,
    organization: user.organizationMembers[0]?.organization || null,
  };
}

export async function requireAuth(allowedRoles?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // If user is ADMIN, allow access across portals
    if (user.role !== "ADMIN" && !allowedRoles.includes(user.role)) {
      throw new Error(`FORBIDDEN: Requires one of [${allowedRoles.join(", ")}], current role is ${user.role}`);
    }
  }

  return user;
}
