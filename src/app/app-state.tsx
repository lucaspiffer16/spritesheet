import { createContext } from 'preact'
import type { ComponentChildren } from 'preact'
import JSZip from 'jszip'
import { useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type {
  Asset,
  AssetVariant,
  GenerationMetadata,
  ImageResource,
  JobRecord,
  PipelineStep,
  WorkspaceSnapshot,
} from '../domain/models'
import {
  BrowserSecretStore,
  IndexedDbWorkspaceRepository,
  LocalPreferencesStore,
} from '../persistence/browser-storage'
import {
  createSpriteSheet,
  pixelateImage,
  quantizeImage,
  removeLightBackground,
} from '../processing/local-image'
import { detectGrid } from '../processing/grid-detection'
import type { GridDetectionResult } from '../processing/grid-detection'
import { WorkerProcessingService } from '../processing/worker-processing'
import { getProviderById, listProviderSummaries } from '../providers/registry'
import type {
  GenerationRequest,
  ProviderCapabilities,
  ProviderCredential,
  ProviderModel,
  ProviderSummary,
} from '../providers/types'

interface AppStateValue {
  workspace: WorkspaceSnapshot | null
  providerSummaries: ProviderSummary[]
  selectedProviderId: string
  selectedModelId: string
  availableModels: ProviderModel[]
  selectedProviderCapabilities: ProviderCapabilities | null
  generationOptions: Record<string, string>
  selectedAsset: Asset | null
  selectedAssetVariants: WorkspaceSnapshot['variants']
  selectedAssetSteps: WorkspaceSnapshot['pipelineSteps']
  providerCredentialMode: ProviderCredential['persistence']
  providerCredentialAvailable: boolean
  providerError: string | null
  generationPrompt: string
  generationStatus: 'idle' | 'running' | 'completed' | 'failed'
  activeProcessingLabel: string | null
  canUndo: boolean
  pixelArtScalePercent: number
  paletteSize: number
  ditheringEnabled: boolean
  isBooting: boolean
  gridDetectionResult: GridDetectionResult | null
  gridDetectionError: string | null
  selectAsset(assetId: string): void
  removeAsset(assetId: string): Promise<void>
  renameSelectedAsset(name: string): void
  selectProvider(providerId: string): void
  selectModel(modelId: string): void
  setGenerationPrompt(prompt: string): void
  setGenerationOption(key: string, value: string): void
  setPixelArtScalePercent(size: number): void
  setPaletteSize(size: number): void
  setDitheringEnabled(enabled: boolean): void
  saveCredential(apiKey: string, persistence: ProviderCredential['persistence']): Promise<void>
  generateImage(): Promise<void>
  importFiles(files: FileList | null): Promise<void>
  removeBackground(): Promise<void>
  detectGrid(): Promise<void>
  applyPixelArt(): Promise<void>
  undoLastEdit(): Promise<void>
  exportCurrentVariant(): Promise<void>
  exportSpriteSheet(): Promise<void>
  exportZipPackage(): Promise<void>
  queueComparison(): Promise<void>
  queueExport(): Promise<void>
}

const AppStateContext = createContext<AppStateValue | null>(null)

const workspaceRepository = new IndexedDbWorkspaceRepository()
const preferencesStore = new LocalPreferencesStore()
const secretStore = new BrowserSecretStore()
const processingService = new WorkerProcessingService()

function defaultOptionsForModel(modelId: string): Record<string, string> {
  if (modelId === 'gpt-image-2') {
    return {
      resolution: '1K',
      aspectRatio: '1:1',
    }
  }

  if (modelId === 'gpt-image-1-5') {
    return {
      aspectRatio: '1:1',
      quality: 'medium',
    }
  }

  if (modelId === 'seedream-3') {
    return {
      imageSize: 'square_hd',
      guidanceScale: '2.5',
      seed: '42',
    }
  }

  if (modelId === 'flux-2-flex') {
    return {
      aspectRatio: '1:1',
      resolution: '1K',
    }
  }

  if (modelId === 'qwen-text-to-image') {
    return {
      imageSize: 'square_hd',
      guidanceScale: '2.5',
      seed: '42',
      negativePrompt: '',
      outputFormat: 'png',
    }
  }

  if (modelId === 'ideogram-v3') {
    return {
      renderingSpeed: 'BALANCED',
      style: 'AUTO',
      expandPrompt: 'true',
      imageSize: 'square_hd',
      seed: '42',
      negativePrompt: '',
    }
  }

  if (modelId === 'google-nano-banana') {
    return {
      outputFormat: 'png',
      aspectRatio: '1:1',
    }
  }

  if (modelId === 'google-nano-banana-2') {
    return {
      aspectRatio: 'auto',
      resolution: '1K',
      outputFormat: 'png',
    }
  }

  if (modelId === 'grok-imagine') {
    return {
      aspectRatio: '1:1',
      enablePro: 'false',
    }
  }

  return {
    negativePrompt: '',
    seed: '42',
    aspectRatio: '1:1',
  }
}

function normalizeProviderOptions(options: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => {
      if (value.trim() !== '' && !Number.isNaN(Number(value)) && /^-?\d+(\.\d+)?$/.test(value)) {
        return [key, Number(value)]
      }

      return [key, value]
    }),
  ) as Record<string, string | number | boolean>
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read blob'))
    reader.readAsDataURL(blob)
  })
}

