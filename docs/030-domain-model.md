---
title: Domain Model
aliases:
  - Modelo de Dominio
type: domain-note
status: active
tags:
  - domain
  - modeling
created: 2026-06-25
updated: 2026-06-25
---

# Domain Model

## Core Entities

### `Project`

Represents a persisted workstation session.

Suggested fields:

- `id`
- `name`
- `createdAt`
- `updatedAt`
- `assetIds`
- `activeAssetId`
- `exportPresets`
- `workspacePreferences`

### `Asset`

Represents one source image and all derived outputs.

Suggested fields:

- `id`
- `projectId`
- `kind`: generated | uploaded
- `sourceImageId`
- `variantIds`
- `pipelineStepIds`
- `generationMetadataId?`
- `tags`

### `ImageResource`

Represents persisted binary image data plus lightweight metadata.

Suggested fields:

- `id`
- `blobKey`
- `width`
- `height`
- `mimeType`
- `createdAt`
- `checksum?`

### `AssetVariant`

Represents a concrete output in the pipeline.

Suggested fields:

- `id`
- `assetId`
- `imageResourceId`
- `label`
- `originStepId`
- `isExportable`
- `comparisonGroupId?`

### `PipelineStep`

Represents a deterministic transformation or external generation step.

Suggested fields:

- `id`
- `assetId`
- `type`
- `inputVariantIds`
- `outputVariantIds`
- `parameters`
- `engine`
- `startedAt`
- `finishedAt`
- `status`

### `GenerationMetadata`

Represents provider-specific execution details normalized into app-safe metadata.

Suggested fields:

- `id`
- `providerId`
- `modelId`
- `request`
- `normalizedCapabilitiesSnapshot`
- `providerTaskId?`
- `timestamps`

## Why This Model

This model supports:

- non-destructive editing
- multiple variants per asset
- comparison views
- reproducibility
- export from any valid variant
- undo/redo via command history and step graph

## Lineage Rule

Every output must know:

- where it came from
- which parameters produced it
- which engine produced it

No derived image should exist without a `PipelineStep`.

## Command Model

Application actions should eventually become commands.

Examples:

- `createProject`
- `importImages`
- `generateImage`
- `removeBackground`
- `convertToPixelArt`
- `createComparisonSet`
- `exportVariant`

This will simplify:

- undo/redo
- analytics-free internal logs
- job replay
- future automation

## Related

- [[020-target-architecture]]
- [[040-user-flows]]
- [[050-processing-pipeline]]
- [[060-storage-and-security]]
