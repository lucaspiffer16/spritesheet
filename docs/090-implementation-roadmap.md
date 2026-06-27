---
title: Implementation Roadmap
aliases:
  - Roadmap Tecnico
type: roadmap-note
status: active
tags:
  - roadmap
  - implementation
created: 2026-06-25
updated: 2026-06-25
---

# Implementation Roadmap

## Goal

Sequence implementation in a way that protects the core architecture before feature spread.

## Stage 1: Replace The Starter App

- remove template UI
- create workstation shell
- create base layout regions
- create theme and design tokens aligned with desktop-tool behavior

Deliverable:

- navigable shell ready for feature insertion

## Stage 2: Create Domain And Service Contracts

- define domain types
- define provider interfaces
- define processing job interfaces
- define persistence interfaces

Deliverable:

- compile-time contracts for future modules

## Stage 3: Implement Persistence Foundation

- add Dexie
- define first IndexedDB schema
- persist projects and image blobs
- load recent projects on boot

Deliverable:

- local project open/save loop

## Stage 4: Implement Provider Foundation

- add credential handling
- implement KIE adapter
- fetch models and capabilities
- create dynamic generation form

Deliverable:

- image generation stored locally with metadata

## Stage 5: Implement Local Processing Foundation

- add worker bootstrap
- create job message protocol
- implement image decode path
- implement nearest-neighbor resize
- implement palette quantization and dithering

Deliverable:

- first local conversion path

## Stage 6: Implement Background Removal

- define background engine adapter
- integrate local segmentation path
- output transparent variants

Deliverable:

- generation to transparent asset flow

## Stage 7: Comparison And Export

- fan-out variant generation
- synchronized comparison UI
- PNG export
- ZIP package export

Deliverable:

- production-ready MVP flow

## Stage 8: Reliability Layer

- undo/redo
- retry semantics
- crash-safe loading
- schema migration hardening

Deliverable:

- resilient workstation behavior

## Definition Of Ready For Feature Work

A feature is ready to build when:

- its domain model exists
- its persistence behavior is known
- its worker strategy is known
- its provider dependency is isolated
- its output metadata shape is defined

## Related

- [[010-technical-scope]]
- [[020-target-architecture]]
- [[060-storage-and-security]]
- [[080-product-lifecycle]]
