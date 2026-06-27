---
title: Storage And Security
aliases:
  - Persistencia e Seguranca
type: storage-note
status: active
tags:
  - storage
  - security
  - indexeddb
created: 2026-06-25
updated: 2026-06-25
---

# Storage And Security

## Decision Summary

- `IndexedDB` is the primary persistent store.
- `Dexie` is the preferred IndexedDB wrapper.
- `localStorage` is limited to small, non-critical preferences.
- session credentials stay in memory by default.

## Why IndexedDB

The product must store:

- projects
- image blobs
- variant metadata
- generation metadata
- processing history
- export settings

This exceeds what `localStorage` should handle.

IndexedDB is the correct browser-native persistence layer for structured local data and binary blobs.

## Why Dexie

Initial research via Context7 shows Dexie provides:

- explicit schema declaration
- versioned migrations
- transactions
- support for storing `Blob` values

That fits the need for evolving project schemas while keeping browser persistence local-first.

## Storage Split

### IndexedDB

Use for:

- projects
- assets
- variants
- image blobs
- pipeline steps
- generation metadata
- job records

### localStorage

Use for:

- theme
- UI layout preferences
- last selected provider
- explicit credential persistence preference flag

### In-memory only

Use for:

- default session API keys
- ephemeral in-flight worker state
- temporary UI selections that do not matter after reload

## Suggested Database Shape

```text
projects
assets
imageResources
variants
pipelineSteps
generationMetadata
exports
settings
```

## Security Rules

- no secret is sent anywhere except the chosen provider
- local secret persistence must be opt-in
- local secret persistence must show a warning matching the PRD intent
- exported files must not silently include secrets or unnecessary raw provider payloads

## Recovery Rules

- database schema must be versioned from day one
- project opening should tolerate missing optional records
- corrupted asset records should fail locally without preventing other projects from opening

## Related

- [[020-target-architecture]]
- [[030-domain-model]]
- [[070-provider-layer]]
- [[100-research-notes#Dexie]]
