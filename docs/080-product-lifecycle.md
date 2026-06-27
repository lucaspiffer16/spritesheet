---
title: Product Lifecycle
aliases:
  - Ciclo de Vida do Produto
type: lifecycle-note
status: active
tags:
  - lifecycle
  - operations
created: 2026-06-25
updated: 2026-06-25
---

# Product Lifecycle

## Technical Lifecycle View

This note describes lifecycle at the technical product level, not only release planning.

## Lifecycle 1: Application Session

1. App boots.
2. Settings are loaded.
3. IndexedDB connection opens.
4. Service contexts are created.
5. Recent project or workspace chooser is presented.

## Lifecycle 2: Project

1. Project is created or reopened.
2. Assets are attached to the project.
3. Variants and pipeline steps accumulate over time.
4. Export outputs are produced.
5. Project is reopened later and resumed from persisted state.

## Lifecycle 3: Asset

1. Asset enters by upload or generation.
2. Source binary is persisted.
3. Processing steps create derived variants.
4. Comparison sets branch from one or more variants.
5. One or more variants are exported.
6. The asset remains reproducible via step history.

## Lifecycle 4: Async Job

1. Job is created.
2. Job enters queue or active execution.
3. Progress events are emitted.
4. Job resolves into outputs or failure.
5. Metadata is persisted.

This lifecycle applies to:

- generation polling
- background removal
- pixel conversion
- batch comparison
- exports

## Lifecycle 5: Product Evolution

### Phase 1

Foundations:

- shell
- domain
- storage
- workers
- first provider

### Phase 2

Core pipeline:

- generation
- upload
- background removal
- conversion
- export

### Phase 3

Productivity:

- undo/redo
- keyboard shortcuts
- smarter comparisons
- project resilience

### Phase 4

Expansion:

- more providers
- richer local engines
- recommendation system
- advanced exports

## Lifecycle Principle

Every lifecycle should preserve two things:

- the user never loses the original asset
- the system can explain how every derived result was produced

## Related

- [[030-domain-model]]
- [[040-user-flows]]
- [[050-processing-pipeline]]
- [[090-implementation-roadmap]]
