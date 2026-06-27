function createCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  return { canvas, ctx }
}

function loadImageBitmap(sourceUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unable to load image for grid detection'))
    img.src = sourceUrl
  })
}

function cannyEdgeDetect(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const pixelCount = width * height

  const gray = new Float64Array(pixelCount)
  for (let i = 0; i < pixelCount; i++) {
    const idx = i << 2
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
  }

  const kernel = [
    [2, 4, 5, 4, 2],
    [4, 9, 12, 9, 4],
    [5, 12, 15, 12, 5],
    [4, 9, 12, 9, 4],
    [2, 4, 5, 4, 2],
  ]
  const kernelDiv = 159

  const blurred = new Float64Array(pixelCount)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      for (let ky = -2; ky <= 2; ky++) {
        for (let kx = -2; kx <= 2; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx))
          const py = Math.min(height - 1, Math.max(0, y + ky))
          sum += gray[py * width + px] * kernel[ky + 2][kx + 2]
        }
      }
      blurred[y * width + x] = sum / kernelDiv
    }
  }

  const magnitude = new Float64Array(pixelCount)
  const direction = new Float64Array(pixelCount)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const gx =
        -blurred[idx - width - 1] + blurred[idx - width + 1] -
        2 * blurred[idx - 1] + 2 * blurred[idx + 1] -
        blurred[idx + width - 1] + blurred[idx + width + 1]
      const gy =
        -blurred[idx - width - 1] - 2 * blurred[idx - width] - blurred[idx - width + 1] +
        blurred[idx + width - 1] + 2 * blurred[idx + width] + blurred[idx + width + 1]
      magnitude[idx] = Math.sqrt(gx * gx + gy * gy)
      direction[idx] = Math.atan2(gy, gx)
    }
  }

  const suppressed = new Float64Array(pixelCount)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const angle = ((direction[idx] * 180 / Math.PI) + 180) % 180
      let n1 = 0, n2 = 0

      if (angle < 22.5 || angle >= 157.5) {
        n1 = magnitude[idx - 1]; n2 = magnitude[idx + 1]
      } else if (angle < 67.5) {
        n1 = magnitude[idx - width + 1]; n2 = magnitude[idx + width - 1]
      } else if (angle < 112.5) {
        n1 = magnitude[idx - width]; n2 = magnitude[idx + width]
      } else {
        n1 = magnitude[idx - width - 1]; n2 = magnitude[idx + width + 1]
      }

      if (magnitude[idx] >= n1 && magnitude[idx] >= n2) {
        suppressed[idx] = magnitude[idx]
      }
    }
  }

  const edges = new Uint8Array(pixelCount)
  const low = 40, high = 100

  for (let i = 0; i < pixelCount; i++) {
    if (suppressed[i] >= high) {
      edges[i] = 2
    } else if (suppressed[i] >= low) {
      edges[i] = 1
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      if (edges[idx] === 1) {
        let connected = false
        for (let dy = -1; dy <= 1 && !connected; dy++) {
          for (let dx = -1; dx <= 1 && !connected; dx++) {
            if (edges[(y + dy) * width + (x + dx)] === 2) {
              connected = true
            }
          }
        }
        edges[idx] = connected ? 255 : 0
      }
    }
  }

  for (let i = 0; i < pixelCount; i++) {
    if (edges[i] === 2) edges[i] = 255
  }

  return edges
}

function findProjectionPeaks(projection: Float64Array, length: number): number[] {
  const max = Math.max(...projection)
  if (max === 0) return []
  const threshold = max * 0.35
  const peaks: number[] = []

  for (let i = 1; i < length - 1; i++) {
    if (projection[i] > threshold && projection[i] > projection[i - 1] && projection[i] > projection[i + 1]) {
      peaks.push(i)
    }
  }

  return peaks
}

function findDominantGap(positions: number[]): number | null {
  if (positions.length < 3) return null

  const sorted = [...positions].sort((a, b) => a - b)
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1]
    if (gap > 1) gaps.push(gap)
  }

  if (gaps.length < 2) return null

  const bucket = new Map<number, number[]>()
  for (const gap of gaps) {
    const key = Math.round(gap / 2) * 2
    const list = bucket.get(key) ?? []
    list.push(gap)
    bucket.set(key, list)
  }

  let bestKey = 0
  let bestCount = 0
  for (const [key, list] of bucket) {
    if (list.length > bestCount) {
      bestCount = list.length
      bestKey = key
    }
  }

  return bestKey >= 2 ? bestKey : null
}

export interface GridDetectionResult {
  gridWidth: number
  gridHeight: number
  originalWidth: number
  originalHeight: number
}

export async function detectGrid(sourceUrl: string): Promise<GridDetectionResult> {
  const img = await loadImageBitmap(sourceUrl)
  const origW = img.naturalWidth
  const origH = img.naturalHeight

  if (origW < 16 || origH < 16) {
    throw new Error('Image is too small for grid detection')
  }

  const maxDim = 512
  const scale = Math.min(1, maxDim / Math.max(origW, origH))
  const w = Math.round(origW * scale)
  const h = Math.round(origH * scale)

  const { ctx } = createCanvas(w, h)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)

  const edges = cannyEdgeDetect(imageData.data, w, h)

  const horizontalProj = new Float64Array(h)
  const verticalProj = new Float64Array(w)

  for (let y = 0; y < h; y++) {
    let sum = 0
    const rowStart = y * w
    for (let x = 0; x < w; x++) {
      sum += edges[rowStart + x]
    }
    horizontalProj[y] = sum
  }

  for (let x = 0; x < w; x++) {
    let sum = 0
    for (let y = 0; y < h; y++) {
      sum += edges[y * w + x]
    }
    verticalProj[x] = sum
  }

  const hPeaks = findProjectionPeaks(horizontalProj, h)
  const vPeaks = findProjectionPeaks(verticalProj, w)

  const hSpacing = findDominantGap(hPeaks)
  const vSpacing = findDominantGap(vPeaks)

  if (!hSpacing || !vSpacing) {
    throw new Error('Could not detect a consistent pixel grid. The image may not have a regular pixel-art structure.')
  }

  const gridWidth = Math.max(1, Math.round(w / vSpacing))
  const gridHeight = Math.max(1, Math.round(h / hSpacing))

  return { gridWidth, gridHeight, originalWidth: origW, originalHeight: origH }
}
