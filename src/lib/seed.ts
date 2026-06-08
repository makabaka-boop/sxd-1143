import type { Category, Location, Responsible, Item, BorrowRecord, Anomaly, InventoryCheck, ReplenishRequest } from '@/types'
import { generateId } from '@/lib/db'

const now = new Date().toISOString()
const day = 86400000

export const seedCategories: Category[] = [
  { id: 'cat-1', name: '办公用品', description: '日常办公文具及耗材', createdAt: now },
  { id: 'cat-2', name: '电子设备', description: '电脑、投影仪等电子设备', createdAt: now },
  { id: 'cat-3', name: '家具', description: '桌椅、柜子等办公家具', createdAt: now },
  { id: 'cat-4', name: '劳保用品', description: '安全防护用品', createdAt: now },
]

export const seedLocations: Location[] = [
  { id: 'loc-1', name: 'A栋仓库', building: 'A栋', floor: '1', room: '101' },
  { id: 'loc-2', name: 'B栋仓库', building: 'B栋', floor: '2', room: '201' },
  { id: 'loc-3', name: '行政办公室', building: 'A栋', floor: '3', room: '305' },
  { id: 'loc-4', name: 'IT机房', building: 'C栋', floor: '1', room: '108' },
]

export const seedResponsibles: Responsible[] = [
  { id: 'resp-1', name: '张明', department: '行政部', contact: '13800138001' },
  { id: 'resp-2', name: '李红', department: 'IT部', contact: '13800138002' },
  { id: 'resp-3', name: '王刚', department: '后勤部', contact: '13800138003' },
]

export const seedItems: Item[] = [
  { id: 'item-1', name: 'A4复印纸', categoryId: 'cat-1', locationId: 'loc-1', responsibleId: 'resp-1', totalQuantity: 500, availableQuantity: 350, lowStockThreshold: 100, status: 'normal', createdAt: now, updatedAt: now },
  { id: 'item-2', name: '签字笔（黑色）', categoryId: 'cat-1', locationId: 'loc-1', responsibleId: 'resp-1', totalQuantity: 200, availableQuantity: 45, lowStockThreshold: 50, status: 'low_stock', createdAt: now, updatedAt: now },
  { id: 'item-3', name: '笔记本电脑', categoryId: 'cat-2', locationId: 'loc-4', responsibleId: 'resp-2', totalQuantity: 20, availableQuantity: 5, lowStockThreshold: 3, status: 'low_stock', createdAt: now, updatedAt: now },
  { id: 'item-4', name: '投影仪', categoryId: 'cat-2', locationId: 'loc-4', responsibleId: 'resp-2', totalQuantity: 8, availableQuantity: 3, lowStockThreshold: 2, status: 'normal', createdAt: now, updatedAt: now },
  { id: 'item-5', name: '办公椅', categoryId: 'cat-3', locationId: 'loc-2', responsibleId: 'resp-3', totalQuantity: 50, availableQuantity: 12, lowStockThreshold: 10, status: 'normal', createdAt: now, updatedAt: now },
  { id: 'item-6', name: '文件柜', categoryId: 'cat-3', locationId: 'loc-2', responsibleId: null, totalQuantity: 30, availableQuantity: 8, lowStockThreshold: 5, status: 'normal', createdAt: now, updatedAt: now },
  { id: 'item-7', name: '安全帽', categoryId: 'cat-4', locationId: 'loc-1', responsibleId: 'resp-3', totalQuantity: 100, availableQuantity: 0, lowStockThreshold: 20, status: 'out_of_stock', createdAt: now, updatedAt: now },
  { id: 'item-8', name: '订书机', categoryId: 'cat-1', locationId: 'loc-3', responsibleId: 'resp-1', totalQuantity: 60, availableQuantity: 25, lowStockThreshold: 10, status: 'normal', createdAt: now, updatedAt: now },
  { id: 'item-9', name: '白板', categoryId: 'cat-3', locationId: 'loc-2', responsibleId: null, totalQuantity: 15, availableQuantity: 2, lowStockThreshold: 3, status: 'low_stock', createdAt: now, updatedAt: now },
  { id: 'item-10', name: '打印机墨盒', categoryId: 'cat-1', locationId: 'loc-3', responsibleId: 'resp-1', totalQuantity: 40, availableQuantity: 8, lowStockThreshold: 10, status: 'low_stock', createdAt: now, updatedAt: now },
]

