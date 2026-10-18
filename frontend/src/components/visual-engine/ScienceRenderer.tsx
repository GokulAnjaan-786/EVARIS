"use client";

import React from "react";
import { ActiveFeature } from "../../types/classroom";

interface ScienceElement {
  id: string;
  label: string;
  role: string;
  x: number;
  y: number;
  radius: number;
  highlight?: boolean;
  description?: string;
}

interface ScienceRendererProps {
  diagramType: string;
  elements: ScienceElement[];
  activeElementId?: string;
  activeFeatures: ActiveFeature[];
}

export const ScienceRenderer: React.FC<ScienceRendererProps> = ({
  diagramType,
  elements = [],
  activeElementId,
  activeFeatures,
}) => {
  return (
    <div
      id="science-visual-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "16px",
      }}
    >
      <svg
        viewBox="0 0 800 480"
        style={{
          width: "100%",
          maxHeight: "360px",
          overflow: "visible",
        }}
      >
        <defs>
          <radialGradient id="chloroplastBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
            <stop offset="80%" stopColor="rgba(5, 150, 105, 0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <filter id="sciGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Chloroplast Organelle Boundary */}
        <ellipse
          cx="400"
          cy="240"
          rx="290"
          ry="170"
          fill="url(#chloroplastBg)"
          stroke="#10b981"
          strokeWidth="3"
          filter="url(#sciGlow)"
        />

        {/* Inner Membrane Envelope */}
        <ellipse
          cx="400"
          cy="240"
          rx="265"
          ry="148"
          fill="rgba(6, 78, 59, 0.15)"
          stroke="rgba(52, 211, 153, 0.5)"
          strokeWidth="1.8"
          strokeDasharray="4 2"
        />

        {/* Stroma Fluid Region Label */}
        <text
          x="260"
          y="180"
          fill="#6ee7b7"
          fontSize="12"
          fontWeight="600"
          fontFamily="var(--font-family-mono)"
        >
          Aqueous Stroma Matrix (Dark Reactions)
        </text>

        {/* Thylakoid Granum Disc Stacks */}
        {[
          { x: 440, y: 220 },
          { x: 530, y: 240 },
          { x: 360, y: 270 },
        ].map((stack, sIdx) => {
          const isThylakoidActive =
            activeElementId === "thylakoids" ||
            activeFeatures.some((f) => f.id === "thylakoids" && f.highlight);

          return (
            <g key={`granum-${sIdx}`} filter={isThylakoidActive ? "url(#sciGlow)" : undefined}>
              {[-16, -8, 0, 8, 16].map((offsetY, dIdx) => (
                <ellipse
                  key={`disc-${dIdx}`}
                  cx={stack.x}
                  cy={stack.y + offsetY}
                  rx="36"
                  ry="9"
                  fill={isThylakoidActive ? "#34d399" : "rgba(16, 185, 129, 0.5)"}
                  stroke={isThylakoidActive ? "#ffffff" : "#059669"}
                  strokeWidth={isThylakoidActive ? "2" : "1"}
                  style={{ transition: "all 0.4s ease" }}
                />
              ))}
            </g>
          );
        })}

        {/* Element Annotation Pointer Callouts */}
        {elements.map((elem) => {
          const isHighlighted =
            elem.id === activeElementId ||
            elem.highlight ||
            activeFeatures.some((f) => f.id === elem.id && f.highlight);

          return (
            <g key={elem.id} style={{ transition: "all 0.35s ease" }}>
              {/* Pointer Marker */}
              <circle
                cx={elem.x}
                cy={elem.y}
                r={isHighlighted ? 9 : 5}
                fill={isHighlighted ? "#38bdf8" : "#34d399"}
                stroke="#ffffff"
                strokeWidth={isHighlighted ? "2.5" : "1.5"}
                className={isHighlighted ? "pulse-dot" : undefined}
              />

              {/* Callout Label Card */}
              <g
                transform={`translate(${elem.x > 400 ? elem.x + 20 : elem.x - 170}, ${
                  elem.y - 12
                })`}
              >
                <rect
                  x="0"
                  y="0"
                  width="155"
                  height="34"
                  rx="8"
                  fill="rgba(10, 14, 23, 0.92)"
                  stroke={isHighlighted ? "#38bdf8" : "rgba(255, 255, 255, 0.15)"}
                  strokeWidth={isHighlighted ? "1.8" : "1"}
                />
                <text
                  x="10"
                  y="15"
                  fill={isHighlighted ? "#38bdf8" : "#f8fafc"}
                  fontSize="11"
                  fontWeight={isHighlighted ? "700" : "600"}
                >
                  {elem.label}
                </text>
                <text
                  x="10"
                  y="27"
                  fill="var(--text-muted)"
                  fontSize="9"
                  fontFamily="var(--font-family-mono)"
                >
                  {elem.role}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
