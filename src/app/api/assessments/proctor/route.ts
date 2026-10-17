import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { attemptId, eventType, metadata } = await req.json();

    const event = await prisma.proctoringEvent.create({
      data: {
        attemptId,
        eventType,
        metadata: JSON.stringify(metadata || {}),
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
