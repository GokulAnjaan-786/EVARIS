"use client";

import React, { useMemo } from "react";
import { ActiveFeature } from "../../types/classroom";

interface GraphRendererProps {
  functionLatex: string;
  functionExpr?: string;
  domain?: [number, number];
  rangeY?: [number, number];
  points?: Array<{
    id: string;
    label: string;
    coordinates: [number, number];
    highlight?: boolean;
    details?: string;
  }>;
  activeFeatures?: ActiveFeature[];
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({
  functionLatex,
  functionExpr = "x * x - 4 * x + 3",
  domain = [-1, 5],
  rangeY = [-2, 6],
  points = [],
  activeFeatures = [],
}) => {
  // SVG Canvas Dimensions
  const width = 640;
  const height = 400;
  const padding = 50;

  const [xMin, xMax] = domain && domain.length === 2 ? domain : [-6, 6];
  const [yMin, yMax] = rangeY && rangeY.length === 2 ? rangeY : [-6, 6];

  // Coordinate Conversion Functions
  const toSvgX = useMemo(
    () => (x: number) => padding + ((x - xMin) / (xMax - xMin || 1)) * (width - 2 * padding),
    [xMin, xMax]
  );
  const toSvgY = useMemo(
    () => (y: number) => height - padding - ((y - yMin) / (yMax - yMin || 1)) * (height - 2 * padding),
    [yMin, yMax]
  );

  // Safe Dynamic Function Evaluator
  const evaluateFn = useMemo(() => {
    if (!functionExpr) return (x: number) => x * x - 4 * x + 3;
    try {
      // Normalize operators safely
      let expr = functionExpr
        .replace(/\^/g, "**")
        .replace(/\bsin\b(?!\()/g, "Math.sin")
        .replace(/\bcos\b(?!\()/g, "Math.cos")
        .replace(/\btan\b(?!\()/g, "Math.tan");

      const compiledFn = new Function(
        "x",
        "Math",
        `"use strict";
        try {
          return (${expr});
        } catch (e) {
          return 0;
        }`
      );

      return (x: number) => {
        try {
          const val = compiledFn(x, Math);
          return typeof val === "number" && !isNaN(val) && isFinite(val) ? val : 0;
        } catch {
          return 0;
        }
      };
    } catch (err) {
      console.warn("Failed to compile function expression:", functionExpr, err);
      return (x: number) => x;
    }
  }, [functionExpr]);

  // Sample Curve Points dynamically across active domain
  const curvePath = useMemo(() => {
    const samples = 180;
    const pathSegments: string[] = [];
    const step = (xMax - xMin) / samples;

    for (let i = 0; i <= samples; i++) {
      const x = xMin + i * step;
      const y = evaluateFn(x);
      const sx = toSvgX(x);
      const sy = toSvgY(y);

      if (i === 0) {
        pathSegments.push(`M ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      } else {
        pathSegments.push(`L ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      }
    }
    return pathSegments.join(" ");
  }, [xMin, xMax, evaluateFn, toSvgX, toSvgY]);

  // Clamped Origin Positions for Coordinate Axes
  const rawOriginX = toSvgX(0);
  const rawOriginY = toSvgY(0);
  const originX = Math.max(padding, Math.min(width - padding, rawOriginX));
  const originY = Math.max(padding, Math.min(height - padding, rawOriginY));

  // Dynamic Ticks Calculation
  const xTicks = useMemo(() => {
    const span = xMax - xMin;
    let step = 1;
    if (span > 30) step = 10;
    else if (span > 15) step = 5;
    else if (span > 8) step = 2;
    else if (span <= 3) step = 0.5;

    const ticks: number[] = [];
    const start = Math.ceil(xMin / step) * step;
    for (let val = start; val <= xMax; val += step) {
      if (Math.abs(val) > 0.01) {
        ticks.push(Number(val.toFixed(2)));
      }
    }
    return ticks;
  }, [xMin, xMax]);

  const yTicks = useMemo(() => {
    const span = yMax - yMin;
    let step = 1;
    if (span > 30) step = 10;
    else if (span > 15) step = 5;
    else if (span > 8) step = 2;
    else if (span <= 3) step = 0.5;

    const ticks: number[] = [];
    const start = Math.ceil(yMin / step) * step;
    for (let val = start; val <= yMax; val += step) {
      if (Math.abs(val) > 0.01) {
        ticks.push(Number(val.toFixed(2)));
      }
    }
    return ticks;
  }, [yMin, yMax]);

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

          {/* Plot Area Clip Path to prevent curves bleeding outside padding */}
          <clipPath id="graphPlotClip">
            <rect
              x={padding}
              y={padding}
              width={width - 2 * padding}
              height={height - 2 * padding}
            />
          </clipPath>
        </defs>

        {/* Dynamic Coordinate Grid Lines */}
        {xTicks.map((x) => (
          <line
            key={`grid-x-${x}`}
            x1={toSvgX(x)}
            y1={padding}
            x2={toSvgX(x)}
            y2={height - padding}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeDasharray="3 3"
          />
        ))}
        {yTicks.map((y) => (
          <line
            key={`grid-y-${y}`}
            x1={padding}
            y1={toSvgY(y)}
            x2={width - padding}
            y2={toSvgY(y)}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeDasharray="3 3"
          />
        ))}

        {/* X and Y Coordinate Axes */}
        <line
          x1={padding}
          y1={originY}
          x2={width - padding}
          y2={originY}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
        />
        <line
          x1={originX}
          y1={padding}
          x2={originX}
          y2={height - padding}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
        />

        {/* Axis Arrows */}
        <polygon
          points={`${width - padding + 8},${originY} ${width - padding},${originY - 4} ${width - padding},${originY + 4}`}
          fill="rgba(255, 255, 255, 0.7)"
        />
        <polygon
          points={`${originX},${padding - 8} ${originX - 4},${padding} ${originX + 4},${padding}`}
          fill="rgba(255, 255, 255, 0.7)"
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

        {/* Dynamic Numeric Ticks */}
        {xTicks.map((x) => (
          <text
            key={`tick-x-${x}`}
            x={toSvgX(x)}
            y={Math.min(height - 18, originY + 16)}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-family-mono)"
            textAnchor="middle"
          >
            {x}
          </text>
        ))}
        {yTicks.map((y) => (
          <text
            key={`tick-y-${y}`}
            x={Math.max(16, originX - 10)}
            y={toSvgY(y) + 3}
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="var(--font-family-mono)"
            textAnchor="end"
          >
            {y}
          </text>
        ))}

        {/* Dynamic Continuous Curve Clipped to Graph Area */}
        <path
          clipPath="url(#graphPlotClip)"
          d={curvePath}
          fill="none"
          stroke="url(#curveGradient)"
          strokeWidth="3.5"
          filter="url(#glowFilter)"
          style={{
            transition: "all 0.5s ease",
          }}
        />

        {/* Formula Badge Card in Top Left */}
        {functionLatex && (
          <g transform={`translate(${padding + 8}, ${padding + 16})`}>
            <rect
              x="0"
              y="-16"
              width={Math.max(120, functionLatex.length * 8 + 24)}
              height="24"
              rx="6"
              fill="rgba(13, 19, 34, 0.9)"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth="1"
            />
            <text
              x="10"
              y="0"
              fill="#38bdf8"
              fontSize="11"
              fontWeight="700"
              fontFamily="var(--font-family-mono)"
            >
              {functionLatex}
            </text>
          </g>
        )}

        {/* Highlighted Points of Interest (Vertex, Roots, Intercepts) */}
        {points.map((pt) => {
          const [px, py] = pt.coordinates;
          const sx = toSvgX(px);
          const sy = toSvgY(py);
          const isHighlighted = pt.highlight;

          // Ensure callout badge stays comfortably within SVG view bounds
          const calloutY = sy > 45 ? sy - 22 : sy + 28;
          const calloutX = Math.max(65, Math.min(width - 65, sx));

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
              <g transform={`translate(${calloutX}, ${calloutY})`}>
                <rect
                  x="-62"
                  y="-14"
                  width="124"
                  height="22"
                  rx="6"
                  fill="rgba(10, 14, 23, 0.92)"
                  stroke={isHighlighted ? "#38bdf8" : "rgba(255, 255, 255, 0.2)"}
                  strokeWidth={isHighlighted ? "1.5" : "1"}
                />
                <text
                  x="0"
                  y="1"
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

