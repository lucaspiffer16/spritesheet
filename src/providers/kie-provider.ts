import type {
  AIProvider,
  GenerationRequest,
  GenerationResult,
  GenerationTask,
  ProviderCapabilities,
  ProviderCredential,
  ProviderModel,
} from './types'

const baseUrl = 'https://api.kie.ai'

interface KieModelConfig {
  appModelId: string
  providerModelId: string
  name: string
  category: string
  modes: Array<'text-to-image' | 'image-to-image'>
  capabilityProfile: 'gpt-image' | 'generic-text-to-image'
}

const modelConfigs: KieModelConfig[] = [
  {
    appModelId: 'gpt-image-2',
    providerModelId: 'gpt-image-2-text-to-image',
    name: 'GPT Image 2',
    category: 'GPT Image',
    modes: ['text-to-image'],
    capabilityProfile: 'gpt-image',
  },
  {
    appModelId: 'gpt-image-1-5',
    providerModelId: 'gpt-image/1.5-text-to-image',
    name: 'GPT Image 1.5',
    category: 'GPT Image',
    modes: ['text-to-image'],
    capabilityProfile: 'gpt-image',
  },
  {
    appModelId: 'google-imagen4-fast',
    providerModelId: 'google/imagen4-fast',
    name: 'Google Imagen 4 Fast',
    category: 'Google',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'google-imagen4',
    providerModelId: 'google/imagen4',
    name: 'Google Imagen 4',
    category: 'Google',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'google-imagen4-ultra',
    providerModelId: 'google/imagen4-ultra',
    name: 'Google Imagen 4 Ultra',
    category: 'Google',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'google-nano-banana',
    providerModelId: 'google/nano-banana',
    name: 'Google Nano Banana',
    category: 'Google',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'google-nano-banana-2',
    providerModelId: 'nano-banana-2',
    name: 'Google Nano Banana 2',
    category: 'Google',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'seedream-3',
    providerModelId: 'bytedance/seedream',
    name: 'Seedream 3.0',
    category: 'Seedream',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'flux-2-flex',
    providerModelId: 'flux-2/flex-text-to-image',
    name: 'Flux 2 Flex',
    category: 'Flux 2',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'qwen-text-to-image',
    providerModelId: 'qwen/text-to-image',
    name: 'Qwen Text to Image',
    category: 'Qwen',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'ideogram-v3',
    providerModelId: 'ideogram/v3-text-to-image',
    name: 'Ideogram V3',
    category: 'Ideogram',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'z-image',
    providerModelId: 'z-image',
    name: 'Z-Image',
    category: 'Z-Image',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
  {
    appModelId: 'grok-imagine',
    providerModelId: 'grok-imagine/text-to-image',
    name: 'Grok Imagine',
    category: 'Grok Imagine',
    modes: ['text-to-image'],
    capabilityProfile: 'generic-text-to-image',
  },
]

const models: ProviderModel[] = modelConfigs.map((config) => ({
  id: config.appModelId,
  name: config.name,
  category: config.category,
  modes: config.modes,
}))

const genericCapabilities: ProviderCapabilities = {
  modelId: 'generic',
  supportedModes: ['text-to-image'],
  parameters: [
    { key: 'prompt', label: 'Prompt', type: 'text' },
    { key: 'negativePrompt', label: 'Negative Prompt', type: 'text' },
    { key: 'seed', label: 'Seed', type: 'number' },
    {
      key: 'aspectRatio',
      label: 'Aspect Ratio',
      type: 'select',
      options: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', 'auto'],
    },
  ],
}

const capabilities: Record<string, ProviderCapabilities> = {
  'gpt-image-2': {
    modelId: 'gpt-image-2',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'resolution', label: 'Resolution', type: 'select', options: ['1K', '2K', '4K'] },
      {
        key: 'aspectRatio',
        label: 'Aspect Ratio',
        type: 'select',
        options: ['auto', '1:1', '3:2', '2:3', '4:3', '3:4', '5:4', '4:5', '16:9', '9:16'],
      },
    ],
  },
  'gpt-image-1-5': {
    modelId: 'gpt-image-1-5',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['1:1', '2:3', '3:2'] },
      { key: 'quality', label: 'Quality', type: 'select', options: ['medium', 'high'] },
    ],
  },
  'google-imagen4-fast': {
    ...genericCapabilities,
    modelId: 'google-imagen4-fast',
  },
  'google-imagen4': {
    ...genericCapabilities,
    modelId: 'google-imagen4',
  },
  'google-imagen4-ultra': {
    ...genericCapabilities,
    modelId: 'google-imagen4-ultra',
  },
  'google-nano-banana': {
    modelId: 'google-nano-banana',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '5:4', '4:5', '21:9', 'auto'] },
      { key: 'outputFormat', label: 'Output Format', type: 'select', options: ['png', 'jpeg'] },
    ],
  },
  'google-nano-banana-2': {
    modelId: 'google-nano-banana-2',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9', 'auto'] },
      { key: 'resolution', label: 'Resolution', type: 'select', options: ['1K', '2K', '4K'] },
      { key: 'outputFormat', label: 'Output Format', type: 'select', options: ['png', 'jpg'] },
    ],
  },
  'seedream-3': {
    modelId: 'seedream-3',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'imageSize', label: 'Image Size', type: 'select', options: ['square', 'square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
      { key: 'guidanceScale', label: 'Guidance Scale', type: 'number' },
      { key: 'seed', label: 'Seed', type: 'number' },
    ],
  },
  'flux-2-flex': {
    modelId: 'flux-2-flex',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'] },
      { key: 'resolution', label: 'Resolution', type: 'select', options: ['1K', '2K'] },
    ],
  },
  'qwen-text-to-image': {
    modelId: 'qwen-text-to-image',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'imageSize', label: 'Image Size', type: 'select', options: ['square', 'square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
      { key: 'negativePrompt', label: 'Negative Prompt', type: 'text' },
      { key: 'seed', label: 'Seed', type: 'number' },
      { key: 'guidanceScale', label: 'Guidance Scale', type: 'number' },
      { key: 'outputFormat', label: 'Output Format', type: 'select', options: ['png', 'jpeg'] },
    ],
  },
  'ideogram-v3': {
    modelId: 'ideogram-v3',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'renderingSpeed', label: 'Rendering Speed', type: 'select', options: ['TURBO', 'BALANCED', 'QUALITY'] },
      { key: 'style', label: 'Style', type: 'select', options: ['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN'] },
      { key: 'expandPrompt', label: 'Expand Prompt', type: 'boolean' },
      { key: 'imageSize', label: 'Image Size', type: 'select', options: ['square', 'square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
      { key: 'seed', label: 'Seed', type: 'number' },
      { key: 'negativePrompt', label: 'Negative Prompt', type: 'text' },
    ],
  },
  'z-image': {
    modelId: 'z-image',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['1:1', '4:3', '3:4', '16:9', '9:16'] },
    ],
  },
  'grok-imagine': {
    modelId: 'grok-imagine',
    supportedModes: ['text-to-image'],
    parameters: [
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['2:3', '3:2', '1:1', '16:9', '9:16'] },
      { key: 'enablePro', label: 'Enable Pro', type: 'boolean' },
    ],
  },
}

