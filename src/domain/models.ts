export type AssetKind = 'generated' | 'uploaded'

export type PipelineStepType =
  | 'generation'
  | 'background-removal'
  | 'resize'
  | 'quantization'
  | 'dithering'
  | 'export'

export type PipelineStepStatus = 'idle' | 'running' | 'completed' | 'failed'

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface WorkspacePreferences {
  theme: 'dark'
  showCheckerboard: boolean
  showPixelGrid: boolean
  zoomPercent: number
}

export interface ExportPreset {
  id: string
  name: string
  format: 'png' | 'transparent-png' | 'spritesheet-png' | 'zip'
  scale: number
}

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  assetIds: string[]
  activeAssetId: string
  exportPresets: ExportPreset[]
  workspacePreferences: WorkspacePreferences
}

export interface Asset {
  id: string
  projectId: string
  kind: AssetKind
  name: string
  sourceImageId: string
  variantIds: string[]
  pipelineStepIds: string[]
  generationMetadataId?: string
  tags: string[]
}

export interface ImageResource {
  id: string
  blobKey: string
  width: number
  height: number
  mimeType: string
  createdAt: string
  checksum?: string
  sourceUrl?: string
}

export interface AssetVariant {
  id: string
  assetId: string
  imageResourceId: string
  label: string
  originStepId: string
  isExportable: boolean
  comparisonGroupId?: string
}

export interface PipelineStep {
  id: string
  assetId: string
  type: PipelineStepType
  inputVariantIds: string[]
  outputVariantIds: string[]
  parameters: Record<string, string | number | boolean>
  engine: string
  startedAt: string
  finishedAt?: string
  status: PipelineStepStatus
}

export interface GenerationMetadata {
  id: string
  providerId: string
  modelId: string
  request: Record<string, string | number | boolean>
  normalizedCapabilitiesSnapshot: string[]
  providerTaskId?: string
  timestamps: {
    requestedAt: string
    completedAt?: string
  }
}

export interface JobRecord {
  id: string
  label: string
  assetId: string
  status: JobStatus
  progressPercent: number
  detail: string
}

export interface WorkspaceSnapshot {
  project: Project
  assets: Asset[]
  imageResources: ImageResource[]
  variants: AssetVariant[]
  pipelineSteps: PipelineStep[]
  generationMetadata: GenerationMetadata[]
  jobs: JobRecord[]
}
