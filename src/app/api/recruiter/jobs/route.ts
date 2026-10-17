import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "RECRUITER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Recruiter role required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      overview,
      responsibilities,
      requiredSkills,
      preferredSkills,
      seniorityLevel,
      location,
      workArrangement,
      compensationRange,
      aiPromptUsed,
      skillWeights = {},
    } = body;

    const employerOrg = await prisma.organization.findFirst({
      where: { type: "EMPLOYER" },
    });

    if (!employerOrg) {
      return NextResponse.json({ error: "Employer organization not found" }, { status: 404 });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

    // Create the Job
    const job = await prisma.job.create({
      data: {
        organizationId: employerOrg.id,
        createdById: user.id,
        title,
        slug,
        overview,
        responsibilitiesJson: JSON.stringify(responsibilities || []),
        requiredSkillsJson: JSON.stringify(requiredSkills || []),
        preferredSkillsJson: JSON.stringify(preferredSkills || []),
        seniorityLevel: seniorityLevel || "MID",
        location: location || "Remote",
        workArrangement: workArrangement || "REMOTE",
        compensationRange: compensationRange || "$110,000 - $140,000",
        status: "PUBLISHED",
        aiPromptUsed,
        aiGenerated: Boolean(aiPromptUsed),
      },
    });

    // Create Skill Requirements
    for (const skillName of requiredSkills) {
      let skill = await prisma.skill.findFirst({
        where: { name: { equals: skillName } },
      });

      if (!skill) {
        // Fallback to first category
        const cat = await prisma.skillCategory.findFirst();
        skill = await prisma.skill.create({
          data: {
            name: skillName,
            slug: skillName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            categoryId: cat?.id || "default",
          },
        });
      }

      const weight = skillWeights[skillName] || 2.0;

      await prisma.jobSkillRequirement.create({
        data: {
          jobId: job.id,
          skillId: skill.id,
          requiredLevel: seniorityLevel === "SENIOR" ? "ADVANCED" : "INTERMEDIATE",
          weight: Number(weight),
          minScoreThreshold: 75.0,
          mustBeVerified: true,
        },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: employerOrg.id,
        action: "JOB_POSTING_PUBLISHED",
        entityType: "Job",
        entityId: job.id,
        detailsJson: JSON.stringify({ title, requiredSkills }),
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