const borrowDate1 = new Date(Date.now() - 15 * day).toISOString()
const borrowDate2 = new Date(Date.now() - 30 * day).toISOString()
const borrowDate3 = new Date(Date.now() - 5 * day).toISOString()
const borrowDate4 = new Date(Date.now() - 45 * day).toISOString()

export const seedBorrowRecords: BorrowRecord[] = [
  { id: 'br-1', itemId: 'item-1', borrowerName: '陈伟', quantity: 50, purpose: '部门月度报告打印', borrowDate: borrowDate1, expectedReturnDate: new Date(Date.now() - 1 * day).toISOString(), actualReturnDate: null, status: 'overdue' },
  { id: 'br-2', itemId: 'item-3', borrowerName: '刘洋', quantity: 1, purpose: '出差使用', borrowDate: borrowDate2, expectedReturnDate: new Date(Date.now() - 10 * day).toISOString(), actualReturnDate: null, status: 'overdue' },
  { id: 'br-3', itemId: 'item-4', borrowerName: '赵芳', quantity: 1, purpose: '客户演示', borrowDate: borrowDate3, expectedReturnDate: new Date(Date.now() + 5 * day).toISOString(), actualReturnDate: null, status: 'borrowed' },
  { id: 'br-4', itemId: 'item-2', borrowerName: '孙磊', quantity: 30, purpose: '新员工入职', borrowDate: borrowDate4, expectedReturnDate: new Date(Date.now() - 20 * day).toISOString(), actualReturnDate: null, status: 'overdue' },
  { id: 'br-5', itemId: 'item-5', borrowerName: '周婷', quantity: 2, purpose: '临时工位', borrowDate: borrowDate3, expectedReturnDate: new Date(Date.now() + 10 * day).toISOString(), actualReturnDate: null, status: 'borrowed' },
  { id: 'br-6', itemId: 'item-8', borrowerName: '吴强', quantity: 5, purpose: '部门配置', borrowDate: new Date(Date.now() - 60 * day).toISOString(), expectedReturnDate: new Date(Date.now() - 30 * day).toISOString(), actualReturnDate: new Date(Date.now() - 28 * day).toISOString(), status: 'returned' },
]

export const seedAnomalies: Anomaly[] = [
  { id: 'ano-1', borrowRecordId: 'br-1', itemId: 'item-1', type: 'overdue', description: '领用已超期15天未归还', status: 'pending', createdAt: new Date(Date.now() - 2 * day).toISOString(), checkedAt: null },
  { id: 'ano-2', borrowRecordId: 'br-2', itemId: 'item-3', type: 'overdue', description: '笔记本电脑超期未归还', status: 'pending', createdAt: new Date(Date.now() - 10 * day).toISOString(), checkedAt: null },
  { id: 'ano-3', borrowRecordId: 'br-4', itemId: 'item-2', type: 'quantity_mismatch', description: '签字笔领用30支，实际仅余15支可归还', status: 'pending', createdAt: new Date(Date.now() - 5 * day).toISOString(), checkedAt: null },
  { id: 'ano-4', borrowRecordId: null, itemId: 'item-6', type: 'responsible_missing', description: '文件柜无责任人管理', status: 'pending', createdAt: now, checkedAt: null },
  { id: 'ano-5', borrowRecordId: null, itemId: 'item-9', type: 'responsible_missing', description: '白板无责任人管理', status: 'pending', createdAt: now, checkedAt: null },
  { id: 'ano-6', borrowRecordId: null, itemId: 'item-7', type: 'damaged', description: '安全帽库存为零，无法领用', status: 'pending', createdAt: new Date(Date.now() - 1 * day).toISOString(), checkedAt: null },
]

