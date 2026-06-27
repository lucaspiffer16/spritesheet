export interface ProviderCredential {
  apiKey: string
  persistence: 'session' | 'local'
}

export interface ProviderModelCapability {
  key: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select'
  options?: string[]
}

export interface ProviderModel {
  id: string
  name: string
  category: string
  modes: Array<'text-to-image' | 'image-to-image'>
}

export interface ProviderCapabilities {
  modelId: string
  supportedModes: Array<'text-to-image' | 'image-to-image'>
  parameters: ProviderModelCapability[]
}

export interface ProviderSummary {
  id: string
  name: string
  status: 'ready' | 'experimental'
}

export interface GenerationRequest {
  modelId: string
  mode: 'text-to-image' | 'image-to-image'
  prompt: string
  rawOptions: Record<string, string | number | boolean>
}

export interface GenerationTask {
  taskId: string
  status: 'queued' | 'running' | 'completed'
}

export interface GenerationResult {
  taskId: string
  status: 'completed'
  imageUrl: string
}

export interface ProviderTaskDetails {
  taskId: string
  model: string
  state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail'
  failMsg?: string
  resultUrls: string[]
}

export interface AIProvider {
  summary: ProviderSummary
  listModels(): Promise<ProviderModel[]>
  getModelCapabilities(modelId: string): Promise<ProviderCapabilities>
  validateCredential(credential: ProviderCredential): Promise<boolean>
  generateImage(credential: ProviderCredential, request: GenerationRequest): Promise<GenerationTask>
  getTaskStatus(credential: ProviderCredential, taskId: string): Promise<GenerationTask>
  getResult(credential: ProviderCredential, taskId: string): Promise<GenerationResult>
}
