"use client";

import React from "react";
import { VisualPayload } from "../../types/classroom";
import { Layers, RefreshCw, Zap, CheckCircle2 } from "lucide-react";

interface TopicStatusBadgeProps {
  activeVisual: VisualPayload | null;
  activeSubject: string;
}

export const TopicStatusBadge: React.FC<TopicStatusBadgeProps> = ({
  activeVisual,
  activeSubject,
}) => {
  if (!activeVisual) {
    return (
      <div
        className="card-light"
        style={{
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={14} color="var(--brand-blue)" />
          <span>Active Subject: <strong style={{ color: "var(--text-primary)" }}>{activeSubject}</strong> — Awaiting teacher explanation to generate visual...</span>
        </div>
      </div>
    );
  }

  const isContinuityMode =
    activeVisual.mode === "UPDATE" || activeVisual.mode === "HIGHLIGHT";

  return (
    <div
      id="topic-status-container"
      className="card-light"
      style={{
        padding: "8px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderLeft: isContinuityMode
          ? "3.5px solid var(--brand-cyan)"
          : "3.5px solid var(--brand-blue)",
      }}
    >
      {/* Concept Identification */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            backgroundColor: isContinuityMode
              ? "var(--brand-cyan-light)"
              : "var(--brand-blue-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isContinuityMode ? (
            <RefreshCw size={14} color="var(--brand-cyan)" />
          ) : (
            <Zap size={14} color="var(--brand-blue)" />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {activeVisual.title}
          </span>
          <span
            className={`badge ${
              isContinuityMode ? "badge-cyan" : "badge-blue"
            }`}
            style={{ fontSize: "0.68rem" }}
          >
            {activeVisual.mode}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            ({activeVisual.continuity_key})
          </span>
        </div>
      </div>

      {/* Continuity Confirmation & Confidence */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {isContinuityMode && (
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--brand-cyan)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <CheckCircle2 size={13} color="var(--brand-cyan)" />
            Smart Continuity Engaged
          </span>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Confidence:</span>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--status-success)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {Math.round(activeVisual.metadata.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
