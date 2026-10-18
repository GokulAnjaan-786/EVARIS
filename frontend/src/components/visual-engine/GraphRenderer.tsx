"use client";

import React, { useMemo } from "react";
import { ActiveFeature } from "../../types/classroom";

interface GraphRendererProps {
  functionLatex: string;
  functionExpr: string;
  domain: [number, number];
  rangeY: [number, number];
  points: Array<{
    id: string;
    label: string;
    coordinates: [number, number];
    highlight?: boolean;
    details?: string;
  }>;
  activeFeatures: ActiveFeature[];
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({
  functionLatex,
  domain = [-1, 5],
  rangeY = [-2, 6],
  points = [],
  activeFeatures,
}) => {
  // SVG Canvas Dimension Dimensions
  const width = 640;
  const height = 400;
  const padding = 50;

  const [xMin, xMax] = domain;
  const [yMin, yMax] = rangeY;

  // Coordinate Conversion Functions
  const toSvgX = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
  const toSvgY = (y: number) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

  // Sample Curve Points: f(x) = x^2 - 4x + 3
  const curvePath = useMemo(() => {
    const samples = 120;
    const pathSegments: string[] = [];
    const step = (xMax - xMin) / samples;

    for (let i = 0; i <= samples; i++) {
      const x = xMin + i * step;
      const y = x * x - 4 * x + 3;
      const sx = toSvgX(x);
      const sy = toSvgY(y);

      if (i === 0) {
        pathSegments.push(`M ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      } else {
        pathSegments.push(`L ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      }
    }
    return pathSegments.join(" ");
  }, [xMin, xMax, yMin, yMax]);

  const originX = toSvgX(0);
  const originY = toSvgY(0);

  return (
    <div
      id="graph-visual-container"
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
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: "100%",
          maxHeight: "380px",
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Coordinate Grid Lines */}
        {[-1, 1, 2, 3, 4, 5].map((x) => (
          <line
            key={`grid-x-${x}`}
            x1={toSvgX(x)}
            y1={padding}
            x2={toSvgX(x)}
            y2={height - padding}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="3 3"
          />
        ))}
        {[-2, -1, 1, 2, 3, 4, 5, 6].map((y) => (
          <line
            key={`grid-y-${y}`}
            x1={padding}
            y1={toSvgY(y)}
            x2={width - padding}
            y2={toSvgY(y)}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="3 3"
          />
        ))}

        {/* X and Y Coordinate Axes */}
        <line
          x1={padding}
          y1={originY}
          x2={width - padding}
          y2={originY}
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1.5"
        />
        <line
          x1={originX}
          y1={padding}
          x2={originX}
          y2={height - padding}
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1.5"
        />

        {/* Axis Arrows */}
        <polygon
          points={`${width - padding + 8},${originY} ${width - padding},${originY - 4} ${width - padding},${originY + 4}`}
          fill="rgba(255, 255, 255, 0.6)"
        />
        <polygon
          points={`${originX},${padding - 8} ${originX - 4},${padding} ${originX + 4},${padding}`}
          fill="rgba(255, 255, 255, 0.6)"
        />

        {/* Axis Labels */}
        <text
          x={width - padding + 14}
          y={originY + 4}
          fill="var(--text-muted)"
          fontSize="11"
          fontFamily="var(--font-family-mono)"
        >
          x
        </text>
        <text
          x={originX - 6}
          y={padding - 14}
          fill="var(--text-muted)"
          fontSize="11"
          fontFamily="var(--font-family-mono)"
          textAnchor="middle"
        >
          f(x)
        </text>

        {/* Numeric Ticks */}
        {[-1, 1, 2, 3, 4, 5].map((x) => (
          <text
            key={`tick-x-${x}`}
            x={toSvgX(x)}
            y={originY + 16}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-family-mono)"
            textAnchor="middle"
          >
            {x}
          </text>
        ))}
        {[-2, -1, 1, 2, 3, 4, 5].map((y) => (
          <text
            key={`tick-y-${y}`}
            x={originX - 12}
            y={toSvgY(y) + 3}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-family-mono)"
            textAnchor="end"
          >
            {y}
          </text>
        ))}

        {/* Parabola Continuous Curve */}
        <path
          d={curvePath}
          fill="none"
          stroke="url(#curveGradient)"
          strokeWidth="3.5"
          filter="url(#glowFilter)"
          style={{
            transition: "all 0.5s ease",
          }}
        />

        {/* Highlighted Points of Interest (Vertex, Roots) */}
        {points.map((pt) => {
          const [px, py] = pt.coordinates;
          const sx = toSvgX(px);
          const sy = toSvgY(py);
          const isHighlighted = pt.highlight;

          return (
            <g
              key={pt.id}
              style={{
                transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* Outer Pulsing Glow Circle */}
              {isHighlighted && (
                <circle
                  cx={sx}
                  cy={sy}
                  r="14"
                  fill="rgba(56, 189, 248, 0.25)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  className="pulse-dot"
                />
              )}

              {/* Central Solid Point */}
              <circle
                cx={sx}
                cy={sy}
                r={isHighlighted ? 7 : 5}
                fill={isHighlighted ? "#ffffff" : "#38bdf8"}
                stroke={isHighlighted ? "#06b6d4" : "#818cf8"}
                strokeWidth="2.5"
              />

              {/* Point Label Card Callout */}
              <g transform={`translate(${sx}, ${sy - 22})`}>
                <rect
                  x="-55"
                  y="-16"
                  width="110"
                  height="22"
                  rx="6"
                  fill="rgba(10, 14, 23, 0.88)"
                  stroke={isHighlighted ? "#38bdf8" : "rgba(255, 255, 255, 0.2)"}
                  strokeWidth={isHighlighted ? "1.5" : "1"}
                />
                <text
                  x="0"
                  y="-2"
                  fill={isHighlighted ? "#ffffff" : "var(--text-secondary)"}
                  fontSize="10"
                  fontWeight={isHighlighted ? "700" : "500"}
                  fontFamily="var(--font-family-mono)"
                  textAnchor="middle"
                >
                  {pt.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
