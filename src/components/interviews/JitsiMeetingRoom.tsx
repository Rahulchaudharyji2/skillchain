"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  ShieldCheck,
  Maximize2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface JitsiMeetingRoomProps {
  roomName: string;
  domain?: string;
  userName: string;
  userRole: "RECRUITER" | "CANDIDATE";
  interviewTitle: string;
  candidateName: string;
  recruiterName: string;
  onHangup?: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function JitsiMeetingRoom({
  roomName,
  domain = "meet.jit.si",
  userName,
  userRole,
  interviewTitle,
  candidateName,
  recruiterName,
  onHangup,
}: JitsiMeetingRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [inMeeting, setInMeeting] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const initMeeting = () => {
    if (!window.JitsiMeetExternalAPI || !containerRef.current) {
      return;
    }

    try {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch {}
      }

      containerRef.current.innerHTML = "";

      const options = {
        roomName: roomName.replace(/[^a-zA-Z0-9-_]/g, ""),
        width: "100%",
        height: "100%",
        parentNode: containerRef.current,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: "#070b12",
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "closedcaptions",
            "desktop",
            "fullscreen",
            "fodeviceselection",
            "hangup",
            "chat",
            "settings",
            "raisehand",
            "videoquality",
            "filmstrip",
            "tileview",
          ],
        },
        userInfo: {
          displayName: `${userName} (${userRole === "RECRUITER" ? "Interviewer" : "Candidate"})`,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      api.addEventListener("videoConferenceJoined", () => {
        setInMeeting(true);
        setConnectionError(null);
      });

      api.addEventListener("participantJoined", () => {
        setParticipantCount((prev) => prev + 1);
      });

      api.addEventListener("participantLeft", () => {
        setParticipantCount((prev) => Math.max(1, prev - 1));
      });

      api.addEventListener("readyToClose", () => {
        setInMeeting(false);
        if (onHangup) onHangup();
      });
    } catch (err: any) {
      console.error("Jitsi init error:", err);
      setConnectionError("Could not initialize meeting window: " + (err.message || String(err)));
    }
  };

  useEffect(() => {
    if (jitsiLoaded) {
      initMeeting();
    }

    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch {}
      }
    };
  }, [jitsiLoaded, roomName]);

  const externalJoinUrl = `https://${domain}/${roomName}`;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-forest-800 bg-[#070b12] text-cream-50 shadow-2xl flex flex-col h-[680px]">
      <Script
        src={`https://${domain}/external_api.js`}
        onLoad={() => setJitsiLoaded(true)}
        onError={() => setConnectionError("Failed to load Jitsi Meet script. Please check your network or browser adblocker.")}
      />

      {/* Top Meeting Control & Metadata Bar */}
      <div className="p-4 bg-gradient-to-r from-forest-950 via-[#0d1522] to-forest-950 border-b border-forest-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-900 border border-forest-700 text-ochre-300 flex items-center justify-center font-bold">
            <Video className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE 1:1 WEBRTC MEETING
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                Room: <strong className="text-cream-100">{roomName}</strong>
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">{interviewTitle}</h3>
          </div>
        </div>

        {/* Right Action & Info Badges */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1 rounded-lg bg-forest-900/80 border border-forest-700 text-stone-300 text-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-ochre-300" />
            <span>
              {userRole === "RECRUITER" ? `Candidate: ${candidateName}` : `Interviewer: ${recruiterName}`}
            </span>
          </div>

          <a
            href={externalJoinUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 rounded-lg bg-cream-100/10 hover:bg-cream-100/20 text-cream-200 text-xs font-semibold flex items-center gap-1.5 border border-forest-700 transition-colors"
            title="Open Meeting in Full New Tab"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="relative flex-1 w-full bg-black">
        {!jitsiLoaded && !connectionError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#070b12] text-cream-200">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-xs font-semibold">Connecting to SkillChain WebRTC Room...</p>
            <span className="text-[11px] text-stone-500">Audio/Video devices connecting</span>
          </div>
        )}

        {connectionError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#070b12] text-cream-200 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Browser Meeting Connection Notice</h4>
            <p className="text-xs text-stone-400 max-w-md leading-relaxed">{connectionError}</p>
            <a
              href={externalJoinUrl}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
            >
              <span>Launch Jitsi Meet in Separate Window</span>
              <ExternalLink className="w-4 h-4 text-ochre-300" />
            </a>
          </div>
        )}

        {/* Jitsi External API Container */}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Bottom Security / Privacy Footer */}
      <div className="p-2.5 bg-[#090d16] border-t border-forest-900/60 px-4 flex items-center justify-between text-[11px] text-stone-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Peer-to-Peer WebRTC Audio/Video Connection</span>
        </div>
        <span className="text-[10px] font-mono text-stone-500">
          AiProtctor Interview Model Integrated
        </span>
      </div>
    </div>
  );
}
