"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, CameraOff, Mic, MicOff, UserCheck, ShieldCheck, Volume2 } from "lucide-react";

interface TeacherVideoPreviewProps {
  isMicActive: boolean;
  audioLevel: number;
  framesSent?: number;
  permissionError?: string | null;
  onToggleLiveSession?: () => void;
}

export const TeacherVideoPreview: React.FC<TeacherVideoPreviewProps> = ({
  isMicActive,
  audioLevel,
  framesSent = 0,
  permissionError,
  onToggleLiveSession,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Toggle Camera with explicit user permission
  const toggleCamera = async () => {
    setCameraError(null);
    if (isCameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getVideoTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
        });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } catch (err: any) {
        setCameraError("Camera access denied or device unavailable.");
      }
    }
  };

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div
      id="teacher-video-container"
      className="card-light"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Viewport / Video Area */}
      <div
        style={{
          height: "135px",
          position: "relative",
          backgroundColor: "#0b0f19",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: isCameraActive ? "block" : "none",
          }}
        />

        {/* Fallback Privacy Avatar */}
        {!isCameraActive && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(37, 99, 235, 0.15)",
                border: "1.5px solid rgba(59, 130, 246, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCheck size={22} color="#60a5fa" />
            </div>
            <div>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#f8fafc" }}>
                Teacher Presence Active
              </p>
              <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                Camera in privacy standby
              </p>
            </div>
          </div>
        )}

        {/* Privacy Pill Overlay */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "6px",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            color: "#94a3b8",
            fontSize: "0.68rem",
            fontWeight: 500,
            backdropFilter: "blur(4px)",
          }}
        >
          <ShieldCheck size={11} color="#38bdf8" />
          <span>Privacy Controlled</span>
        </div>

        {/* Real Microphone Level Meter Overlay */}
        {isMicActive && (
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "10px",
              right: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              padding: "5px 10px",
              borderRadius: "6px",
              backdropFilter: "blur(4px)",
            }}
          >
            <Volume2 size={12} color="#34d399" />
            <div
              style={{
                flex: 1,
                height: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${audioLevel}%`,
                  height: "100%",
                  backgroundColor: audioLevel > 70 ? "#ef4444" : "#10b981",
                  transition: "width 0.08s ease-out",
                }}
              />
            </div>
            <span style={{ fontSize: "0.68rem", color: "#34d399", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              {audioLevel}% ({framesSent} frames)
            </span>
          </div>
        )}
      </div>

      {/* Media Action Buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            id="btn-toggle-camera"
            onClick={toggleCamera}
            className={`btn ${isCameraActive ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "5px 10px", fontSize: "0.78rem" }}
            title={isCameraActive ? "Stop Camera Preview" : "Enable Camera Preview (Requires Permission)"}
          >
            {isCameraActive ? <Camera size={13} /> : <CameraOff size={13} />}
            <span>{isCameraActive ? "Camera On" : "Camera Off"}</span>
          </button>

          <button
            id="btn-toggle-mic"
            onClick={onToggleLiveSession}
            className={`btn ${isMicActive ? "btn-danger" : "btn-secondary"}`}
            style={{
              padding: "5px 10px",
              fontSize: "0.78rem",
              backgroundColor: isMicActive ? "#ef4444" : undefined,
              color: isMicActive ? "#ffffff" : undefined,
            }}
            title={isMicActive ? "Stop Live Microphone Teaching Session" : "Start Live Teaching with Microphone"}
          >
            {isMicActive ? <Mic size={13} /> : <MicOff size={13} />}
            <span>{isMicActive ? "Live Mic Active" : "Mic Standby"}</span>
          </button>
        </div>

        {(permissionError || cameraError) && (
          <span style={{ fontSize: "0.7rem", color: "var(--status-error)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={permissionError || cameraError || ""}>
            {permissionError || cameraError}
          </span>
        )}
      </div>
    </div>
  );
};
