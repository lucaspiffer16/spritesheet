import type { JobRecord, WorkspaceSnapshot } from '../domain/models'

export interface CreateJobInput {
  assetId: string
  label: string
  detail: string
}

export interface JobUpdate {
  status: JobRecord['status']
  progressPercent: number
  detail: string
}

export interface ProcessingService {
  queueComparison(workspace: WorkspaceSnapshot, assetId: string): Promise<JobRecord>
  queueExport(workspace: WorkspaceSnapshot, assetId: string): Promise<JobRecord>
  runJob(
    kind: 'comparison' | 'export',
    assetId: string,
    onUpdate: (update: JobUpdate) => void,
  ): Promise<void>
}
