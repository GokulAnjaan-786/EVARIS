"use client";

import React from "react";
import { ActiveFeature } from "../../types/classroom";
import { Calendar } from "lucide-react";

interface TimelineEvent {
  id: string;
  period: string;
  title: string;
  description: string;
  highlight?: boolean;
}

interface TimelineRendererProps {
  events: TimelineEvent[];
  activeEventId?: string;
  activeFeatures: ActiveFeature[];
}

export const TimelineRenderer: React.FC<TimelineRendererProps> = ({
  events = [],
  activeEventId,
  activeFeatures,
}) => {
  return (
    <div
      id="timeline-visual-container"
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
          gap: "18px",
          width: "100%",
          maxWidth: "560px",
          position: "relative",
        }}
      >
        {/* Vertical Center Track Line */}
        <div
          style={{
            position: "absolute",
            left: "24px",
            top: "10px",
            bottom: "10px",
            width: "2px",
            background: "rgba(255, 255, 255, 0.12)",
          }}
        />

        {events.map((ev) => {
          const isHighlighted =
            ev.id === activeEventId ||
            ev.highlight ||
            activeFeatures.some((f) => f.id === ev.id && f.highlight);

          return (
            <div
              key={ev.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "20px",
                position: "relative",
              }}
            >
              {/* Timeline Node Point */}
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: isHighlighted ? "#38bdf8" : "var(--bg-secondary)",
                  border: isHighlighted
                    ? "3px solid #ffffff"
                    : "2px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: isHighlighted ? "0 0 15px #38bdf8" : "none",
                  marginLeft: "18px",
                  marginTop: "6px",
                  zIndex: 2,
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                }}
              />

              {/* Event Content Card */}
              <div
                style={{
                  flex: 1,
                  background: isHighlighted
                    ? "rgba(99, 102, 241, 0.18)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: isHighlighted
                    ? "1px solid #818cf8"
                    : "1px solid var(--border-subtle)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  boxShadow: isHighlighted
                    ? "0 0 20px rgba(99, 102, 241, 0.25)"
                    : "none",
                  transition: "all 0.3s ease",
                  transform: isHighlighted ? "scale(1.02)" : "scale(1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: isHighlighted ? "#ffffff" : "var(--text-primary)",
                    }}
                  >
                    {ev.title}
                  </span>
                  <span
                    className="pill pill-cyan"
                    style={{ fontSize: "0.65rem", padding: "2px 8px" }}
                  >
                    {ev.period}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    lineHeight: "1.5",
                  }}
                >
                  {ev.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
