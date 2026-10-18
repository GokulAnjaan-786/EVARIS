"use client";

import React, { useState, useMemo } from "react";
import {
  STANDARD_SUBJECTS,
  INITIAL_SELECTED_SUBJECTS,
  SubjectDefinition,
} from "../../lib/subjectsConfig";
import {
  Search,
  Plus,
  Check,
  X,
  BookOpen,
  Sparkles,
  RotateCcw,
  Layers,
} from "lucide-react";

interface UniversalSubjectSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubjects: string[];
  onToggleSubject: (subjectName: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onResetDefaults: () => void;
  customSubjects: SubjectDefinition[];
  onAddCustomSubject: (name: string) => boolean;
  onRemoveCustomSubject: (name: string) => void;
  primarySubject: string;
  onSetPrimarySubject: (name: string) => void;
}

export const UniversalSubjectSelector: React.FC<UniversalSubjectSelectorProps> = ({
  isOpen,
  onClose,
  selectedSubjects,
  onToggleSubject,
  onSelectAll,
  onClearAll,
  onResetDefaults,
  customSubjects,
  onAddCustomSubject,
  onRemoveCustomSubject,
  primarySubject,
  onSetPrimarySubject,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // Combine standard + custom subjects
  const allSubjects = useMemo(() => {
    return [...STANDARD_SUBJECTS, ...customSubjects];
  }, [customSubjects]);

  // Filter by search query
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return allSubjects;
    const q = searchQuery.toLowerCase().trim();
    return allSubjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.topics.some((t) => t.toLowerCase().includes(q))
    );
  }, [allSubjects, searchQuery]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const trimmed = newSubjectInput.trim();
    if (!trimmed) {
      setAddError("Please enter a subject name.");
      return;
    }
    const success = onAddCustomSubject(trimmed);
    if (success) {
      setNewSubjectInput("");
    } else {
      setAddError(`Subject "${trimmed}" already exists.`);
    }
  };

  if (!isOpen) return null;

  return (
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
        zIndex: 100,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card-light"
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "var(--brand-blue-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={20} color="var(--brand-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Universal Subject Selection
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Select the disciplines taught in your curriculum. Multi-selection supported.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "6px", borderRadius: "50%", minWidth: "32px", height: "32px" }}
            title="Close dialog (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Action Bar */}
        <div
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid var(--border-color-subtle)",
            backgroundColor: "var(--bg-app)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* Search Input */}
          <div
            style={{
              flex: 1,
              minWidth: "220px",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: "absolute", left: "12px" }}
            />
            <input
              type="text"
              placeholder="Search 14 subjects or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                fontSize: "0.875rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color-strong)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Select Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={onSelectAll}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              Select All
            </button>
            <button
              onClick={onClearAll}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              Clear All
            </button>
            <button
              onClick={onResetDefaults}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
              title="Reset to default example subjects (Math, English, Science, Physics, Biology)"
            >
              <RotateCcw size={12} />
              <span>Defaults</span>
            </button>
          </div>
        </div>

        {/* Currently Selected Chips Bar */}
        <div
          style={{
            padding: "10px 24px",
            backgroundColor: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-color-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            minHeight: "44px",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>
            Selected ({selectedSubjects.length}):
          </span>

          {selectedSubjects.length === 0 ? (
            <span style={{ fontSize: "0.78rem", color: "var(--status-warning)", fontStyle: "italic" }}>
              No subjects selected. Click subjects below to add them to your classroom.
            </span>
          ) : (
            selectedSubjects.map((subName) => {
              const isPrimary = subName === primarySubject;
              return (
                <div
                  key={subName}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    backgroundColor: isPrimary ? "var(--brand-blue-light)" : "var(--bg-surface-secondary)",
                    border: isPrimary ? "1px solid var(--brand-blue)" : "1px solid var(--border-color)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: isPrimary ? "var(--brand-blue)" : "var(--text-secondary)",
                    flexShrink: 0,
                  }}
                >
                  <span
                    onClick={() => onSetPrimarySubject(subName)}
                    style={{ cursor: "pointer" }}
                    title={isPrimary ? "Active Primary Subject" : "Click to set as active subject"}
                  >
                    {subName} {isPrimary && "★"}
                  </span>
                  <button
                    onClick={() => onToggleSubject(subName)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      padding: "1px",
                    }}
                    title={`Deselect ${subName}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Subject Grid List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "10px",
            alignContent: "start",
          }}
        >
          {filteredSubjects.map((subject) => {
            const isSelected = selectedSubjects.includes(subject.name);
            const isCustom = subject.isCustom;
            const hasDemo = Boolean(subject.demoLesson);

            return (
              <div
                key={subject.id}
                onClick={() => onToggleSubject(subject.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: isSelected
                    ? "1.5px solid var(--brand-blue)"
                    : "1px solid var(--border-color)",
                  backgroundColor: isSelected
                    ? "var(--brand-blue-light)"
                    : "var(--bg-surface)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "4px",
                      border: isSelected
                        ? "1.5px solid var(--brand-blue)"
                        : "1.5px solid var(--border-color-strong)",
                      backgroundColor: isSelected ? "var(--brand-blue)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={12} color="#ffffff" />}
                  </div>

                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "var(--brand-blue)" : "var(--text-primary)",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {subject.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {hasDemo ? "Demo Ready" : "Live Teaching"}
                    </div>
                  </div>
                </div>

                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCustomSubject(subject.name);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: "2px",
                    }}
                    title={`Delete custom subject ${subject.name}`}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            );
          })}

          {filteredSubjects.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "24px",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            >
              No subjects matching "{searchQuery}". You can add it as a custom subject below.
            </div>
          )}
        </div>

        {/* Add Custom Subject Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-app)",
          }}
        >
          <form
            onSubmit={handleAddCustom}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <input
              type="text"
              placeholder="Add custom subject (e.g. Astronomy, Statistics)..."
              value={newSubjectInput}
              onChange={(e) => {
                setNewSubjectInput(e.target.value);
                setAddError(null);
              }}
              style={{
                flex: 1,
                padding: "8px 14px",
                fontSize: "0.875rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color-strong)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: "8px 14px" }}>
              <Plus size={15} />
              <span>Add Subject</span>
            </button>
          </form>

          {addError && (
            <p style={{ fontSize: "0.75rem", color: "var(--status-error)", marginTop: "6px" }}>
              {addError}
            </p>
          )}
        </div>

        {/* Modal Done Footer */}
        <div
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--bg-surface)",
            borderTop: "1px solid var(--border-color-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Active subject: <strong style={{ color: "var(--text-primary)" }}>{primarySubject}</strong>
          </div>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: "8px 22px" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
