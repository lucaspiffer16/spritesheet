---
title: User Flows
aliases:
  - Fluxos do Usuario
  - MVP Flows
type: flow-note
status: active
tags:
  - flows
  - ux
  - mvp
created: 2026-06-25
updated: 2026-06-25
---

# User Flows

The interaction model described here assumes the workstation layout defined in [[045-workstation-ux]].

## Primary MVP Flow

```text
Select provider
-> Configure credential
-> Load provider models and capabilities
-> Generate image
-> Save generation metadata
-> Remove background locally
-> Convert to pixel art locally
-> Adjust palette locally
-> Compare variants
-> Export assets
```

## Flow 1: Provider Setup

1. User opens provider settings.
2. App shows available providers.
3. User selects provider.
4. User enters API key in session mode by default.
5. App validates ability to call the provider.
6. App fetches models and capabilities.

Technical notes:

- provider selection changes capability-driven UI
- session secret stays in memory unless user opts into persistence
- provider boot errors should not crash the rest of the app

## Flow 2: Generation

1. User chooses text-to-image or image-to-image mode.
2. App renders fields from provider capabilities.
3. User submits generation request.
4. Provider adapter creates task.
5. App tracks pending job.
6. App retrieves result URL or file.
7. App stores source image and normalized metadata locally.

Technical notes:

- the UI must not assume a fixed parameter list
- provider-specific fields should be represented in a normalized schema with an escape hatch for raw options

## Flow 3: Background Removal

1. User selects a source variant.
2. App dispatches a local processing job to a worker.
3. Worker emits progress updates.
4. App persists output as a new variant.
5. App records a pipeline step with parameters and engine version.

## Flow 4: Pixel Art Conversion

1. User picks preset or custom values.
2. App computes resize strategy.
3. App runs nearest-neighbor resizing locally.
4. App quantizes to target palette.
5. App applies optional dithering.
6. App stores a new variant and step metadata.

## Flow 5: Comparison

1. User selects multiple presets or custom settings.
2. App fans out local worker jobs.
3. Each result becomes a comparison variant.
4. UI presents synchronized zoom and selection.

## Flow 6: Export

1. User selects one or more exportable variants.
2. App chooses output format.
3. App renders final export buffers locally.
4. App packages files if necessary.
5. App triggers browser download.

## Failure Handling Principles

- provider failures must remain isolated from local data
- processing failures must preserve the last valid variant
- partial batch failures should not cancel successful outputs
- every async job must expose status, error, and retry semantics

## Related

- [[030-domain-model]]
- [[045-workstation-ux]]
- [[050-processing-pipeline]]
- [[070-provider-layer]]
- [[080-product-lifecycle]]
