---
title: Research Notes
aliases:
  - Research Backing
  - Notas de Pesquisa
type: research-note
status: active
tags:
  - research
  - references
created: 2026-06-25
updated: 2026-06-25
---

# Research Notes

## Repository Reality

The repository currently contains a minimal `Vite + Preact + TypeScript` starter and product documentation.

This means architecture should be established deliberately now, because there is little legacy implementation to preserve.

## Context7 Findings

### Dexie

Context7 documentation for Dexie indicates good fit for this project because it supports:

- IndexedDB schema declaration
- version upgrades and migrations
- transactions
- storing binary `Blob` data

This justifies selecting Dexie as the first persistence abstraction.

### Preact

Context7 documentation for Preact indicates Context remains a practical pattern for shared app state and service injection.

This supports starting with:

- local hooks
- Context for workspace and services
- feature reducers where complexity grows

without introducing a heavier state stack too early.

## Web Research Findings

### MDN Web Workers

MDN guidance confirms:

- workers are appropriate for CPU-intensive background tasks
- they communicate through messages
- large buffers can use transferable objects
- bundlers should create workers via URLs relative to `import.meta.url`

This directly informs the image processing architecture.

### KIE Docs

The KIE reference index shows image-generation related task creation and task-detail endpoints across multiple model families.

This suggests the provider adapter should model:

- task creation
- task status polling
- result retrieval
- capability normalization

## Open Research Questions

- which local background-removal engine best balances size, speed, and quality
- whether OffscreenCanvas improves enough in target browsers to be the default processing primitive
- whether export packaging should start with a small custom layer or a dedicated archive library
- how closely pixel-art quantization should reproduce ImageMagick edge behavior in practice

## Research Policy For Implementation Phase

Before implementing each major subsystem, consult authoritative sources again:

- Context7 for library and framework usage details
- official provider docs for API behavior
- MDN for browser platform constraints

Research should be used to refine implementation details, but not to override the PRD's core principles.

## Related

- [[000-index]]
- [[060-storage-and-security]]
- [[070-provider-layer]]