export const seedInventoryChecks: InventoryCheck[] = [
  {
    id: 'ic-1',
    title: '办公用品月度盘点',
    scope: 'category',
    scopeIds: ['cat-1'],
    checkerName: '张明',
    status: 'completed',
    items: [
      { itemId: 'item-1', bookQuantity: 350, actualQuantity: 348, difference: -2, note: '2包已拆封使用' },
      { itemId: 'item-2', bookQuantity: 45, actualQuantity: 40, difference: -5, note: '5支无法找到' },
      { itemId: 'item-8', bookQuantity: 25, actualQuantity: 25, difference: 0, note: '' },
      { itemId: 'item-10', bookQuantity: 8, actualQuantity: 6, difference: -2, note: '2个已开封' },
    ],
    note: '办公用品常规月度盘点',
    createdAt: new Date(Date.now() - 7 * day).toISOString(),
    completedAt: new Date(Date.now() - 6 * day).toISOString(),
  },
  {
    id: 'ic-2',
    title: 'A栋仓库全面盘点',
    scope: 'location',
    scopeIds: ['loc-1'],
    checkerName: '王刚',
    status: 'in_progress',
    items: [
      { itemId: 'item-1', bookQuantity: 350, actualQuantity: null, difference: null, note: '' },
      { itemId: 'item-2', bookQuantity: 45, actualQuantity: null, difference: null, note: '' },
      { itemId: 'item-7', bookQuantity: 0, actualQuantity: null, difference: null, note: '' },
    ],
    note: 'A栋仓库季度盘点',
    createdAt: new Date(Date.now() - 1 * day).toISOString(),
    completedAt: null,
  },
  {
    id: 'ic-3',
    title: 'IT设备专项盘点',
    scope: 'responsible',
    scopeIds: ['resp-2'],
    checkerName: '李红',
    status: 'pending',
    items: [
      { itemId: 'item-3', bookQuantity: 5, actualQuantity: null, difference: null, note: '' },
      { itemId: 'item-4', bookQuantity: 3, actualQuantity: null, difference: null, note: '' },
    ],
    note: 'IT部负责设备专项盘点',
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
]

export const seedReplenishRequests: ReplenishRequest[] = [
  {
    id: 'rr-1',
    itemId: 'item-7',
    applicantName: '王刚',
    quantity: 50,
    purpose: '安全帽库存为零，急需补充以满足工地需求',
    expectedDate: new Date(Date.now() + 3 * day).toISOString().split('T')[0],
    status: 'pending',
    handlerName: null,
    handledAt: null,
    remark: null,
    createdAt: new Date(Date.now() - 1 * day).toISOString(),
    updatedAt: new Date(Date.now() - 1 * day).toISOString(),
  },
  {
    id: 'rr-2',
    itemId: 'item-2',
    applicantName: '张明',
    quantity: 100,
    purpose: '签字笔库存低于预警阈值，补充日常办公用',
    expectedDate: new Date(Date.now() + 5 * day).toISOString().split('T')[0],
    status: 'approved',
    handlerName: '管理员',
    handledAt: new Date(Date.now() - 0.5 * day).toISOString(),
    remark: '已联系供应商，预计按时到货',
    createdAt: new Date(Date.now() - 2 * day).toISOString(),
    updatedAt: new Date(Date.now() - 0.5 * day).toISOString(),
  },
  {
    id: 'rr-3',
    itemId: 'item-10',
    applicantName: '陈伟',
    quantity: 20,
    purpose: '打印机墨盒即将耗尽，需及时补充',
    expectedDate: new Date(Date.now() + 7 * day).toISOString().split('T')[0],
    status: 'warehoused',
    handlerName: '管理员',
    handledAt: new Date(Date.now() - 3 * day).toISOString(),
    remark: '已入库',
    createdAt: new Date(Date.now() - 7 * day).toISOString(),
    updatedAt: new Date(Date.now() - 3 * day).toISOString(),
  },
  {
    id: 'rr-4',
    itemId: 'item-9',
    applicantName: '李红',
    quantity: 5,
    purpose: '白板库存不足，会议室需要补充',
    expectedDate: new Date(Date.now() + 10 * day).toISOString().split('T')[0],
    status: 'rejected',
    handlerName: '管理员',
    handledAt: new Date(Date.now() - 1 * day).toISOString(),
    remark: '本月预算不足，下月再申请',
    createdAt: new Date(Date.now() - 3 * day).toISOString(),
    updatedAt: new Date(Date.now() - 1 * day).toISOString(),
  },
]
