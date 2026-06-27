import {
  initializeImageMagick,
  ImageMagick,
  MagickFormat,
  FilterType,
  QuantizeSettings,
  DitherMethod,
} from '@imagemagick/magick-wasm'

let initialized = false

export async function ensureMagick(): Promise<boolean> {
  if (initialized) return true
  try {
    const response = await fetch('/magick.wasm')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const wasmBytes = new Uint8Array(await response.arrayBuffer())
    await initializeImageMagick(wasmBytes)
    initialized = true
    return true
  } catch (e) {
    console.error('ImageMagick init failed', e)
    return false
  }
}

function loadImageBitmap(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unable to load image'))
    img.src = sourceUrl
  })
}

export async function magickPixelate(sourceUrl: string, scalePercent: number) {
  const ready = await ensureMagick()
  if (!ready) throw new Error('ImageMagick not available')

  const img = await loadImageBitmap(sourceUrl)
  const srcW = img.naturalWidth
  const srcH = img.naturalHeight
  const targetW = Math.max(1, Math.round(srcW * scalePercent))
  const targetH = Math.max(1, Math.round(srcH * scalePercent))
  const outputW = targetW * 4
  const outputH = targetH * 4

  const canvas = document.createElement('canvas')
  canvas.width = srcW
  canvas.height = srcH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(img, 0, 0)

  try {
    const blob = ImageMagick.readFromCanvas(canvas, (image) => {
      image.resize(targetW, targetH, FilterType.Point)
      image.resize(outputW, outputH, FilterType.Point)

      return image.write(MagickFormat.Png, (data) => new Blob([data as BlobPart], { type: 'image/png' }))
    })

    return { dataUrl: URL.createObjectURL(blob), width: outputW, height: outputH }
  } catch (error) {
    throw new Error(`pixelate failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function magickQuantize(sourceUrl: string, paletteSize: number, dither = false) {
  const ready = await ensureMagick()
  if (!ready) throw new Error('ImageMagick not available')

  const img = await loadImageBitmap(sourceUrl)
  const { naturalWidth: w, naturalHeight: h } = img
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(img, 0, 0)

  try {
    const blob = ImageMagick.readFromCanvas(canvas, (image) => {
      const settings = new QuantizeSettings()
      settings.colors = Math.max(2, Math.min(256, paletteSize))
      settings.treeDepth = 4
      settings.measureErrors = false
      settings.ditherMethod = dither ? DitherMethod.FloydSteinberg : DitherMethod.No
      image.quantize(settings)

      return image.write(MagickFormat.Png, (data) => new Blob([data as BlobPart], { type: 'image/png' }))
    })

    return { dataUrl: URL.createObjectURL(blob), width: w, height: h }
  } catch (error) {
    throw new Error(`quantize failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
