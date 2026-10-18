"use client";

import React, { useState } from "react";
import { ConnectionStatus, TeachingStatus } from "../../types/classroom";
import { Sparkles, Wifi, BookOpen, Settings, Info } from "lucide-react";
import { ClassroomSettingsModal } from "./ClassroomSettingsModal";

interface ClassroomHeaderProps {
  connectionStatus: ConnectionStatus;
  teachingStatus: TeachingStatus;
  primarySubject: string;
  totalSelectedSubjects: number;
  sessionId: string;
  onOpenSubjectModal: () => void;
}

export const ClassroomHeader: React.FC<ClassroomHeaderProps> = ({
  connectionStatus,
  teachingStatus,
  primarySubject,
  totalSelectedSubjects,
  sessionId,
  onOpenSubjectModal,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header
        id="evaris-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 28px",
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-sm)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Brand Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
            }}
          >
            <Sparkles size={20} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <h1
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                EVARIS
              </h1>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Every Victory Arrives After Rising In Silence
              </span>
            </div>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              Intelligence That Makes Learning Visible.
            </p>
          </div>
        </div>

        {/* Status Indicators & Navigation Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Active Subject Pill Button */}
          <button
            onClick={onOpenSubjectModal}
            className="badge badge-blue"
            style={{
              cursor: "pointer",
              border: "1px solid #bfdbfe",
              padding: "4px 10px",
              textDecoration: "none",
            }}
            title="Click to manage and select subjects"
          >
            <BookOpen size={13} />
            <span>
              {primarySubject}
              {totalSelectedSubjects > 1 && ` (+${totalSelectedSubjects - 1})`}
            </span>
          </button>

          {/* Teaching State Badge */}
          <div
            className={`badge ${
              teachingStatus === "TEACHING"
                ? "badge-cyan"
                : teachingStatus === "PAUSED"
                ? "badge-amber"
                : "badge-slate"
            }`}
          >
            <div
              className="status-indicator-dot"
              style={{
                animation: teachingStatus === "TEACHING" ? "pulse-ring 2s infinite" : "none",
              }}
            />
            <span>{teachingStatus}</span>
          </div>

          {/* Backend Connection Badge */}
          <div
            className={`badge ${
              connectionStatus === "CONNECTED"
                ? "badge-emerald"
                : connectionStatus === "CONNECTING"
                ? "badge-amber"
                : "badge-amber"
            }`}
          >
            <Wifi size={13} />
            <span>{connectionStatus}</span>
          </div>

          {/* Settings / Info Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn btn-secondary"
            style={{ padding: "6px 10px", borderRadius: "var(--radius-md)" }}
            title="Classroom Information & Settings"
          >
            <Info size={15} />
          </button>
        </div>
      </header>

      <ClassroomSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        connectionStatus={connectionStatus}
        sessionId={sessionId}
      />
    </>
  );
};
