import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export interface SignalMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  type: "offer" | "answer" | "candidate" | "chat" | "join" | "leave" | "state";
  payload: any;
  timestamp: number;
}

// In-memory room message storage for real-time WebRTC signaling & chat
// Structured by interviewId -> list of signal messages
const roomSignals = new Map<string, SignalMessage[]>();
const MAX_MESSAGES_PER_ROOM = 100;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interviewId } = await params;
    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get("since") || "0", 10);

    const messages = roomSignals.get(interviewId) || [];
    const newMessages = messages.filter((m) => m.timestamp > since);

    return NextResponse.json({
      success: true,
      messages: newMessages,
      serverTime: Date.now(),
    });
  } catch (err: any) {
    console.error("Signal GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interviewId } = await params;
    const body = await req.json();
    const { type, payload } = body;

    if (!type) {
      return NextResponse.json({ error: "Message type required" }, { status: 400 });
    }

    const message: SignalMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      senderId: user.id,
      senderName: user.name || "Participant",
      senderRole: user.role,
      type,
      payload,
      timestamp: Date.now(),
    };

    if (!roomSignals.has(interviewId)) {
      roomSignals.set(interviewId, []);
    }

    const list = roomSignals.get(interviewId)!;
    list.push(message);

    // Keep memory clean
    if (list.length > MAX_MESSAGES_PER_ROOM) {
      list.splice(0, list.length - MAX_MESSAGES_PER_ROOM);
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err: any) {
    console.error("Signal POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
