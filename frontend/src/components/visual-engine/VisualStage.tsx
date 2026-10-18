"use client";

import React from "react";
import { VisualPayload } from "../../types/classroom";
import { MathRenderer } from "./MathRenderer";
import { GraphRenderer } from "./GraphRenderer";
import { FlowchartRenderer } from "./FlowchartRenderer";
import { ScienceRenderer } from "./ScienceRenderer";
import { TimelineRenderer } from "./TimelineRenderer";
import { Snowflake, Sparkles, BookOpen, Mic, CheckCircle2 } from "lucide-react";

interface VisualStageProps {
  activeVisual: VisualPayload | null;
  isVisualFrozen: boolean;
  activeSubject: string;
  hasDemoLesson: boolean;
  sessionMode?: "LIVE" | "SIMULATED" | "STANDBY";
  isLiveAudioActive?: boolean;
  onSelectSupportedDemo: (subjectName: string) => void;
}

export const VisualStage: React.FC<VisualStageProps> = ({
  activeVisual,
  isVisualFrozen,
  activeSubject,
  hasDemoLesson,
  sessionMode = "STANDBY",
  isLiveAudioActive = false,
  onSelectSupportedDemo,
}) => {
  return (
    <div
      id="evaris-visual-stage"
      className="visual-stage-dark"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Dark Stage Top Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 18px",
          backgroundColor: "#0d1322",
          borderBottom: "1px solid var(--stage-border)",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isLiveAudioActive ? "#22c55e" : (activeVisual ? "#38bdf8" : "#64748b"),
              boxShadow: isLiveAudioActive ? "0 0 8px #22c55e" : (activeVisual ? "0 0 8px #38bdf8" : "none"),
            }}
          />
          <h2
            style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              letterSpacing: "0.01em",
              color: "#f8fafc",
              margin: 0,
            }}
          >
            {activeVisual ? activeVisual.title : `${activeSubject} — Visual Teaching Stage`}
          </h2>
          {activeVisual?.subtitle && (
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              — {activeVisual.subtitle}
            </span>
          )}

          {/* Mode Pill: LIVE vs SIMULATED */}
          {sessionMode === "LIVE" || isLiveAudioActive ? (
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                padding: "2px 8px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Mic size={10} />
              LIVE MICROPHONE
            </span>
          ) : sessionMode === "SIMULATED" ? (
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#f59e0b",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                padding: "2px 8px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ⚡ SIMULATED DEMO
            </span>
          ) : null}

          {/* Visual Update Mode indicator */}
          {activeVisual && (
            <span
              className="dark-pill dark-pill-indigo"
              style={{ fontSize: "0.65rem", padding: "1px 6px" }}
            >
              Mode: {activeVisual.mode}
            </span>
          )}
        </div>

        {/* Visual Freeze Warning Tag */}
        {isVisualFrozen && (
          <div className="dark-pill dark-pill-cyan">
            <Snowflake size={12} color="#38bdf8" />
            <span>Visual Locked / Frozen</span>
          </div>
        )}
      </div>

      {/* Main Canvas Viewport */}
      <div
        id="visual-canvas-viewport"
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#090d16",
          overflow: "hidden",
        }}
      >
        {!activeVisual ? (
          /* Empty / Standby State */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "18px",
              textAlign: "center",
              padding: "40px 24px",
              maxWidth: "540px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                backgroundColor: isLiveAudioActive ? "rgba(34, 197, 94, 0.15)" : "rgba(37, 99, 235, 0.15)",
                border: isLiveAudioActive ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(59, 130, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isLiveAudioActive ? "0 0 25px rgba(34, 197, 94, 0.2)" : "0 0 25px rgba(37, 99, 235, 0.2)",
              }}
            >
              {isLiveAudioActive ? <Mic size={28} color="#4ade80" /> : <Sparkles size={28} color="#60a5fa" />}
            </div>

            {isLiveAudioActive ? (
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", marginBottom: "6px" }}>
                  Live Microphone Active — Listening
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.6" }}>
                  Speak an educational explanation naturally in <strong>{activeSubject}</strong>.
                  EVARIS will transcribe your speech and automatically generate mathematical graphs,
                  biological diagrams, algorithmic flowcharts, or timelines from your words.
                </p>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", marginBottom: "6px" }}>
                  EVARIS Visual Engine Ready
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.6" }}>
                  Click <strong>Start Live Session</strong> above to teach with your microphone, or run a <strong>Simulated Demo</strong> to preview a scripted lesson.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Render Active Visual Typology (scrolls internally if content is larger than viewport) */
          <div
            id="active-visual-scroll-wrapper"
            style={{
              width: "100%",
              height: "100%",
              maxHeight: "100%",
              minHeight: 0,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {activeVisual.typology === "MATH_EQUATION" && (
              <MathRenderer
                latex={activeVisual.data.latex}
                steps={activeVisual.data.steps}
                activeStepId={activeVisual.data.active_step_id}
                activeFeatures={activeVisual.active_features}
              />
            )}

            {activeVisual.typology === "FUNCTION_GRAPH" && (
              <GraphRenderer
                functionLatex={activeVisual.data.function_latex}
                functionExpr={activeVisual.data.function_expr}
                domain={activeVisual.data.domain}
                rangeY={activeVisual.data.range}
                points={activeVisual.data.points}
                activeFeatures={activeVisual.active_features}
              />
            )}

            {activeVisual.typology === "STRUCTURED_FLOWCHART" && (
              <FlowchartRenderer
                nodes={activeVisual.data.nodes}
                edges={activeVisual.data.edges}
                activeNodeId={activeVisual.data.active_node_id}
                activeFeatures={activeVisual.active_features}
              />
            )}

            {activeVisual.typology === "SCIENCE_DIAGRAM" && (
              <ScienceRenderer
                diagramType={activeVisual.data.diagram_type}
                elements={activeVisual.data.elements}
                activeElementId={activeVisual.data.active_element_id}
                activeFeatures={activeVisual.active_features}
              />
            )}

            {activeVisual.typology === "TIMELINE" && (
              <TimelineRenderer
                events={activeVisual.data.events}
                activeEventId={activeVisual.data.active_event_id}
                activeFeatures={activeVisual.active_features}
              />
            )}
          </div>
        )}
      </div>

      {/* Feature Annotation Footer */}
      {activeVisual && activeVisual.active_features.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            backgroundColor: "#0d1322",
            borderTop: "1px solid var(--stage-border)",
            overflowX: "auto",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "0.72rem",
              color: "#94a3b8",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}
          >
            Active Elements:
          </span>
          {activeVisual.active_features.map((feat) => (
            <span
              key={feat.id}
              className={`dark-pill ${feat.highlight ? "dark-pill-cyan" : "dark-pill-indigo"}`}
              style={{
                fontSize: "0.68rem",
                padding: "2px 8px",
                flexShrink: 0,
              }}
            >
              {feat.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
