import { mockWorkspace } from '../app/mock-project'
import type { WorkspaceSnapshot } from '../domain/models'
import type { ProviderCredential } from '../providers/types'
import type {
  PreferencesStore,
  ProviderSettingsRecord,
  SecretStore,
  WorkspaceRepository,
} from './types'

const WORKSPACE_KEY = 'spritesheet.workspace.v1'
const PROVIDER_SETTINGS_KEY = 'spritesheet.provider-settings.v1'
const PROVIDER_SECRET_PREFIX = 'spritesheet.provider-secret.'
const WORKSPACE_DATABASE = 'spritesheet-db'
const WORKSPACE_STORE = 'workspaceSnapshots'
const ACTIVE_WORKSPACE_ID = 'active-workspace'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function cloneWorkspace(workspace: WorkspaceSnapshot) {
  return JSON.parse(JSON.stringify(workspace)) as WorkspaceSnapshot
}

export class LocalWorkspaceRepository implements WorkspaceRepository {
  async loadWorkspace() {
    if (!canUseLocalStorage()) {
      return cloneWorkspace(mockWorkspace)
    }

    const persisted = parseJson<WorkspaceSnapshot>(window.localStorage.getItem(WORKSPACE_KEY))
    return persisted ?? cloneWorkspace(mockWorkspace)
  }

  async saveWorkspace(workspace: WorkspaceSnapshot) {
    if (!canUseLocalStorage()) {
      return
    }

    window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace))
  }
}

interface WorkspaceSnapshotRecord {
  id: string
  snapshot: WorkspaceSnapshot
}

function canUseIndexedDb() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

function openWorkspaceDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(WORKSPACE_DATABASE, 1)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(WORKSPACE_STORE)) {
        database.createObjectStore(WORKSPACE_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'))
  })
}

export class IndexedDbWorkspaceRepository implements WorkspaceRepository {
  private fallback = new LocalWorkspaceRepository()

  async loadWorkspace() {
    if (!canUseIndexedDb()) {
      return this.fallback.loadWorkspace()
    }

    try {
      const database = await openWorkspaceDatabase()

      return await new Promise<WorkspaceSnapshot>((resolve, reject) => {
        const transaction = database.transaction(WORKSPACE_STORE, 'readonly')
        const store = transaction.objectStore(WORKSPACE_STORE)
        const request = store.get(ACTIVE_WORKSPACE_ID)

        request.onsuccess = () => {
          const record = request.result as WorkspaceSnapshotRecord | undefined
          resolve(record?.snapshot ?? cloneWorkspace(mockWorkspace))
        }

        request.onerror = () => reject(request.error ?? new Error('Unable to load workspace snapshot'))
      })
    } catch {
      return this.fallback.loadWorkspace()
    }
  }

  async saveWorkspace(workspace: WorkspaceSnapshot) {
    if (!canUseIndexedDb()) {
      return this.fallback.saveWorkspace(workspace)
    }

    try {
      const database = await openWorkspaceDatabase()

      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(WORKSPACE_STORE, 'readwrite')
        const store = transaction.objectStore(WORKSPACE_STORE)

        store.put({
          id: ACTIVE_WORKSPACE_ID,
          snapshot: workspace,
        } satisfies WorkspaceSnapshotRecord)

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save workspace snapshot'))
      })
    } catch {
      await this.fallback.saveWorkspace(workspace)
    }
  }
}

export class LocalPreferencesStore implements PreferencesStore {
  async loadProviderSettings() {
    if (!canUseLocalStorage()) {
      return null
    }

    return parseJson<ProviderSettingsRecord>(window.localStorage.getItem(PROVIDER_SETTINGS_KEY))
  }

  async saveProviderSettings(settings: ProviderSettingsRecord) {
    if (!canUseLocalStorage()) {
      return
    }

    window.localStorage.setItem(PROVIDER_SETTINGS_KEY, JSON.stringify(settings))
  }
}

const sessionSecrets = new Map<string, ProviderCredential>()

export class BrowserSecretStore implements SecretStore {
  async load(providerId: string) {
    const sessionCredential = sessionSecrets.get(providerId)

    if (sessionCredential) {
      return sessionCredential
    }

    if (!canUseLocalStorage()) {
      return null
    }

    return parseJson<ProviderCredential>(
      window.localStorage.getItem(`${PROVIDER_SECRET_PREFIX}${providerId}`),
    )
  }

  async save(providerId: string, credential: ProviderCredential) {
    if (credential.persistence === 'session') {
      sessionSecrets.set(providerId, credential)
      return
    }

    if (!canUseLocalStorage()) {
      return
    }

    window.localStorage.setItem(
      `${PROVIDER_SECRET_PREFIX}${providerId}`,
      JSON.stringify(credential),
    )
  }
}