interface KieApiResponse<T> {
  code: number
  msg: string
  data: T
}

function getModelConfig(modelId: string) {
  return modelConfigs.find((model) => model.appModelId === modelId) ?? modelConfigs[0]
}

async function fetchJson<T>(credential: ProviderCredential, path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${credential.apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json()) as KieApiResponse<T>

  if (!response.ok || payload.code !== 200) {
    throw new Error(payload.msg || 'KIE request failed')
  }

  return payload.data
}

function normalizeTaskState(state: string): GenerationTask['status'] {
  if (state === 'success' || state === 'fail') {
    return 'completed'
  }

  if (state === 'waiting') {
    return 'queued'
  }

  return 'running'
}

function buildCreateTaskPayload(config: KieModelConfig, request: GenerationRequest) {
  const rawOptions = request.rawOptions

  if (config.appModelId === 'gpt-image-2') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        aspect_ratio: rawOptions.aspectRatio || '1:1',
        resolution: rawOptions.resolution || '1K',
      },
    }
  }

  if (config.appModelId === 'gpt-image-1-5') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        aspect_ratio: rawOptions.aspectRatio || '1:1',
        quality: rawOptions.quality || 'medium',
      },
    }
  }

  if (config.appModelId === 'seedream-3') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        image_size: rawOptions.imageSize || 'square_hd',
        guidance_scale: rawOptions.guidanceScale || 2.5,
        seed: typeof rawOptions.seed === 'number' ? rawOptions.seed : undefined,
      },
    }
  }

  if (config.appModelId === 'flux-2-flex') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        aspect_ratio: rawOptions.aspectRatio || '1:1',
        resolution: rawOptions.resolution || '1K',
        nsfw_checker: false,
      },
    }
  }

  if (config.appModelId === 'qwen-text-to-image') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        image_size: rawOptions.imageSize || 'square_hd',
        negative_prompt: rawOptions.negativePrompt || '',
        seed: typeof rawOptions.seed === 'number' ? rawOptions.seed : undefined,
        guidance_scale: rawOptions.guidanceScale || 2.5,
        output_format: rawOptions.outputFormat || 'png',
      },
    }
  }

  if (config.appModelId === 'ideogram-v3') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        rendering_speed: rawOptions.renderingSpeed || 'BALANCED',
        style: rawOptions.style || 'AUTO',
        expand_prompt: rawOptions.expandPrompt === 'true' || rawOptions.expandPrompt === true,
        image_size: rawOptions.imageSize || 'square_hd',
        seed: typeof rawOptions.seed === 'number' ? rawOptions.seed : undefined,
        negative_prompt: rawOptions.negativePrompt || '',
      },
    }
  }

  if (config.appModelId === 'google-nano-banana') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        output_format: rawOptions.outputFormat || 'png',
        aspect_ratio: rawOptions.aspectRatio || '1:1',
        nsfw_checker: false,
      },
    }
  }

  if (config.appModelId === 'google-nano-banana-2') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        image_input: [],
        aspect_ratio: rawOptions.aspectRatio || 'auto',
        resolution: rawOptions.resolution || '1K',
        output_format: rawOptions.outputFormat || 'png',
      },
    }
  }

  if (config.appModelId === 'grok-imagine') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        aspect_ratio: rawOptions.aspectRatio || '1:1',
        enable_pro: rawOptions.enablePro === 'true' || rawOptions.enablePro === true,
      },
    }
  }

  if (config.appModelId === 'z-image') {
    return {
      model: config.providerModelId,
      input: {
        prompt: request.prompt,
        aspect_ratio: rawOptions.aspectRatio || '1:1',
        nsfw_checker: true,
      },
    }
  }

  return {
    model: config.providerModelId,
    input: {
      prompt: request.prompt,
      negative_prompt: rawOptions.negativePrompt || '',
      aspect_ratio: rawOptions.aspectRatio || '1:1',
      seed: typeof rawOptions.seed === 'number' ? rawOptions.seed : undefined,
    },
  }
}

