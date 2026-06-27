import { useEffect, useRef, useState } from 'preact/hooks'
import type { Asset, AssetVariant, ImageResource, WorkspaceSnapshot } from '../domain/models'
import { useAppState } from './app-state'

function formatKindLabel(kind: Asset['kind']) {
  return kind === 'generated' ? 'Generated' : 'Uploaded'
}

function getAssetVariants(workspace: WorkspaceSnapshot, assetId: string) {
  return workspace.variants.filter((variant) => variant.assetId === assetId)
}

function getCurrentVariant(variants: AssetVariant[]) {
  return variants.at(-1) ?? null
}

function getImageResource(workspace: WorkspaceSnapshot, imageResourceId: string | undefined) {
  if (!imageResourceId) {
    return null
  }

  return workspace.imageResources.find((imageResource) => imageResource.id === imageResourceId) ?? null
}

function groupModelsByCategory(models: Array<{ id: string; name: string; category: string }>) {
  const groups = new Map<string, Array<{ id: string; name: string }>>()

  models.forEach((model) => {
    const existing = groups.get(model.category) ?? []
    existing.push({ id: model.id, name: model.name })
    groups.set(model.category, existing)
  })

  return Array.from(groups.entries())
}

export function AppShell() {
  const {
    availableModels,
    activeProcessingLabel,
    applyPixelArt,
    canUndo,
    detectGrid,
    ditheringEnabled,
    gridDetectionResult,
    gridDetectionError,
    exportCurrentVariant,
    exportSpriteSheet,
    exportZipPackage,
    generateImage,
    generationOptions,
    generationPrompt,
    generationStatus,
    importFiles,
    isBooting,
    pixelArtScalePercent,
    paletteSize,
    providerCredentialAvailable,
    providerCredentialMode,
    providerError,
    providerSummaries,
    removeAsset,
    removeBackground,
    saveCredential,
    selectedAsset,
    selectedAssetVariants,
    selectedModelId,
    selectedProviderCapabilities,
    selectedProviderId,
    selectAsset,
    selectModel,
    selectProvider,
    renameSelectedAsset,
    setDitheringEnabled,
    setGenerationOption,
    setGenerationPrompt,
    setPixelArtScalePercent,
    setPaletteSize,
    workspace,
    undoLastEdit,
  } = useAppState()
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [assetNameDraft, setAssetNameDraft] = useState('')
  const [lightboxImage, setLightboxImage] = useState<ImageResource | null>(null)
  const [assetPendingDelete, setAssetPendingDelete] = useState<Asset | null>(null)

  if (isBooting || !workspace || !selectedAsset) {
    return (
      <div class="shell">
        <section class="panel boot-panel">
          <p class="eyebrow">Booting workspace</p>
          <h1>Loading local-first studio</h1>
        </section>
      </div>
    )
  }

  const groupedModels = groupModelsByCategory(availableModels)
  const currentVariant = getCurrentVariant(selectedAssetVariants)
  const sourceImage = getImageResource(workspace, selectedAsset.sourceImageId)
  const variantImage = getImageResource(workspace, currentVariant?.imageResourceId)
  const isProcessing = activeProcessingLabel !== null

  useEffect(() => {
    setAssetNameDraft(selectedAsset.name)
  }, [selectedAsset.name])

  return (
    <div class="shell shell--sidebar-layout">
      <div class="workspace-shell">
        <aside class="panel sidebar sidebar--left">
          <div class="sidebar__scroll">
            <section class="sidebar-section">
              <div class="panel-heading">
                <div>
                  <p class="eyebrow">Project Assets</p>
                  <h2>Assets</h2>
                </div>
                <label class="ghost-button file-button">
                  Import
                  <input type="file" accept="image/*" multiple onChange={(event) => void importFiles(event.currentTarget.files)} />
                </label>
              </div>
            </section>

            <section class="sidebar-section asset-list" role="list" aria-label="Assets">
              {workspace.assets.map((asset) => {
                const variants = getAssetVariants(workspace, asset.id)
                const active = asset.id === selectedAsset.id

                return (
                  <button
                    key={asset.id}
                    type="button"
                    class={`asset-card${active ? ' is-active' : ''}`}
                    onClick={() => selectAsset(asset.id)}
                  >
                    <span class="asset-card__remove-wrap">
                      <span class="asset-card__kind">{formatKindLabel(asset.kind)}</span>
                      <span
                        class="asset-card__remove"
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation()
                          setAssetPendingDelete(asset)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            event.stopPropagation()
                            setAssetPendingDelete(asset)
                          }
                        }}
                      >
                        Remove
                      </span>
                    </span>
                    <strong>{asset.name}</strong>
                    <span>{variants.length} variants</span>
                    <span class="asset-card__tags">{asset.tags.join(' • ')}</span>
                  </button>
                )
              })}
            </section>
          </div>
        </aside>

        <main class="panel workspace-main">
          <div class="workspace-main__inner">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Selected Asset</p>
                <div class="title-edit">
                  <input
                    class="title-edit__input"
                    value={assetNameDraft}
                    onInput={(event) => setAssetNameDraft(event.currentTarget.value)}
                    onBlur={() => renameSelectedAsset(assetNameDraft)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        renameSelectedAsset(assetNameDraft)
                        event.currentTarget.blur()
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div class="preview-canvas" aria-label="Asset preview">
              <div class="preview-surface">
                <div class="preview-frame preview-frame--source">
                  <AssetPreview imageResource={sourceImage} fallbackLabel="Source" onOpen={setLightboxImage} />
                </div>
                <div class="preview-frame preview-frame--derived">
                  <AssetPreview imageResource={variantImage} fallbackLabel={currentVariant?.label ?? 'Variant'} onOpen={setLightboxImage} />
                </div>
              </div>
            </div>

            <section class="comparison-strip">
              <div class="section-heading">
                <h3>Versions</h3>
                <span>{selectedAssetVariants.length} saved</span>
              </div>
              <div class="variant-grid">
                {selectedAssetVariants.map((variant) => (
                  <article key={variant.id} class="variant-card">
                    <div class="variant-card__preview">
                      <AssetPreview
                        imageResource={getImageResource(workspace, variant.imageResourceId)}
                        fallbackLabel={variant.label}
                        compact
                        onOpen={setLightboxImage}
                      />
                  </div>
                  <strong>{variant.label}</strong>
                  <span>{variant.isExportable ? 'Ready to export' : 'Work in progress'}</span>
                </article>
              ))}
            </div>
            </section>
          </div>
        </main>

        <aside class="panel sidebar sidebar--right">
          <div class="sidebar__scroll">
            <section class="sidebar-section">
              <div class="section-heading">
                <h3>Generate Image</h3>
                <span>{selectedProviderId.toUpperCase()}</span>
              </div>
              <div class="field-stack">
                <label class="field">
                  <span class="label">Provider</span>
                  <select value={selectedProviderId} onChange={(event) => selectProvider(event.currentTarget.value)}>
                    {providerSummaries.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label class="field">
                  <span class="label">Model</span>
                  <select value={selectedModelId} onChange={(event) => selectModel(event.currentTarget.value)}>
                    {groupedModels.map(([category, models]) => (
                      <optgroup key={category} label={`${selectedProviderId.toUpperCase()} / ${category}`}>
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label class="field">
                  <span class="label">API Key</span>
                  <input
                    type="password"
                    value={apiKeyDraft}
                    placeholder={providerCredentialAvailable ? 'Stored locally or in session' : 'Paste provider key'}
                    onInput={(event) => setApiKeyDraft(event.currentTarget.value)}
                  />
                </label>
                <div class="inline-actions inline-actions--wrap">
                <button type="button" class="ghost-button" onClick={() => void saveCredential(apiKeyDraft, 'session')}>
                  Save In Session
                </button>
                  <button type="button" class="ghost-button" onClick={() => void saveCredential(apiKeyDraft, 'local')}>
                    Store Locally
                  </button>
                </div>
                <p class="muted">Credential mode: {providerCredentialAvailable ? providerCredentialMode : 'not configured'}</p>
                {providerError ? <p class="error-text">{providerError}</p> : null}
                <label class="field">
                  <span class="label">Prompt</span>
                  <textarea rows={5} value={generationPrompt} onInput={(event) => setGenerationPrompt(event.currentTarget.value)} />
                </label>
                {selectedProviderCapabilities?.parameters
                  .filter((parameter) => parameter.key !== 'prompt')
                  .map((parameter) => (
                    <label key={parameter.key} class="field">
                      <span class="label">{parameter.label}</span>
                      {parameter.type === 'select' ? (
                        <select value={generationOptions[parameter.key] ?? ''} onChange={(event) => setGenerationOption(parameter.key, event.currentTarget.value)}>
                          {(parameter.options ?? []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : parameter.type === 'boolean' ? (
                        <select value={generationOptions[parameter.key] ?? 'false'} onChange={(event) => setGenerationOption(parameter.key, event.currentTarget.value)}>
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      ) : (
                        <input type={parameter.type === 'number' ? 'number' : 'text'} value={generationOptions[parameter.key] ?? ''} onInput={(event) => setGenerationOption(parameter.key, event.currentTarget.value)} />
                      )}
                    </label>
                  ))}
                <button type="button" class="primary-button" disabled={generationStatus === 'running' || isProcessing} onClick={() => void generateImage()}>
                  {generationStatus === 'running' ? 'Generating...' : `Generate With ${selectedProviderId.toUpperCase()}`}
                </button>
              </div>
            </section>

            <section class="sidebar-section">
              <div class="section-heading">
                <h3>Transform</h3>
                <span>Processing</span>
              </div>
              <div class="action-card">
                <strong>1. Detect pixel grid</strong>
                <p class="muted">Analyzes the image with edge detection to find the underlying pixel-art resolution.</p>
                {gridDetectionResult ? (
                  <p class="grid-result">
                    <strong>Detected:</strong> {gridDetectionResult.gridWidth} × {gridDetectionResult.gridHeight} logical pixels<br />
                    <span class="muted">Original: {gridDetectionResult.originalWidth} × {gridDetectionResult.originalHeight}</span>
                  </p>
                ) : null}
                {gridDetectionError ? (
                  <p class="muted" style="color:#fca5a5">{gridDetectionError}</p>
                ) : null}
                <button
                  type="button"
                  class="ghost-button"
                  disabled={isProcessing || generationStatus === 'running'}
                  onClick={() => void detectGrid()}
                >
                  {activeProcessingLabel === 'Detecting pixel grid' ? 'Working...' : 'Detect Grid'}
                </button>
              </div>
              <div class="action-card">
                  <strong>1. Make background transparent</strong>
                  <p class="muted">Best when the image has a bright or plain background.</p>
                  <button type="button" class="primary-button" disabled={isProcessing || generationStatus === 'running'} onClick={() => void removeBackground()}>
                    {activeProcessingLabel === 'Removing background' ? 'Working...' : 'Remove Background'}
                  </button>
                </div>

                <div class="action-card">
                  <strong>2. Turn into pixel art</strong>
                  <p class="muted">Resize with nearest-neighbor, then reduce colors with optional dithering.</p>
                  <label class="field">
                    <span class="label">Resize %</span>
                    <input type="number" min={1} max={100} value={String(pixelArtScalePercent)} onInput={(event) => setPixelArtScalePercent(Number(event.currentTarget.value))} />
                  </label>
                  <label class="field">
                    <span class="label">Palette Size</span>
                    <input type="number" min={2} max={256} value={String(paletteSize)} onInput={(event) => setPaletteSize(Number(event.currentTarget.value))} />
                  </label>
                  <label class="toggle-field">
                    <input type="checkbox" checked={ditheringEnabled} onChange={(event) => setDitheringEnabled(event.currentTarget.checked)} />
                    <span>Floyd-Steinberg dithering</span>
                  </label>
                  <button type="button" class="ghost-button" disabled={isProcessing || generationStatus === 'running'} onClick={() => void applyPixelArt()}>
                    {activeProcessingLabel === 'Turning into pixel art' ? 'Working...' : 'Apply Pixel Art'}
                  </button>
                </div>
                {activeProcessingLabel ? <p class="muted">{activeProcessingLabel}</p> : null}
            </section>

            <section class="sidebar-section">
              <div class="section-heading">
                <h3>Export</h3>
                <span>Downloads</span>
              </div>
              <div class="inline-actions inline-actions--wrap">
                <button type="button" class="ghost-button" onClick={() => void exportCurrentVariant()}>
                    Download PNG
                </button>
                <button type="button" class="ghost-button" onClick={() => void exportSpriteSheet()}>
                  Sprite Sheet PNG
                </button>
                <button type="button" class="ghost-button" onClick={() => void exportZipPackage()}>
                  ZIP Package
                </button>
              </div>
            </section>

            <div class="sidebar-footer">
              <button type="button" class="ghost-button" disabled={!canUndo || isProcessing || generationStatus === 'running'} onClick={() => void undoLastEdit()}>
                Undo Last Edit
              </button>
            </div>
          </div>
        </aside>
      </div>

      {lightboxImage?.sourceUrl ? (
        <div class="lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxImage(null)}>
          <div class="lightbox__content" onClick={(event) => event.stopPropagation()}>
            <button type="button" class="lightbox__close" onClick={() => setLightboxImage(null)}>
              Close
            </button>
            <img class="lightbox__image" src={lightboxImage.sourceUrl} alt="Expanded preview" />
          </div>
        </div>
      ) : null}

      {assetPendingDelete ? (
        <div class="lightbox" role="dialog" aria-modal="true" onClick={() => setAssetPendingDelete(null)}>
          <div class="lightbox__content lightbox__content--narrow" onClick={(event) => event.stopPropagation()}>
            <h3>Remove asset?</h3>
            <p class="muted">This will remove <strong>{assetPendingDelete.name}</strong> and its saved versions from the project.</p>
            <div class="inline-actions inline-actions--wrap">
              <button type="button" class="ghost-button" onClick={() => setAssetPendingDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                class="ghost-button ghost-button--danger"
                onClick={() => {
                  void removeAsset(assetPendingDelete.id)
                  setAssetPendingDelete(null)
                }}
              >
                Remove Asset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AssetPreview(props: {
  imageResource: ImageResource | null
  fallbackLabel: string
  compact?: boolean
  onOpen?: (image: ImageResource) => void
}) {
  const mountedAtRef = useRef(Date.now())

  useEffect(() => {
    mountedAtRef.current = Date.now()
  }, [props.imageResource?.id])

  if (!props.imageResource?.sourceUrl) {
    return <span>{props.fallbackLabel}</span>
  }

  return (
    <img
      class={props.compact ? 'asset-preview asset-preview--compact' : 'asset-preview'}
      src={props.imageResource.sourceUrl}
      alt={props.fallbackLabel}
      onClick={() => {
        if (Date.now() - mountedAtRef.current < 350) {
          return
        }

        props.onOpen?.(props.imageResource as ImageResource)
      }}
    />
  )
}
