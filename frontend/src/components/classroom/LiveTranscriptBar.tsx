"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { TranscriptEvent } from "../../types/classroom";
import { groupIntoParagraphs } from "../../lib/transcriptAggregator";
import { MessageSquareText, Radio, Volume2, ChevronDown, ChevronUp, Terminal } from "lucide-react";

interface LiveTranscriptBarProps {
  transcript: TranscriptEvent | null;
  history: string[];
  continuousText?: string;
  rawHistory?: string[];
  isMicActive: boolean;
  isTeaching: boolean;
}

export const LiveTranscriptBar: React.FC<LiveTranscriptBarProps> = ({
  transcript,
  history,
  continuousText = "",
  rawHistory = [],
  isMicActive,
  isTeaching,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [showRawDiagnostics, setShowRawDiagnostics] = useState(false);

  // Group continuous text into readable paragraphs of ~2-3 sentences each
  const paragraphs = useMemo(() => {
    const sourceText = continuousText.trim() || history.join(" ").trim();
    if (!sourceText) return [];
    return groupIntoParagraphs(sourceText, 2);
  }, [continuousText, history]);

  // Handle auto-scroll only if user has not scrolled up to read history
  useEffect(() => {
    if (!userScrolledUp && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, continuousText, history, userScrolledUp]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If within 40px of bottom, consider user at bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setUserScrolledUp(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      setUserScrolledUp(false);
    }
  };

  const isListening = isMicActive || isTeaching;
  const hasContent = paragraphs.length > 0 || (transcript && Boolean(transcript.sentence));

  return (
    <div
      id="live-transcript-panel"
      className="card-light"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-surface)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <MessageSquareText size={15} color="var(--brand-blue)" />
          <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap" }}>
            Live Spoken Transcript
          </h3>
        </div>

        {/* Listening / Stream State Badge & Raw Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {rawHistory.length > 0 && (
            <button
              onClick={() => setShowRawDiagnostics((prev) => !prev)}
              className="btn btn-secondary"
              title="Toggle raw speech-recognition chunks for debugging"
              style={{
                padding: "2px 6px",
                fontSize: "0.68rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                height: "22px",
              }}
            >
              <Terminal size={11} />
              <span>Chunks ({rawHistory.length})</span>
              {showRawDiagnostics ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}

          {isTeaching && (
            <span
              className="badge badge-cyan"
              style={{ fontSize: "0.68rem", padding: "2px 8px" }}
            >
              Demo Stream
            </span>
          )}

          <div
            className={`badge ${
              isListening ? "badge-emerald" : "badge-slate"
            }`}
            style={{ fontSize: "0.68rem", padding: "2px 8px" }}
          >
            <div
              className="status-indicator-dot"
              style={{ animation: isListening ? "pulse-ring 2s infinite" : "none" }}
            />
            <span>{isListening ? "Listening" : "Standby"}</span>
          </div>
        </div>
      </div>

      {/* Raw Diagnostic Drawer (truthful recognition inspection) */}
      {showRawDiagnostics && (
        <div
          style={{
            maxHeight: "120px",
            overflowY: "auto",
            backgroundColor: "#0f172a",
            color: "#94a3b8",
            padding: "8px 12px",
            fontSize: "0.72rem",
            fontFamily: "var(--font-mono)",
            borderBottom: "1px solid var(--border-color)",
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 600, color: "#38bdf8", marginBottom: "4px" }}>
            Raw Whisper Speech Chunks ({rawHistory.length}):
          </div>
          {rawHistory.map((chunk, i) => (
            <div key={i} style={{ marginBottom: "2px", lineHeight: "1.4" }}>
              <span style={{ color: "#64748b" }}>[{i + 1}]</span> {chunk}
            </div>
          ))}
        </div>
      )}

      {/* Continuous Transcript Text Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          minHeight: 0,
          padding: "14px 18px",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          fontSize: "0.92rem",
          lineHeight: "1.68",
          color: "var(--text-primary)",
        }}
      >
        {!hasContent && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: "140px",
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "20px",
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

        {/* Continuous Flowing Paragraphs — No Numbered Points */}
        {paragraphs.map((paragraph, pIdx) => (
          <p
            key={pIdx}
            style={{
              margin: 0,
              color: "var(--text-secondary)",
              letterSpacing: "0.005em",
            }}
          >
            {paragraph}
          </p>
        ))}

        {/* Active In-Progress Sentence (Live Streaming Tokens) */}
        {transcript && !transcript.is_final && transcript.sentence && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--brand-blue-light)",
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid #bfdbfe",
              alignSelf: "flex-start",
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "var(--brand-blue)",
                fontFamily: "var(--font-mono)",
                flexShrink: 0,
                backgroundColor: "#dbeafe",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              LIVE
            </span>
            <span style={{ color: "var(--brand-blue)", fontWeight: 500, fontSize: "0.88rem" }}>
              {transcript.sentence}
            </span>
            <span
              style={{
                display: "inline-block",
                width: "2px",
                height: "14px",
                backgroundColor: "var(--brand-blue)",
                flexShrink: 0,
                animation: "pulse-ring 0.8s infinite",
              }}
            />
          </div>
        )}
      </div>

      {/* Floating Jump to Latest Button when User Scrolls Up */}
      {userScrolledUp && (
        <button
          onClick={scrollToBottom}
          className="btn btn-secondary"
          style={{
            position: "absolute",
            bottom: transcript?.concept ? "44px" : "12px",
            right: "14px",
            padding: "4px 10px",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "var(--brand-blue)",
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-color-strong)",
            boxShadow: "var(--shadow-md)",
            zIndex: 10,
          }}
        >
          ↓ Jump to latest
        </button>
      )}

      {/* Transcript Footer Concept Tag */}
      {transcript?.concept && (
        <div
          style={{
            padding: "7px 16px",
            backgroundColor: "var(--bg-app)",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            flexShrink: 0,
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
