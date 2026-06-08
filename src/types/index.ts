export type Role = 'admin' | 'user' | 'auditor'

export interface Category {
  id: string
  name: string
  description: string
  createdAt: string
}

export interface Location {
  id: string
  name: string
  building: string
  floor: string
  room: string
}

export interface Responsible {
  id: string
  name: string
  department: string
  contact: string
}

export type ItemStatus = 'normal' | 'low_stock' | 'out_of_stock'

export interface Item {
  id: string
  name: string
  categoryId: string
  locationId: string
  responsibleId: string | null
  totalQuantity: number
  availableQuantity: number
  lowStockThreshold: number
  status: ItemStatus
  createdAt: string
  updatedAt: string
}

export type BorrowStatus = 'borrowed' | 'returned' | 'overdue'

export interface BorrowRecord {
  id: string
  itemId: string
  borrowerName: string
  quantity: number
  purpose: string
  borrowDate: string
  expectedReturnDate: string
  actualReturnDate: string | null
  status: BorrowStatus
}

export type AnomalyType = 'overdue' | 'damaged' | 'missing' | 'quantity_mismatch' | 'responsible_missing' | 'replenish_request'
export type AnomalyStatus = 'pending' | 'checked' | 'resolved'

export interface Anomaly {
  id: string
  borrowRecordId: string | null
  itemId: string | null
  type: AnomalyType
  description: string
  status: AnomalyStatus
  createdAt: string
  checkedAt: string | null
  replenishQuantity?: number
}

export type CheckScope = 'category' | 'location' | 'responsible' | 'specific_items'
export type CheckStatus = 'pending' | 'in_progress' | 'completed'

export interface InventoryCheckItem {
  itemId: string
  bookQuantity: number
  actualQuantity: number | null
  difference: number | null
  note: string
}

export interface InventoryCheck {
  id: string
  title: string
  scope: CheckScope
  scopeIds: string[]
  checkerName: string
  status: CheckStatus
  items: InventoryCheckItem[]
  note: string
  createdAt: string
  completedAt: string | null
}

export interface FilterState {
  category: string | null
  location: string | null
  responsible: string | null
  borrowStatus: BorrowStatus | null
  anomalyType: AnomalyType | null
  searchQuery: string
  checkStatus: CheckStatus | null
}

export type BatchAction = 'return' | 'replenish' | 'check'

export interface AlertItem {
  id: string
  type: 'low_stock' | 'overdue' | 'responsible_missing' | 'check_pending' | 'check_diff'
  title: string
  description: string
  relatedId: string
  createdAt: string
}