function parseResultUrls(resultJson: string | undefined) {
  if (!resultJson) {
    return []
  }

  try {
    const parsed = JSON.parse(resultJson) as { resultUrls?: string[] }
    return parsed.resultUrls ?? []
  } catch {
    return []
  }
}

export function createKieProvider(): AIProvider {
  return {
    summary: {
      id: 'kie',
      name: 'KIE',
      status: 'ready',
    },
    async listModels() {
      return models
    },
    async getModelCapabilities(modelId) {
      return capabilities[modelId] ?? genericCapabilities
    },
    async validateCredential(credential: ProviderCredential) {
      if (!credential.apiKey.trim()) {
        return false
      }

      try {
        await fetchJson<number>(credential, '/api/v1/chat/credit', { method: 'GET' })
        return true
      } catch {
        return false
      }
    },
    async generateImage(credential: ProviderCredential, request: GenerationRequest) {
      const config = getModelConfig(request.modelId)
      const data = await fetchJson<{ taskId: string }>(credential, '/api/v1/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify(buildCreateTaskPayload(config, request)),
      })

      return {
        taskId: data.taskId,
        status: 'running',
      }
    },
    async getTaskStatus(credential: ProviderCredential, taskId: string) {
      const search = new URLSearchParams({ taskId })
      const data = await fetchJson<{ state: string }>(
        credential,
        `/api/v1/jobs/recordInfo?${search.toString()}`,
        { method: 'GET' },
      )

      return {
        taskId,
        status: normalizeTaskState(data.state),
      }
    },
    async getResult(credential: ProviderCredential, taskId: string): Promise<GenerationResult> {
      const search = new URLSearchParams({ taskId })
      const data = await fetchJson<{ resultJson?: string; failMsg?: string; state: string }>(
        credential,
        `/api/v1/jobs/recordInfo?${search.toString()}`,
        { method: 'GET' },
      )

      if (data.state === 'fail') {
        throw new Error(data.failMsg || 'Generation failed')
      }

      const resultUrls = parseResultUrls(data.resultJson)
      const imageUrl = resultUrls[0]

      if (!imageUrl) {
        throw new Error('KIE returned no image URL')
      }

      try {
        const downloadUrl = await fetchJson<string>(credential, '/api/v1/common/download-url', {
          method: 'POST',
          body: JSON.stringify({ url: imageUrl }),
        })

        return {
          taskId,
          status: 'completed',
          imageUrl: downloadUrl,
        }
      } catch {
        return {
          taskId,
          status: 'completed',
          imageUrl,
        }
      }
    },
  }
}
