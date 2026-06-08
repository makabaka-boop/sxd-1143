import { create } from 'zustand'
import type { Role, Category, Location, Responsible, Item, ItemStatus, BorrowRecord, Anomaly, FilterState, AlertItem, InventoryCheck, ReplenishRequest } from '@/types'
import { db, generateId, resetDB } from '@/lib/db'
import { seedCategories, seedLocations, seedResponsibles, seedItems, seedBorrowRecords, seedAnomalies, seedInventoryChecks, seedReplenishRequests } from '@/lib/seed'

interface AppState {
  currentRole: Role
  categories: Category[]
  locations: Location[]
  responsibles: Responsible[]
  items: Item[]
  borrowRecords: BorrowRecord[]
  anomalies: Anomaly[]
  inventoryChecks: InventoryCheck[]
  replenishRequests: ReplenishRequest[]
  filters: FilterState
  selectedIds: Set<string>
  alerts: AlertItem[]
  dataLoaded: boolean

  setRole: (role: Role) => void
  loadData: () => Promise<void>
  seedData: () => Promise<void>

  addCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Promise<void>
  updateCategory: (data: Category) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  addLocation: (data: Omit<Location, 'id'>) => Promise<void>
  updateLocation: (data: Location) => Promise<void>
  deleteLocation: (id: string) => Promise<void>

  addResponsible: (data: Omit<Responsible, 'id'>) => Promise<void>
  updateResponsible: (data: Responsible) => Promise<void>
  deleteResponsible: (id: string) => Promise<void>

