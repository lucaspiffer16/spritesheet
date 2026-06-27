import type {
  Asset,
  AssetVariant,
  ExportPreset,
  GenerationMetadata,
  ImageResource,
  JobRecord,
  PipelineStep,
  Project,
  WorkspaceSnapshot,
} from '../domain/models'

const exportPresets: ExportPreset[] = [
  { id: 'export-1', name: 'Transparent PNG', format: 'transparent-png', scale: 1 },
  { id: 'export-2', name: 'Sprite Sheet ZIP', format: 'zip', scale: 1 },
]

const project: Project = {
  id: 'project-1',
  name: 'Forest Familiar Asset Pack',
  createdAt: '2026-06-25T10:00:00.000Z',
  updatedAt: '2026-06-25T14:42:00.000Z',
  assetIds: ['asset-1', 'asset-2', 'asset-3'],
  activeAssetId: 'asset-1',
  exportPresets,
  workspacePreferences: {
    theme: 'dark',
    showCheckerboard: true,
    showPixelGrid: true,
    zoomPercent: 300,
  },
}

const assets: Asset[] = [
  {
    id: 'asset-1',
    projectId: project.id,
    kind: 'generated',
    name: 'Forest Familiar',
    sourceImageId: 'image-1',
    variantIds: ['variant-1', 'variant-2', 'variant-3'],
    pipelineStepIds: ['step-1', 'step-2', 'step-3'],
    generationMetadataId: 'generation-1',
    tags: ['character', 'mvp'],
  },
  {
    id: 'asset-2',
    projectId: project.id,
    kind: 'uploaded',
    name: 'Mushroom Prop',
    sourceImageId: 'image-4',
    variantIds: ['variant-4'],
    pipelineStepIds: ['step-4'],
    tags: ['prop'],
  },
  {
    id: 'asset-3',
    projectId: project.id,
    kind: 'generated',
    name: 'UI Badge Concept',
    sourceImageId: 'image-5',
    variantIds: ['variant-5'],
    pipelineStepIds: ['step-5'],
    generationMetadataId: 'generation-2',
    tags: ['ui'],
  },
]

const imageResources: ImageResource[] = [
  { id: 'image-1', blobKey: 'image-1', width: 1024, height: 1024, mimeType: 'image/png', createdAt: '2026-06-25T10:10:00.000Z' },
  { id: 'image-2', blobKey: 'image-2', width: 1024, height: 1024, mimeType: 'image/png', createdAt: '2026-06-25T10:14:00.000Z' },
  { id: 'image-3', blobKey: 'image-3', width: 256, height: 256, mimeType: 'image/png', createdAt: '2026-06-25T10:18:00.000Z' },
  { id: 'image-4', blobKey: 'image-4', width: 2048, height: 2048, mimeType: 'image/webp', createdAt: '2026-06-25T11:03:00.000Z' },
  { id: 'image-5', blobKey: 'image-5', width: 1536, height: 1024, mimeType: 'image/png', createdAt: '2026-06-25T11:48:00.000Z' },
]

const variants: AssetVariant[] = [
  { id: 'variant-1', assetId: 'asset-1', imageResourceId: 'image-1', label: 'Generated Base', originStepId: 'step-1', isExportable: false },
  { id: 'variant-2', assetId: 'asset-1', imageResourceId: 'image-2', label: 'Background Removed', originStepId: 'step-2', isExportable: true },
  { id: 'variant-3', assetId: 'asset-1', imageResourceId: 'image-3', label: 'SNES Variant', originStepId: 'step-3', isExportable: true, comparisonGroupId: 'compare-1' },
  { id: 'variant-4', assetId: 'asset-2', imageResourceId: 'image-4', label: 'Uploaded Source', originStepId: 'step-4', isExportable: false },
  { id: 'variant-5', assetId: 'asset-3', imageResourceId: 'image-5', label: 'Generated Badge', originStepId: 'step-5', isExportable: true },
]

