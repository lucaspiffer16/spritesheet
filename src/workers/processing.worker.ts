export interface ProcessingWorkerMessage {
  type: 'comparison' | 'export'
  payload: {
    assetId: string
  }
}

export interface ProcessingWorkerResult {
  type: 'progress' | 'completed'
  progressPercent: number
}

self.onmessage = (event: MessageEvent<ProcessingWorkerMessage>) => {
  const { data } = event

  if (!data) {
    return
  }

  const progressValues = [20, 55, 100]

  progressValues.forEach((progressPercent, index) => {
    self.setTimeout(() => {
      const type: ProcessingWorkerResult['type'] =
        progressPercent === 100 ? 'completed' : 'progress'

      self.postMessage({
        type,
        progressPercent,
      } satisfies ProcessingWorkerResult)
    }, index * 120)
  })
}
