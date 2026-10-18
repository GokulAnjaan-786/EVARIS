# EVARIS

> **Full Form:** Every Victory Arrives After Rising In Silence  
> **Brand Tagline:** *Intelligence That Makes Learning Visible.*  
> **Category:** AI-Powered Real-Time Visual Teaching Engine  

---

## Overview

**EVARIS** is an ambient real-time visual teaching engine designed for online educators. Instead of requiring teachers to pause their explanations to search for diagrams, assemble slides, or draw sketches, EVARIS listens to the spoken explanation, understands the conceptual progression, and automatically surfaces or mutates relevant, verified visual representations (equations, dynamic coordinate curves, algorithmic flowcharts, scientific schematics, timelines) directly alongside the teacher's video feed.

## Core Architectural Differentiators

- **Ambient & Hands-Free:** Teachers explain lessons naturally without manually triggering slides, searching the web, or holding items to a camera.
- **Deterministic & Factually Grounded:** Replaces hallucination-prone image diffusion models with programmatic renderers (KaTeX for math, dynamic SVG for coordinate functions, Mermaid for flowcharts, verified vector schematics for science).
- **Smart Visual Continuity:** Avoids distracting visual churn. When a teacher elaborates on a topic (e.g. discussing the vertex of a parabola), EVARIS highlights or mutates the existing visual rather than replacing it with an unrelated image.
- **Universal Subject Engine:** A modular cognitive and visual architecture supporting Mathematics, Science, Computer Science, History, Economics, and Languages.
- **Zero Paid Dependencies:** Runs 100% locally with open-source tooling, without requiring paid API keys.

---

## Project Structure

```
EVARIS/
├── backend/            # FastAPI, WebSocket Hub, Cognitive & Visual Engine
├── frontend/           # Next.js 15, React 19, TypeScript, Vanilla CSS, KaTeX
└── docs/               # System architecture and engineering specifications
    └── PHASE_0_SYSTEM_ARCHITECTURE.md
```

---

## Development Roadmap

- [x] **Phase 0 — Understanding & Planning:** Workspace inspection, architecture specification, data contracts, and risk analysis.
- [x] **Phase 1 — Working Local Prototype:** Commercial-grade classroom UI, multi-subject sample lessons (Math, CS, Biology), KaTeX equation & dynamic SVG coordinate curve rendering with smart visual continuity, WebSocket transport, latency telemetry profiler.
- [ ] **Phase 2 — Live Microphone & Streaming Transcription:** Browser audio capture, local Faster-Whisper, VAD chunking.
- [ ] **Phase 3 — Universal Concept Understanding:** Sliding context buffer, semantic transition detector.
- [ ] **Phase 4 — Real-Time Visual Continuity:** Dynamic visual mutations, predictive pre-rendering.
- [ ] **Phase 5 — Reliability & Multi-Subject Hardening:** Acoustic and accent robustness, failure recovery.
- [ ] **Phase 6 — Commercial Platform Readiness:** EdTech SDK, persistent storage, tenant separation.

## Local Quick Start

### 1. Start Backend (FastAPI + Uvicorn)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Start Frontend (Next.js 15)
```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000` to interact with EVARIS Classroom.

---

## Documentation

Detailed architectural and data contract specifications are available in [PHASE_0_SYSTEM_ARCHITECTURE.md](file:///c:/Users/HP/Desktop/EVARIS/docs/PHASE_0_SYSTEM_ARCHITECTURE.md).
