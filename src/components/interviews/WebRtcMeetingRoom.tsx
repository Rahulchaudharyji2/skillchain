"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  MessageSquare,
  Users,
  Settings,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Radio,
  FileText,
} from "lucide-react";

interface WebRtcMeetingRoomProps {
  interviewId: string;
  roomName: string;
  userName: string;
  userRole: "RECRUITER" | "CANDIDATE";
  interviewTitle: string;
  candidateName: string;
  recruiterName: string;
  onHangup?: () => void;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function WebRtcMeetingRoom({
  interviewId,
  roomName,
  userName,
  userRole,
  interviewTitle,
  candidateName,
  recruiterName,
  onHangup,
}: WebRtcMeetingRoomProps) {
  // Streams & WebRTC refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const lastSignalTimeRef = useRef<number>(0);
  const pollTimerRef = useRef<any>(null);

  // States
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "chat" | "people" | "info">("video");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Participant details
  const remoteRole = userRole === "RECRUITER" ? "CANDIDATE" : "RECRUITER";
  const remoteName = userRole === "RECRUITER" ? candidateName : recruiterName;

  // Format timer
  const formatMeetingTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer increment
  useEffect(() => {
    if (callEnded) return;
    const interval = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callEnded]);

  // Signaling dispatch helper
  const sendSignal = useCallback(
    async (type: string, payload: any) => {
      try {
        await fetch(`/api/interviews/${interviewId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, payload }),
        });
      } catch (err) {
        console.error("Signal send failed:", err);
      }
    },
    [interviewId]
  );

  // Initialize Media Stream
  const initLocalMedia = async () => {
    try {
      setMediaError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err: any) {
      console.warn("Camera/Mic access note:", err.message);
      setMediaError(
        "Camera/Microphone permission was not granted. You can still test screen sharing and in-room chat."
      );
      return null;
    }
  };

  // Create WebRTC Peer Connection
  const createPeerConnection = (stream: MediaStream | null) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setHasRemoteParticipant(true);
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("candidate", event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setIsConnected(true);
        setHasRemoteParticipant(true);
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        setIsConnected(false);
      }
    };

    return pc;
  };

  // Handle incoming signaling messages
  const processSignalMessage = async (msg: any) => {
    if (msg.senderName === userName) return; // ignore own signals

    const pc = pcRef.current;

    if (msg.type === "chat") {
      setChatMessages((prev) => [
        ...prev,
        {
          id: msg.id,
          senderName: msg.senderName,
          senderRole: msg.senderRole,
          text: msg.payload.text,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } else if (msg.type === "offer" && pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal("answer", answer);
        setHasRemoteParticipant(true);
      } catch (err) {
        console.error("Error responding to offer:", err);
      }
    } else if (msg.type === "answer" && pc) {
      try {
        if (pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
          setHasRemoteParticipant(true);
        }
      } catch (err) {
        console.error("Error setting answer:", err);
      }
    } else if (msg.type === "candidate" && pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
      } catch (err) {
        console.error("Error adding candidate:", err);
      }
    } else if (msg.type === "join") {
      setHasRemoteParticipant(true);
      // If recruiter receives join from candidate, initiate offer
      if (userRole === "RECRUITER" && pc) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal("offer", offer);
        } catch (err) {
          console.error("Error sending offer on join:", err);
        }
      }
    } else if (msg.type === "leave") {
      setHasRemoteParticipant(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
  };

  // Signal Polling Loop
  const startSignalingLoop = () => {
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/interviews/${interviewId}/signal?since=${lastSignalTimeRef.current}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            for (const msg of data.messages) {
              await processSignalMessage(msg);
              if (msg.timestamp > lastSignalTimeRef.current) {
                lastSignalTimeRef.current = msg.timestamp;
              }
            }
          }
          if (data.serverTime) {
            lastSignalTimeRef.current = Math.max(lastSignalTimeRef.current, data.serverTime);
          }
        }
      } catch (err) {
        // Network polling error - continue
      }
      pollTimerRef.current = setTimeout(poll, 1500);
    };

    pollTimerRef.current = setTimeout(poll, 500);
  };

  // Initialize Room on Mount
  useEffect(() => {
    let active = true;

    async function setupRoom() {
      const stream = await initLocalMedia();
      if (!active) return;

      const pc = createPeerConnection(stream);

      // Join event
      sendSignal("join", { role: userRole });

      // If Recruiter, create initial offer
      if (userRole === "RECRUITER" && stream) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal("offer", offer);
        } catch (err) {
          console.warn("Initial offer deferred:", err);
        }
      }

      startSignalingLoop();
    }

    setupRoom();

    return () => {
      active = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      sendSignal("leave", { role: userRole });
    };
  }, []);

  // Controls: Audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Controls: Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Controls: Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current && pcRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  // Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput("");

    sendSignal("chat", { text });

    setChatMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        senderName: userName,
        senderRole: userRole,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Hangup
  const handleHangup = () => {
    setCallEnded(true);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    sendSignal("leave", { role: userRole });
    if (onHangup) {
      onHangup();
    }
  };

  // Copy Room Link
  const copyMeetingInfo = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  if (callEnded) {
    return (
      <div className="card-premium p-12 bg-[#0B0F19] text-white border border-stone-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-5 animate-fade-in shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-xl font-bold font-display text-white">Call Ended Successfully</h2>
          <p className="text-xs text-stone-400">
            Duration: <strong>{formatMeetingTimer(meetingDuration)}</strong> • The session data, verified skills, and transcript evidence are securely logged for evaluation synthesis.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-cream-50 text-xs font-semibold shadow-md transition-all flex items-center gap-2"
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>Re-Enter Meeting Room</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-[650px] w-full bg-[#0E131F] rounded-2xl overflow-hidden border border-stone-800 shadow-2xl text-stone-100 font-sans select-none"
    >
      {/* Top Google Meet Inspired Navigation Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#0B0F19]/90 backdrop-blur-md border-b border-stone-800/80 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md">
              {interviewTitle}
            </h2>
          </div>
          <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
            WebRTC HD Direct
          </span>
          <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
            {formatMeetingTimer(meetingDuration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Mode Tag */}
          <div className="px-2.5 py-1 rounded-lg bg-forest-900/60 border border-forest-700 text-[11px] font-semibold text-ochre-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{userRole === "RECRUITER" ? "Interviewer Host" : "Candidate"}</span>
          </div>

          {/* Copy Meeting Link */}
          <button
            onClick={copyMeetingInfo}
            title="Copy Meeting Link"
            className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Arena & Side Panels */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left / Center Video Stage */}
        <div className="relative flex-1 bg-[#090D16] p-4 flex items-center justify-center overflow-hidden">
          {/* Grid Layout: If remote participant is present, show 2-tile split; otherwise show single main local stream */}
          <div
            className={`w-full h-full grid gap-4 transition-all duration-300 ${
              hasRemoteParticipant ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* Primary/Remote Participant Tile */}
            {hasRemoteParticipant ? (
              <div className="relative w-full h-full bg-[#131929] rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center shadow-lg group">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Tile Watermark / Name Tag */}
                <div className="absolute bottom-3 left-3 bg-[#0B0F19]/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white border border-stone-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{remoteName} ({remoteRole})</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full bg-[#131929] rounded-xl overflow-hidden border border-stone-800 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-800/80 border border-stone-700 flex items-center justify-center text-stone-400">
                  <Users className="w-8 h-8 animate-pulse text-ochre-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Waiting for {remoteName} ({remoteRole}) to join...
                  </h3>
                  <p className="text-xs text-stone-400 max-w-sm">
                    Both participants connect directly through peer-to-peer WebRTC. Once joined, audio and video stream seamlessly.
                  </p>
                </div>
                <button
                  onClick={copyMeetingInfo}
                  className="px-4 py-2 rounded-xl bg-forest-800/80 hover:bg-forest-700 text-cream-50 text-xs font-semibold flex items-center gap-2 border border-forest-600 transition-all shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5 text-ochre-300" />
                  <span>{copiedLink ? "Meeting URL Copied!" : "Copy Interview Invite Link"}</span>
                </button>
              </div>
            )}

            {/* Local User Tile */}
            <div className="relative w-full h-full bg-[#131929] rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center shadow-lg group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isVideoMuted ? "opacity-0" : "opacity-100"
                }`}
              />

              {/* Avatar fallback when video is off */}
              {isVideoMuted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#151D30] space-y-2">
                  <div className="w-20 h-20 rounded-full bg-forest-900 border-2 border-ochre-400 text-cream-50 flex items-center justify-center text-2xl font-bold font-display shadow-md">
                    {userName.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-stone-300">Camera is turned off</span>
                </div>
              )}

              {/* Local Tile Name Tag */}
              <div className="absolute bottom-3 left-3 bg-[#0B0F19]/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white border border-stone-700 flex items-center gap-1.5">
                <span>{userName} (You - {userRole})</span>
                {isAudioMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
              </div>

              {isScreenSharing && (
                <div className="absolute top-3 left-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <ScreenShare className="w-3 h-3" />
                  <span>Sharing Screen</span>
                </div>
              )}
            </div>
          </div>

          {/* Media Permission Warning Toast */}
          {mediaError && (
            <div className="absolute top-6 left-6 right-6 z-30 p-3 rounded-xl bg-amber-950/90 border border-amber-600/70 text-amber-200 text-xs flex items-center gap-2 shadow-xl backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{mediaError}</span>
            </div>
          )}
        </div>

        {/* Right Side Sliding Drawer (Chat / People / Info) */}
        {activeTab !== "video" && (
          <div className="w-80 bg-[#0E1424] border-l border-stone-800 flex flex-col z-20 animate-fade-in shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                {activeTab === "chat" && <MessageSquare className="w-4 h-4 text-ochre-400" />}
                {activeTab === "people" && <Users className="w-4 h-4 text-emerald-400" />}
                {activeTab === "info" && <Info className="w-4 h-4 text-sky-400" />}
                <span>
                  {activeTab === "chat" ? "In-Call Messages" : activeTab === "people" ? "Participants (2)" : "Meeting Details"}
                </span>
              </span>
              <button
                onClick={() => setActiveTab("video")}
                className="text-stone-400 hover:text-white text-xs font-bold px-2 py-1 rounded hover:bg-stone-800"
              >
                ✕
              </button>
            </div>

            {/* Tab Contents: Chat */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-stone-500 py-10 space-y-1">
                      <MessageSquare className="w-6 h-6 mx-auto text-stone-600" />
                      <p>No messages yet.</p>
                      <p className="text-[11px] text-stone-600">Messages are visible to participants in this room.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderName === userName;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-stone-400">{msg.senderName}</span>
                            <span className="text-[9px] text-stone-500">{msg.timestamp}</span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                              isMe
                                ? "bg-forest-800 text-cream-50 border border-forest-600"
                                : "bg-stone-800/80 text-stone-100 border border-stone-700"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={handleSendChat}
                  className="p-3 border-t border-stone-800 bg-[#0B0F19] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message to everyone..."
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-forest-600"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 rounded-xl bg-forest-800 hover:bg-forest-700 disabled:opacity-50 text-ochre-300 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Tab Contents: People */}
            {activeTab === "people" && (
              <div className="p-4 space-y-4 text-xs overflow-y-auto">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    In Meeting
                  </span>

                  {/* You */}
                  <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-forest-900 text-cream-50 flex items-center justify-center font-bold text-xs">
                        {userName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{userName} (You)</span>
                        <span className="text-[10px] text-stone-400">{userRole}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-400">
                      {isAudioMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                      {isVideoMuted ? <VideoOff className="w-3.5 h-3.5 text-red-400" /> : <Video className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>

                  {/* Remote Participant */}
                  <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 text-ochre-300 flex items-center justify-center font-bold text-xs">
                        {remoteName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{remoteName}</span>
                        <span className="text-[10px] text-stone-400">{remoteRole}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        hasRemoteParticipant
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-stone-800 text-stone-400"
                      }`}
                    >
                      {hasRemoteParticipant ? "Active" : "Waiting"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Contents: Info */}
            {activeTab === "info" && (
              <div className="p-4 space-y-4 text-xs overflow-y-auto">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Interview Title</span>
                  <p className="font-semibold text-white">{interviewTitle}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Room Security</span>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Peer-to-Peer Encrypted WebRTC</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <span className="text-[10px] uppercase font-bold text-stone-500">Joining Info</span>
                  <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 font-mono text-[11px] text-stone-300 break-all select-all">
                    {typeof window !== "undefined" ? window.location.href : ""}
                  </div>
                  <button
                    onClick={copyMeetingInfo}
                    className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-ochre-300" />
                    <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Google Meet Floating Controls Bar */}
      <div className="px-6 py-4 bg-[#0B0F19]/95 backdrop-blur-md border-t border-stone-800/80 flex items-center justify-between z-20">
        {/* Left Status info */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-stone-400">
          <span className="font-mono text-stone-300 font-semibold">{formatMeetingTimer(meetingDuration)}</span>
          <span>|</span>
          <span className="truncate max-w-[180px] text-stone-400">{roomName}</span>
        </div>

        {/* Center Primary Action Buttons (Mute, Camera, ScreenShare, Hangup) */}
        <div className="flex items-center gap-3 mx-auto">
          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? "Turn on microphone" : "Turn off microphone"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
              isAudioMuted
                ? "bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400/50"
                : "bg-stone-800 hover:bg-stone-700 text-white border border-stone-700"
            }`}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video On/Off */}
          <button
            onClick={toggleVideo}
            title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
              isVideoMuted
                ? "bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400/50"
                : "bg-stone-800 hover:bg-stone-700 text-white border border-stone-700"
            }`}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Stop presenting" : "Present now (Screen Share)"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
              isScreenSharing
                ? "bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50"
                : "bg-stone-800 hover:bg-stone-700 text-white border border-stone-700"
            }`}
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          {/* End Call / Leave */}
          <button
            onClick={handleHangup}
            title="Leave call"
            className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg hover:shadow-red-600/40 transition-all ml-2"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right Secondary Action Buttons (Chat, Participants, Details) */}
        <div className="flex items-center gap-2">
          {/* Details / Info */}
          <button
            onClick={() => setActiveTab(activeTab === "info" ? "video" : "info")}
            title="Meeting details"
            className={`p-2.5 rounded-full transition-colors ${
              activeTab === "info"
                ? "bg-forest-800 text-ochre-300"
                : "bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white"
            }`}
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Participants */}
          <button
            onClick={() => setActiveTab(activeTab === "people" ? "video" : "people")}
            title="People in meeting"
            className={`p-2.5 rounded-full transition-colors relative ${
              activeTab === "people"
                ? "bg-forest-800 text-ochre-300"
                : "bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            {hasRemoteParticipant && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B0F19]" />
            )}
          </button>

          {/* Chat */}
          <button
            onClick={() => setActiveTab(activeTab === "chat" ? "video" : "chat")}
            title="Chat with everyone"
            className={`p-2.5 rounded-full transition-colors relative ${
              activeTab === "chat"
                ? "bg-forest-800 text-ochre-300"
                : "bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {chatMessages.length > 0 && activeTab !== "chat" && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-ochre-500 text-forest-950 font-bold text-[9px]">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
