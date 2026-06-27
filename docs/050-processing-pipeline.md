---
title: Processing Pipeline
aliases:
  - Local Processing Pipeline
type: processing-note
status: active
tags:
  - processing
  - workers
  - imaging
created: 2026-06-25
updated: 2026-06-25
---

# Processing Pipeline

## Decision

The processing system will be job-based, local, deterministic where possible, and worker-first.

## Job Contract

Each processing operation should accept:

- input resource identifiers
- serialized parameters
- engine identifier and version
- optional comparison group context

Each job should produce:

- output image resource
- normalized execution metadata
- progress events
- failure details when applicable

## Pipeline Stages

### 1. Decode

Convert uploaded or generated image data into a browser-processable format.

### 2. Background Removal

Must remain local-first.

Architecture decision:

- define a `BackgroundRemovalEngine` interface before selecting the concrete engine
- run the engine inside a worker when model/runtime cost justifies it
- always emit alpha-aware PNG-compatible output

### 3. Resize

Must use nearest-neighbor style scaling to match the PRD intent for hard-edge preservation.

### 4. Quantization

Must support:

- palette sizes from 2 to 256
- reproducible settings
- explicit palette metadata

### 5. Dithering

Must support:

- none
- Floyd-Steinberg

### 6. Variant Fan-out

The same input should be processable into multiple outputs concurrently for comparison mode.

## Performance Rules

- never process large images on the main thread when avoidable
- use transferables for large binary payloads when practical
- keep worker payloads serializable
- prefer passing identifiers and storage handles over repeatedly cloning large images

MDN guidance confirms workers communicate by messaging and support transferables for large buffers, which matters for `8192 x 8192` images.

## Future Engine Boundary

The processing layer should not care whether a concrete engine is:

- pure Canvas
- OffscreenCanvas
- WASM-backed
- local ML runtime

The app should depend on engine contracts, not implementation details.

## Related

- [[020-target-architecture#Worker Strategy]]
- [[030-domain-model]]
- [[040-user-flows#Flow 3: Background Removal]]
- [[060-storage-and-security]]
