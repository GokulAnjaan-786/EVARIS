"use client";

import React, { useState } from "react";
import { TelemetryReport, DiagnosticEvent, DiagnosticStage } from "../../types/classroom";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Eye,
  Gauge,
  CheckCircle2,
  Radio,
  FileCheck2,
  MonitorCheck,
  Mic,
  MicOff,
  AlertTriangle,
} from "lucide-react";

interface TelemetryHUDProps {
  telemetry: TelemetryReport | null;
  diagnosticTrace?: Record<string, DiagnosticEvent>;
  sessionMode?: "LIVE" | "SIMULATED" | "STANDBY";
  micPermission?: "prompt" | "granted" | "denied" | "unsupported";
  isHardwareCapturing?: boolean;
  processorType?: "AudioWorklet" | "ScriptProcessor" | "None";
  framesSent?: number;
  audioLevel?: number;
  permissionError?: string | null;
}

const PIPELINE_STAGES: { id: DiagnosticStage; label: string; stepNum: number }[] = [
  { id: "AUDIO_RECEIVED", label: "1. Audio Ingest", stepNum: 1 },
  { id: "AUDIO_PROCESSED", label: "2. VAD Chunking", stepNum: 2 },
  { id: "TRANSCRIPT_PRODUCED", label: "3. Faster-Whisper", stepNum: 3 },
  { id: "CONCEPT_EXTRACTED", label: "4. Semantic Concept", stepNum: 4 },
  { id: "VISUAL_ACTION_SELECTED", label: "5. Visual Action", stepNum: 5 },
  { id: "VISUAL_PAYLOAD_VALIDATED", label: "6. Schema Validated", stepNum: 6 },
  { id: "FRONTEND_RENDERED", label: "7. Canvas Rendered", stepNum: 7 },
];

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  telemetry,
  diagnosticTrace = {},
  sessionMode = "STANDBY",
  micPermission = "prompt",
  isHardwareCapturing = false,
  processorType = "None",
  framesSent = 0,
  audioLevel = 0,
  permissionError = null,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const hasTrace = Object.keys(diagnosticTrace).length > 0;

  return (
    <div
      id="telemetry-hud"
      className="card-light"
      style={{
        padding: "8px 16px",
        fontSize: "0.78rem",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
      }}
    >
      {/* Compact HUD Header Strip */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Gauge size={14} color="var(--brand-blue)" />
          <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
            Engine Diagnostics & Pipeline Trace
          </span>

          {telemetry ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="badge badge-emerald" style={{ fontSize: "0.68rem" }}>
                {telemetry.total_latency_ms} ms total
              </span>
              <span
                className={`badge ${telemetry.is_simulated ? "badge-cyan" : "badge-emerald"}`}
                style={{ fontSize: "0.65rem" }}
              >
                {telemetry.is_simulated ? "⚡ Simulated Demo" : "🔴 Live Microphone"}
              </span>
            </div>
          ) : (
            <span
              className={`badge ${sessionMode === "LIVE" ? "badge-emerald" : "badge-slate"}`}
              style={{ fontSize: "0.68rem" }}
            >
              {sessionMode === "LIVE" ? "🔴 Live Audio Ready" : "Standby"}
            </span>
          )}

          {/* Truthful Hardware Microphone Status Badge */}
          {isHardwareCapturing ? (
            <span
              id="hud-mic-active-badge"
              style={{
                fontSize: "0.68rem",
                color: "#15803d",
                fontWeight: 600,
                backgroundColor: "#dcfce7",
                border: "1px solid #86efac",
                padding: "2px 8px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Mic size={11} color="#15803d" />
              <span>Mic: {processorType} ({framesSent} frames, {audioLevel}%)</span>
            </span>
          ) : permissionError ? (
            <span
              id="hud-mic-error-badge"
              style={{
                fontSize: "0.68rem",
                color: "#b91c1c",
                fontWeight: 600,
                backgroundColor: "#fee2e2",
                border: "1px solid #fca5a5",
                padding: "2px 8px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title={permissionError}
            >
              <AlertTriangle size={11} color="#b91c1c" />
              <span>Mic Blocked / Error</span>
            </span>
          ) : (
            <span
              id="hud-mic-standby-badge"
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                backgroundColor: "var(--bg-surface-secondary)",
                border: "1px solid var(--border-color)",
                padding: "2px 8px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <MicOff size={11} color="var(--text-muted)" />
              <span>Mic: {micPermission === "granted" ? "Ready" : "Standby"}</span>
            </span>
          )}

          {hasTrace && (
            <span
              style={{
                fontSize: "0.68rem",
                color: "#16a34a",
                fontWeight: 600,
                backgroundColor: "#dcfce7",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              Trace Active ({Object.keys(diagnosticTrace).length}/7 Stages)
            </span>
          )}
        </div>

        <button
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.72rem",
          }}
        >
          <span>{isExpanded ? "Hide Details" : "View Pipeline Trace & Metrics"}</span>
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded Metrics Breakdown & 7-Stage Pipeline Trace */}
      {isExpanded && (
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-color)" }}>
          {/* Section A: 7-Stage End-to-End Diagnostic Pipeline Tracker */}
          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Radio size={12} color="var(--brand-blue)" />
              End-to-End Live Pipeline Trace (Sentence Diagnostics)
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "8px",
              }}
            >
              {PIPELINE_STAGES.map((stg) => {
                const event = diagnosticTrace[stg.id];
                const isPassed = Boolean(event);

                return (
                  <div
                    key={stg.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      backgroundColor: isPassed ? "#f0fdf4" : "var(--bg-app)",
                      border: isPassed ? "1px solid #86efac" : "1px dashed var(--border-color)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: isPassed ? "#15803d" : "var(--text-muted)",
                        }}
                      >
                        {stg.label}
                      </span>
                      {isPassed && <CheckCircle2 size={12} color="#16a34a" />}
                    </div>

                    <div
                      style={{
                        fontSize: "0.68rem",
                        fontFamily: "var(--font-mono)",
                        color: isPassed ? "var(--text-primary)" : "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {event ? (
                        stg.id === "TRANSCRIPT_PRODUCED" ? (
                          event.details?.sentence ? `"${event.details.sentence.slice(0, 16)}..."` : "Transcribed"
                        ) : stg.id === "CONCEPT_EXTRACTED" ? (
                          event.details?.concept_name || "Concept Found"
                        ) : stg.id === "VISUAL_ACTION_SELECTED" ? (
                          `Action: ${event.details?.action || "CREATE"}`
                        ) : event.duration_ms ? (
                          `${event.duration_ms} ms`
                        ) : (
                          "Recorded"
                        )
                      ) : (
                        "Pending"
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Latency Metrics Cards & Hardware State */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
            }}
          >
            {/* Hardware Microphone Ingestion Node */}
            <div
              style={{
                backgroundColor: "var(--bg-app)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--text-muted)",
                  marginBottom: "2px",
                  fontSize: "0.72rem",
                }}
              >
                <Mic size={11} color="var(--brand-emerald)" />
                <span>Hardware Audio</span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: isHardwareCapturing ? "#16a34a" : (permissionError ? "#dc2626" : "var(--text-primary)"),
                }}
              >
                {isHardwareCapturing ? `${processorType} (${framesSent}f)` : (permissionError ? "Blocked" : micPermission)}
              </div>
            </div>

            {/* Transcription Delay */}
            <div
              style={{
                backgroundColor: "var(--bg-app)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--text-muted)",
                  marginBottom: "2px",
                  fontSize: "0.72rem",
                }}
              >
                <Clock size={11} color="var(--brand-blue)" />
                <span>ASR Transcription</span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {telemetry ? `${telemetry.transcription_ms} ms` : "--"}
              </div>
            </div>

            {/* Cognitive Decision Delay */}
            <div
              style={{
                backgroundColor: "var(--bg-app)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--text-muted)",
                  marginBottom: "2px",
                  fontSize: "0.72rem",
                }}
              >
                <Cpu size={11} color="var(--brand-cyan)" />
                <span>Concept Decision</span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {telemetry ? `${telemetry.understanding_ms} ms` : "--"}
              </div>
            </div>

            {/* Visual Synthesis Delay */}
            <div
              style={{
                backgroundColor: "var(--bg-app)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--text-muted)",
                  marginBottom: "2px",
                  fontSize: "0.72rem",
                }}
              >
                <Eye size={11} color="var(--brand-violet)" />
                <span>Visual Synthesis</span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {telemetry ? `${telemetry.visual_ms} ms` : "--"}
              </div>
            </div>

            {/* Total End-to-End Latency */}
            <div
              style={{
                backgroundColor: "var(--status-success-light)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid #a7f3d0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--status-success)",
                  marginBottom: "2px",
                  fontSize: "0.72rem",
                }}
              >
                <Activity size={11} color="var(--status-success)" />
                <span>Total Latency</span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--status-success)",
                }}
              >
                {telemetry ? `${telemetry.total_latency_ms} ms` : "--"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
