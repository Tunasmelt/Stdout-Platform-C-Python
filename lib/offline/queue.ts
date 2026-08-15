import { offlineDb, type SyncOp, type SyncTable } from './db'

export async function enqueueWrite(
  table: SyncTable,
  op: SyncOp,
  payload: Record<string, unknown>
): Promise<void> {
  await offlineDb.syncQueue.add({
    table,
    op,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  })
}

export async function getQueuedWrites() {
  return offlineDb.syncQueue.orderBy('createdAt').toArray()
}

export async function removeQueuedWrite(id: number): Promise<void> {
  await offlineDb.syncQueue.delete(id)
}

export async function incrementRetry(id: number): Promise<void> {
  const item = await offlineDb.syncQueue.get(id)
  if (item) {
    await offlineDb.syncQueue.update(id, { retryCount: item.retryCount + 1 })
  }
}

export async function pendingCount(): Promise<number> {
  return offlineDb.syncQueue.count()
}
