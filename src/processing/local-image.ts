async function normalizeSourceUrl(sourceUrl: string) {
  if (sourceUrl.startsWith('data:') || sourceUrl.startsWith('blob:')) {
    return {
      objectUrl: sourceUrl,
      revoke() {},
    }
  }

  const response = await fetch(sourceUrl)

  if (!response.ok) {
    throw new Error('Unable to fetch image resource')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  return {
    objectUrl,
    revoke() {
      URL.revokeObjectURL(objectUrl)
    },
  }
}

async function loadImage(sourceUrl: string) {
  const normalized = await normalizeSourceUrl(sourceUrl)

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      normalized.revoke()
      resolve(image)
    }
    image.onerror = () => {
      normalized.revoke()
      reject(new Error('Unable to load image resource'))
    }
    image.src = normalized.objectUrl
  })
}

function canvasToDataUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL('image/png')
}

function getCanvasContext(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context unavailable')
  }

  return { canvas, context }
}

export async function removeLightBackground(sourceUrl: string) {
  const image = await loadImage(sourceUrl)
  const { canvas, context } = getCanvasContext(image.naturalWidth, image.naturalHeight)

  context.drawImage(image, 0, 0)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index]
    const green = data[index + 1]
    const blue = data[index + 2]
    const average = (red + green + blue) / 3

    if (average > 240) {
      data[index + 3] = 0
    }
  }

  context.putImageData(imageData, 0, 0)

  return {
    dataUrl: canvasToDataUrl(canvas),
    width: canvas.width,
    height: canvas.height,
  }
}

export async function pixelateImage(sourceUrl: string, scalePercent: number) {
  const { magickPixelate } = await import('./magick')
  return magickPixelate(sourceUrl, scalePercent)
}

export async function quantizeImage(sourceUrl: string, paletteSize: number, dither = false) {
  const { magickQuantize } = await import('./magick')
  return magickQuantize(sourceUrl, paletteSize, dither)
}

export async function createSpriteSheet(sourceUrls: string[]) {
  const images = await Promise.all(sourceUrls.map((sourceUrl) => loadImage(sourceUrl)))

  if (!images.length) {
    throw new Error('No source images available for spritesheet export')
  }

  const cellWidth = Math.max(...images.map((image) => image.naturalWidth))
  const cellHeight = Math.max(...images.map((image) => image.naturalHeight))
  const columns = Math.ceil(Math.sqrt(images.length))
  const rows = Math.ceil(images.length / columns)
  const { canvas, context } = getCanvasContext(cellWidth * columns, cellHeight * rows)

  context.imageSmoothingEnabled = false

  images.forEach((image, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    context.drawImage(image, column * cellWidth, row * cellHeight, image.naturalWidth, image.naturalHeight)
  })

  return {
    dataUrl: canvasToDataUrl(canvas),
    width: canvas.width,
    height: canvas.height,
  }
}
