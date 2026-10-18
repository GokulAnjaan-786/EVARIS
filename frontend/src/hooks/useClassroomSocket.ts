"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  VisualPayload,
  TranscriptEvent,
  TelemetryReport,
  ConnectionStatus,
  TeachingStatus,
  DiagnosticEvent,
} from "../types/classroom";
import { mergeTranscriptSegments, splitIntoSentences } from "../lib/transcriptAggregator";

export function useClassroomSocket(sessionId: string = "session_evaris_demo") {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("CONNECTING");
  const [teachingStatus, setTeachingStatus] = useState<TeachingStatus>("IDLE");
  const [transcript, setTranscript] = useState<TranscriptEvent | null>(null);
  const [continuousTranscript, setContinuousTranscript] = useState<string>("");
  const [fullTranscriptHistory, setFullTranscriptHistory] = useState<string[]>([]);
  const [rawTranscriptHistory, setRawTranscriptHistory] = useState<string[]>([]);
  const [activeVisual, setActiveVisual] = useState<VisualPayload | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryReport | null>(null);
  const [activeSubject, setActiveSubject] = useState<string>("Mathematics");
  const [isVisualFrozen, setIsVisualFrozen] = useState<boolean>(false);
  const [isLiveAudioActive, setIsLiveAudioActive] = useState<boolean>(false);
  const [sessionMode, setSessionMode] = useState<"LIVE" | "SIMULATED" | "STANDBY">("STANDBY");
  const [diagnosticTrace, setDiagnosticTrace] = useState<Record<string, DiagnosticEvent>>({});
  const [recentDiagnostics, setRecentDiagnostics] = useState<DiagnosticEvent[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const wsUrl = `ws://127.0.0.1:8000/ws/classroom/${sessionId}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("CONNECTED");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event_type, payload } = message;

          if (event_type === "CONNECTION_ESTABLISHED") {
            setConnectionStatus("CONNECTED");
          } else if (event_type === "TRANSCRIPT_UPDATE") {
            setTranscript(payload);
            if (payload.subject) {
              setActiveSubject(payload.subject);
            }
            if (payload.is_final && payload.sentence) {
              // 1. Preserve original unmerged chunk for debugging/truthful diagnostics
              setRawTranscriptHistory((prev) => [...prev, payload.sentence]);

              // 2. Aggregate into continuous transcript with overlap deduplication
              setContinuousTranscript((prevContinuous) => {
                const merged = mergeTranscriptSegments(prevContinuous, payload.sentence);
                // Also update fullTranscriptHistory as readable sentence array
                const sentences = splitIntoSentences(merged);
                setFullTranscriptHistory(sentences);
                return merged;
              });
            }
          } else if (event_type === "VISUAL_PAYLOAD") {
            const startRenderTime = performance.now();
            setActiveVisual(payload);
            
            // Confirm frontend DOM render back to server for Stage 7 telemetry
            const renderDuration = Math.round((performance.now() - startRenderTime) * 10) / 10;
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  command: "VISUAL_RENDERED",
                  payload: {
                    trace_id: payload.trace_id,
                    visual_id: payload.visual_id,
                    render_duration_ms: Math.max(1.0, renderDuration),
                  },
                })
              );
            }
          } else if (event_type === "DIAGNOSTIC_EVENT") {
            const diag = payload as DiagnosticEvent;
            setRecentDiagnostics((prev) => [diag, ...prev.slice(0, 19)]);
            if (diag.stage) {
              setDiagnosticTrace((prev) => ({
                ...prev,
                [diag.stage]: diag,
              }));
            }
          } else if (event_type === "TELEMETRY_REPORT") {
            setTelemetry(payload);
          } else if (event_type === "STATUS_CHANGE") {
            if (payload.status) {
              setTeachingStatus(payload.status as TeachingStatus);
            }
            if (payload.subject) {
              setActiveSubject(payload.subject);
            }
            if (typeof payload.visual_frozen === "boolean") {
              setIsVisualFrozen(payload.visual_frozen);
            }
            if (payload.status === "LISTENING") {
              setIsLiveAudioActive(true);
              setSessionMode("LIVE");
            } else if (payload.status === "TEACHING") {
              setSessionMode("SIMULATED");
            } else if (payload.status === "IDLE" || payload.status === "RESET") {
              setIsLiveAudioActive(false);
              setSessionMode("STANDBY");
            }
          }
        } catch (e) {
          console.error("Failed to parse websocket message:", e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus("DISCONNECTED");
        // Reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = () => {
        setConnectionStatus("ERROR");
      };
    } catch (e) {
      setConnectionStatus("ERROR");
    }
  }, [sessionId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendCommand = useCallback((command: string, payload: Record<string, any> = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ command, payload }));
    }
  }, []);

  // Live Audio Streaming
  const startLiveAudio = useCallback(
    (subject: string) => {
      setIsLiveAudioActive(true);
      setSessionMode("LIVE");
      setActiveVisual(null);
      setContinuousTranscript("");
      setFullTranscriptHistory([]);
      setRawTranscriptHistory([]);
      setTranscript(null);
      setDiagnosticTrace({});
      sendCommand("START_LIVE_AUDIO", { subject });
    },
    [sendCommand]
  );

  const sendLiveAudioChunk = useCallback((pcmInt16Buffer: ArrayBuffer) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(pcmInt16Buffer);
    }
  }, []);

  const stopLiveAudio = useCallback(() => {
    setIsLiveAudioActive(false);
    setSessionMode("STANDBY");
    sendCommand("STOP_LIVE_AUDIO");
  }, [sendCommand]);

  const setLiveSubject = useCallback(
    (subject: string) => {
      setActiveSubject(subject);
      sendCommand("SET_LIVE_SUBJECT", { subject });
    },
    [sendCommand]
  );

  const startSampleLesson = useCallback(
    (lessonId: string) => {
      setIsLiveAudioActive(false);
      setSessionMode("SIMULATED");
      setContinuousTranscript("");
      setFullTranscriptHistory([]);
      setRawTranscriptHistory([]);
      setTranscript(null);
      setDiagnosticTrace({});
      sendCommand("START_SAMPLE_LESSON", { lesson_id: lessonId });
    },
    [sendCommand]
  );

  const pauseTeaching = useCallback(() => {
    sendCommand("PAUSE");
  }, [sendCommand]);

  const resumeTeaching = useCallback(() => {
    sendCommand("RESUME");
  }, [sendCommand]);

  const toggleFreezeVisual = useCallback(
    (freeze: boolean) => {
      setIsVisualFrozen(freeze);
      sendCommand("FREEZE_VISUAL", { frozen: freeze });
    },
    [sendCommand]
  );

  const resetLesson = useCallback(() => {
    setIsLiveAudioActive(false);
    setSessionMode("STANDBY");
    setContinuousTranscript("");
    setFullTranscriptHistory([]);
    setRawTranscriptHistory([]);
    setTranscript(null);
    setActiveVisual(null);
    setTelemetry(null);
    setDiagnosticTrace({});
    setRecentDiagnostics([]);
    sendCommand("RESET");
  }, [sendCommand]);

  const manualStep = useCallback(
    (lessonId: string, stepIndex: number) => {
      sendCommand("MANUAL_STEP", { lesson_id: lessonId, step_index: stepIndex });
    },
    [sendCommand]
  );

  return {
    connectionStatus,
    teachingStatus,
    sessionMode,
    transcript,
    continuousTranscript,
    fullTranscriptHistory,
    rawTranscriptHistory,
    activeVisual,
    telemetry,
    activeSubject,
    isVisualFrozen,
    isLiveAudioActive,
    diagnosticTrace,
    recentDiagnostics,
    startLiveAudio,
    sendLiveAudioChunk,
    stopLiveAudio,
    setLiveSubject,
    startSampleLesson,
    pauseTeaching,
    resumeTeaching,
    toggleFreezeVisual,
    resetLesson,
    manualStep,
  };
}
