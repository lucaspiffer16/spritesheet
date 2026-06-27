---
title: Provider Layer
aliases:
  - AI Provider Layer
  - Camada de Providers
type: integration-note
status: active
tags:
  - providers
  - integrations
  - generation
created: 2026-06-25
updated: 2026-06-25
---

# Provider Layer

## Decision

The first provider may be `KIE`, but the architecture must be provider-first, not KIE-first.

## Provider Contract

Each provider adapter should implement functions equivalent to:

- `listModels()`
- `getModelCapabilities(modelId)`
- `generateImage(request)`
- `getTaskStatus(taskId)`
- `getResult(taskId)`

Optional later functions:

- `validateCredential()`
- `normalizeError()`
- `estimateCost()`

## Capability Model

The UI must be built from capability metadata rather than hardcoded fields.

Capability examples:

- supports text-to-image
- supports image-to-image
- supports seed
- supports negative prompt
- supports aspect ratio
- supports image count
- supports provider-specific extra options

## Request Model

Use a normalized request shape with extension points.

The normalized request should contain common fields.

Provider-specific extras should live under a namespaced field such as `rawOptions`.

## KIE Research Notes

`REFERENCES.md` points to `https://docs.kie.ai/llms.txt`.

Initial web research shows KIE exposes:

- image generation task creation
- task status retrieval
- model-specific image endpoints
- unified task-detail style endpoints in parts of the platform

This supports the adapter model described above.

## Constraint From PRD

Even if KIE offers cloud endpoints for adjacent features such as background removal, the app must not use them for local-first processing flows that the PRD reserves for browser execution.

## Provider Failure Policy

- provider errors become normalized domain errors
- provider outages must not corrupt local projects
- provider switching must not require UI rewrites

## Related

- [[010-technical-scope]]
- [[020-target-architecture]]
- [[040-user-flows#Flow 1: Provider Setup]]
- [[100-research-notes#KIE Docs]]
