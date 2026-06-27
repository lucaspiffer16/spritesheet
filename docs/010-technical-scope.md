---
title: Technical Scope
aliases:
  - Escopo Tecnico
  - PRD Technical Translation
type: scope-note
status: active
tags:
  - scope
  - prd
  - architecture
created: 2026-06-25
updated: 2026-06-25
---

# Technical Scope

## Product Definition

The product is a browser-based workstation for turning AI-generated images into production-ready game assets.

The non-negotiable technical constraints from the PRD are:

- provider agnostic
- local first
- no proprietary backend
- reproducible workflows
- production-ready export

## Scope Translation

Only image generation may depend on remote APIs.

Everything else must execute inside the browser:

- upload
- decoding
- background removal
- pixel-art conversion
- quantization
- variant comparison
- project persistence
- export packaging

## Technical Consequences

The app must be designed around five stable layers:

1. `ui`: workstation shell, editors, inspectors, galleries
2. `application`: commands, workflows, orchestration, undo/redo
3. `provider`: remote AI generation abstraction
4. `processing`: local image operations and background jobs
5. `persistence`: browser storage for projects, assets, settings, metadata

## MVP Boundary

The MVP should be intentionally narrow:

- one provider adapter first: `KIE`
- one complete asset pipeline first: prompt -> generation -> background removal -> pixel conversion -> export
- one local project format first
- one comparison workflow first

The MVP should not attempt:

- tileset intelligence
- engine-specific integrations
- multi-user or auth systems
- server-side proxying
- cloud storage

## Current Repository Status

The current codebase is still a Vite + Preact starter.

What exists now:

- `src/main.tsx` entrypoint
- `src/app.tsx` template UI
- basic CSS

What does not exist yet:

- domain models
- provider abstraction
- persistence layer
- worker-based processing layer
- export system
- application shell

## Immediate Technical Objective

The next implementation phase should create architectural foundations before feature breadth.

Priority order:

1. app shell
2. domain model
3. provider contract
4. storage contract
5. worker contract
6. first end-to-end MVP path

## Related

- [[000-index]]
- [[020-target-architecture]]
- [[070-provider-layer]]
- [[090-implementation-roadmap]]
