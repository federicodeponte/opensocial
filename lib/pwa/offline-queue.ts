// ABOUTME: Offline queue system using IndexedDB
// ABOUTME: Queue posts/actions when offline, sync when back online

export interface QueuedAction {
  id?: number
  type: 'post' | 'like' | 'retweet' | 'follow'
  data: any
  timestamp: number
  retries: number
}

const DB_NAME = 'opensocial-offline'
const DB_VERSION = 1
const STORE_NAME = 'queue'

/**
 * Open IndexedDB
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

/**
 * Add action to queue
 */
export async function queueAction(action: Omit<QueuedAction, 'id'>): Promise<number> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.add(action)
    request.onsuccess = () => resolve(request.result as number)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all queued actions
 */
export async function getQueuedActions(): Promise<QueuedAction[]> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readonly')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Remove action from queue
 */
export async function removeQueuedAction(id: number): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all queued actions
 */
export async function clearQueue(): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Sync queued actions
 */
export async function syncQueue(): Promise<{ success: number; failed: number }> {
  if (!navigator.onLine) {
    throw new Error('Cannot sync while offline')
  }

  const actions = await getQueuedActions()
  let success = 0
  let failed = 0

  for (const action of actions) {
    try {
      await executeAction(action)
      await removeQueuedAction(action.id!)
      success++
    } catch (error) {
      console.error('Failed to sync action:', error)
      failed++

      // Remove action if it has failed too many times
      if (action.retries >= 3) {
        await removeQueuedAction(action.id!)
      }
    }
  }

  return { success, failed }
}

/**
 * Execute a queued action
 */
async function executeAction(action: QueuedAction): Promise<void> {
  const endpoints: Record<QueuedAction['type'], string> = {
    post: '/api/posts',
    like: '/api/posts/like',
    retweet: '/api/posts/retweet',
    follow: '/api/profiles/follow',
  }

  const response = await fetch(endpoints[action.type], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.data),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
}

/**
 * Register background sync
 */
export async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready
    // @ts-ignore - Background Sync API types not fully supported
    await registration.sync?.register('sync-posts')
  }
}
