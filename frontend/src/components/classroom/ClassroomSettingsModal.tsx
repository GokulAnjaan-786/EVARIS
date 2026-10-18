"use client";

import React from "react";
import { X, Info, Shield, Radio, Sparkles } from "lucide-react";
import { ConnectionStatus } from "../../types/classroom";

interface ClassroomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: ConnectionStatus;
  sessionId: string;
}

export const ClassroomSettingsModal: React.FC<ClassroomSettingsModalProps> = ({
  isOpen,
  onClose,
  connectionStatus,
  sessionId,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 110,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card-light"
        style={{
          width: "100%",
          maxWidth: "520px",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Info size={18} color="var(--brand-blue)" />
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
              About EVARIS Classroom
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "4px", borderRadius: "50%", width: "28px", height: "28px" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <strong style={{ fontSize: "1.1rem", color: "var(--brand-blue)" }}>EVARIS</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Every Victory Arrives After Rising In Silence
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Intelligence That Makes Learning Visible. Real-time visual teaching engine designed for online educators.
            </p>
          </div>

          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--bg-app)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Backend Connection:</span>
              <span style={{ fontWeight: 600, color: connectionStatus === "CONNECTED" ? "var(--status-success)" : "var(--status-warning)" }}>
                {connectionStatus}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Session Identifier:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--text-primary)" }}>
                {sessionId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Visual Continuity Engine:</span>
              <span style={{ fontWeight: 600, color: "var(--brand-cyan)" }}>Active (Hysteresis Guard)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Privacy Protection:</span>
              <span style={{ fontWeight: 600, color: "var(--status-success)" }}>Zero Unsolicited Media</span>
            </div>
          </div>

          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
            In live classes, teachers speak naturally. EVARIS parses spoken context and projects
            exact mathematical curves, algorithmic flowcharts, and biological schematics
            with zero manual screen switching.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--bg-app)",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button onClick={onClose} className="btn btn-primary" style={{ padding: "6px 18px" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
