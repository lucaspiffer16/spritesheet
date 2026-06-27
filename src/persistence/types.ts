import type { WorkspaceSnapshot } from '../domain/models'
import type { ProviderCredential } from '../providers/types'

export interface WorkspaceRepository {
  loadWorkspace(): Promise<WorkspaceSnapshot>
  saveWorkspace(workspace: WorkspaceSnapshot): Promise<void>
}

export interface ProviderSettingsRecord {
  providerId: string
  modelId: string
}

export interface PreferencesStore {
  loadProviderSettings(): Promise<ProviderSettingsRecord | null>
  saveProviderSettings(settings: ProviderSettingsRecord): Promise<void>
}

export interface SecretStore {
  load(providerId: string): Promise<ProviderCredential | null>
  save(providerId: string, credential: ProviderCredential): Promise<void>
}
