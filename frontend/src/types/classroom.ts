/**
 * EVARIS Frontend TypeScript Contracts and Type Definitions.
 */

export type VisualTypology =
  | "MATH_EQUATION"
  | "FUNCTION_GRAPH"
  | "STRUCTURED_FLOWCHART"
  | "SCIENCE_DIAGRAM"
  | "TIMELINE"
  | "CODE_SNIPPET";

export type RenderMode = "CREATE" | "UPDATE" | "HIGHLIGHT" | "RETAIN";

export interface ActiveFeature {
  id: string;
  type: string;
  label: string;
  coordinates?: [number, number];
  highlight: boolean;
  details?: string;
}

export interface VisualMetadata {
  confidence: number;
  subject: string;
  topic: string;
  generation_time_ms: number;
  source_attribution?: string;
}

export interface VisualPayload {
  visual_id: string;
  typology: VisualTypology;
  mode: RenderMode;
  continuity_key: string;
  title: string;
  subtitle?: string;
  data: Record<string, any>;
  active_features: ActiveFeature[];
  metadata: VisualMetadata;
  created_at: number;
}

export interface TranscriptEvent {
  token: string;
  sentence: string;
  concept: string;
  subject: string;
  topic: string;
  is_final: boolean;
  is_live?: boolean;
  step_index: number;
  total_steps: number;
}

export interface TelemetryReport {
  event_id: string;
  mode?: string;
  is_simulated?: boolean;
  transcription_ms: number;
  understanding_ms: number;
  visual_ms: number;
  total_latency_ms: number;
  timestamp: number;
}


export interface SampleLessonMeta {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  duration_seconds: number;
  description: string;
  total_steps: number;
}

export type DiagnosticStage =
  | "AUDIO_RECEIVED"
  | "AUDIO_PROCESSED"
  | "TRANSCRIPT_PRODUCED"
  | "CONCEPT_EXTRACTED"
  | "VISUAL_ACTION_SELECTED"
  | "VISUAL_PAYLOAD_VALIDATED"
  | "FRONTEND_RENDERED";

export interface DiagnosticEvent {
  session_id: string;
  trace_id: string;
  stage: DiagnosticStage;
  timestamp_ms: number;
  duration_ms?: number;
  details: Record<string, any>;
  is_live: boolean;
}

export type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";

export type TeachingStatus = "IDLE" | "TEACHING" | "PAUSED" | "FROZEN" | "COMPLETED" | "RESET" | "LISTENING";

