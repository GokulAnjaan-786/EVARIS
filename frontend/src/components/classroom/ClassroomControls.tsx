"use client";

import React, { useState, useMemo } from "react";
import { TeachingStatus } from "../../types/classroom";
import {
  SubjectDefinition,
  findSubjectByName,
} from "../../lib/subjectsConfig";
import {
  Play,
  Pause,
  RotateCcw,
  Snowflake,
  ChevronRight,
  BookOpen,
  SlidersHorizontal,
  Plus,
  GraduationCap,
  Layers,
  AlertCircle,
} from "lucide-react";

interface ClassroomControlsProps {
  teachingStatus: TeachingStatus;
  isVisualFrozen: boolean;
  isLiveAudioActive: boolean;
  onStartLiveAudio: () => void;
  onStopLiveAudio: () => void;
  onStartLesson: (lessonId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onToggleFreeze: (frozen: boolean) => void;
  onReset: () => void;
  onManualStep: (lessonId: string, stepIndex: number) => void;
  selectedSubjects: string[];
  primarySubject: string;
  onSelectPrimarySubject: (name: string) => void;
  customSubjects: SubjectDefinition[];
  onOpenSubjectModal: () => void;
  activeLessonId: string | null;
  onShowUnsupportedMessage: (subjectName: string) => void;
}

export const ClassroomControls: React.FC<ClassroomControlsProps> = ({
  teachingStatus,
  isVisualFrozen,
  isLiveAudioActive,
  onStartLiveAudio,
  onStopLiveAudio,
  onStartLesson,
  onPause,
  onResume,
  onToggleFreeze,
  onReset,
  onManualStep,
  selectedSubjects,
  primarySubject,
  onSelectPrimarySubject,
  customSubjects,
  onOpenSubjectModal,
  activeLessonId,
  onShowUnsupportedMessage,
}) => {
  const [selectedGrade, setSelectedGrade] = useState("Grade 10–12");
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Get active subject definition
  const activeSubjectDef = useMemo(() => {
    return findSubjectByName(primarySubject, customSubjects);
  }, [primarySubject, customSubjects]);

  const hasDemo = Boolean(activeSubjectDef?.demoLesson);

  const handleStartOrToggleDemo = () => {
    if (teachingStatus === "TEACHING") {
      onPause();
    } else if (teachingStatus === "PAUSED") {
      onResume();
    } else {
      if (activeSubjectDef?.demoLesson) {
        onStartLesson(activeSubjectDef.demoLesson.lessonId);
      } else {
        onShowUnsupportedMessage(primarySubject);
      }
    }
  };

  const handleManualNext = () => {
    if (activeSubjectDef?.demoLesson) {
      const maxSteps = activeSubjectDef.demoLesson.totalSteps;
      const nextIdx = (currentStepIdx + 1) % maxSteps;
      setCurrentStepIdx(nextIdx);
      onManualStep(activeSubjectDef.demoLesson.lessonId, nextIdx);
    }
  };

  return (
    <div
      id="classroom-master-controls"
      className="card-light"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      {/* Left Configuration Group */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {/* 1. Subject Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            htmlFor="select-primary-subject"
            style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <BookOpen size={13} color="var(--brand-blue)" />
            Subject:
          </label>
          <select
            id="select-primary-subject"
            value={primarySubject}
            onChange={(e) => {
              if (e.target.value === "__MANAGE__") {
                onOpenSubjectModal();
              } else {
                onSelectPrimarySubject(e.target.value);
                setCurrentStepIdx(0);
              }
            }}
            style={{
              padding: "6px 12px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color-strong)",
              borderRadius: "var(--radius-md)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {selectedSubjects.map((subName) => (
              <option key={subName} value={subName}>
                {subName}
              </option>
            ))}
            <option value="__MANAGE__">+ Manage Universal Subjects ({selectedSubjects.length} selected)...</option>
          </select>
        </div>

        {/* 2. Grade Level Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            htmlFor="select-grade-level"
            style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <GraduationCap size={13} color="var(--brand-violet)" />
            Level:
          </label>
          <select
            id="select-grade-level"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            style={{
              padding: "6px 12px",
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="Middle School">Middle School (Grades 6–8)</option>
            <option value="Secondary">Secondary (Grades 9–10)</option>
            <option value="Grade 10–12">Higher Secondary (Grades 11–12)</option>
            <option value="Undergraduate">Undergraduate / College</option>
            <option value="All Levels">All Levels</option>
          </select>
        </div>

        {/* 3. Mode Status Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Layers size={13} color="var(--brand-cyan)" />
            Active Mode:
          </span>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: isLiveAudioActive ? "#16a34a" : (teachingStatus === "TEACHING" ? "#d97706" : "var(--text-muted)"),
              padding: "4px 10px",
              backgroundColor: isLiveAudioActive ? "#dcfce7" : (teachingStatus === "TEACHING" ? "#fef3c7" : "var(--bg-surface-secondary)"),
              border: isLiveAudioActive ? "1px solid #86efac" : (teachingStatus === "TEACHING" ? "1px solid #fde68a" : "1px solid var(--border-color)"),
              borderRadius: "var(--radius-md)",
            }}
          >
            {isLiveAudioActive ? "🔴 LIVE TEACHING (Real Microphone)" : (teachingStatus === "TEACHING" ? "⚡ SIMULATED DEMO (Sample Lesson)" : "STANDBY (Select Mode)")}
          </span>
        </div>

        {/* Manage / Add Subject Button */}
        <button
          onClick={onOpenSubjectModal}
          className="btn btn-secondary"
          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
          title="Open Universal Subject Selection to add or toggle subjects"
        >
          <SlidersHorizontal size={13} />
          <span>Subjects ({selectedSubjects.length})</span>
        </button>
      </div>

      {/* Right Primary Action Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {/* PRIMARY ACTION: Live Teaching Session Button */}
        <button
          id="btn-live-session"
          onClick={isLiveAudioActive ? onStopLiveAudio : onStartLiveAudio}
          className="btn"
          style={{
            backgroundColor: isLiveAudioActive ? "#ef4444" : "var(--brand-blue)",
            color: "#ffffff",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "7px",
            boxShadow: isLiveAudioActive ? "0 0 12px rgba(239, 68, 68, 0.4)" : "var(--shadow-sm)",
          }}
          title={isLiveAudioActive ? "Stop Live Microphone Teaching Session" : "Start Live Teaching: Generates visual models directly from spoken microphone audio"}
        >
          {isLiveAudioActive ? (
            <>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ffffff" }} />
              <span>Stop Live Session</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Start Live Session</span>
            </>
          )}
        </button>

        {/* SECONDARY ACTION: Simulated Demo Button */}
        <button
          id="btn-play-demo-lesson"
          onClick={handleStartOrToggleDemo}
          className="btn btn-secondary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8rem",
            backgroundColor: "#fffbeb",
            borderColor: "#fde68a",
            color: "#b45309",
          }}
          title={hasDemo ? "Run scripted sample lesson simulation (Demo Mode)" : "No sample lesson configured for this subject"}
        >
          {teachingStatus === "TEACHING" ? (
            <>
              <Pause size={13} />
              <span>Pause Demo</span>
            </>
          ) : (
            <>
              <BookOpen size={13} />
              <span>{teachingStatus === "PAUSED" ? "Resume Demo" : "Simulated Demo"}</span>
            </>
          )}
        </button>

        {/* Freeze Visual Toggle */}
        <button
          id="btn-freeze-visual"
          onClick={() => onToggleFreeze(!isVisualFrozen)}
          className={`btn ${isVisualFrozen ? "btn-freeze-active" : "btn-secondary"}`}
          title="Freeze the current visual display to prevent updates while continuing explanation"
        >
          <Snowflake size={14} />
          <span>{isVisualFrozen ? "Visual Frozen" : "Freeze"}</span>
        </button>

        {/* Step Forward (Manual Inspection for Demo) */}
        {hasDemo && (
          <button
            id="btn-manual-step"
            onClick={handleManualNext}
            className="btn btn-secondary"
            title="Manually advance to next visual step (Demo Mode)"
          >
            <ChevronRight size={14} />
            <span>Step Next</span>
          </button>
        )}

        {/* Reset Lesson */}
        <button
          id="btn-reset-lesson"
          onClick={() => {
            setCurrentStepIdx(0);
            onReset();
          }}
          className="btn btn-secondary"
          title="Reset the lesson visual stage and transcript history"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
