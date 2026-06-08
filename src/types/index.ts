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

export interface FilterState {
  category: string | null
  location: string | null
  responsible: string | null
  borrowStatus: BorrowStatus | null
  anomalyType: AnomalyType | null
  searchQuery: string
}

export type BatchAction = 'return' | 'replenish' | 'check'

export interface AlertItem {
  id: string
  type: 'low_stock' | 'overdue' | 'responsible_missing'
  title: string
  description: string
  relatedId: string
  createdAt: string
}
