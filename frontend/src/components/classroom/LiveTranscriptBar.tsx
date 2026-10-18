"use client";

import React, { useEffect, useRef, useState } from "react";
import { TranscriptEvent } from "../../types/classroom";
import { MessageSquareText, Radio, Volume2 } from "lucide-react";

interface LiveTranscriptBarProps {
  transcript: TranscriptEvent | null;
  history: string[];
  isMicActive: boolean;
  isTeaching: boolean;
}

export const LiveTranscriptBar: React.FC<LiveTranscriptBarProps> = ({
  transcript,
  history,
  isMicActive,
  isTeaching,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Handle auto-scroll only if user hasn't scrolled up to read history
  useEffect(() => {
    if (!userScrolledUp && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, history, userScrolledUp]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If within 40px of bottom, consider user at bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setUserScrolledUp(!isAtBottom);
  };

  const isListening = isMicActive || isTeaching;

  return (
    <div
      id="live-transcript-panel"
      className="card-light"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "260px",
        overflow: "hidden",
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquareText size={16} color="var(--brand-blue)" />
          <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Live Spoken Transcript
          </h3>
        </div>

        {/* Listening / Stream State Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isTeaching && (
            <span
              className="badge badge-cyan"
              style={{ fontSize: "0.68rem" }}
            >
              Demo Stream
            </span>
          )}

          <div
            className={`badge ${
              isListening ? "badge-emerald" : "badge-slate"
            }`}
            style={{ fontSize: "0.68rem" }}
          >
            <div
              className="status-indicator-dot"
              style={{ animation: isListening ? "pulse-ring 2s infinite" : "none" }}
            />
            <span>{isListening ? "Listening" : "Standby"}</span>
          </div>
        </div>
      </div>

      {/* Transcript Text Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          padding: "16px 18px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          fontSize: "0.92rem",
          lineHeight: "1.65",
          color: "var(--text-primary)",
        }}
      >
        {history.length === 0 && !transcript && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "24px",
            }}
          >
            <p style={{ fontSize: "0.85rem", fontStyle: "italic", marginBottom: "4px" }}>
              Spoken explanations will appear here in real time as the lesson begins.
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Start a lesson or enable your microphone to begin visual teaching.
            </p>
          </div>
        )}

        {/* Completed Sentences */}
        {history.map((sentence, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              paddingBottom: "8px",
              borderBottom: "1px dashed var(--border-color-subtle)",
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                marginTop: "3px",
                flexShrink: 0,
              }}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              {sentence}
            </p>
          </div>
        ))}

        {/* Active In-Progress Sentence (Live Tokens) */}
        {transcript && !transcript.is_final && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              backgroundColor: "var(--brand-blue-light)",
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid #bfdbfe",
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "var(--brand-blue)",
                fontFamily: "var(--font-mono)",
                marginTop: "3px",
                flexShrink: 0,
              }}
            >
              LIVE
            </span>
            <p style={{ margin: 0, color: "var(--brand-blue)", fontWeight: 500 }}>
              {transcript.sentence}
              <span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "14px",
                  backgroundColor: "var(--brand-blue)",
                  marginLeft: "4px",
                  verticalAlign: "middle",
                  animation: "pulse-ring 0.8s infinite",
                }}
              />
            </p>
          </div>
        )}
      </div>

      {/* Transcript Footer Concept Tag */}
      {transcript?.concept && (
        <div
          style={{
            padding: "8px 18px",
            backgroundColor: "var(--bg-app)",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>Active Concept:</span>
          <span style={{ fontWeight: 600, color: "var(--brand-blue)" }}>
            {transcript.concept}
          </span>
        </div>
      )}
    </div>
  );
};
