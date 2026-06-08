import type { Category, Location, Responsible, Item, BorrowRecord, Anomaly } from '@/types'

const DB_NAME = 'OfficeItemDB'
const DB_VERSION = 1

const STORES = {
  categories: 'categories',
  locations: 'locations',
  responsibles: 'responsibles',
  items: 'items',
  borrowRecords: 'borrowRecords',
  anomalies: 'anomalies',
} as const

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORES.categories)) {
        const store = db.createObjectStore(STORES.categories, { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.locations)) {
        const store = db.createObjectStore(STORES.locations, { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.responsibles)) {
        const store = db.createObjectStore(STORES.responsibles, { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('department', 'department', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.items)) {
        const store = db.createObjectStore(STORES.items, { keyPath: 'id' })
        store.createIndex('categoryId', 'categoryId', { unique: false })
        store.createIndex('locationId', 'locationId', { unique: false })
        store.createIndex('responsibleId', 'responsibleId', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.borrowRecords)) {
        const store = db.createObjectStore(STORES.borrowRecords, { keyPath: 'id' })
        store.createIndex('itemId', 'itemId', { unique: false })
        store.createIndex('borrowerName', 'borrowerName', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.anomalies)) {
        const store = db.createObjectStore(STORES.anomalies, { keyPath: 'id' })
        store.createIndex('borrowRecordId', 'borrowRecordId', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }
    }
  })
}

function getAll<T>(storeName: string): Promise<T[]> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result as T[])
        request.onerror = () => reject(request.error)
      })
  )
}

function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const request = store.get(id)
        request.onsuccess = () => resolve(request.result as T | undefined)
        request.onerror = () => reject(request.error)
      })
  )
}

function put<T>(storeName: string, data: T): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const request = store.put(data)
        request.onsuccess = () => resolve(data)
        request.onerror = () => reject(request.error)
      })
  )
}

function deleteById(storeName: string, id: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        const request = store.delete(id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
  )
}

function putMany<T>(storeName: string, items: T[]): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        for (const item of items) {
          store.put(item)
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
  )
}

function deleteByIds(storeName: string, ids: string[]): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        for (const id of ids) {
          store.delete(id)
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
  )
}

export const db = {
  getAll,
  getById,
  put,
  deleteById,
  putMany,
  deleteByIds,
  STORES,
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export { openDB }
export type { Category, Location, Responsible, Item, BorrowRecord, Anomaly }