async function fetchImageAsDataUrl(sourceUrl: string) {
  const response = await fetch(sourceUrl)

  if (!response.ok) {
    throw new Error('Unable to download generated image for local processing')
  }

  const blob = await response.blob()
  return blobToDataUrl(blob)
}

function loadImageDimensions(sourceUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Unable to load image dimensions'))
    image.src = sourceUrl
  })
}

export function AppStateProvider(props: { children: ComponentChildren }) {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState('kie')
  const [selectedModelId, setSelectedModelId] = useState('gpt-image-2')
  const [availableModels, setAvailableModels] = useState<ProviderModel[]>([])
  const [selectedProviderCapabilities, setSelectedProviderCapabilities] =
    useState<ProviderCapabilities | null>(null)
  const [generationOptions, setGenerationOptions] = useState<Record<string, string>>(
    defaultOptionsForModel('gpt-image-2'),
  )
  const [providerCredentialMode, setProviderCredentialMode] = useState<ProviderCredential['persistence']>('session')
  const [providerCredentialAvailable, setProviderCredentialAvailable] = useState(false)
  const [providerError, setProviderError] = useState<string | null>(null)
  const [generationPrompt, setGenerationPrompt] = useState(
    'A friendly forest familiar, full-body concept art, game-ready silhouette, clean readable shapes.',
  )
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [activeProcessingLabel, setActiveProcessingLabel] = useState<string | null>(null)
  const [pixelArtScalePercent, setPixelArtScalePercent] = useState(25)
  const [paletteSize, setPaletteSize] = useState(32)
  const [ditheringEnabled, setDitheringEnabled] = useState(false)
  const [gridDetectionResult, setGridDetectionResult] = useState<GridDetectionResult | null>(null)
  const [gridDetectionError, setGridDetectionError] = useState<string | null>(null)
  const [isBooting, setIsBooting] = useState(true)
  const workspaceRef = useRef<WorkspaceSnapshot | null>(null)

  const providerSummaries = useMemo(() => listProviderSummaries(), [])

  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  useEffect(() => {
    let active = true

    async function boot() {
      const [loadedWorkspace, providerSettings] = await Promise.all([
        workspaceRepository.loadWorkspace(),
        preferencesStore.loadProviderSettings(),
      ])

      if (!active) {
        return
      }

      setWorkspace(loadedWorkspace)

      if (providerSettings) {
        setSelectedProviderId(providerSettings.providerId)
        setSelectedModelId(providerSettings.modelId)
      }

      setIsBooting(false)
    }

    void boot()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const provider = getProviderById(selectedProviderId)

    async function loadProviderContext() {
      if (!provider) {
        return
      }

      const [models, storedCredential] = await Promise.all([
        provider.listModels(),
        secretStore.load(selectedProviderId),
      ])

      if (!active) {
        return
      }

      setAvailableModels(models)

      const selectedModelExists = models.some((model) => model.id === selectedModelId)
      const nextModelId = selectedModelExists ? selectedModelId : (models[0]?.id ?? '')

      setSelectedModelId(nextModelId)

      const nextCapabilities = await provider.getModelCapabilities(nextModelId)

      if (!active) {
        return
      }

      setSelectedProviderCapabilities(nextCapabilities)
      setGenerationOptions((current) => ({
        ...defaultOptionsForModel(nextModelId),
        ...current,
      }))
      setProviderCredentialAvailable(Boolean(storedCredential?.apiKey))
      setProviderCredentialMode(storedCredential?.persistence ?? 'session')

      await preferencesStore.saveProviderSettings({
        providerId: selectedProviderId,
        modelId: nextModelId,
      })
    }

    void loadProviderContext()

    return () => {
      active = false
    }
  }, [selectedModelId, selectedProviderId])

  const selectedAsset = useMemo(() => {
    if (!workspace) {
      return null
    }

    return workspace.assets.find((asset) => asset.id === workspace.project.activeAssetId) ?? null
  }, [workspace])

  const selectedAssetVariants = useMemo(() => {
    if (!workspace || !selectedAsset) {
      return []
    }

    return workspace.variants.filter((variant) => variant.assetId === selectedAsset.id)
  }, [selectedAsset, workspace])

  const selectedAssetSteps = useMemo(() => {
    if (!workspace || !selectedAsset) {
      return []
    }

    return workspace.pipelineSteps.filter((step) => step.assetId === selectedAsset.id)
  }, [selectedAsset, workspace])

  const canUndo = useMemo(() => {
    const latestStep = selectedAssetSteps.at(-1)
    return Boolean(latestStep && latestStep.type !== 'generation' && latestStep.inputVariantIds.length > 0)
  }, [selectedAssetSteps])

  async function persistWorkspace(nextWorkspace: WorkspaceSnapshot) {
    workspaceRef.current = nextWorkspace
    setWorkspace(nextWorkspace)
    await workspaceRepository.saveWorkspace(nextWorkspace)
  }

  async function appendJob(job: JobRecord) {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace) {
      return
    }

    const nextWorkspace: WorkspaceSnapshot = {
      ...currentWorkspace,
      jobs: [job, ...currentWorkspace.jobs],
    }

    await persistWorkspace(nextWorkspace)
  }

  async function updateJob(jobId: string, nextStatus: JobRecord['status'], progressPercent: number, detail: string) {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace) {
      return
    }

    const nextWorkspace: WorkspaceSnapshot = {
      ...currentWorkspace,
      jobs: currentWorkspace.jobs.map((job) =>
        job.id === jobId ? { ...job, status: nextStatus, progressPercent, detail } : job,
      ),
    }

    await persistWorkspace(nextWorkspace)
  }

  function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  function getLatestVariant(asset: Asset, currentWorkspace: WorkspaceSnapshot) {
    const variants = currentWorkspace.variants.filter((variant) => variant.assetId === asset.id)
    return variants.at(-1) ?? null
  }

  async function appendDerivedVariant(input: {
    asset: Asset
    label: string
    stepType: PipelineStep['type']
    engine: string
    parameters: Record<string, string | number | boolean>
    sourceUrl: string
    width: number
    height: number
    exportable: boolean
    comparisonGroupId?: string
  }) {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace) {
      return
    }

    const timestamp = new Date().toISOString()
    const imageResourceId = createId('image')
    const variantId = createId('variant')
    const stepId = createId('step')

    const imageResource: ImageResource = {
      id: imageResourceId,
      blobKey: imageResourceId,
      width: input.width,
      height: input.height,
      mimeType: 'image/png',
      createdAt: timestamp,
      sourceUrl: input.sourceUrl,
    }

    const latestVariant = getLatestVariant(input.asset, currentWorkspace)

    const variant: AssetVariant = {
      id: variantId,
      assetId: input.asset.id,
      imageResourceId,
      label: input.label,
      originStepId: stepId,
      isExportable: input.exportable,
      comparisonGroupId: input.comparisonGroupId,
    }

    const step: PipelineStep = {
      id: stepId,
      assetId: input.asset.id,
      type: input.stepType,
      inputVariantIds: latestVariant ? [latestVariant.id] : [],
      outputVariantIds: [variantId],
      parameters: input.parameters,
      engine: input.engine,
      startedAt: timestamp,
      finishedAt: timestamp,
      status: 'completed',
    }

    const nextWorkspace: WorkspaceSnapshot = {
      ...currentWorkspace,
      project: {
        ...currentWorkspace.project,
        activeAssetId: input.asset.id,
        updatedAt: timestamp,
      },
      assets: currentWorkspace.assets.map((asset) =>
        asset.id === input.asset.id
          ? {
              ...asset,
              variantIds: [...asset.variantIds, variantId],
              pipelineStepIds: [...asset.pipelineStepIds, stepId],
            }
          : asset,
      ),
      imageResources: [...currentWorkspace.imageResources, imageResource],
      variants: [...currentWorkspace.variants, variant],
      pipelineSteps: [...currentWorkspace.pipelineSteps, step],
    }

    await persistWorkspace(nextWorkspace)
  }

  async function ensureProcessableSourceUrl(imageResource: ImageResource) {
    if (!imageResource.sourceUrl) {
      throw new Error('No image available to process')
    }

    if (
      imageResource.sourceUrl.startsWith('data:') ||
      imageResource.sourceUrl.startsWith('blob:')
    ) {
      return imageResource.sourceUrl
    }

    const localSourceUrl = await fetchImageAsDataUrl(imageResource.sourceUrl)
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace) {
      return localSourceUrl
    }

    const nextWorkspace: WorkspaceSnapshot = {
      ...currentWorkspace,
      imageResources: currentWorkspace.imageResources.map((resource) =>
        resource.id === imageResource.id ? { ...resource, sourceUrl: localSourceUrl } : resource,
      ),
    }

    await persistWorkspace(nextWorkspace)
    return localSourceUrl
  }

  function selectAsset(assetId: string) {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace) {
      return
    }

    const nextWorkspace: WorkspaceSnapshot = {
      ...currentWorkspace,
      project: {
        ...currentWorkspace.project,
        activeAssetId: assetId,
        updatedAt: new Date().toISOString(),
      },
    }

    void persistWorkspace(nextWorkspace)
  }

  function renameSelectedAsset(name: string) {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace || !selectedAsset) {
      return
    }

    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    const nextWorkspace: WorkspaceSnapshot = {
      ...currentWorkspace,
      project: {
        ...currentWorkspace.project,
        updatedAt: new Date().toISOString(),
      },
      assets: currentWorkspace.assets.map((asset) =>
        asset.id === selectedAsset.id ? { ...asset, name: trimmedName } : asset,
      ),
    }

    void persistWorkspace(nextWorkspace)
  }

  async function removeAsset(assetId: string) {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace) {
      return
    }

    const assetToRemove = currentWorkspace.assets.find((asset) => asset.id === assetId)

    if (!assetToRemove) {
      return
    }

    if (currentWorkspace.assets.length <= 1) {
      setProviderError('At least one asset must remain in the project')
      return
    }

    const variantIdsToRemove = currentWorkspace.variants
      .filter((variant) => variant.assetId === assetToRemove.id)
      .map((variant) => variant.id)

    const imageResourceIdsToRemove = currentWorkspace.variants
      .filter((variant) => variant.assetId === assetToRemove.id)
      .map((variant) => variant.imageResourceId)

    const stepIdsToRemove = currentWorkspace.pipelineSteps
      .filter((step) => step.assetId === assetToRemove.id)
      .map((step) => step.id)

    const nextAssets = currentWorkspace.assets.filter((asset) => asset.id !== assetToRemove.id)
    const nextActiveAssetId =
      currentWorkspace.project.activeAssetId === assetToRemove.id
        ? (nextAssets[0]?.id ?? currentWorkspace.project.activeAssetId)
        : currentWorkspace.project.activeAssetId

    const nextWorkspace: WorkspaceSnapshot = {
      ...currentWorkspace,
      project: {
        ...currentWorkspace.project,
        activeAssetId: nextActiveAssetId,
        assetIds: currentWorkspace.project.assetIds.filter((currentAssetId) => currentAssetId !== assetToRemove.id),
        updatedAt: new Date().toISOString(),
      },
      assets: nextAssets,
      variants: currentWorkspace.variants.filter((variant) => !variantIdsToRemove.includes(variant.id)),
      imageResources: currentWorkspace.imageResources.filter(
        (imageResource) => !imageResourceIdsToRemove.includes(imageResource.id),
      ),
      pipelineSteps: currentWorkspace.pipelineSteps.filter((step) => !stepIdsToRemove.includes(step.id)),
      generationMetadata: currentWorkspace.generationMetadata.filter(
        (metadata) => metadata.id !== assetToRemove.generationMetadataId,
      ),
      jobs: currentWorkspace.jobs.filter((job) => job.assetId !== assetToRemove.id),
    }

    await persistWorkspace(nextWorkspace)
  }

  function selectProvider(providerId: string) {
    setProviderError(null)
    setSelectedProviderId(providerId)
  }

  function selectModel(modelId: string) {
    setProviderError(null)
    setSelectedModelId(modelId)
    setGenerationOptions(defaultOptionsForModel(modelId))
    void preferencesStore.saveProviderSettings({
      providerId: selectedProviderId,
      modelId,
    })
  }

  function setGenerationOption(key: string, value: string) {
    setGenerationOptions((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function setPixelArtScalePercentValue(size: number) {
    setPixelArtScalePercent(Math.max(1, Math.min(100, size)))
  }

  function setPaletteSizeValue(size: number) {
    setPaletteSize(Math.max(2, Math.min(256, size)))
  }

  async function saveCredential(apiKey: string, persistence: ProviderCredential['persistence']) {
    const provider = getProviderById(selectedProviderId)

    if (!provider) {
      setProviderError('Selected provider is unavailable')
      return
    }

    const credential = { apiKey, persistence } satisfies ProviderCredential
    const isValid = await provider.validateCredential(credential)

    if (!isValid) {
      setProviderError('Provider credential is invalid or has no available access')
      setProviderCredentialAvailable(false)
      return
    }

    await secretStore.save(selectedProviderId, credential)
    setProviderError(null)
    setProviderCredentialAvailable(Boolean(apiKey.trim()))
    setProviderCredentialMode(persistence)
  }

  async function generateImage() {
    const currentWorkspace = workspaceRef.current
    const provider = getProviderById(selectedProviderId)

    if (!currentWorkspace || !provider) {
      return
    }

    const credential = await secretStore.load(selectedProviderId)

    if (!credential?.apiKey) {
      setProviderError('Configure a valid provider credential before generating')
      setGenerationStatus('failed')
      return
    }

    setGenerationStatus('running')
    setProviderError(null)

    const request: GenerationRequest = {
      modelId: selectedModelId,
      mode: 'text-to-image',
      prompt: generationPrompt,
      rawOptions: normalizeProviderOptions(generationOptions),
    }

    const jobId = createId('job-generation')
    await appendJob({
      id: jobId,
      assetId: currentWorkspace.project.activeAssetId,
      label: `Generation: ${selectedModelId}`,
      status: 'running',
      progressPercent: 8,
      detail: 'Submitting provider task',
    })

    try {
      const task = await provider.generateImage(credential, request)
      await updateJob(jobId, 'running', 20, `Polling task ${task.taskId}`)

      let status = await provider.getTaskStatus(credential, task.taskId)
      let attempts = 0

      while (status.status !== 'completed' && attempts < 40) {
        attempts += 1
        await new Promise((resolve) => {
          window.setTimeout(resolve, 3000)
        })
        await updateJob(jobId, 'running', Math.min(20 + attempts * 2, 96), 'Waiting for provider result')
        status = await provider.getTaskStatus(credential, task.taskId)
      }

      const result = await provider.getResult(credential, task.taskId)
      const timestamp = new Date().toISOString()
      const localSourceUrl = await fetchImageAsDataUrl(result.imageUrl)
      const dimensions = await loadImageDimensions(localSourceUrl)
      const imageResourceId = createId('image')
      const variantId = createId('variant')
      const stepId = createId('step')
      const assetId = createId('asset')
      const metadataId = createId('generation')

      const imageResource: ImageResource = {
        id: imageResourceId,
        blobKey: imageResourceId,
        width: dimensions.width,
        height: dimensions.height,
        mimeType: 'image/png',
        createdAt: timestamp,
        sourceUrl: localSourceUrl,
      }

      const variant: AssetVariant = {
        id: variantId,
        assetId,
        imageResourceId,
        label: `${selectedModelId} output`,
        originStepId: stepId,
        isExportable: false,
      }

      const pipelineStep: PipelineStep = {
        id: stepId,
        assetId,
        type: 'generation',
        inputVariantIds: [],
        outputVariantIds: [variantId],
        parameters: {
          promptLength: generationPrompt.length,
          modelId: selectedModelId,
        },
        engine: `kie:${selectedModelId}`,
        startedAt: timestamp,
        finishedAt: timestamp,
        status: 'completed',
      }

      const metadata: GenerationMetadata = {
        id: metadataId,
        providerId: selectedProviderId,
        modelId: selectedModelId,
        request: {
          prompt: generationPrompt,
          ...request.rawOptions,
        },
        normalizedCapabilitiesSnapshot:
          selectedProviderCapabilities?.parameters.map((parameter) => parameter.key) ?? [],
        providerTaskId: task.taskId,
        timestamps: {
          requestedAt: timestamp,
          completedAt: timestamp,
        },
      }

      const asset: Asset = {
        id: assetId,
        projectId: currentWorkspace.project.id,
        kind: 'generated',
        name: `Generated ${selectedModelId}`,
        sourceImageId: imageResourceId,
        variantIds: [variantId],
        pipelineStepIds: [stepId],
        generationMetadataId: metadataId,
        tags: ['generated', selectedProviderId],
      }

      const nextWorkspace: WorkspaceSnapshot = {
        ...currentWorkspace,
        project: {
          ...currentWorkspace.project,
          activeAssetId: assetId,
          assetIds: [assetId, ...currentWorkspace.project.assetIds],
          updatedAt: timestamp,
        },
        assets: [asset, ...currentWorkspace.assets],
        imageResources: [imageResource, ...currentWorkspace.imageResources],
        variants: [variant, ...currentWorkspace.variants],
        pipelineSteps: [pipelineStep, ...currentWorkspace.pipelineSteps],
        generationMetadata: [metadata, ...currentWorkspace.generationMetadata],
        jobs: currentWorkspace.jobs,
      }

      await persistWorkspace(nextWorkspace)
      await updateJob(jobId, 'completed', 100, 'Generation finished and stored locally')
      setGenerationStatus('completed')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed'
      setProviderError(message)
      setGenerationStatus('failed')
      await updateJob(jobId, 'failed', 100, message)
    }
  }

  async function importFiles(files: FileList | null) {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace || !files?.length) {
      return
    }

    const importedAssets: Asset[] = []
    const importedImages: ImageResource[] = []
    const importedVariants: AssetVariant[] = []
    const importedSteps: PipelineStep[] = []
    let activeAssetId = currentWorkspace.project.activeAssetId

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        continue
      }

      const sourceUrl = await fileToDataUrl(file)
      const dimensions = await loadImageDimensions(sourceUrl)
      const timestamp = new Date().toISOString()
      const imageResourceId = createId('image')
      const variantId = createId('variant')
      const stepId = createId('step')
      const assetId = createId('asset')

      importedImages.push({
        id: imageResourceId,
        blobKey: imageResourceId,
        width: dimensions.width,
        height: dimensions.height,
        mimeType: file.type || 'image/png',
        createdAt: timestamp,
        sourceUrl,
      })

      importedVariants.push({
        id: variantId,
        assetId,
        imageResourceId,
        label: 'Uploaded Source',
        originStepId: stepId,
        isExportable: true,
      })

      importedSteps.push({
        id: stepId,
        assetId,
        type: 'resize',
        inputVariantIds: [],
        outputVariantIds: [variantId],
        parameters: { imported: true },
        engine: 'browser:file-import',
        startedAt: timestamp,
        finishedAt: timestamp,
        status: 'completed',
      })

      importedAssets.push({
        id: assetId,
        projectId: currentWorkspace.project.id,
        kind: 'uploaded',
        name: file.name.replace(/\.[^.]+$/, ''),
        sourceImageId: imageResourceId,
        variantIds: [variantId],
        pipelineStepIds: [stepId],
        tags: ['uploaded'],
      })

      activeAssetId = assetId
    }

    if (!importedAssets.length) {
      return
    }

    const timestamp = new Date().toISOString()
    const nextWorkspace: WorkspaceSnapshot = {
      ...currentWorkspace,
      project: {
        ...currentWorkspace.project,
        activeAssetId,
        assetIds: [...currentWorkspace.project.assetIds, ...importedAssets.map((asset) => asset.id)],
        updatedAt: timestamp,
      },
      assets: [...currentWorkspace.assets, ...importedAssets],
      imageResources: [...currentWorkspace.imageResources, ...importedImages],
      variants: [...currentWorkspace.variants, ...importedVariants],
      pipelineSteps: [...currentWorkspace.pipelineSteps, ...importedSteps],
    }

    await persistWorkspace(nextWorkspace)
  }

  async function removeBackground() {
    try {
      setActiveProcessingLabel('Removing background')
      const currentWorkspace = workspaceRef.current

      if (!currentWorkspace || !selectedAsset) {
        return
      }

      const latestVariant = getLatestVariant(selectedAsset, currentWorkspace)
      const sourceImage = currentWorkspace.imageResources.find(
        (imageResource) => imageResource.id === latestVariant?.imageResourceId,
      )

      if (!sourceImage) {
        throw new Error('No image available to process')
      }

      const processableSourceUrl = await ensureProcessableSourceUrl(sourceImage)
      const result = await removeLightBackground(processableSourceUrl)
      await appendDerivedVariant({
        asset: selectedAsset,
        label: 'Background Removed',
        stepType: 'background-removal',
        engine: 'local:light-background-removal',
        parameters: { threshold: 240 },
        sourceUrl: result.dataUrl,
        width: result.width,
        height: result.height,
        exportable: true,
      })
      setProviderError(null)
    } catch (error) {
      setProviderError(error instanceof Error ? error.message : 'Could not remove background')
    } finally {
      setActiveProcessingLabel(null)
    }
  }

  async function detectGridAction() {
    try {
      setActiveProcessingLabel('Detecting pixel grid')
      setGridDetectionResult(null)
      setGridDetectionError(null)

      const currentWorkspace = workspaceRef.current
      if (!currentWorkspace || !selectedAsset) {
        return
      }

      const latestVariant = getLatestVariant(selectedAsset, currentWorkspace)
      const sourceImage = currentWorkspace.imageResources.find(
        (imageResource) => imageResource.id === latestVariant?.imageResourceId,
      )

      if (!sourceImage) {
        throw new Error('No image available to analyze')
      }

      const processableSourceUrl = await ensureProcessableSourceUrl(sourceImage)
      const result = await detectGrid(processableSourceUrl)

      setGridDetectionResult(result)
      setProviderError(null)
    } catch (error) {
      setGridDetectionResult(null)
      setGridDetectionError(error instanceof Error ? error.message : 'Grid detection failed')
      setProviderError(null)
    } finally {
      setActiveProcessingLabel(null)
    }
  }

  async function applyPixelArt() {
    try {
      setActiveProcessingLabel('Turning into pixel art')
      const currentWorkspace = workspaceRef.current

      if (!currentWorkspace || !selectedAsset) {
        return
      }

      const latestVariant = getLatestVariant(selectedAsset, currentWorkspace)
      const sourceImage = currentWorkspace.imageResources.find(
        (imageResource) => imageResource.id === latestVariant?.imageResourceId,
      )

      if (!sourceImage) {
        throw new Error('No image available to process')
      }

      const processableSourceUrl = await ensureProcessableSourceUrl(sourceImage)
      const pixelated = await pixelateImage(processableSourceUrl, pixelArtScalePercent / 100)
      const result = await quantizeImage(pixelated.dataUrl, paletteSize, ditheringEnabled)
      await appendDerivedVariant({
        asset: selectedAsset,
        label: `Pixel Art ${pixelArtScalePercent}% / ${paletteSize} colors`,
        stepType: 'quantization',
        engine: 'local:pixel-art-pipeline',
        parameters: { resizePercent: pixelArtScalePercent, paletteSize, dithering: ditheringEnabled },
        sourceUrl: result.dataUrl,
        width: result.width,
        height: result.height,
        exportable: true,
      })
      setProviderError(null)
    } catch (error) {
      setProviderError(error instanceof Error ? error.message : 'Could not turn image into pixel art')
    } finally {
      setActiveProcessingLabel(null)
    }
  }

  async function undoLastEdit() {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace || !selectedAsset) {
      return
    }

    const assetSteps = currentWorkspace.pipelineSteps.filter((step) => step.assetId === selectedAsset.id)
    const latestStep = assetSteps.at(-1)

    if (!latestStep || latestStep.type === 'generation' || latestStep.inputVariantIds.length === 0) {
      return
    }

    const latestVariant = currentWorkspace.variants.find(
      (variant) => variant.id === latestStep.outputVariantIds.at(-1),
    )

    const comparisonGroupId = latestVariant?.comparisonGroupId

    const stepIdsToRemove = comparisonGroupId
      ? currentWorkspace.variants
          .filter((variant) => variant.assetId === selectedAsset.id && variant.comparisonGroupId === comparisonGroupId)
          .map((variant) => variant.originStepId)
      : [latestStep.id]

    const variantIdsToRemove = currentWorkspace.variants
      .filter((variant) => stepIdsToRemove.includes(variant.originStepId))
      .map((variant) => variant.id)

    const imageResourceIdsToRemove = currentWorkspace.variants
      .filter((variant) => variantIdsToRemove.includes(variant.id))
      .map((variant) => variant.imageResourceId)

    const nextWorkspace: WorkspaceSnapshot = {
      ...currentWorkspace,
      project: {
        ...currentWorkspace.project,
        updatedAt: new Date().toISOString(),
      },
      assets: currentWorkspace.assets.map((asset) =>
        asset.id === selectedAsset.id
          ? {
              ...asset,
              variantIds: asset.variantIds.filter((variantId) => !variantIdsToRemove.includes(variantId)),
              pipelineStepIds: asset.pipelineStepIds.filter((stepId) => !stepIdsToRemove.includes(stepId)),
            }
          : asset,
      ),
      variants: currentWorkspace.variants.filter((variant) => !variantIdsToRemove.includes(variant.id)),
      pipelineSteps: currentWorkspace.pipelineSteps.filter((step) => !stepIdsToRemove.includes(step.id)),
      imageResources: currentWorkspace.imageResources.filter(
        (imageResource) => !imageResourceIdsToRemove.includes(imageResource.id),
      ),
    }

    await persistWorkspace(nextWorkspace)
  }

  async function exportCurrentVariant() {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace || !selectedAsset) {
      return
    }

    const latestVariant = getLatestVariant(selectedAsset, currentWorkspace)
    const sourceImage = currentWorkspace.imageResources.find(
      (imageResource) => imageResource.id === latestVariant?.imageResourceId,
    )

    if (!sourceImage?.sourceUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = sourceImage.sourceUrl
    link.download = `${selectedAsset.name.replace(/\s+/g, '-').toLowerCase()}.png`
    link.click()
  }

  async function exportSpriteSheet() {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace || !selectedAsset) {
      return
    }

    const sourceUrls = currentWorkspace.variants
      .filter((variant) => variant.assetId === selectedAsset.id && variant.isExportable)
      .map((variant) =>
        currentWorkspace.imageResources.find((imageResource) => imageResource.id === variant.imageResourceId),
      )
      .filter((imageResource): imageResource is ImageResource => Boolean(imageResource?.sourceUrl))
      .map((imageResource) => imageResource.sourceUrl as string)

    if (!sourceUrls.length) {
      return
    }

    const result = await createSpriteSheet(sourceUrls)
    const link = document.createElement('a')
    link.href = result.dataUrl
    link.download = `${selectedAsset.name.replace(/\s+/g, '-').toLowerCase()}-sheet.png`
    link.click()
  }

  async function exportZipPackage() {
    const currentWorkspace = workspaceRef.current

    if (!currentWorkspace || !selectedAsset) {
      return
    }

    const exportableVariants = currentWorkspace.variants.filter(
      (variant) => variant.assetId === selectedAsset.id && variant.isExportable,
    )

    if (!exportableVariants.length) {
      return
    }

    const zip = new JSZip()

    for (const variant of exportableVariants) {
      const imageResource = currentWorkspace.imageResources.find(
        (resource) => resource.id === variant.imageResourceId,
      )

      if (!imageResource?.sourceUrl) {
        continue
      }

      const response = await fetch(imageResource.sourceUrl)
      const blob = await response.blob()
      const safeName = variant.label.replace(/\s+/g, '-').toLowerCase()
      zip.file(`${safeName}.png`, blob)
    }

    const archive = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(archive)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedAsset.name.replace(/\s+/g, '-').toLowerCase()}.zip`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function queueComparison() {
    if (!workspace || !selectedAsset) {
      return
    }

    const job = await processingService.queueComparison(workspace, selectedAsset.id)
    await appendJob(job)
    await processingService.runJob('comparison', selectedAsset.id, (update) => {
      void updateJob(job.id, update.status, update.progressPercent, update.detail)
    })
  }

  async function queueExport() {
    if (!workspace || !selectedAsset) {
      return
    }

    const job = await processingService.queueExport(workspace, selectedAsset.id)
    await appendJob(job)
    await processingService.runJob('export', selectedAsset.id, (update) => {
      void updateJob(job.id, update.status, update.progressPercent, update.detail)
    })
  }

  const value = useMemo<AppStateValue>(
    () => ({
      workspace,
      providerSummaries,
      selectedProviderId,
      selectedModelId,
      availableModels,
      selectedProviderCapabilities,
      generationOptions,
      selectedAsset,
      selectedAssetVariants,
      selectedAssetSteps,
      providerCredentialMode,
      providerCredentialAvailable,
      providerError,
      generationPrompt,
      generationStatus,
      activeProcessingLabel,
      canUndo,
      pixelArtScalePercent,
      paletteSize,
      ditheringEnabled,
      gridDetectionResult,
      gridDetectionError,
      isBooting,
      removeAsset,
      selectAsset,
      renameSelectedAsset,
      selectProvider,
      selectModel,
      setGenerationPrompt,
      setGenerationOption,
      setPixelArtScalePercent: setPixelArtScalePercentValue,
      setPaletteSize: setPaletteSizeValue,
      setDitheringEnabled,
      saveCredential,
      generateImage,
      importFiles,
      removeBackground,
      detectGrid: detectGridAction,
      applyPixelArt,
      undoLastEdit,
      exportCurrentVariant,
      exportSpriteSheet,
      exportZipPackage,
      queueComparison,
      queueExport,
    }),
    [
      availableModels,
      generationOptions,
      generationPrompt,
      generationStatus,
      activeProcessingLabel,
      canUndo,
      isBooting,
      removeAsset,
      selectedAsset,
      pixelArtScalePercent,
      paletteSize,
      ditheringEnabled,
      gridDetectionResult,
      gridDetectionError,
      providerCredentialAvailable,
      providerCredentialMode,
      providerError,
      providerSummaries,
      selectedAsset,
      selectedAssetSteps,
      selectedAssetVariants,
      selectedModelId,
      selectedProviderCapabilities,
      selectedProviderId,
      workspace,
    ],
  )

  return <AppStateContext.Provider value={value}>{props.children}</AppStateContext.Provider>
}

export function useAppState() {
  const value = useContext(AppStateContext)

  if (!value) {
    throw new Error('useAppState must be used within AppStateProvider')
  }

  return value
}
