# AI Asset Pipeline Studio

## Vision

A professional browser-based asset pipeline workstation for transforming AI-generated images into production-ready game assets.

The application focuses on generation, processing, conversion, organization, and export of game-ready assets while keeping all processing local-first whenever possible.

The experience should feel closer to a desktop creative tool than a simple web editor.

---

# Product Principles

## Provider Agnostic

The application must never depend on a single AI provider.

Providers are interchangeable.

Examples:

* KIE
* OpenAI
* Stability AI
* Future Providers

The rest of the system must remain unchanged when switching providers.

---

## Local First

Only image generation may communicate with external APIs.

All asset processing executes locally inside the browser.

Examples:

* Background Removal
* Pixel Art Conversion
* Palette Quantization
* Export Generation
* Project Storage

---

## No Backend

No proprietary backend.

No server-side image processing.

No server-side storage.

No user accounts.

No authentication system.

All user data remains inside the browser.

---

# MVP Workflow

Prompt
↓
AI Image Generation
↓
Background Removal
↓
Pixel Art Conversion
↓
Palette Quantization
↓
Export

---

# MVP Goals

A user must be able to:

1. Configure an AI provider
2. Provide an API key
3. Generate images
4. Remove backgrounds
5. Convert images into pixel art
6. Adjust color palettes
7. Compare outputs
8. Export production-ready assets

---

# High-Level Architecture

Application
↓
Provider Layer
↓
AI Providers

Application
↓
Processing Layer
↓
Local Processing Engines

Application
↓
Persistence Layer
↓
Browser Storage

---

# Module 1 - Provider Management

## Goal

Allow switching AI providers without affecting the rest of the application.

---

## Provider Interface

Get Available Models

Get Model Capabilities

Generate Image

Get Generation Status

Retrieve Result

---

## Supported Providers

Initial Release

* KIE

Future

* OpenAI
* Stability AI

---

## Provider Selection

Users choose a provider before generating assets.

Example

Provider

○ KIE

○ OpenAI

○ Stability AI

---

# Module 2 - API Key Management

## Session Mode (Default)

Credentials remain only in memory.

Characteristics

* Not persisted
* Lost when tab closes
* Lost when browser closes
* Lowest security risk

Recommended default.

---

## Local Persistence (Optional)

Users may explicitly choose to persist credentials locally.

Storage

* Browser Local Storage
* Browser Database

---

## Required Security Warning

Before enabling persistence:

Your API key will be stored locally inside your browser.

It will never be transmitted anywhere except to the selected provider.

Anyone with access to your browser profile may potentially recover this credential.

Use local persistence only if you understand this risk.

---

## Credential UI

Provider

[KIE]

API Key

[________________]

[x] Keep only for this session

[ ] Store locally

---

# Module 3 - AI Image Generation

## Goal

Generate images using the selected provider.

---

## Text To Image

Inputs may include:

* Prompt
* Negative Prompt
* Model
* Aspect Ratio
* Seed
* Number of Images

---

## Image To Image

Inputs may include:

* Source Image
* Prompt
* Transformation Strength
* Model

---

## Dynamic Model Selection

Users must be able to select among the models exposed by the selected provider.

Examples:

* Image Generation Models
* Image Editing Models
* Specialized Models
* Future Models

The list should be loaded dynamically whenever possible.

---

## Dynamic Parameter Discovery

The interface must adapt to the capabilities exposed by the selected provider and model.

Examples of supported parameters may include:

* Model
* Resolution
* Aspect Ratio
* Quality Level
* Generation Tier
* Seed
* Image Count
* Negative Prompt
* Guidance Settings
* Transformation Strength
* Provider-Specific Options

The exact parameters available depend on the provider implementation.

The application must not assume that all providers expose the same settings.

---

## Capability-Based UI

Only parameters supported by the selected provider and model should be displayed.

Unsupported options must remain hidden.

Example

Provider A supports:

* Quality
* Seed
* Negative Prompt

Provider B supports:

* Resolution
* Image Count

The interface adapts automatically.

---

## Future Compatibility

New provider capabilities should be supported through the provider layer whenever possible.

The core workflow should not require modifications when providers evolve.

---

## Generation Metadata

Store:

* Provider
* Model
* Parameters
* Timestamp

---

# Module 4 - Image Upload

Supported Formats

* PNG
* JPG
* JPEG
* WEBP

Capabilities

