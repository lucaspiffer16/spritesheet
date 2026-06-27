import type { JobRecord, WorkspaceSnapshot } from '../domain/models'
import type { ProcessingWorkerMessage, ProcessingWorkerResult } from '../workers/processing.worker'
import type { CreateJobInput, JobUpdate, ProcessingService } from './types'

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

function createWorker() {
  return new Worker(new URL('../workers/processing.worker.ts', import.meta.url), {
    type: 'module',
  })
}

export class WorkerProcessingService implements ProcessingService {
  async queueComparison(_workspace: WorkspaceSnapshot, assetId: string) {
    return createJob({
      assetId,
      label: 'Comparison queue',
      detail: 'Queued for local worker pipeline',
    })
  }

  async queueExport(_workspace: WorkspaceSnapshot, assetId: string) {
    return createJob({
      assetId,
      label: 'Export queue',
      detail: 'Queued for local export packaging',
    })
  }

  async runJob(kind: 'comparison' | 'export', assetId: string, onUpdate: (update: JobUpdate) => void) {
    if (typeof Worker === 'undefined') {
      onUpdate({
        status: 'completed',
        progressPercent: 100,
        detail: `${kind} completed without worker support`,
      })
      return
    }

    await new Promise<void>((resolve, reject) => {
      const worker = createWorker()

      worker.onmessage = (event: MessageEvent<ProcessingWorkerResult>) => {
        const { data } = event

        if (!data) {
          return
        }

        onUpdate({
          status: data.type === 'completed' ? 'completed' : 'running',
          progressPercent: data.progressPercent,
          detail:
            data.type === 'completed'
              ? `${kind} finished in local worker`
              : `${kind} running in local worker`,
        })

        if (data.type === 'completed') {
          worker.terminate()
          resolve()
        }
      }

      worker.onerror = (event) => {
        worker.terminate()
        reject(event.error ?? new Error('Worker processing failed'))
      }

      worker.postMessage({
        type: kind,
        payload: { assetId },
      } satisfies ProcessingWorkerMessage)
    })
  }
}