const pipelineSteps: PipelineStep[] = [
  {
    id: 'step-1',
    assetId: 'asset-1',
    type: 'generation',
    inputVariantIds: [],
    outputVariantIds: ['variant-1'],
    parameters: { promptLength: 92, imageCount: 1, aspectRatio: '1:1' },
    engine: 'kie:gpt-image-2',
    startedAt: '2026-06-25T10:08:00.000Z',
    finishedAt: '2026-06-25T10:10:00.000Z',
    status: 'completed',
  },
  {
    id: 'step-2',
    assetId: 'asset-1',
    type: 'background-removal',
    inputVariantIds: ['variant-1'],
    outputVariantIds: ['variant-2'],
    parameters: { feathering: 2, edgeRefinement: true },
    engine: 'local:segmentation-worker',
    startedAt: '2026-06-25T10:12:00.000Z',
    finishedAt: '2026-06-25T10:14:00.000Z',
    status: 'completed',
  },
  {
    id: 'step-3',
    assetId: 'asset-1',
    type: 'quantization',
    inputVariantIds: ['variant-2'],
    outputVariantIds: ['variant-3'],
    parameters: { resizePercent: 25, paletteSize: 64, dithering: 'floyd-steinberg' },
    engine: 'local:pixel-pipeline',
    startedAt: '2026-06-25T10:16:00.000Z',
    finishedAt: '2026-06-25T10:18:00.000Z',
    status: 'completed',
  },
  {
    id: 'step-4',
    assetId: 'asset-2',
    type: 'resize',
    inputVariantIds: [],
    outputVariantIds: ['variant-4'],
    parameters: { upload: true },
    engine: 'browser:file-import',
    startedAt: '2026-06-25T11:03:00.000Z',
    finishedAt: '2026-06-25T11:03:00.000Z',
    status: 'completed',
  },
  {
    id: 'step-5',
    assetId: 'asset-3',
    type: 'generation',
    inputVariantIds: [],
    outputVariantIds: ['variant-5'],
    parameters: { promptLength: 61, imageCount: 2, aspectRatio: '3:2' },
    engine: 'kie:google-imagen4-fast',
    startedAt: '2026-06-25T11:45:00.000Z',
    finishedAt: '2026-06-25T11:48:00.000Z',
    status: 'completed',
  },
]

const generationMetadata: GenerationMetadata[] = [
  {
    id: 'generation-1',
    providerId: 'kie',
    modelId: 'gpt-image-2',
    request: { mode: 'text-to-image', seed: 41, quality: 'high' },
    normalizedCapabilitiesSnapshot: ['text-to-image', 'seed', 'negative-prompt', 'aspect-ratio'],
    providerTaskId: 'task-kie-001',
    timestamps: {
      requestedAt: '2026-06-25T10:08:00.000Z',
      completedAt: '2026-06-25T10:10:00.000Z',
    },
  },
  {
    id: 'generation-2',
    providerId: 'kie',
    modelId: 'google-imagen4-fast',
    request: { mode: 'text-to-image', imageCount: 2 },
    normalizedCapabilitiesSnapshot: ['text-to-image', 'resolution', 'image-count'],
    providerTaskId: 'task-kie-002',
    timestamps: {
      requestedAt: '2026-06-25T11:45:00.000Z',
      completedAt: '2026-06-25T11:48:00.000Z',
    },
  },
]

const jobs: JobRecord[] = [
  {
    id: 'job-1',
    label: 'Comparison set: SNES presets',
    assetId: 'asset-1',
    status: 'running',
    progressPercent: 68,
    detail: 'Rendering 3 of 4 local variants',
  },
  {
    id: 'job-2',
    label: 'Export queue: Forest Familiar',
    assetId: 'asset-1',
    status: 'queued',
    progressPercent: 0,
    detail: 'Waiting for current worker slot',
  },
]

export const mockWorkspace: WorkspaceSnapshot = {
  project,
  assets,
  imageResources,
  variants,
  pipelineSteps,
  generationMetadata,
  jobs,
}
