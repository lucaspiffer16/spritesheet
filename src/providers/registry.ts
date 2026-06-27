import { createKieProvider } from './kie-provider'
import type { AIProvider, ProviderSummary } from './types'

const providers = [createKieProvider()]

export function listProviderSummaries(): ProviderSummary[] {
  return providers.map((provider) => provider.summary)
}

export function getProviderById(providerId: string): AIProvider | undefined {
  return providers.find((provider) => provider.summary.id === providerId)
}
