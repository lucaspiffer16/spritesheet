import type { JobRecord, WorkspaceSnapshot } from '../domain/models'
import type { CreateJobInput, ProcessingService } from './types'

function createJob({ assetId, label, detail }: CreateJobInput): JobRecord {
  return {
    id: `${assetId}-${label.toLowerCase().replaceAll(' ', '-')}-${Date.now()}`,
    assetId,
    label,
    detail,
    status: 'queued',
    progressPercent: 0,
  }
}

export class MockProcessingService implements ProcessingService {
  async queueComparison(_workspace: WorkspaceSnapshot, assetId: string) {
    return createJob({
      assetId,
      label: 'Comparison queue',
      detail: 'Preparing preset fan-out in local worker pipeline',
    })
  }

  async queueExport(_workspace: WorkspaceSnapshot, assetId: string) {
    return createJob({
      assetId,
      label: 'Export queue',
      detail: 'Preparing local export package',
    })
  }

  async runJob(
    kind: 'comparison' | 'export',
    _assetId: string,
    onUpdate: (update: { status: JobRecord['status']; progressPercent: number; detail: string }) => void,
  ) {
    onUpdate({
      status: 'running',
      progressPercent: 35,
      detail:
        kind === 'comparison'
          ? 'Running local preset fan-out'
          : 'Preparing export buffers',
    })

    await new Promise((resolve) => {
      window.setTimeout(resolve, 120)
    })

    onUpdate({
      status: 'completed',
      progressPercent: 100,
      detail:
        kind === 'comparison'
          ? 'Comparison variants completed'
          : 'Export package ready to download',
    })
  }
}
