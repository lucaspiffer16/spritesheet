---
title: Target Architecture
aliases:
  - Arquitetura Alvo
type: architecture-note
status: active
tags:
  - architecture
  - system-design
created: 2026-06-25
updated: 2026-06-25
---

# Target Architecture

## Core Decision

Adopt a layered browser-first architecture with strict separation between remote generation and local processing.

## Proposed Top-Level Structure

```text
src/
  app/
  ui/
  features/
  domain/
  providers/
  processing/
  persistence/
  workers/
  lib/
```

## Layer Responsibilities

### `domain`

Pure types and business rules.

Examples:

- `Project`
- `Asset`
- `PipelineStep`
- `GenerationRequest`
- `GenerationResult`
- `ExportPreset`

### `providers`

Adapters for external generation APIs.

Rules:

- no UI concerns
- no local persistence concerns
- no image processing logic
- no provider-specific assumptions leaking into the app

### `processing`

Local algorithms and orchestration for image transformation.

Rules:

- worker-friendly
- deterministic inputs and outputs
- serializable job payloads
- metadata emitted for reproducibility

### `persistence`

Browser storage access.

Rules:

- IndexedDB for project data and binary assets
- localStorage only for tiny preference flags
- no provider logic inside persistence adapters

### `features`

Vertical product slices.

Examples:

- provider-settings
- generation
- upload
- background-removal
- conversion
- comparison
- export

## State Strategy

Initial state strategy should stay simple:

- local component state where possible
- Preact Context for shared services and workspace state
- feature-level reducers for complex interactions

Avoid introducing a large external state framework before the domain shape stabilizes.

This is aligned with Preact guidance that Context can carry shared app state effectively for medium-sized apps, while keeping hooks-driven composition simple.

## Worker Strategy

All CPU-intensive operations should move to dedicated workers.

Use dedicated workers first, not shared workers.

Reasons:

- simpler ownership model
- clearer lifecycle per operation or per subsystem
- fits the workstation interaction model

Vite-compatible worker loading should use `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`.

This follows MDN guidance for bundler-safe worker URLs.

## Rendering Strategy

The app should behave like a workstation, not a landing page.

Recommended shell:

- left: tools and assets
- center: preview and canvas area
- right: inspector, pipeline, metadata
- bottom optional: jobs, logs, export queue

This shell is expanded in [[045-workstation-ux]].

## Architectural Invariants

- the provider layer must be swappable
- processing must remain local-first
- every derived asset must preserve lineage
- every mutation must be reproducible from metadata
- storage must survive tab reload and browser restart except session-only secrets

## Related

- [[010-technical-scope]]
- [[030-domain-model]]
- [[045-workstation-ux]]
- [[050-processing-pipeline]]
- [[060-storage-and-security]]
- [[070-provider-layer]]
