"use client";

import React from "react";
import { ActiveFeature } from "../../types/classroom";
import { GitBranch, CornerDownRight } from "lucide-react";

interface FlowchartNode {
  id: string;
  label: string;
  type: "start" | "process" | "decision" | "end";
  highlight?: boolean;
}

interface FlowchartEdge {
  from: string;
  to: string;
  label?: string;
}

interface FlowchartRendererProps {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  activeNodeId?: string;
  activeFeatures: ActiveFeature[];
}

export const FlowchartRenderer: React.FC<FlowchartRendererProps> = ({
  nodes = [],
  edges = [],
  activeNodeId,
  activeFeatures,
}) => {
  return (
    <div
      id="flowchart-visual-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          width: "100%",
          maxWidth: "540px",
        }}
      >
        {nodes.map((node, index) => {
          const isHighlighted =
            node.id === activeNodeId ||
            node.highlight ||
            activeFeatures.some((f) => f.id === node.id && f.highlight);

          const isDecision = node.type === "decision";
          const isTerminal = node.type === "start" || node.type === "end";

          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: isTerminal ? "999px" : isDecision ? "14px" : "10px",
                  background: isHighlighted
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: isHighlighted
                    ? "2px solid #38bdf8"
                    : isDecision
                    ? "1px dashed rgba(255, 255, 255, 0.2)"
                    : "1px solid var(--border-subtle)",
                  boxShadow: isHighlighted
                    ? "0 0 25px rgba(56, 189, 248, 0.35)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: isHighlighted ? "scale(1.03)" : "scale(1)",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: isHighlighted ? "#38bdf8" : "var(--text-muted)",
                      boxShadow: isHighlighted ? "0 0 10px #38bdf8" : "none",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: isHighlighted ? 700 : 500,
                      color: isHighlighted ? "#ffffff" : "var(--text-primary)",
                    }}
                  >
                    {node.label}
                  </span>
                </div>

                <span
                  className={`pill ${
                    isHighlighted ? "pill-cyan" : "pill-indigo"
                  }`}
                  style={{ fontSize: "0.62rem", padding: "2px 8px" }}
                >
                  {node.type.toUpperCase()}
                </span>
              </div>

              {/* Connecting Path Arrow */}
              {index < nodes.length - 1 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    color: isHighlighted ? "#38bdf8" : "var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      width: "2px",
                      height: "12px",
                      backgroundColor: isHighlighted ? "#38bdf8" : "rgba(255, 255, 255, 0.15)",
                    }}
                  />
                  <CornerDownRight size={14} color={isHighlighted ? "#38bdf8" : "#64748b"} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
