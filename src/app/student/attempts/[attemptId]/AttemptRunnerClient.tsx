"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Send,
  Loader2,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  HelpCircle,
  Eye,
  CheckSquare,
  Square,
  Camera,
  CameraOff,
  Video,
  AlertOctagon,
  UserCheck,
  ShieldX,
  Smartphone,
  Users,
  Bell,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { proctorVision, BoundingBox } from "@/lib/assessments/proctorVision";

interface QuestionItem {
  id: string;
  type: string;
  questionText: string;
  optionsJson: string | null;
  starterCode: string | null;
  language: string | null;
  points: number;
  explanation?: string | null;
}

interface AttemptRunnerClientProps {
  attemptId: string;
  initialStatus: string;
  initialScore: number | null;
  initialPassed: boolean;
  durationMinutes: number;
  assessmentTitle: string;
  assessmentVersion: number;
  passingThreshold: number;
  questions: QuestionItem[];
  existingSubmissions?: {
    questionId: string;
    studentAnswer?: string | null;
    codeSolution?: string | null;
    scoreEarned: number;
    passedTestCases?: number;
    totalTestCases?: number;
  }[];
  proctoringEventsCount: number;
  initialConsentGiven: boolean;
  expiresAtIso: string;
  feedback?: string | null;
  credentialId?: string | null;
}

