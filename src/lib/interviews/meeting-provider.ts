/**
 * SkillChain Meeting & Interview Intelligence Provider Architecture
 * 
 * Rules:
 * 1. Integrate a real meeting provider ONLY if configured in environment (e.g. DAILY_API_KEY).
 * 2. Otherwise use a clearly labelled DEMO_SIMULATED_PROVIDER with transparent transcript labelling.
 * 3. Enforce candidate consent before AI transcript processing.
 * 4. Generate structured evidence-linked reports with competencies, quotes, limitations, and follow-up questions.
 * 5. Mandatory human recruiter sign-off.
 */

export interface MeetingRoomOptions {
  topic: string;
  scheduledAt: Date;
  durationMinutes: number;
}

export interface MeetingRoomResult {
  meetingUrl: string;
  provider: "DAILY" | "ZOOM" | "DEMO_SIMULATED";
  isSimulated: boolean;
  providerLabel: string;
}

export interface TranscriptTurn {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface TranscriptData {
  rawTranscriptText: string;
  turns: TranscriptTurn[];
  isSimulated: boolean;
  transcriptLabel: string;
}

export class MeetingProviderService {
  private dailyApiKey?: string;
  private zoomApiKey?: string;

  constructor() {
    this.dailyApiKey = process.env.DAILY_API_KEY;
    this.zoomApiKey = process.env.ZOOM_API_KEY;
  }

  /**
   * Returns active meeting provider information
   */
  getProviderInfo(): { provider: string; isReal: boolean; label: string } {
    if (this.dailyApiKey) {
      return { provider: "DAILY", isReal: true, label: "Daily.co Real-Time WebRTC" };
    }
    if (this.zoomApiKey) {
      return { provider: "ZOOM", isReal: true, label: "Zoom Video Meeting API" };
    }
    return {
      provider: "DEMO_SIMULATED",
      isReal: false,
      label: "Simulated Demo Meeting Provider (Clearly Labelled)",
    };
  }

  /**
   * Creates a meeting room using real provider if configured, otherwise simulated demo room.
   */
  async createMeetingRoom(options: MeetingRoomOptions): Promise<MeetingRoomResult> {
    // 1. Check for Daily.co integration
    if (this.dailyApiKey) {
      try {
        const res = await fetch("https://api.daily.co/v1/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.dailyApiKey}`,
          },
          body: JSON.stringify({
            properties: {
              exp: Math.floor(options.scheduledAt.getTime() / 1000) + options.durationMinutes * 60 + 3600,
              enable_chat: true,
              enable_screenshare: true,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            meetingUrl: data.url,
            provider: "DAILY",
            isSimulated: false,
            providerLabel: "Daily.co Live WebRTC Room",
          };
        }
      } catch (err) {
        console.warn("Daily.co API call failed, falling back to clearly labelled demo room:", err);
      }
    }

    // 2. Default clearly labelled demo simulated meeting room
    const roomId = `demo-room-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      meetingUrl: `https://meet.skillchain.org/rooms/${roomId}?demo=true`,
      provider: "DEMO_SIMULATED",
      isSimulated: true,
      providerLabel: "Simulated Demo Meeting Provider (Demo Only)",
    };
  }

  /**
   * Generates a domain-specific, clearly labelled interview transcript based on job skills
   */
  generateDemoTranscript(candidateName: string, jobTitle: string, requiredSkills: string[]): TranscriptData {
    const skillsList = requiredSkills.length > 0 ? requiredSkills : ["React", "TypeScript", "System Design"];
    const primarySkill = skillsList[0] || "Frontend Architecture";
    const secondarySkill = skillsList[1] || "Asynchronous Data";

    const turns: TranscriptTurn[] = [
      {
        speaker: "Interviewer",
        text: `Welcome ${candidateName}. Today we're evaluating your technical background for the ${jobTitle} position, specifically focusing on ${skillsList.join(", ")}.`,
        timestamp: "00:01:15",
      },
      {
        speaker: candidateName,
        text: `Thank you. I'm excited to discuss my experience with ${primarySkill} and building scalable, verifiable web architectures.`,
        timestamp: "00:01:42",
      },
      {
        speaker: "Interviewer",
        text: `Could you walk me through how you handle state management, cache invalidation, and race conditions when dealing with ${primarySkill}?`,
        timestamp: "00:03:10",
      },
      {
        speaker: candidateName,
        text: `In production systems, I isolate transient leaf state from global application state. For asynchronous caching with ${secondarySkill}, I implement deterministic key hashing, optimistic mutations with rollback buffers, and abort controllers to prevent stale responses.`,
        timestamp: "00:04:30",
      },
      {
        speaker: "Interviewer",
        text: `How do you approach automated testing and verifying edge cases before rolling out changes to production?`,
        timestamp: "00:08:20",
      },
      {
        speaker: candidateName,
        text: `I maintain a pyramid: comprehensive unit tests for core deterministic business logic, sandboxed integration tests for API boundary contracts, and end-to-end flows for user-critical journeys.`,
        timestamp: "00:09:45",
      },
      {
        speaker: "Interviewer",
        text: `What limitations have you encountered with this approach when scale increases by 10x?`,
        timestamp: "00:14:05",
      },
      {
        speaker: candidateName,
        text: `At 10x scale, memory footprints and connection pooling become the primary bottlenecks. We mitigate this by introducing read replicas, query batching, and distributed cache invalidation headers.`,
        timestamp: "00:15:30",
      },
    ];

    const rawTranscriptText = turns
      .map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
      .join("\n\n");

    return {
      rawTranscriptText: `[SIMULATED DEMO TRANSCRIPT — REAL MEETING PROVIDER NOT CONFIGURED]\n\n${rawTranscriptText}`,
      turns,
      isSimulated: true,
      transcriptLabel: "Simulated Technical Evaluation Transcript (Real Meeting Provider Not Configured)",
    };
  }
}

export const meetingProviderService = new MeetingProviderService();
