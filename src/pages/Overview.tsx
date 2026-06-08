import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { FilterState } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Search, AlertTriangle, Package, ArrowRightLeft, ClipboardList, RotateCcw, AlertCircle, X, PlusCircle, ClipboardCheck } from 'lucide-react'

export default function Overview() {
  const {
    items, borrowRecords, categories, locations, responsibles, anomalies, inventoryChecks,
    filters, selectedIds, currentRole, alerts,
    setFilters, resetFilters, toggleSelect, selectAll, clearSelection,
    batchReturnBorrowRecords, addAnomaly,
  } = useAppStore()

  const [pendingFilter, setPendingFilter] = useState<Partial<FilterState> | null>(null)
  const [showReplenish, setShowReplenish] = useState(false)
  const [replenishQty, setReplenishQty] = useState(10)

  const filteredItems = useMemo(() => items.filter((item) => {
    if (filters.searchQuery && !item.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false
    if (filters.category && item.categoryId !== filters.category) return false
    if (filters.location && item.locationId !== filters.location) return false
    if (filters.responsible && item.responsibleId !== filters.responsible) return false
    if (filters.borrowStatus) {
      const hasActive = borrowRecords.some((r) => r.itemId === item.id && (r.status === 'borrowed' || r.status === 'overdue'))
      if (filters.borrowStatus === 'borrowed' && !hasActive) return false
      if (filters.borrowStatus === 'returned' && hasActive) return false
    }
    if (filters.anomalyType && !anomalies.some((a) => a.itemId === item.id && a.type === filters.anomalyType)) return false
    if (filters.checkStatus) {
      const checks = inventoryChecks.filter((c) => c.items.some((ci) => ci.itemId === item.id))
      const latest = checks.length > 0 ? checks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null
      if (!latest) return false
      if (latest.status !== filters.checkStatus) return false
    }
    return true
  }), [items, borrowRecords, anomalies, inventoryChecks, filters])

  const getLatestCheck = (itemId: string) => {
    const checks = inventoryChecks.filter((c) => c.items.some((i) => i.itemId === itemId))
    if (checks.length === 0) return null
    return checks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  }

  const getCheckBadge = (itemId: string) => {
    const latest = getLatestCheck(itemId)
    if (!latest) return null
    if (latest.status === 'pending') return { cls: 'badge-warning', label: '待盘点' }
    if (latest.status === 'in_progress') return { cls: 'badge-info', label: '盘点中' }
    const hasDiff = latest.items.some((i) => i.itemId === itemId && i.difference !== null && i.difference !== 0)
    if (hasDiff) return { cls: 'badge-danger', label: '有差异' }
    return { cls: 'badge-success', label: '已盘点' }
  }

  const visibleItemIds = useMemo(() => new Set(filteredItems.map((i) => i.id)), [filteredItems])
  const selectedArr = useMemo(() => Array.from(selectedIds), [selectedIds])
  const hiddenSelectedCount = selectedArr.filter((id) => !visibleItemIds.has(id)).length
  const isAllSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id))

  const lowStockCount = alerts.filter((a) => a.type === 'low_stock').length
  const overdueCount = alerts.filter((a) => a.type === 'overdue').length
  const respMissingCount = alerts.filter((a) => a.type === 'responsible_missing').length
  const checkPendingCount = alerts.filter((a) => a.type === 'check_pending').length
  const checkDiffCount = alerts.filter((a) => a.type === 'check_diff').length

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '-'
  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? '-'
  const respName = (id: string | null) => id ? responsibles.find((r) => r.id === id)?.name ?? '-' : '未指定'

  const activeBorrowCount = (itemId: string) =>
    borrowRecords.filter((r) => r.itemId === itemId && (r.status === 'borrowed' || r.status === 'overdue')).length

  const statusBadge = (s: string) => {
    const m: Record<string, [string, string]> = {
      normal: ['badge-success', '正常'],
      low_stock: ['badge-warning', '库存不足'],
      out_of_stock: ['badge-danger', '缺货'],
    }
    return m[s] ?? ['badge-info', s]
  }

  const handleFilterChange = (update: Partial<FilterState>) => {
    if (selectedIds.size > 0) {
      setPendingFilter(update)
    } else {
      setFilters(update)
    }
  }

  const handlePendingConfirm = () => {
    if (pendingFilter) setFilters(pendingFilter)
    setPendingFilter(null)
  }

  const handlePendingCancel = () => {
    if (pendingFilter) {
      setFilters(pendingFilter)
    }
    clearSelection()
    setPendingFilter(null)
  }

  const handleBatchReturn = () => {
    const visibleSelected = selectedArr.filter((id) => visibleItemIds.has(id))
    const activeBorrowIds = borrowRecords
      .filter((r) => visibleSelected.includes(r.itemId) && (r.status === 'borrowed' || r.status === 'overdue'))
      .map((r) => r.id)
    if (activeBorrowIds.length > 0) {
      batchReturnBorrowRecords(activeBorrowIds, new Date().toISOString())
    }
  }

  const handleBatchAnomaly = () => {
    const visibleSelected = selectedArr.filter((id) => visibleItemIds.has(id))
    for (const id of visibleSelected) {
      const item = items.find((i) => i.id === id)
      if (item) {
        addAnomaly({
          borrowRecordId: null,
          itemId: id,
          type: 'missing',
          description: `物品"${item.name}"标记待核对`,
          status: 'pending',
        })
      }
    }
  }

  const handleReplenish = () => {
    const visibleSelected = selectedArr.filter((id) => visibleItemIds.has(id))
    for (const id of visibleSelected) {
      const item = items.find((i) => i.id === id)
      if (item) {
        addAnomaly({
          borrowRecordId: null,
          itemId: id,
          type: 'replenish_request' as const,
          description: `申请补充"${item.name}"库存 ${replenishQty} 件，当前库存 ${item.availableQuantity}/${item.totalQuantity}`,
          status: 'pending' as const,
          replenishQuantity: replenishQty,
        })
      }
    }
    clearSelection()
    setShowReplenish(false)
    setReplenishQty(10)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">物品总览</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>共 {items.length} 件物品，当前显示 {filteredItems.length} 件</p>
        </div>
        <div className="flex gap-3">
          <div className="card px-4 py-2 flex items-center gap-2 cursor-pointer hover:border-amber-500 transition-colors" style={{ borderColor: lowStockCount > 0 ? 'var(--warning)' : 'var(--border-color)' }} onClick={() => handleFilterChange({ anomalyType: null, borrowStatus: null })}>
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            <span className="text-sm">库存不足</span>
            <span className="badge badge-warning">{lowStockCount}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2 cursor-pointer hover:border-red-500 transition-colors" style={{ borderColor: overdueCount > 0 ? 'var(--danger)' : 'var(--border-color)' }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
            <span className="text-sm">超期未还</span>
            <span className="badge badge-danger">{overdueCount}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2 cursor-pointer hover:border-blue-500 transition-colors" style={{ borderColor: respMissingCount > 0 ? 'var(--info)' : 'var(--border-color)' }}>
            <AlertTriangle size={16} style={{ color: 'var(--info)' }} />
            <span className="text-sm">责任人空缺</span>
            <span className="badge badge-info">{respMissingCount}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2 cursor-pointer hover:border-purple-500 transition-colors" style={{ borderColor: checkPendingCount > 0 ? 'var(--warning)' : 'var(--border-color)' }} onClick={() => handleFilterChange({ checkStatus: null })}>
            <ClipboardCheck size={16} style={{ color: '#a855f7' }} />
            <span className="text-sm">待盘点</span>
            <span className="badge badge-warning">{checkPendingCount}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2 cursor-pointer hover:border-orange-500 transition-colors" style={{ borderColor: checkDiffCount > 0 ? 'var(--danger)' : 'var(--border-color)' }}>
            <ClipboardCheck size={16} style={{ color: '#f97316' }} />
            <span className="text-sm">盘点差异</span>
            <span className="badge badge-danger">{checkDiffCount}</span>
          </div>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-9" placeholder="搜索物品名称..." value={filters.searchQuery} onChange={(e) => handleFilterChange({ searchQuery: e.target.value })} />
        </div>
        <select className="select-field w-36" value={filters.category ?? ''} onChange={(e) => handleFilterChange({ category: e.target.value || null })}>
          <option value="">所有分类</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select-field w-36" value={filters.location ?? ''} onChange={(e) => handleFilterChange({ location: e.target.value || null })}>
          <option value="">所有存放点</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className="select-field w-36" value={filters.responsible ?? ''} onChange={(e) => handleFilterChange({ responsible: e.target.value || null })}>
          <option value="">所有责任人</option>
          {responsibles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select className="select-field w-32" value={filters.borrowStatus ?? ''} onChange={(e) => handleFilterChange({ borrowStatus: (e.target.value || null) as FilterState['borrowStatus'] })}>
          <option value="">领用状态</option>
          <option value="borrowed">借出中</option>
          <option value="returned">已归还</option>
          <option value="overdue">超期未还</option>
        </select>
        <select className="select-field w-32" value={filters.anomalyType ?? ''} onChange={(e) => handleFilterChange({ anomalyType: (e.target.value || null) as FilterState['anomalyType'] })}>
          <option value="">异常类型</option>
          <option value="overdue">超期</option>
          <option value="damaged">损坏</option>
          <option value="missing">丢失</option>
          <option value="quantity_mismatch">数量不符</option>
          <option value="responsible_missing">责任人空缺</option>
          <option value="replenish_request">补充申请</option>
        </select>
        <select className="select-field w-32" value={filters.checkStatus ?? ''} onChange={(e) => handleFilterChange({ checkStatus: (e.target.value || null) as FilterState['checkStatus'] })}>
          <option value="">盘点状态</option>
          <option value="pending">待盘点</option>
          <option value="in_progress">盘点中</option>
          <option value="completed">已盘点</option>
        </select>
        <button className="btn-secondary flex items-center gap-1.5" onClick={() => { resetFilters(); clearSelection() }}>
          <RotateCcw size={14} /> 重置
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                {currentRole !== 'auditor' && (
                  <th className="p-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={() => isAllSelected ? clearSelection() : selectAll(filteredItems.map((i) => i.id))}
                      className="rounded"
                    />
                  </th>
                )}
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>物品名称</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>分类</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>存放点</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>责任人</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>库存</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>状态</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>领用中</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>盘点状态</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>最近盘点</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const [badgeCls, badgeLabel] = statusBadge(item.status)
                return (
                  <tr key={item.id} className="border-t transition-colors hover:bg-opacity-50" style={{ borderColor: 'var(--border-color)' }}>
                    {currentRole !== 'auditor' && (
                      <td className="p-3">
                        <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" />
                      </td>
                    )}
                    <td className="p-3 font-medium text-sm">{item.name}</td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{catName(item.categoryId)}</td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{locName(item.locationId)}</td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{respName(item.responsibleId)}</td>
                    <td className="p-3 text-sm">
                      <span className={item.availableQuantity < item.lowStockThreshold ? 'font-semibold' : ''} style={{ color: item.availableQuantity <= 0 ? 'var(--danger)' : item.availableQuantity < item.lowStockThreshold ? 'var(--warning)' : 'var(--text-primary)' }}>
                        {item.availableQuantity}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}> / {item.totalQuantity}</span>
                    </td>
                    <td className="p-3"><span className={`badge ${badgeCls}`}>{badgeLabel}</span></td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{activeBorrowCount(item.id)}</td>
                    <td className="p-3">{(() => { const cb = getCheckBadge(item.id); return cb ? <span className={`badge ${cb.cls}`}>{cb.label}</span> : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span> })()}</td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>{(() => { const lc = getLatestCheck(item.id); return lc ? new Date(lc.completedAt || lc.createdAt).toLocaleDateString() : '—' })()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 && (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <Package size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无匹配的物品记录</p>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && currentRole !== 'auditor' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-xl px-6 py-3 flex items-center gap-4 shadow-2xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent)' }}>
          <span className="font-semibold text-sm">已选 {selectedIds.size} 项</span>
          {hiddenSelectedCount > 0 && (
            <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--warning)' }}>
              <AlertTriangle size={14} /> {hiddenSelectedCount} 项被筛选隐藏
            </span>
          )}
          <div className="w-px h-6" style={{ background: 'var(--border-color)' }} />
          <button className="btn-primary flex items-center gap-1.5 text-xs" onClick={handleBatchReturn}>
            <ArrowRightLeft size={14} /> 标记归还
          </button>
          <button className="btn-secondary flex items-center gap-1.5 text-xs" onClick={() => setShowReplenish(true)}>
            <PlusCircle size={14} /> 补充申请
          </button>
          <button className="btn-secondary flex items-center gap-1.5 text-xs" onClick={handleBatchAnomaly}>
            <ClipboardList size={14} /> 待核对
          </button>
          <button className="btn-secondary flex items-center gap-1.5 text-xs" onClick={clearSelection}>
            <X size={14} /> 清空
          </button>
        </div>
      )}

      {showReplenish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReplenish(false)} />
          <div className="relative rounded-xl p-6 w-full max-w-sm shadow-2xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-semibold text-base mb-4">补充申请</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>为 {selectedIds.size} 件物品提交补充申请，管理员审核后入库</p>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>补充数量</label>
            <input type="number" className="input-field" min={1} value={replenishQty} onChange={(e) => setReplenishQty(Math.max(1, Number(e.target.value)))} />
            <div className="flex justify-end gap-3 mt-5">
              <button className="btn-secondary" onClick={() => setShowReplenish(false)}>取消</button>
              <button className="btn-primary" onClick={handleReplenish}>提交申请</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingFilter}
        title="切换筛选条件"
        message={`当前有 ${selectedIds.size} 条记录被选中，切换筛选后这些选择可能被隐藏。是否保留选择？`}
        confirmLabel="保留选择"
        cancelLabel="清空选择"
        variant="warning"
        onConfirm={handlePendingConfirm}
        onCancel={handlePendingCancel}
      />
    </div>
  )
}