  addItem: (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>
  updateItem: (data: Item) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  batchUpdateItems: (ids: string[], updates: Partial<Item>) => Promise<void>

  addBorrowRecord: (data: Omit<BorrowRecord, 'id' | 'status'>) => Promise<void>
  returnBorrowRecord: (id: string, actualReturnDate: string) => Promise<void>
  batchReturnBorrowRecords: (ids: string[], actualReturnDate: string) => Promise<void>

  addAnomaly: (data: Omit<Anomaly, 'id' | 'createdAt' | 'checkedAt'>) => Promise<void>
  updateAnomaly: (data: Anomaly) => Promise<void>

  addInventoryCheck: (data: Omit<InventoryCheck, 'id' | 'createdAt' | 'completedAt'>) => Promise<void>
  updateInventoryCheck: (data: InventoryCheck) => Promise<void>
  completeInventoryCheck: (id: string) => Promise<void>

  addReplenishRequest: (data: Omit<ReplenishRequest, 'id' | 'status' | 'handlerName' | 'handledAt' | 'remark' | 'createdAt' | 'updatedAt'>) => Promise<void>
  approveReplenishRequest: (id: string, handlerName: string, remark?: string) => Promise<void>
  rejectReplenishRequest: (id: string, handlerName: string, remark?: string) => Promise<void>
  completeReplenishRequest: (id: string, handlerName: string, remark?: string) => Promise<void>

  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  removeHiddenSelections: (visibleIds: string[]) => void

  refreshAlerts: () => void
}

const defaultFilters: FilterState = {
  category: null,
  location: null,
  responsible: null,
  borrowStatus: null,
  anomalyType: null,
  searchQuery: '',
  checkStatus: null,
}

function getStoredRole(): Role {
  try {
    const stored = localStorage.getItem('office_current_role')
    if (stored === 'admin' || stored === 'user' || stored === 'auditor') return stored
  } catch {}
  return 'admin'
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: getStoredRole(),
  categories: [],
  locations: [],
  responsibles: [],
  items: [],
  borrowRecords: [],
  anomalies: [],
  inventoryChecks: [],
  replenishRequests: [],
  filters: { ...defaultFilters },
  selectedIds: new Set<string>(),
  alerts: [],
  dataLoaded: false,

  setRole: (role) => {
    localStorage.setItem('office_current_role', role)
    set({ currentRole: role, selectedIds: new Set() })
  },

  loadData: async () => {
    if (get().dataLoaded) return
    try {
      const categories = await db.getAll<Category>('categories')
      const locations = await db.getAll<Location>('locations')
      const responsibles = await db.getAll<Responsible>('responsibles')
      const items = await db.getAll<Item>('items')
      const borrowRecords = await db.getAll<BorrowRecord>('borrowRecords')
      const anomalies = await db.getAll<Anomaly>('anomalies')
      const inventoryChecks = await db.getAll<InventoryCheck>('inventoryChecks')
      const replenishRequests = await db.getAll<ReplenishRequest>('replenishRequests')

      if (categories.length === 0) {
        await get().seedData()
        return
      }

      set({ categories, locations, responsibles, items, borrowRecords, anomalies, inventoryChecks, replenishRequests, dataLoaded: true })
      get().refreshAlerts()
    } catch {
      await resetDB()
      await get().seedData()
    }
  },

  seedData: async () => {
    await db.putMany('categories', seedCategories)
    await db.putMany('locations', seedLocations)
    await db.putMany('responsibles', seedResponsibles)
    await db.putMany('items', seedItems)
    await db.putMany('borrowRecords', seedBorrowRecords)
    await db.putMany('anomalies', seedAnomalies)
    await db.putMany('inventoryChecks', seedInventoryChecks)
    await db.putMany('replenishRequests', seedReplenishRequests)

    set({
      categories: seedCategories,
      locations: seedLocations,
      responsibles: seedResponsibles,
      items: seedItems,
      borrowRecords: seedBorrowRecords,
      anomalies: seedAnomalies,
      inventoryChecks: seedInventoryChecks,
      replenishRequests: seedReplenishRequests,
      dataLoaded: true,
    })
    get().refreshAlerts()
  },

  addCategory: async (data) => {
    const item: Category = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    await db.put('categories', item)
    set((s) => ({ categories: [...s.categories, item] }))
  },
  updateCategory: async (data) => {
    await db.put('categories', data)
    set((s) => ({ categories: s.categories.map((c) => (c.id === data.id ? data : c)) }))
  },
  deleteCategory: async (id) => {
    await db.deleteById('categories', id)
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
  },

  addLocation: async (data) => {
    const item: Location = { ...data, id: generateId() }
    await db.put('locations', item)
    set((s) => ({ locations: [...s.locations, item] }))
  },
  updateLocation: async (data) => {
    await db.put('locations', data)
    set((s) => ({ locations: s.locations.map((l) => (l.id === data.id ? data : l)) }))
  },
  deleteLocation: async (id) => {
    await db.deleteById('locations', id)
    set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }))
  },

  addResponsible: async (data) => {
    const item: Responsible = { ...data, id: generateId() }
    await db.put('responsibles', item)
    set((s) => ({ responsibles: [...s.responsibles, item] }))
    get().refreshAlerts()
  },
  updateResponsible: async (data) => {
    await db.put('responsibles', data)
    set((s) => ({ responsibles: s.responsibles.map((r) => (r.id === data.id ? data : r)) }))
    get().refreshAlerts()
  },
  deleteResponsible: async (id) => {
    await db.deleteById('responsibles', id)
    set((s) => ({ responsibles: s.responsibles.filter((r) => r.id !== id) }))
    get().refreshAlerts()
  },

  addItem: async (data) => {
    const now = new Date().toISOString()
    const status = data.availableQuantity <= 0 ? 'out_of_stock' : data.availableQuantity < data.lowStockThreshold ? 'low_stock' : 'normal'
    const item: Item = { ...data, id: generateId(), status, createdAt: now, updatedAt: now }
    await db.put('items', item)
    set((s) => ({ items: [...s.items, item] }))
    get().refreshAlerts()
  },
  updateItem: async (data) => {
    const status: ItemStatus = data.availableQuantity <= 0 ? 'out_of_stock' : data.availableQuantity < data.lowStockThreshold ? 'low_stock' : 'normal'
    const updated: Item = { ...data, status, updatedAt: new Date().toISOString() }
    await db.put('items', updated)
    set((s) => ({ items: s.items.map((i) => (i.id === updated.id ? updated : i)) }))
    get().refreshAlerts()
  },
  deleteItem: async (id) => {
    await db.deleteById('items', id)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
    get().refreshAlerts()
  },
  batchUpdateItems: async (ids, updates) => {
    const items = get().items
    const updatedItems: Item[] = items
      .filter((i) => ids.includes(i.id))
      .map((i) => {
        const merged = { ...i, ...updates, updatedAt: new Date().toISOString() } as Item
        if ('availableQuantity' in updates || 'lowStockThreshold' in updates) {
          const s: ItemStatus = merged.availableQuantity <= 0 ? 'out_of_stock' : merged.availableQuantity < merged.lowStockThreshold ? 'low_stock' : 'normal'
          merged.status = s
        }
        return merged
      })
    await db.putMany('items', updatedItems)
    const finalItems: Item[] = get().items.map((i) => {
      const updated = updatedItems.find((u) => u.id === i.id)
      return updated || i
    })
    set({ items: finalItems, selectedIds: new Set() })
    get().refreshAlerts()
  },

  addBorrowRecord: async (data) => {
    const isOverdue = new Date(data.expectedReturnDate) < new Date()
    const status = isOverdue ? 'overdue' : 'borrowed'
    const record: BorrowRecord = { ...data, id: generateId(), status }
    await db.put('borrowRecords', record)
    const item = get().items.find((i) => i.id === data.itemId)
    if (item) {
      const newQty = Math.max(0, item.availableQuantity - data.quantity)
      await get().updateItem({ ...item, availableQuantity: newQty })
    }
    set((s) => ({ borrowRecords: [...s.borrowRecords, record] }))
    if (isOverdue) {
      await get().addAnomaly({
        borrowRecordId: record.id,
        itemId: data.itemId,
        type: 'overdue',
        description: `领用时归还日期已过期，${data.borrowerName}领用${item?.name || '物品'}x${data.quantity}`,
        status: 'pending',
      })
    }
    get().refreshAlerts()
  },
  returnBorrowRecord: async (id, actualReturnDate) => {
    const record = get().borrowRecords.find((r) => r.id === id)
    if (!record) return
    const updated: BorrowRecord = { ...record, actualReturnDate, status: 'returned' }
    await db.put('borrowRecords', updated)
    const item = get().items.find((i) => i.id === record.itemId)
    if (item) {
      await get().updateItem({ ...item, availableQuantity: item.availableQuantity + record.quantity })
    }
    const relatedAnomalies = get().anomalies.filter((a) => a.borrowRecordId === id && a.status !== 'resolved')
    for (const anomaly of relatedAnomalies) {
      const resolved: Anomaly = { ...anomaly, status: 'resolved', checkedAt: new Date().toISOString() }
      await db.put('anomalies', resolved)
    }
    set((s) => ({
      borrowRecords: s.borrowRecords.map((r) => (r.id === id ? updated : r)),
      anomalies: s.anomalies.map((a) => {
        if (a.borrowRecordId === id && a.status !== 'resolved') {
          return { ...a, status: 'resolved' as const, checkedAt: new Date().toISOString() }
        }
        return a
      }),
    }))
    get().refreshAlerts()
  },
  batchReturnBorrowRecords: async (ids, actualReturnDate) => {
    const records = get().borrowRecords.filter((r) => ids.includes(r.id) && r.status !== 'returned')
    for (const record of records) {
      const updated: BorrowRecord = { ...record, actualReturnDate, status: 'returned' }
      await db.put('borrowRecords', updated)
      const item = get().items.find((i) => i.id === record.itemId)
      if (item) {
        const newQty = item.availableQuantity + record.quantity
        const status: ItemStatus = newQty <= 0 ? 'out_of_stock' : newQty < item.lowStockThreshold ? 'low_stock' : 'normal'
        const updatedItem = { ...item, availableQuantity: newQty, status, updatedAt: new Date().toISOString() }
        await db.put('items', updatedItem)
      }
      const relatedAnomalies = get().anomalies.filter((a) => a.borrowRecordId === record.id && a.status !== 'resolved')
      for (const anomaly of relatedAnomalies) {
        const resolved: Anomaly = { ...anomaly, status: 'resolved', checkedAt: new Date().toISOString() }
        await db.put('anomalies', resolved)
      }
    }
    const allRecords = await db.getAll<BorrowRecord>('borrowRecords')
    const allItems = await db.getAll<Item>('items')
    const allAnomalies = await db.getAll<Anomaly>('anomalies')
    set({ borrowRecords: allRecords, items: allItems, anomalies: allAnomalies, selectedIds: new Set() })
    get().refreshAlerts()
  },

  addAnomaly: async (data) => {
    const anomaly: Anomaly = { ...data, id: generateId(), createdAt: new Date().toISOString(), checkedAt: null }
    await db.put('anomalies', anomaly)
    set((s) => ({ anomalies: [...s.anomalies, anomaly] }))
  },
  updateAnomaly: async (data) => {
    await db.put('anomalies', data)
    set((s) => ({ anomalies: s.anomalies.map((a) => (a.id === data.id ? data : a)) }))
  },

  addInventoryCheck: async (data) => {
    const check: InventoryCheck = { ...data, id: generateId(), createdAt: new Date().toISOString(), completedAt: null }
    await db.put('inventoryChecks', check)
    set((s) => ({ inventoryChecks: [...s.inventoryChecks, check] }))
    get().refreshAlerts()
  },
  updateInventoryCheck: async (data) => {
    await db.put('inventoryChecks', data)
    set((s) => ({ inventoryChecks: s.inventoryChecks.map((c) => (c.id === data.id ? data : c)) }))
    get().refreshAlerts()
  },
  completeInventoryCheck: async (id) => {
    const check = get().inventoryChecks.find((c) => c.id === id)
    if (!check || check.status === 'completed') return
    const now = new Date().toISOString()
    const updatedItems = check.items.map((item) => {
      if (item.actualQuantity !== null) {
        return { ...item, difference: item.actualQuantity - item.bookQuantity }
      }
      return item
    })
    const completed: InventoryCheck = { ...check, items: updatedItems, status: 'completed' as const, completedAt: now }
    await db.put('inventoryChecks', completed)

    for (const item of updatedItems) {
      if (item.difference !== null && item.difference !== 0) {
        await get().addAnomaly({
          borrowRecordId: null,
          itemId: item.itemId,
          type: 'quantity_mismatch',
          description: `盘点差异：物品账面${item.bookQuantity}件，实盘${item.actualQuantity}件，差异${item.difference > 0 ? '+' : ''}${item.difference}件`,
          status: 'pending',
        })
      }
    }

    const finalChecks = await db.getAll<InventoryCheck>('inventoryChecks')
    set({ inventoryChecks: finalChecks })
    get().refreshAlerts()
  },

  addReplenishRequest: async (data) => {
    const now = new Date().toISOString()
    const req: ReplenishRequest = {
      ...data,
      id: generateId(),
      status: 'pending',
      handlerName: null,
      handledAt: null,
      remark: null,
      createdAt: now,
      updatedAt: now,
    }
    await db.put('replenishRequests', req)
    set((s) => ({ replenishRequests: [...s.replenishRequests, req] }))
    get().refreshAlerts()
  },
  approveReplenishRequest: async (id, handlerName, remark) => {
    const req = get().replenishRequests.find((r) => r.id === id)
    if (!req || req.status !== 'pending') return
    const now = new Date().toISOString()
    const updated: ReplenishRequest = { ...req, status: 'approved', handlerName, handledAt: now, remark: remark ?? null, updatedAt: now }
    await db.put('replenishRequests', updated)
    set((s) => ({ replenishRequests: s.replenishRequests.map((r) => (r.id === id ? updated : r)) }))
    get().refreshAlerts()
  },
  rejectReplenishRequest: async (id, handlerName, remark) => {
    const req = get().replenishRequests.find((r) => r.id === id)
    if (!req || req.status !== 'pending') return
    const now = new Date().toISOString()
    const updated: ReplenishRequest = { ...req, status: 'rejected', handlerName, handledAt: now, remark: remark ?? null, updatedAt: now }
    await db.put('replenishRequests', updated)
    set((s) => ({ replenishRequests: s.replenishRequests.map((r) => (r.id === id ? updated : r)) }))
    get().refreshAlerts()
  },
  completeReplenishRequest: async (id, handlerName, remark) => {
    const req = get().replenishRequests.find((r) => r.id === id)
    if (!req || req.status !== 'approved') return
    const now = new Date().toISOString()
    const updated: ReplenishRequest = { ...req, status: 'warehoused', handlerName, handledAt: now, remark: remark ?? null, updatedAt: now }
    await db.put('replenishRequests', updated)
    const item = get().items.find((i) => i.id === req.itemId)
    if (item) {
      await get().updateItem({
        ...item,
        availableQuantity: item.availableQuantity + req.quantity,
        totalQuantity: item.totalQuantity + req.quantity,
      })
    }
    await get().addAnomaly({
      borrowRecordId: null,
      itemId: req.itemId,
      type: 'replenish_request',
      description: `补货入库完成：${req.applicantName}申请的${item?.name || '物品'}x${req.quantity}件已入库`,
      status: 'resolved',
      replenishQuantity: req.quantity,
    })
    set((s) => ({ replenishRequests: s.replenishRequests.map((r) => (r.id === id ? updated : r)) }))
    get().refreshAlerts()
  },

  setFilters: (newFilters) => {
    set((s) => ({ filters: { ...s.filters, ...newFilters } }))
  },
  resetFilters: () => {
    set({ filters: { ...defaultFilters } })
  },
  toggleSelect: (id) => {
    set((s) => {
      const next = new Set(s.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next }
    })
  },
  selectAll: (ids) => {
    set((s) => {
      const next = new Set(s.selectedIds)
      for (const id of ids) next.add(id)
      return { selectedIds: next }
    })
  },
  clearSelection: () => {
    set({ selectedIds: new Set() })
  },
  removeHiddenSelections: (visibleIds) => {
    set((s) => {
      const visibleSet = new Set(visibleIds)
      const next = new Set<string>()
      for (const id of s.selectedIds) {
        if (visibleSet.has(id)) next.add(id)
      }
      return { selectedIds: next }
    })
  },

  refreshAlerts: () => {
    const { items, borrowRecords, inventoryChecks, replenishRequests } = get()
    const alerts: AlertItem[] = []

    items.forEach((item) => {
      if (item.availableQuantity <= 0) {
        alerts.push({ id: `low-${item.id}`, type: 'low_stock', title: '库存耗尽', description: `${item.name}库存为零`, relatedId: item.id, createdAt: item.updatedAt })
      } else if (item.availableQuantity < item.lowStockThreshold) {
        alerts.push({ id: `low-${item.id}`, type: 'low_stock', title: '库存不足', description: `${item.name}仅剩${item.availableQuantity}件（阈值${item.lowStockThreshold}）`, relatedId: item.id, createdAt: item.updatedAt })
      }
    })

    borrowRecords.forEach((record) => {
      if (record.status === 'overdue') {
        const item = items.find((i) => i.id === record.itemId)
        alerts.push({ id: `overdue-${record.id}`, type: 'overdue', title: '超期未归还', description: `${record.borrowerName}领用的${item?.name || '物品'}已超期`, relatedId: record.id, createdAt: record.expectedReturnDate })
      }
    })

    items.forEach((item) => {
      if (!item.responsibleId) {
        alerts.push({ id: `resp-${item.id}`, type: 'responsible_missing', title: '责任人空缺', description: `${item.name}未指定责任人`, relatedId: item.id, createdAt: item.createdAt })
      }
    })

    inventoryChecks.forEach((check) => {
      if (check.status === 'pending') {
        alerts.push({ id: `chk-pending-${check.id}`, type: 'check_pending', title: '待盘点', description: `盘点任务"${check.title}"尚未开始`, relatedId: check.id, createdAt: check.createdAt })
      } else if (check.status === 'in_progress') {
        alerts.push({ id: `chk-pending-${check.id}`, type: 'check_pending', title: '盘点中', description: `盘点任务"${check.title}"进行中`, relatedId: check.id, createdAt: check.createdAt })
      }
      if (check.status === 'completed') {
        const hasDiff = check.items.some((i) => i.difference !== null && i.difference !== 0)
        if (hasDiff) {
          alerts.push({ id: `chk-diff-${check.id}`, type: 'check_diff', title: '盘点有差异', description: `盘点"${check.title}"存在数量差异`, relatedId: check.id, createdAt: check.completedAt || check.createdAt })
        }
      }
    })

    replenishRequests.forEach((req) => {
      const item = items.find((i) => i.id === req.itemId)
      if (req.status === 'pending') {
        alerts.push({ id: `replenish-pending-${req.id}`, type: 'replenish_pending', title: '待审批补货申请', description: `${req.applicantName}申请补充${item?.name || '物品'}x${req.quantity}件`, relatedId: req.id, createdAt: req.createdAt })
      } else if (req.status === 'approved') {
        alerts.push({ id: `replenish-approved-${req.id}`, type: 'replenish_approved', title: '待入库补货', description: `${item?.name || '物品'}x${req.quantity}件已审批，待入库`, relatedId: req.id, createdAt: req.updatedAt })
      }
    })

    set({ alerts })
  },
}))
