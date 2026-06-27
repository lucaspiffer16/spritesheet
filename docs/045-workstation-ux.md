---
title: Workstation UX
aliases:
  - UX da Workstation
  - Workspace Experience
type: ux-note
status: active
tags:
  - ux
  - layout
  - workstation
created: 2026-06-25
updated: 2026-06-25
---

# Workstation UX

## Intent

The product should feel like a browser-based production workstation, not a sequential form and not a landing-page-style tool.

The user experience must support repeated iteration, visual comparison, and safe experimentation.

## Core UX Model

The user should work inside one persistent workspace where assets, tools, pipeline state, and export actions stay visible or quickly reachable.

The main interaction model is:

- select or create an asset
- inspect it in the center workspace
- adjust settings in context
- create derived variants without destroying prior results
- compare outputs
- export the chosen result

## Primary Layout

### Left Rail

Purpose:

- navigation between features
- project assets and collections
- quick access to generation, upload, and comparison entry points

Expected content:

- project switcher or project title
- asset gallery
- import button
- generate button
- variant groups or comparison groups

### Center Workspace

Purpose:

- the user's main focus area
- source of visual trust when evaluating quality

Expected content:

- main preview canvas
- side-by-side compare mode when needed
- transparency checkerboard mode
- zoom controls
- pixel grid overlay in relevant modes

### Right Inspector

Purpose:

- context-sensitive controls for the selected asset, variant, or tool

Expected content:

- provider and model settings when generating
- processing parameters when editing
- pipeline metadata
- export settings
- step history for the selected item

### Bottom Utility Area

Optional but recommended when complexity grows.

Purpose:

- background job visibility
- logs
- export queue
- warnings and retry surfaces

## Experience Principles

### 1. Non-Destructive By Default

Every operation should create a new result or update reversible state rather than overwrite the only copy.

The user should always feel safe trying another preset.

### 2. Compare-Driven Workflow

The product should encourage evaluating variants side by side instead of forcing guesswork.

This is especially important for pixel-art conversion and palette decisions.

### 3. Progressive Complexity

The UI should show essential controls first and reveal advanced options only when relevant.

Provider-driven forms and context-sensitive inspectors are preferred over giant static forms.

### 4. Continuous Context

The user should not lose track of:

- which asset is active
- which variant is selected
- what processing step produced it
- whether a job is running
- what can be exported

### 5. Fast Iteration

The product should support rapid loops:

- change parameter
- run processing
- inspect result
- compare
- keep or discard

The interface must avoid full-screen blocking states during local processing whenever possible.

## UX Through The Main Flow

### Provider Setup

The provider experience should feel lightweight and operational, not like account onboarding.

The user should:

- choose a provider
- paste a key
- understand whether the key is session-only or locally stored
- move directly into generation

### Generation

The generation UI should adapt to provider capabilities and avoid exposing unsupported options.

The user should see:

- the selected provider and model
- only supported parameters
- clear job status while generation is running
- the generated result entering the asset workspace immediately after completion

### Local Processing

Background removal and pixel conversion should feel like transforms applied to the selected asset, not like disconnected tools.

The user should remain in the same workspace while jobs run in the background.

### Comparison

Comparison should be first-class, not an afterthought.

The user should be able to inspect multiple outputs with synchronized zoom and quickly promote a preferred variant.

### Export

Export should feel like the last step of a pipeline that is already visible, not like a separate application state.

The user should understand exactly which variant is being exported and with which settings.

## UI States That Must Be Clear

- idle
- selected asset with no active job
- running job
- completed job with new variant available
- failed job with retryable error
- unsaved transient state if introduced later

## Responsiveness Expectations

Desktop is the primary target for the workstation experience.

Responsive behavior is still required, but smaller screens should preserve the same model by collapsing regions into panels rather than flattening the product into a long page.

## Accessibility And Clarity

The product should prioritize:

- clear labels for pipeline actions
- visible active selection state
- keyboard-friendly navigation in later phases
- readable contrast in dark mode
- no ambiguous destructive actions

## Success Condition

The UX is successful when a user can move from generation to export while always understanding:

- where they are
- what they selected
- what changed
- what produced the current result
- what they can do next

## Related

- [[020-target-architecture#Rendering Strategy]]
- [[040-user-flows]]
- [[050-processing-pipeline]]
- [[080-product-lifecycle]]
