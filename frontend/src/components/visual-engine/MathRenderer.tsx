"use client";

import React, { useEffect, useRef } from "react";
import katex from "katex";
import { ActiveFeature } from "../../types/classroom";
import { CheckCircle } from "lucide-react";

interface MathRendererProps {
  latex: string;
  steps?: Array<{ id: string; explanation: string; latex: string }>;
  activeStepId?: string;
  activeFeatures: ActiveFeature[];
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  steps = [],
  activeStepId,
  activeFeatures,
}) => {
  const mainMathRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mainMathRef.current && latex) {
      try {
        katex.render(latex, mainMathRef.current, {
          displayMode: true,
          throwOnError: false,
        });
      } catch (e) {
        console.error("KaTeX render error:", e);
      }
    }
  }, [latex]);

  return (
    <div
      id="math-visual-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "32px 24px",
      }}
    >
      {/* Primary Mathematical Expression */}
      <div
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
          padding: "24px 36px",
          borderRadius: "16px",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          boxShadow: "0 0 30px rgba(99, 102, 241, 0.15)",
          marginBottom: "28px",
          maxWidth: "90%",
          textAlign: "center",
        }}
      >
        <div ref={mainMathRef} />
      </div>

      {/* Step-by-Step Derivation Breakdown */}
      {steps && steps.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            Analytical Derivation Steps
          </div>

          {steps.map((step) => {
            const isActive = step.id === activeStepId;
            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  background: isActive
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: isActive
                    ? "1px solid rgba(99, 102, 241, 0.45)"
                    : "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  transition: "all 0.3s ease",
                  transform: isActive ? "scale(1.01)" : "scale(1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle
                    size={16}
                    color={isActive ? "#818cf8" : "var(--text-muted)"}
                  />
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {step.explanation}
                  </span>
                </div>

                <div
                  ref={(el) => {
                    if (el && step.latex) {
                      try {
                        katex.render(step.latex, el, {
                          displayMode: false,
                          throwOnError: false,
                        });
                      } catch (e) {}
                    }
                  }}
                  style={{
                    color: isActive ? "#38bdf8" : "var(--text-muted)",
                    fontSize: "0.9em",
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