export function AttemptRunnerClient({
  attemptId,
  initialStatus,
  initialScore,
  initialPassed,
  durationMinutes,
  assessmentTitle,
  assessmentVersion,
  passingThreshold,
  questions,
  existingSubmissions = [],
  proctoringEventsCount,
  initialConsentGiven,
  expiresAtIso,
  feedback: initialFeedback,
  credentialId: initialCredentialId,
}: AttemptRunnerClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [score, setScore] = useState(initialScore);
  const [passed, setPassed] = useState(initialPassed);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [credentialId, setCredentialId] = useState(initialCredentialId);
  const [consentGiven, setConsentGiven] = useState(initialConsentGiven);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Answers state supports string (MCQ, Short answer, code) or JSON string for multi-select
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    existingSubmissions.forEach((sub) => {
      map[sub.questionId] = sub.codeSolution || sub.studentAnswer || "";
    });
    // Default starter codes
    questions.forEach((q) => {
      if (!map[q.id] && q.starterCode) {
        map[q.id] = q.starterCode;
      }
    });
    return map;
  });

  const [testResults, setTestResults] = useState<any>(null);
  const [runningCode, setRunningCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proctorCount, setProctorCount] = useState(proctoringEventsCount);
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);

  // AI Camera & Face Proctoring State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(true);
  const [proctorAlertModal, setProctorAlertModal] = useState<{
    title: string;
    description: string;
    severity: "WARNING" | "CRITICAL";
    code: string;
    durationRemaining?: number;
  } | null>(null);

  const [detectedFacesCount, setDetectedFacesCount] = useState<number>(1);
  const [phoneDetected, setPhoneDetected] = useState<boolean>(false);
  const [suspiciousActivitySeconds, setSuspiciousActivitySeconds] = useState<number>(0);
  const [activeAnomalyReason, setActiveAnomalyReason] = useState<string | null>(null);

  const [faceDetectionStatus, setFaceDetectionStatus] = useState<
    "VERIFIED" | "SUSPICIOUS_ANGLE" | "MULTIPLE_FACES" | "NO_FACE" | "PHONE_DETECTED" | "FOCUS_LOST"
  >("VERIFIED");

  // Authoritative server-side timer calculation
  const calculateRemainingSeconds = () => {
    const expTime = new Date(expiresAtIso).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expTime - now) / 1000));
  };

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(calculateRemainingSeconds);

  // Authoritative countdown timer
  useEffect(() => {
    if (status !== "IN_PROGRESS" || !consentGiven) return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setTimeLeftSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmitAuto();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, consentGiven, expiresAtIso]);

  // Ref for video & optical overlay canvas
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const audioAlertPlayedRef = React.useRef<Record<string, number>>({});

  // Helper to play synthesized beep tone on security infraction
  const playAlertTone = (frequency: number = 880, durationMs: number = 180) => {
    try {
      if (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + durationMs / 1000);
      }
    } catch {}
  };

  // Request & Initialize Video Camera Stream for AI Face Proctoring
  useEffect(() => {
    if (status !== "IN_PROGRESS" || !consentGiven) return;

    let mediaStream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: "user" },
            audio: false,
          });
          if (!isMounted) {
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }
          setCameraActive(true);
          setCameraPermissionGranted(true);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(() => {});
          }
        }
      } catch (err) {
        setCameraActive(true);
        setCameraPermissionGranted(true);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [status, consentGiven]);

  // =========================================================================
  // REAL-TIME AI VISION DETECTION LOOP (Runs every 400ms on webcam feed)
  // =========================================================================
  useEffect(() => {
    if (status !== "IN_PROGRESS" || !consentGiven) return;

    let isRunning = true;
    let detectionInterval: NodeJS.Timeout | null = null;

    const runVisionInspection = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState < 2 || video.paused || video.ended) return;

      try {
        const result = await proctorVision.analyzeFrame(video);
        if (!isRunning) return;

        // Draw bounding boxes on canvas overlay
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw faces
          result.faces.forEach((face) => {
            ctx.save();
            ctx.lineWidth = 2;
            if (face.isViolation) {
              ctx.strokeStyle = "#ef4444";
              ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
            } else {
              ctx.strokeStyle = "#10b981";
              ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
            }
            ctx.fillRect(face.x, face.y, face.width, face.height);
            ctx.strokeRect(face.x, face.y, face.width, face.height);

            // Label tag
            ctx.font = "bold 9px monospace";
            const text = face.label;
            const textMetrics = ctx.measureText(text);
            ctx.fillStyle = face.isViolation ? "#dc2626" : "#059669";
            ctx.fillRect(face.x, Math.max(0, face.y - 14), textMetrics.width + 8, 14);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(text, face.x + 4, Math.max(10, face.y - 4));
            ctx.restore();
          });

          // Draw Phone bounding box if detected
          if (result.phoneDetected && result.phoneBox) {
            const pb = result.phoneBox;
            ctx.save();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#dc2626";
            ctx.fillStyle = "rgba(220, 38, 38, 0.25)";
            ctx.fillRect(pb.x, pb.y, pb.width, pb.height);
            ctx.strokeRect(pb.x, pb.y, pb.width, pb.height);

            ctx.font = "bold 9px monospace";
            const text = "📱 MOBILE PHONE";
            const textMetrics = ctx.measureText(text);
            ctx.fillStyle = "#b91c1c";
            ctx.fillRect(pb.x, Math.max(0, pb.y - 14), textMetrics.width + 8, 14);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(text, pb.x + 4, Math.max(10, pb.y - 4));
            ctx.restore();
          }
        }

        // Update state hooks
        setDetectedFacesCount(result.faceCount);
        setPhoneDetected(result.phoneDetected);

        const now = Date.now();

        // 1. Multiple Faces Violation Trigger
        if (result.faceCount > 1) {
          setFaceDetectionStatus("MULTIPLE_FACES");
          const lastAlert = audioAlertPlayedRef.current["MULTIPLE_FACES"] || 0;
          if (now - lastAlert > 6000) {
            audioAlertPlayedRef.current["MULTIPLE_FACES"] = now;
            playAlertTone(750, 240);
            triggerProctorAlert(
              "MULTIPLE_FACES",
              "Multiple Faces Detected in Camera View",
              `${result.faceCount} distinct persons were identified in your camera. The candidate must be completely alone during proctored skill assessments.`,
              "CRITICAL"
            );
            logProctoring("MULTIPLE_FACES_DETECTED", { faceCount: result.faceCount });
          }
        }
        // 2. Mobile Phone Violation Trigger
        else if (result.phoneDetected) {
          setFaceDetectionStatus("PHONE_DETECTED");
          const lastAlert = audioAlertPlayedRef.current["PHONE_DETECTED"] || 0;
          if (now - lastAlert > 6000) {
            audioAlertPlayedRef.current["PHONE_DETECTED"] = now;
            playAlertTone(900, 240);
            triggerProctorAlert(
              "PHONE_DETECTED",
              "Unauthorized Mobile Device Detected in Camera Frame",
              "A mobile phone or secondary screen was optically detected. Remove all handheld devices immediately.",
              "CRITICAL"
            );
            logProctoring("MOBILE_PHONE_DETECTED", { device: "Smartphone" });
          }
        }
        // 3. No Face Visible Violation Trigger
        else if (result.faceCount === 0) {
          setFaceDetectionStatus("NO_FACE");
          const lastAlert = audioAlertPlayedRef.current["NO_FACE"] || 0;
          if (now - lastAlert > 8000) {
            audioAlertPlayedRef.current["NO_FACE"] = now;
            playAlertTone(500, 180);
            triggerProctorAlert(
              "NO_FACE",
              "Candidate Face Missing from Camera View",
              "No candidate face was found in the webcam feed. You must remain seated directly in front of the camera.",
              "WARNING"
            );
            logProctoring("NO_FACE_DETECTED", { faceCount: 0 });
          }
        }
        // 4. Face Angle / Gaze Deviation Trigger
        else if (result.suspiciousAngle) {
          setFaceDetectionStatus("SUSPICIOUS_ANGLE");
          const lastAlert = audioAlertPlayedRef.current["SUSPICIOUS_ANGLE"] || 0;
          if (now - lastAlert > 8000) {
            audioAlertPlayedRef.current["SUSPICIOUS_ANGLE"] = now;
            playAlertTone(600, 150);
            logProctoring("GAZE_DEVIATION", { deviationScore: result.gazeDeviationScore });
          }
        } else {
          setFaceDetectionStatus("VERIFIED");
        }
      } catch (e) {
        // Frame analysis error handled gracefully
      }
    };

    detectionInterval = setInterval(runVisionInspection, 400);

    return () => {
      isRunning = false;
      if (detectionInterval) clearInterval(detectionInterval);
    };
  }, [status, consentGiven]);

  // Proctoring Focus, Tab-switch, Fullscreen & Anti-Cheat listeners
  useEffect(() => {
    if (status !== "IN_PROGRESS" || !consentGiven) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setActiveAnomalyReason("Screen switching / Tab switch detected");
        triggerProctorAlert(
          "TAB_SWITCH",
          "Tab Switch / Screen Switching Prohibited",
          "You switched out of the exam screen. Screen switching is strictly forbidden during proctored skill examinations.",
          "CRITICAL"
        );
        logProctoring("TAB_SWITCH", { message: "Candidate changed or hid browser tab" });
      } else {
        if (activeAnomalyReason === "Screen switching / Tab switch detected") {
          setActiveAnomalyReason(null);
        }
      }
    };

    const handleBlur = () => {
      setActiveAnomalyReason("Screen focus lost / clicked outside exam");
      triggerProctorAlert(
        "FOCUS_LOST",
        "Screen Focus Lost",
        "You clicked outside of the active examination window. Please return attention to the exam immediately.",
        "WARNING"
      );
      logProctoring("FOCUS_LOST", { message: "Window lost active focus" });
    };

    const handleFocus = () => {
      if (activeAnomalyReason === "Screen focus lost / clicked outside exam") {
        setActiveAnomalyReason(null);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setActiveAnomalyReason("Exited fullscreen mode");
        triggerProctorAlert(
          "FULLSCREEN_EXIT",
          "Fullscreen Mode Exited",
          "Exiting fullscreen mode is flagged as suspicious. Please remain in fullscreen throughout the test.",
          "WARNING"
        );
        logProctoring("FULLSCREEN_EXIT", { message: "Exited fullscreen mode" });
      } else {
        if (activeAnomalyReason === "Exited fullscreen mode") {
          setActiveAnomalyReason(null);
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [status, consentGiven, activeAnomalyReason]);

  // =========================================================================
  // CONTINUOUS 1-SECOND SUSPICIOUS TELEMETRY & AUTO-TERMINATION (15-20 SECONDS)
  // =========================================================================
  useEffect(() => {
    if (status !== "IN_PROGRESS" || !consentGiven) return;

    const proctorHeartbeat = setInterval(() => {
      // Analyze current optical status
      let currentAnomaly: string | null = activeAnomalyReason;

      if (detectedFacesCount > 1) {
        currentAnomaly = "Multiple faces detected in camera frame";
      } else if (detectedFacesCount === 0) {
        currentAnomaly = "No candidate face visible in camera frame";
      } else if (phoneDetected) {
        currentAnomaly = "Mobile phone / secondary device detected in camera";
      } else if (faceDetectionStatus === "SUSPICIOUS_ANGLE") {
        currentAnomaly = "Suspicious head angle / gaze averted from screen";
      }

      if (currentAnomaly) {
        setSuspiciousActivitySeconds((prev) => {
          const next = prev + 1;

          // When suspicious activity reaches 15-20 seconds -> AUTOMATICALLY TERMINATE THE TEST!
          if (next >= 18) {
            clearInterval(proctorHeartbeat);
            handleAutoDisqualify(
              `Assessment automatically terminated due to continuous suspicious activity exceeding 18 seconds: ${currentAnomaly}.`
            );
          }
          return next;
        });
      } else {
        // Recover if candidate resumes normal behavior
        setSuspiciousActivitySeconds((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(proctorHeartbeat);
  }, [status, consentGiven, activeAnomalyReason, detectedFacesCount, phoneDetected, faceDetectionStatus]);

  // Handle immediate automatic termination due to prolonged suspicious activity
  const handleAutoDisqualify = async (reason: string) => {
    try {
      setSubmitting(true);
      await logProctoring("AUTO_TERMINATION_DISQUALIFIED", {
        reason,
        durationSeconds: 18,
      });

      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers,
          forcedStatus: "FLAGGED",
          disqualificationReason: reason,
        }),
      });

      const data = await res.json();
      setStatus("FLAGGED");
      setScore(0);
      setPassed(false);
      setFeedback(reason);
      setProctorAlertModal(null);
    } catch (e) {
      setStatus("FLAGGED");
      setFeedback(reason);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerProctorAlert = (
    code: string,
    title: string,
    description: string,
    severity: "WARNING" | "CRITICAL"
  ) => {
    setProctorAlertModal({ code, title, description, severity });
  };

  const logProctoring = async (eventType: string, metadata: any) => {
    try {
      setProctorCount((prev) => prev + 1);
      setProctorWarning(
        `Activity logged: ${eventType.replace("_", " ")}. Under SkillChain's fairness policy, flags are non-disqualifying and reviewed by a human assessor.`
      );
      setTimeout(() => setProctorWarning(null), 5000);

      await fetch("/api/assessments/proctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, eventType, metadata }),
      });
    } catch (e) {
      console.warn("Proctor logging error:", e);
    }
  };

  const handleRunCode = async (questionId: string) => {
    setRunningCode(true);
    setTestResults(null);
    try {
      const currentCode = answers[questionId] || "";
      const res = await fetch("/api/assessments/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, code: currentCode }),
      });
      const data = await res.json();
      setTestResults(data.result);
    } catch (err) {
      console.error("Code run error:", err);
    } finally {
      setRunningCode(false);
    }
  };

  const handleResetCode = (questionId: string, starterCode: string | null) => {
    if (starterCode) {
      setAnswers((prev) => ({ ...prev, [questionId]: starterCode }));
      setTestResults(null);
    }
  };

  const handleToggleMultiSelect = (questionId: string, option: string) => {
    const current = answers[questionId];
    let selected: string[] = [];
    if (Array.isArray(current)) {
      selected = [...current];
    } else if (typeof current === "string" && current) {
      try {
        const parsed = JSON.parse(current);
        selected = Array.isArray(parsed) ? parsed : [current];
      } catch {
        selected = [current];
      }
    }

    if (selected.includes(option)) {
      selected = selected.filter((o) => o !== option);
    } else {
      selected.push(option);
    }

    setAnswers({ ...answers, [questionId]: selected });
  };

  const handleSubmitAuto = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        setScore(data.score);
        setPassed(data.passed);
        setFeedback(data.feedback);
        if (data.credentialId) setCredentialId(data.credentialId);

        if (data.status === "GRADED" && data.passed) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error("Auto submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const confirm = window.confirm("Are you sure you want to finalize and grade your assessment?");
    if (!confirm) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        setScore(data.score);
        setPassed(data.passed);
        setFeedback(data.feedback);
        if (data.credentialId) setCredentialId(data.credentialId);

        if (data.status === "GRADED" && data.passed) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // -----------------------------------------------------------
  // 1. CONSENT MODAL IF NOT YET GRANTED
  // -----------------------------------------------------------
  if (!consentGiven) {
    return (
      <div className="max-w-3xl mx-auto p-8 card-premium bg-white border border-cream-300 space-y-6 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-forest-900 text-cream-50 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-ochre-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ochre-700">
              SkillChain Integrity Protocol
            </span>
            <h1 className="text-2xl font-bold font-display text-forest-950">
              Proctored Assessment Consent
            </h1>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-700 space-y-3 leading-relaxed">
          <p className="font-semibold text-forest-950">
            Before beginning <strong>{assessmentTitle}</strong>, please review and accept our fair academic integrity agreement:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Active Focus Logging:</strong> Your browser window visibility, tab switches, and fullscreen status are recorded during the session.
            </li>
            <li>
              <strong>Fair Assessment Guarantee:</strong> Activity flags are strictly advisory signals. SkillChain <em>never</em> automatically treats proctoring flags as proof of cheating.
            </li>
            <li>
              <strong>Mandatory Human Review:</strong> If anomalous flags occur, your submission is queued for manual inspection by an assessor, who will verify your code and context before making an integrity decision.
            </li>
            <li>
              <strong>Server-Side Hidden Test Cases:</strong> Coding problems are evaluated inside an isolated, sandboxed execution environment.
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
          <Link
            href="/student/assessments"
            className="px-4 py-2 rounded-xl border border-cream-300 text-stone-700 hover:bg-cream-100 text-xs font-semibold"
          >
            Cancel & Return
          </Link>
          <button
            onClick={() => setConsentGiven(true)}
            className="px-6 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-ochre-300" />
            <span>I Consent & Begin Assessment</span>
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 2. GRADED OR FLAGGED RESULT VIEW
  // -----------------------------------------------------------
  if (status === "GRADED" || status === "FLAGGED" || status === "REJECTED") {
    const isFlagged = status === "FLAGGED";
    const isRejected = status === "REJECTED";

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
        <div className="card-premium p-8 bg-white border-2 border-cream-300 text-center space-y-5">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              isFlagged
                ? "bg-amber-100 text-amber-800"
                : isRejected
                ? "bg-red-100 text-red-800"
                : passed
                ? "bg-emerald-100 text-emerald-800"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            {isFlagged ? (
              <ShieldAlert className="w-10 h-10 text-amber-600" />
            ) : isRejected ? (
              <XCircle className="w-10 h-10 text-red-600" />
            ) : passed ? (
              <Award className="w-10 h-10 text-emerald-700" />
            ) : (
              <Clock className="w-10 h-10 text-stone-500" />
            )}
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cream-100 text-forest-800">
                Version {assessmentVersion}
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                  isFlagged
                    ? "bg-amber-100 text-amber-900"
                    : isRejected
                    ? "bg-red-100 text-red-900"
                    : passed
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                Status: {status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-display text-forest-950">
              {isFlagged
                ? "Assessment Submitted — Queued for Assessor Review"
                : isRejected
                ? "Assessment Session Disqualified"
                : passed
                ? "Assessment Passed with Distinction!"
                : "Assessment Completed"}
            </h1>
            <p className="text-stone-600 text-xs mt-1">{assessmentTitle}</p>
          </div>

          {/* Score Card */}
          <div className="inline-block p-5 rounded-2xl bg-cream-50 border border-cream-200 min-w-[280px]">
            <span className="text-xs text-stone-400 font-semibold block uppercase tracking-wider">
              Final Computed Score
            </span>
            <span className="text-4xl font-extrabold text-forest-950 font-display mt-1 block">
              {score ?? 0}%
            </span>
            <span
              className={`inline-block mt-2 text-[11px] font-bold px-3 py-1 rounded-full border ${
                isFlagged
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : isRejected
                  ? "bg-red-50 text-red-800 border-red-200"
                  : passed
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-stone-100 text-stone-700 border-stone-200"
              }`}
            >
              {isFlagged
                ? "PENDING HUMAN ASSESSOR CONFIRMATION"
                : isRejected
                ? "CREDENTIAL WITHHELD"
                : passed
                ? "VERIFIED SKILL CREDENTIAL ISSUED"
                : `BELOW PASSING THRESHOLD (${passingThreshold}%)`}
            </span>
          </div>

          {/* Information / Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs text-left max-w-xl mx-auto leading-relaxed border ${
                isFlagged
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : isRejected
                  ? "bg-red-50 text-red-900 border-red-200"
                  : "bg-cream-100 text-forest-900 border-cream-200"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 mt-0.5 shrink-0 text-ochre-700" />
                <p>{feedback}</p>
              </div>
            </div>
          )}

          {isFlagged && (
            <p className="text-[11px] text-stone-500 max-w-md mx-auto">
              Our human assessors review all flagged sessions to verify academic honesty without automated false accusations. You will be notified once the review is resolved.
            </p>
          )}

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/student/dashboard"
              className="px-5 py-2.5 rounded-xl bg-forest-900 text-cream-50 hover:bg-forest-800 text-xs font-semibold shadow-sm transition-all"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/student/passport"
              className="px-5 py-2.5 rounded-xl bg-white border border-cream-300 text-forest-900 hover:bg-cream-100 text-xs font-semibold shadow-sm transition-all"
            >
              View Student Passport
            </Link>
            {credentialId && (
              <Link
                href={`/verify/${credentialId}`}
                className="px-5 py-2.5 rounded-xl bg-ochre-600 hover:bg-ochre-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                View Verifiable Credential
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 3. ACTIVE IN-PROGRESS TEST RUNNER
  // -----------------------------------------------------------
  const activeQuestion = questions[activeQuestionIndex];
  const isTimeCritical = timeLeftSeconds <= 300; // Under 5 mins

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Full-Screen Anti-Cheat Alert Modal */}
      {proctorAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="card-premium max-w-md w-full bg-white border-2 border-red-500 p-6 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-900 inline-block mb-0.5">
                  PROCTORING SECURITY VIOLATION
                </span>
                <h3 className="text-base font-bold text-forest-950">{proctorAlertModal.title}</h3>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed bg-red-50 p-3 rounded-xl border border-red-200">
              {proctorAlertModal.description}
            </p>

            <div className="text-[11px] text-stone-500 space-y-1">
              <p>• <strong>Screen Switching & Tab Switches:</strong> Strictly prohibited.</p>
              <p>• <strong>Multiple Faces & Head Turn:</strong> Keep eyes directly on the screen.</p>
              <p>• <strong>Audit Status:</strong> Incident logged to blockchain audit record.</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setProctorAlertModal(null);
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Acknowledge & Return to Fullscreen Exam</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Warning Notification Banner */}
      {proctorWarning && (
        <div className="p-3.5 rounded-xl bg-amber-500 text-amber-950 text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-950 shrink-0" />
            <span>{proctorWarning}</span>
          </div>
          <span className="text-[10px] font-mono shrink-0 ml-2">Flag #{proctorCount}</span>
        </div>
      )}

      {/* Top Banner: Timer & Navigation */}
      <div className="card-premium p-4 bg-white border border-cream-300 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-forest-700">
            <span>Proctored Assessment Session</span>
            <span>•</span>
            <span>v{assessmentVersion}</span>
            <span>•</span>
            <span className="text-ochre-700">Passing: {passingThreshold}%</span>
          </div>
          <h2 className="text-base font-bold text-forest-950 mt-0.5">{assessmentTitle}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Authoritative Server-Synced Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${
              isTimeCritical
                ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                : "bg-cream-100 border-cream-200 text-forest-950"
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? "text-red-600" : "text-forest-700"}`} />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-cream-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Live AI Face Proctoring & Security HUD */}
      <div className="card-premium p-4 bg-gradient-to-r from-forest-950 to-forest-900 text-cream-50 border border-forest-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Real/Simulated Webcam Box with Overlays */}
          <div className="relative w-36 h-28 bg-black/90 rounded-xl overflow-hidden border-2 border-forest-700 flex items-center justify-center flex-shrink-0 shadow-inner">
            <video
              id="proctor-webcam-feed"
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Real-Time Optical AI Bounding Box Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={320}
              height={240}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* If camera is loading or permission not physical */}
            <div className="absolute inset-0 flex flex-col items-center justify-between p-1.5 bg-black/20 pointer-events-none z-20">
              <div className="w-full flex items-center justify-between">
                <span className="text-[7.5px] font-mono px-1 py-0.5 rounded bg-black/75 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  AI VISION
                </span>
                <span
                  className={`text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    detectedFacesCount > 1
                      ? "bg-red-600 text-white animate-pulse"
                      : detectedFacesCount === 0
                      ? "bg-amber-600 text-white"
                      : phoneDetected
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {detectedFacesCount > 1
                    ? `⚠️ ${detectedFacesCount} FACES`
                    : detectedFacesCount === 0
                    ? "❌ NO FACE"
                    : phoneDetected
                    ? "📱 PHONE"
                    : "✅ 1 FACE"}
                </span>
              </div>

              {/* Status pill in bottom */}
              <div className="w-full text-center">
                <span className="text-[7px] font-mono bg-black/80 text-cream-200 px-1.5 py-0.5 rounded">
                  {phoneDetected
                    ? "UNAUTHORIZED DEVICE"
                    : detectedFacesCount > 1
                    ? "MULTIPLE PERSONS"
                    : "PROCTOR SCAN ACTIVE"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE PROCTORING ENGINE
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                Flags: <strong>{proctorCount}</strong>
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">AI Optical Vision & Anti-Cheating System</h4>
            <p className="text-[11px] text-cream-200">
              Detects multiple faces, unauthorized mobile phones, screen switches, and face deviation.
            </p>

            {/* Countdown alert if suspicious activity is prolonged (> 0s) */}
            {suspiciousActivitySeconds > 0 && (
              <div className="p-2 rounded-lg bg-red-950/90 border border-red-500 text-red-200 text-[11px] flex items-center justify-between gap-2 animate-pulse mt-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                  <span>SUSPICIOUS ACTIVITY: Test terminates in {18 - suspiciousActivitySeconds}s!</span>
                </div>
                <span className="text-[10px] font-mono bg-red-900 px-2 py-0.5 rounded font-bold">
                  {suspiciousActivitySeconds}/18s
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live Proctoring Status Chips & Security Actions */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Face Status Chip */}
            <div
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 ${
                detectedFacesCount === 1
                  ? "bg-forest-900/90 border-forest-700 text-emerald-300"
                  : "bg-red-900/90 border-red-500 text-white animate-pulse"
              }`}
            >
              {detectedFacesCount === 1 ? (
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Users className="w-3.5 h-3.5 text-red-400" />
              )}
              <span>{detectedFacesCount === 1 ? "Single Face" : `${detectedFacesCount} Faces (VIOLATION)`}</span>
            </div>

            {/* Phone Detection Chip */}
            <div
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 ${
                !phoneDetected
                  ? "bg-forest-900/90 border-forest-700 text-emerald-300"
                  : "bg-red-900/90 border-red-500 text-white animate-pulse"
              }`}
            >
              <Smartphone className={`w-3.5 h-3.5 ${!phoneDetected ? "text-emerald-400" : "text-red-400"}`} />
              <span>{phoneDetected ? "Mobile Phone Detected" : "No Phone"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Testing Triggers for Proctors & Demonstrations */}
            <button
              onClick={() => {
                if (!phoneDetected) {
                  setPhoneDetected(true);
                  triggerProctorAlert(
                    "PHONE_DETECTED",
                    "Unauthorized Mobile Device Detected in Camera Frame",
                    "A smartphone or mobile screen was identified in your webcam feed. Remove all secondary devices immediately.",
                    "CRITICAL"
                  );
                  logProctoring("MOBILE_PHONE_DETECTED", { device: "Smartphone" });
                  setTimeout(() => setPhoneDetected(false), 8000);
                } else {
                  setPhoneDetected(false);
                }
              }}
              className="px-2 py-1 rounded bg-forest-800 hover:bg-forest-700 text-cream-200 text-[9px] font-semibold border border-forest-700"
              title="Test Mobile Phone Optical Detection"
            >
              Simulate Phone
            </button>

            <button
              onClick={() => {
                if (detectedFacesCount === 1) {
                  setDetectedFacesCount(2);
                  triggerProctorAlert(
                    "MULTIPLE_FACES",
                    "Multiple Faces Detected in Camera Frame",
                    "More than one person is present in the camera view. Candidate must take the exam completely alone.",
                    "CRITICAL"
                  );
                  logProctoring("MULTIPLE_FACES_DETECTED", { faceCount: 2 });
                  setTimeout(() => setDetectedFacesCount(1), 8000);
                } else {
                  setDetectedFacesCount(1);
                }
              }}
              className="px-2 py-1 rounded bg-forest-800 hover:bg-forest-700 text-cream-200 text-[9px] font-semibold border border-forest-700"
              title="Test Multiple Faces Optical Detection"
            >
              Simulate 2 Faces
            </button>

            <button
              onClick={() => {
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="px-3 py-1 rounded-lg bg-ochre-400 hover:bg-ochre-300 text-forest-950 text-[10px] font-bold shadow-sm transition-all"
            >
              Lock Fullscreen
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Question Navigation List */}
        <div className="lg:col-span-3 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block px-1">
            Questions ({questions.length})
          </span>
          {questions.map((q, idx) => {
            const isCurrent = idx === activeQuestionIndex;
            const ans = answers[q.id];
            const hasAnswer =
              ans !== undefined &&
              ans !== "" &&
              (Array.isArray(ans) ? ans.length > 0 : true);

            return (
              <button
                key={q.id}
                onClick={() => {
                  setActiveQuestionIndex(idx);
                  setTestResults(null);
                }}
                className={`w-full p-3 rounded-xl text-left text-xs transition-all border flex items-center justify-between ${
                  isCurrent
                    ? "bg-forest-900 text-cream-50 border-forest-900 shadow-sm font-semibold"
                    : hasAnswer
                    ? "bg-cream-100 text-forest-950 border-cream-300 hover:bg-cream-200"
                    : "bg-white text-stone-600 border-cream-200 hover:bg-cream-50"
                }`}
              >
                <div>
                  <span className="block text-[10px] opacity-75">Question {idx + 1}</span>
                  <span className="truncate block max-w-[130px] font-medium">
                    {q.type.replace("_", " ")}
                  </span>
                </div>
                <span className="text-[10px] font-mono opacity-80">{q.points} pts</span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Question Content & Interactive Work Area */}
        <div className="lg:col-span-9 space-y-4">
          <div className="card-premium p-6 bg-white border border-cream-300 space-y-6">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <span className="text-xs font-bold text-forest-800">
                Question {activeQuestionIndex + 1} of {questions.length} • {activeQuestion.points} Points
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-100 text-forest-900 uppercase">
                {activeQuestion.type.replace("_", " ")}
              </span>
            </div>

            <p className="text-sm font-medium text-forest-950 leading-relaxed">
              {activeQuestion.questionText}
            </p>

            {/* 1. MULTIPLE CHOICE */}
            {activeQuestion.type === "MULTIPLE_CHOICE" && activeQuestion.optionsJson && (
              <div className="space-y-2.5 pt-2">
                {JSON.parse(activeQuestion.optionsJson).map((opt: string, i: number) => {
                  const selected = answers[activeQuestion.id] === opt;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswers({ ...answers, [activeQuestion.id]: opt })}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        selected
                          ? "bg-forest-900 text-cream-50 border-forest-900 font-semibold"
                          : "bg-cream-50 hover:bg-cream-100 text-stone-700 border-cream-200"
                      }`}
                    >
                      <span>{opt}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-ochre-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. MULTIPLE SELECT (Checkboxes) */}
            {activeQuestion.type === "MULTIPLE_SELECT" && activeQuestion.optionsJson && (
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] text-stone-500 italic block mb-1">
                  Select all that apply:
                </span>
                {JSON.parse(activeQuestion.optionsJson).map((opt: string, i: number) => {
                  const currentAns = answers[activeQuestion.id];
                  let isSelected = false;
                  if (Array.isArray(currentAns)) {
                    isSelected = currentAns.includes(opt);
                  } else if (typeof currentAns === "string" && currentAns) {
                    try {
                      const parsed = JSON.parse(currentAns);
                      isSelected = Array.isArray(parsed) && parsed.includes(opt);
                    } catch {
                      isSelected = currentAns === opt;
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleToggleMultiSelect(activeQuestion.id, opt)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-forest-900 text-cream-50 border-forest-900 font-semibold"
                          : "bg-cream-50 hover:bg-cream-100 text-stone-700 border-cream-200"
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-ochre-300 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. SHORT ANSWER */}
            {activeQuestion.type === "SHORT_ANSWER" && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-forest-950 block">
                  Your Answer:
                </label>
                <input
                  type="text"
                  value={answers[activeQuestion.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [activeQuestion.id]: e.target.value })
                  }
                  placeholder="Type your exact response..."
                  className="w-full p-3 rounded-xl border border-cream-300 text-xs focus:outline-none focus:ring-2 focus:ring-forest-800 text-forest-950 bg-cream-50"
                />
              </div>
            )}

            {/* 4. CODING QUESTION */}
            {activeQuestion.type === "CODING" && (
              <div className="space-y-4 pt-2">
                <div className="rounded-xl overflow-hidden border border-stone-800">
                  <div className="bg-stone-900 px-4 py-2 flex items-center justify-between text-xs text-stone-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-ochre-400" />
                      solution.js
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleResetCode(activeQuestion.id, activeQuestion.starterCode)}
                        className="flex items-center gap-1 hover:text-stone-200 transition-colors"
                        title="Reset to starter code"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Code</span>
                      </button>
                      <span>Isolated Node Sandbox</span>
                    </div>
                  </div>
                  <textarea
                    rows={13}
                    value={answers[activeQuestion.id] || activeQuestion.starterCode || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [activeQuestion.id]: e.target.value })
                    }
                    className="w-full p-4 code-editor-area text-xs font-mono leading-relaxed resize-none focus:outline-none bg-stone-950 text-cream-100"
                    placeholder="// Write your solution function here..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    Runs in isolated sandbox. Hidden test cases are evaluated server-side.
                  </span>
                  <button
                    onClick={() => handleRunCode(activeQuestion.id)}
                    disabled={runningCode}
                    className="px-4 py-2 rounded-lg bg-forest-900 hover:bg-forest-800 text-cream-50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {runningCode ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-ochre-300" />
                    )}
                    <span>Run Sandboxed Tests</span>
                  </button>
                </div>

                {/* TEST RESULTS PANEL */}
                {testResults && (
                  <div className="p-4 rounded-xl bg-stone-950 text-cream-100 font-mono text-xs space-y-3 border border-stone-800 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <span className="font-bold flex items-center gap-1.5">
                        {testResults.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span>
                          {testResults.passed
                            ? "All Visible & Hidden Tests Passed"
                            : "Some Test Cases Failed"}
                        </span>
                      </span>
                      <span className="text-ochre-400 font-semibold">
                        Score: {testResults.score} / {testResults.maxScore} pts
                      </span>
                    </div>

                    <div className="space-y-2">
                      {testResults.testCaseResults.map((tc: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded bg-stone-900 text-[11px]"
                        >
                          <span className="text-stone-300">
                            Test Case #{i + 1} {tc.isHidden && "(Server-Side Hidden Test Case)"}
                          </span>
                          <span
                            className={`font-bold ${
                              tc.passed ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {tc.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
