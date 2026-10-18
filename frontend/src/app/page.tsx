"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useClassroomSocket } from "../hooks/useClassroomSocket";
import { useAudioCapture } from "../hooks/useAudioCapture";
import { ClassroomHeader } from "../components/classroom/ClassroomHeader";
import { ClassroomControls } from "../components/classroom/ClassroomControls";
import { TeacherVideoPreview } from "../components/classroom/TeacherVideoPreview";
import { LiveTranscriptBar } from "../components/classroom/LiveTranscriptBar";
import { TopicStatusBadge } from "../components/classroom/TopicStatusBadge";
import { VisualStage } from "../components/visual-engine/VisualStage";
import { TelemetryHUD } from "../components/classroom/TelemetryHUD";
import { UniversalSubjectSelector } from "../components/classroom/UniversalSubjectSelector";
import {
  INITIAL_SELECTED_SUBJECTS,
  STANDARD_SUBJECTS,
  SubjectDefinition,
  findSubjectByName,
} from "../lib/subjectsConfig";
import { AlertCircle, X, Check, BookOpen } from "lucide-react";

export default function ClassroomPage() {
  // Universal Multi-Subject Selection State
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(INITIAL_SELECTED_SUBJECTS);
  const [primarySubject, setPrimarySubject] = useState<string>("Mathematics");
  const [customSubjects, setCustomSubjects] = useState<SubjectDefinition[]>([]);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState<boolean>(false);
  const [unsupportedAlertSubject, setUnsupportedAlertSubject] = useState<string | null>(null);

  // Hardware Audio Capture Hook
  const audioCapture = useAudioCapture();

  // Real-Time Classroom WebSocket & State Hook
  const {
    connectionStatus,
    teachingStatus,
    sessionMode,
    transcript,
    fullTranscriptHistory,
    activeVisual,
    telemetry,
    activeSubject,
    isVisualFrozen,
    isLiveAudioActive,
    diagnosticTrace,
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
  } = useClassroomSocket("session_evaris_demo");

  // Determine if active primary subject has an associated sample lesson
  const currentSubjectDef = useMemo(() => {
    return findSubjectByName(primarySubject, customSubjects);
  }, [primarySubject, customSubjects]);

  const hasDemoLesson = Boolean(currentSubjectDef?.demoLesson);

  const handleSelectPrimarySubject = useCallback(
    (name: string) => {
      setPrimarySubject(name);
      setLiveSubject(name);
    },
    [setLiveSubject]
  );

  // Subject Selection Handlers
  const handleToggleSubject = useCallback(
    (name: string) => {
      setSelectedSubjects((prev) => {
        if (prev.includes(name)) {
          const next = prev.filter((s) => s !== name);
          // If the currently active subject was removed, switch to another selected subject if available
          if (primarySubject === name && next.length > 0) {
            handleSelectPrimarySubject(next[0]);
          }
          return next;
        } else {
          return [...prev, name];
        }
      });
    },
    [primarySubject, handleSelectPrimarySubject]
  );

  const handleSelectAll = useCallback(() => {
    const allNames = [...STANDARD_SUBJECTS.map((s) => s.name), ...customSubjects.map((s) => s.name)];
    setSelectedSubjects(allNames);
  }, [customSubjects]);

  const handleClearAll = useCallback(() => {
    setSelectedSubjects([]);
  }, []);

  const handleResetDefaults = useCallback(() => {
    setSelectedSubjects(INITIAL_SELECTED_SUBJECTS);
    handleSelectPrimarySubject("Mathematics");
  }, [handleSelectPrimarySubject]);

  const handleAddCustomSubject = useCallback(
    (name: string): boolean => {
      const normalized = name.trim().toLowerCase();
      const allNames = [
        ...STANDARD_SUBJECTS.map((s) => s.name.toLowerCase()),
        ...customSubjects.map((s) => s.name.toLowerCase()),
      ];

      if (allNames.includes(normalized)) {
        return false;
      }

      const newSubject: SubjectDefinition = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        category: "Custom",
        topics: ["General Core Concepts", "Advanced Analysis"],
        demoLesson: undefined,
        isCustom: true,
      };

      setCustomSubjects((prev) => [...prev, newSubject]);
      setSelectedSubjects((prev) => [...prev, newSubject.name]);
      handleSelectPrimarySubject(newSubject.name);
      return true;
    },
    [customSubjects, handleSelectPrimarySubject]
  );

  const handleRemoveCustomSubject = useCallback(
    (name: string) => {
      setCustomSubjects((prev) => prev.filter((s) => s.name.toLowerCase() !== name.toLowerCase()));
      setSelectedSubjects((prev) => prev.filter((s) => s.toLowerCase() !== name.toLowerCase()));
      if (primarySubject.toLowerCase() === name.toLowerCase()) {
        handleSelectPrimarySubject("Mathematics");
      }
    },
    [primarySubject, handleSelectPrimarySubject]
  );

  // Real Hardware Audio Handlers
  const handleStartLiveSession = useCallback(async () => {
    // 1. Notify backend to enter LIVE mode
    startLiveAudio(primarySubject);

    // 2. Start hardware microphone capture & stream binary PCM to WebSocket
    const started = await audioCapture.startCapture((pcmBuffer) => {
      sendLiveAudioChunk(pcmBuffer);
    });

    if (!started) {
      console.warn("Hardware audio capture failed to start.");
      stopLiveAudio();
    }
  }, [primarySubject, startLiveAudio, audioCapture, sendLiveAudioChunk, stopLiveAudio]);

  const handleStopLiveSession = useCallback(() => {
    audioCapture.stopCapture();
    stopLiveAudio();
  }, [audioCapture, stopLiveAudio]);

  const handleStartSampleLesson = useCallback(
    (lessonId: string) => {
      audioCapture.stopCapture();
      startSampleLesson(lessonId);
    },
    [audioCapture, startSampleLesson]
  );

  const handleResetLesson = useCallback(() => {
    audioCapture.stopCapture();
    resetLesson();
  }, [audioCapture, resetLesson]);

  // When teacher selects a demo subject from the empty state
  const handleSelectSupportedDemo = useCallback(
    (subjectName: string) => {
      audioCapture.stopCapture();
      handleSelectPrimarySubject(subjectName);
      if (!selectedSubjects.includes(subjectName)) {
        setSelectedSubjects((prev) => [...prev, subjectName]);
      }
      const def = findSubjectByName(subjectName, customSubjects);
      if (def?.demoLesson) {
        startSampleLesson(def.demoLesson.lessonId);
      }
    },
    [audioCapture, selectedSubjects, customSubjects, handleSelectPrimarySubject, startSampleLesson]
  );

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--bg-app)",
      }}
    >
      {/* 1. Top Application Header */}
      <ClassroomHeader
        connectionStatus={connectionStatus}
        teachingStatus={teachingStatus}
        primarySubject={primarySubject}
        totalSelectedSubjects={selectedSubjects.length}
        sessionId="session_evaris_demo"
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
      />

      {/* 2. Main Content Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          padding: "16px 24px 20px 24px",
          maxWidth: "1680px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Lesson Configuration & Control Toolbar */}
        <ClassroomControls
          teachingStatus={teachingStatus}
          isVisualFrozen={isVisualFrozen}
          isLiveAudioActive={audioCapture.isCapturing || isLiveAudioActive}
          onStartLiveAudio={handleStartLiveSession}
          onStopLiveAudio={handleStopLiveSession}
          onStartLesson={handleStartSampleLesson}
          onPause={pauseTeaching}
          onResume={resumeTeaching}
          onToggleFreeze={toggleFreezeVisual}
          onReset={handleResetLesson}
          onManualStep={manualStep}
          selectedSubjects={selectedSubjects}
          primarySubject={primarySubject}
          onSelectPrimarySubject={handleSelectPrimarySubject}
          customSubjects={customSubjects}
          onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
          activeLessonId={currentSubjectDef?.demoLesson?.lessonId || null}
          onShowUnsupportedMessage={(sub) => setUnsupportedAlertSubject(sub)}
        />

        {/* Transparent Microphone Permission / Hardware Error Banner */}
        {audioCapture.permissionError && (
          <div
            id="microphone-error-banner"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "var(--radius-lg)",
              color: "#991b1b",
              fontSize: "0.82rem",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={16} color="#dc2626" />
              <span><strong>Microphone Hardware Warning:</strong> {audioCapture.permissionError}</span>
            </div>
            <button
              onClick={handleStartLiveSession}
              className="btn btn-secondary"
              style={{ padding: "4px 10px", fontSize: "0.75rem", borderColor: "#fca5a5" }}
            >
              Retry Microphone
            </button>
          </div>
        )}

        {/* Concept / Lineage Status Indicator */}
        <TopicStatusBadge
          activeVisual={activeVisual}
          activeSubject={activeSubject || primarySubject}
        />

        {/* Mandatory Split Layout: Teacher Left (1/3), Dark Visual Stage Right (2/3) */}
        <div
          id="classroom-split-workspace"
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "360px 1fr",
            gap: "16px",
            minHeight: "540px",
          }}
        >
          {/* Left Column: Teacher Video + Live Transcript Panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <TeacherVideoPreview
              isMicActive={audioCapture.isCapturing}
              audioLevel={audioCapture.audioLevel}
              framesSent={audioCapture.framesSent}
              permissionError={audioCapture.permissionError}
              onToggleLiveSession={audioCapture.isCapturing ? handleStopLiveSession : handleStartLiveSession}
            />

            <div style={{ flex: 1, minHeight: "260px" }}>
              <LiveTranscriptBar
                transcript={transcript}
                history={fullTranscriptHistory}
                isMicActive={audioCapture.isCapturing || isLiveAudioActive}
                isTeaching={teachingStatus === "TEACHING"}
              />
            </div>
          </div>

          {/* Right Column: Universal Automatic Visual Stage (Large Dark Canvas) */}
          <div style={{ display: "flex", flexDirection: "column", minHeight: "520px" }}>
            <VisualStage
              activeVisual={activeVisual}
              isVisualFrozen={isVisualFrozen}
              activeSubject={primarySubject}
              hasDemoLesson={hasDemoLesson}
              sessionMode={sessionMode}
              isLiveAudioActive={audioCapture.isCapturing || isLiveAudioActive}
              onSelectSupportedDemo={handleSelectSupportedDemo}
            />
          </div>
        </div>

        {/* 3. Compact Diagnostic Telemetry HUD with 7-Stage End-to-End Trace */}
        <TelemetryHUD
          telemetry={telemetry}
          diagnosticTrace={diagnosticTrace}
          sessionMode={sessionMode}
          micPermission={audioCapture.permissionStatus}
          isHardwareCapturing={audioCapture.isCapturing}
          processorType={audioCapture.processorType}
          framesSent={audioCapture.framesSent}
          audioLevel={audioCapture.audioLevel}
          permissionError={audioCapture.permissionError}
        />
      </div>

      {/* Universal Multi-Subject Selection Dialog */}
      <UniversalSubjectSelector
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        selectedSubjects={selectedSubjects}
        onToggleSubject={handleToggleSubject}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
        onResetDefaults={handleResetDefaults}
        customSubjects={customSubjects}
        onAddCustomSubject={handleAddCustomSubject}
        onRemoveCustomSubject={handleRemoveCustomSubject}
        primarySubject={primarySubject}
        onSetPrimarySubject={(sub) => {
          setPrimarySubject(sub);
          setIsSubjectModalOpen(false);
        }}
      />

      {/* Honest Unsupported Subject Notification Modal */}
      {unsupportedAlertSubject && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 120,
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setUnsupportedAlertSubject(null);
          }}
        >
          <div
            className="card-light"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "24px",
              boxShadow: "var(--shadow-lg)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "var(--status-warning-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={20} color="var(--status-warning)" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Sample Lesson Not Configured
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Subject: <strong>{unsupportedAlertSubject}</strong>
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "18px" }}>
              A scripted sample lesson has not yet been pre-configured for <strong>{unsupportedAlertSubject}</strong>.
              In a live classroom, EVARIS listens to your microphone explanation and generates visual structures dynamically.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => {
                  setUnsupportedAlertSubject(null);
                  handleSelectSupportedDemo("Mathematics");
                }}
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem" }}
              >
                Try Math Demo
              </button>
              <button
                onClick={() => setUnsupportedAlertSubject(null)}
                className="btn btn-primary"
                style={{ fontSize: "0.8rem" }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