* Drag and Drop
* Multi-file Upload
* Batch Upload
* Thumbnail Gallery

---

# Module 5 - Background Removal

## Goal

Generate transparent assets.

---

## Execution

Runs entirely in the browser.

No cloud processing.

---

## Features

* Automatic Segmentation
* Transparency Generation
* Edge Refinement
* Feathering
* Restore Brush
* Erase Brush
* Manual Mask Editing

---

## Viewing Modes

* Original
* Processed
* Side-by-Side
* Transparency Checkerboard

---

# Module 6 - Pixel Art Conversion

## Requirement

Pixel-art conversion must match ImageMagick behavior.

---

## Resize Engine

Always use nearest-neighbor style scaling.

Goals

* Preserve hard edges
* Preserve readability
* Avoid color blending

---

## Quantization Engine

Supported Palette Sizes

2 to 256 colors

Optional Dithering

* None
* Floyd Steinberg

---

# Presets

## Retro Touch

100%

128 Colors

---

## Modern Pixel Art

50%

128 Colors

---

## Modern Pixel Art Lite

50%

64 Colors

---

## SNES Style

25%

64 Colors

---

## Strong SNES

25%

32 Colors

---

## NES Style

10%

16 Colors

---

## Game Boy Style

10%

8 Colors

---

# Module 7 - Advanced Conversion

## User Controls

Resize

10% to 100%

---

Palette Size

2 to 256 colors

---

Dithering

* None
* Floyd Steinberg

---

## Processing Preview

Display processing settings before execution.

Allow users to reproduce results later.

---

# Module 8 - Smart Recommendations

## Asset Types

* Character
* Enemy
* NPC
* Boss
* Prop
* Background
* UI Asset

---

## Output

Recommended:

* Resize
* Palette Size
* Dithering

Include rationale for every recommendation.

---

# Module 9 - Live Comparison

Generate multiple variants simultaneously.

Variant A

100%

128 Colors

---

Variant B

50%

128 Colors

---

Variant C

25%

64 Colors

---

Variant D

25%

32 Colors

---

## Features

* Side-by-Side Comparison
* Synchronized Zoom
* Pixel Grid Overlay

---

# Module 10 - Export

## Supported Formats

* PNG
* Transparent PNG
* Sprite Sheet PNG
* ZIP Package

---

## Capabilities

* Single Export
* Batch Export

---

# Module 11 - Project Storage

Store locally:

* Generated Images
* Processed Images
* Export Settings
* Processing History
* Generation Metadata

---

## Storage Goals

Users should be able to reopen a project and continue exactly where they stopped.

---

# Module 12 - Pipeline Inspector

Display every processing step.

Example

Prompt
↓
Generated Image
↓
Background Removed
↓
Resize 50%
↓
Palette 128 Colors
↓
Export

---

## Purpose

Provide reproducibility.

Users must always understand how an asset was produced.

---

# Performance Requirements

Support images up to:

8192 × 8192

---

Processing must not freeze the interface.

Long-running operations should execute in background workers.

---

# UX Requirements

* Dark Mode
* Responsive Layout
* Undo
* Redo
* Keyboard Shortcuts
* Non-Destructive Editing
* Reversible Processing
* Batch Operations

---

# Explicitly Excluded From MVP

## AI Tileset Builder

Includes:

* Tile Detection
* Tile Classification
* Terrain Analysis
* Auto-Tiling
* Wang Tiles
* Terrain Sets

Reason:

High complexity and does not validate the core value proposition.

---

## Prompt Library

Post-MVP.

---

## Prompt Traceability

Post-MVP.

---

## Engine-Specific Features

No engine-specific integrations during MVP.

The application should remain engine-agnostic.

---

# Success Criteria

A new user can:

1. Select a provider
2. Configure credentials
3. Select a model
4. Configure generation parameters
5. Generate an image
6. Remove the background
7. Convert to pixel art
8. Adjust palette settings
9. Compare multiple variants
10. Export assets

without requiring any external image-editing software.

---

# Long-Term Vision

Future versions may include:

* AI Tileset Builder
* Auto-Tiling Systems
* Asset Classification
* Local AI Integrations
* Multi-Provider Routing
* Cost Optimization
* Quality Benchmarking
* Advanced Asset Automation

The product should evolve into a complete AI-assisted asset pipeline workstation while preserving its core principles:

* Provider Agnostic
* Local First
* No Backend
* Reproducible Workflows
* Production-Ready Outputs

