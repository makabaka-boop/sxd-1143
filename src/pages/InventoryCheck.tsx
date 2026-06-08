import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { CheckScope, CheckStatus, InventoryCheck, InventoryCheckItem } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog'
import {
  ClipboardCheck, Plus, ChevronDown, ChevronUp, Search, Play, CheckCircle,
  AlertTriangle, Package, Eye, RotateCcw, FileText,
} from 'lucide-react'

type View = 'list' | 'create' | 'detail'

export default function InventoryCheckPage() {
  const {
    inventoryChecks, items, categories, locations, responsibles, currentRole,
    updateInventoryCheck,
  } = useAppStore()

  const [view, setView] = useState<View>('list')
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<CheckStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isAdmin = currentRole === 'admin'
  const isReadOnly = currentRole === 'auditor'

  const filteredChecks = useMemo(() => inventoryChecks.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!c.title.toLowerCase().includes(q) && !c.checkerName.toLowerCase().includes(q) && !c.note.toLowerCase().includes(q)) return false
    }
    return true
  }), [inventoryChecks, filterStatus, searchQuery])

  const pendingCount = inventoryChecks.filter((c) => c.status === 'pending').length
  const inProgressCount = inventoryChecks.filter((c) => c.status === 'in_progress').length
  const completedCount = inventoryChecks.filter((c) => c.status === 'completed').length
  const diffCount = inventoryChecks.filter((c) => c.status === 'completed' && c.items.some((i) => i.difference !== null && i.difference !== 0)).length

  const statusConfig: Record<CheckStatus, { label: string; badge: string; color: string }> = {
    pending: { label: '待盘点', badge: 'badge-warning', color: 'text-amber-400' },
    in_progress: { label: '盘点中', badge: 'badge-info', color: 'text-blue-400' },
    completed: { label: '已完成', badge: 'badge-success', color: 'text-emerald-400' },
  }

  const scopeConfig: Record<CheckScope, { label: string }> = {
    category: { label: '按分类' },
    location: { label: '按存放点' },
    responsible: { label: '按责任人' },
    specific_items: { label: '指定物品' },
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '-'
  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? '-'
  const respName = (id: string) => responsibles.find((r) => r.id === id)?.name ?? '-'
  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? '-'

  const getScopeLabel = (check: InventoryCheck) => {
    const cfg = scopeConfig[check.scope]
    const names = check.scopeIds.map((id) => {
      if (check.scope === 'category') return catName(id)
      if (check.scope === 'location') return locName(id)
      if (check.scope === 'responsible') return respName(id)
      return itemName(id)
    })
    return `${cfg.label}：${names.join('、')}`
  }

  if (view === 'create') {
    return <CreateCheckView onBack={() => setView('list')} />
  }

  if (view === 'detail' && selectedCheckId) {
    const check = inventoryChecks.find((c) => c.id === selectedCheckId)
    if (check) {
      return (
        <CheckDetailView
          check={check}
          isReadOnly={isReadOnly}
          onBack={() => { setView('list'); setSelectedCheckId(null) }}
        />
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardCheck size={22} style={{ color: 'var(--accent)' }} /> 库存盘点
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isReadOnly ? '您当前为审计员角色，仅可查看盘点记录' : `共 ${inventoryChecks.length} 个盘点任务`}
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-1.5" onClick={() => setView('create')}>
            <Plus size={16} /> 发起盘点
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="card px-4 py-2 flex items-center gap-2" style={{ borderColor: pendingCount > 0 ? 'var(--warning)' : 'var(--border-color)' }}>
          <span className="text-sm">待盘点</span>
          <span className="badge badge-warning">{pendingCount}</span>
        </div>
        <div className="card px-4 py-2 flex items-center gap-2" style={{ borderColor: inProgressCount > 0 ? 'var(--info)' : 'var(--border-color)' }}>
          <span className="text-sm">盘点中</span>
          <span className="badge badge-info">{inProgressCount}</span>
        </div>
        <div className="card px-4 py-2 flex items-center gap-2">
          <span className="text-sm">已完成</span>
          <span className="badge badge-success">{completedCount}</span>
        </div>
        <div className="card px-4 py-2 flex items-center gap-2" style={{ borderColor: diffCount > 0 ? 'var(--danger)' : 'var(--border-color)' }}>
          <span className="text-sm">有差异</span>
          <span className="badge badge-danger">{diffCount}</span>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-9" placeholder="搜索盘点标题、盘点人..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="select-field w-32" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CheckStatus | '')}>
          <option value="">所有状态</option>
          <option value="pending">待盘点</option>
          <option value="in_progress">盘点中</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredChecks.map((check) => {
          const statusCfg = statusConfig[check.status]
          const isExpanded = expandedId === check.id
          const diffItems = check.items.filter((i) => i.difference !== null && i.difference !== 0)
          const itemCount = check.items.length
          const checkedCount = check.items.filter((i) => i.actualQuantity !== null).length

          return (
            <div key={check.id} className="card overflow-hidden" style={{ borderColor: check.status === 'pending' ? 'var(--warning)' : check.status === 'in_progress' ? 'var(--info)' : 'var(--border-color)' }}>
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : check.id)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${check.status === 'pending' ? 'bg-amber-500/10' : check.status === 'in_progress' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                  <ClipboardCheck size={18} className={statusCfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${statusCfg.badge}`}>{statusCfg.label}</span>
                    <span className="badge badge-info">{scopeConfig[check.scope].label}</span>
                    {diffItems.length > 0 && <span className="badge badge-danger">{diffItems.length}项差异</span>}
                  </div>
                  <p className="text-sm font-medium truncate">{check.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{getScopeLabel(check)}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>盘点人：{check.checkerName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>进度：{checkedCount}/{itemCount}</p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(check.createdAt).toLocaleDateString()}</span>
                  {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-4 pt-0 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: 'var(--bg-tertiary)' }}>
                          <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>物品名称</th>
                          <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>账面数量</th>
                          <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>实盘数量</th>
                          <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>差异</th>
                          <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>备注</th>
                        </tr>
                      </thead>
                      <tbody>
                        {check.items.map((ci) => {
                          const diffColor = ci.difference === null ? 'var(--text-muted)' : ci.difference === 0 ? 'var(--accent)' : ci.difference > 0 ? 'var(--info)' : 'var(--danger)'
                          return (
                            <tr key={ci.itemId} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                              <td className="p-2.5 text-sm font-medium">{itemName(ci.itemId)}</td>
                              <td className="p-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{ci.bookQuantity}</td>
                              <td className="p-2.5 text-sm" style={{ color: ci.actualQuantity === null ? 'var(--text-muted)' : 'var(--text-primary)' }}>{ci.actualQuantity ?? '—'}</td>
                              <td className="p-2.5 text-sm font-semibold" style={{ color: diffColor }}>
                                {ci.difference === null ? '—' : ci.difference === 0 ? '一致' : `${ci.difference > 0 ? '+' : ''}${ci.difference}`}
                              </td>
                              <td className="p-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{ci.note || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {check.note && (
                    <div className="mt-3 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>盘点备注：</span>{check.note}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      创建时间：{new Date(check.createdAt).toLocaleString()}
                      {check.completedAt && ` | 完成时间：${new Date(check.completedAt).toLocaleString()}`}
                    </div>
                    <div className="flex gap-2">
                      {isReadOnly && (
                        <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)' }}>
                          <Eye size={12} className="inline mr-1" /> 仅查看
                        </span>
                      )}
                      {isAdmin && check.status === 'pending' && (
                        <button
                          className="btn-secondary flex items-center gap-1.5 text-xs"
                          onClick={(e) => { e.stopPropagation(); updateInventoryCheck({ ...check, status: 'in_progress' }) }}
                        >
                          <Play size={14} /> 开始盘点
                        </button>
                      )}
                      {isAdmin && (check.status === 'pending' || check.status === 'in_progress') && (
                        <button
                          className="btn-primary flex items-center gap-1.5 text-xs"
                          onClick={(e) => { e.stopPropagation(); setView('detail'); setSelectedCheckId(check.id) }}
                        >
                          <FileText size={14} /> 录入盘点
                        </button>
                      )}
                      <button
                        className="btn-secondary flex items-center gap-1.5 text-xs"
                        onClick={(e) => { e.stopPropagation(); setView('detail'); setSelectedCheckId(check.id) }}
                      >
                        <Eye size={14} /> 查看详情
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredChecks.length === 0 && (
          <div className="card p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <ClipboardCheck size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无盘点记录</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateCheckView({ onBack }: { onBack: () => void }) {
  const { items, categories, locations, responsibles, addInventoryCheck } = useAppStore()
  const [title, setTitle] = useState('')
  const [scope, setScope] = useState<CheckScope>('category')
  const [scopeIds, setScopeIds] = useState<string[]>([])
  const [checkerName, setCheckerName] = useState('')
  const [note, setNote] = useState('')

  const scopeOptions = useMemo(() => {
    if (scope === 'category') return categories.map((c) => ({ id: c.id, name: c.name }))
    if (scope === 'location') return locations.map((l) => ({ id: l.id, name: l.name }))
    if (scope === 'responsible') return responsibles.map((r) => ({ id: r.id, name: r.name }))
    return items.map((i) => ({ id: i.id, name: i.name }))
  }, [scope, categories, locations, responsibles, items])

  const filteredItems = useMemo(() => {
    if (scope === 'category') return items.filter((i) => scopeIds.includes(i.categoryId))
    if (scope === 'location') return items.filter((i) => scopeIds.includes(i.locationId))
    if (scope === 'responsible') return items.filter((i) => i.responsibleId && scopeIds.includes(i.responsibleId))
    return items.filter((i) => scopeIds.includes(i.id))
  }, [scope, scopeIds, items])

  const toggleScopeId = (id: string) => {
    setScopeIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const handleSubmit = async () => {
    if (!title || !checkerName || scopeIds.length === 0) return
    const checkItems: InventoryCheckItem[] = filteredItems.map((item) => ({
      itemId: item.id,
      bookQuantity: item.availableQuantity,
      actualQuantity: null,
      difference: null,
      note: '',
    }))
    await addInventoryCheck({
      title,
      scope,
      scopeIds,
      checkerName,
      status: 'pending',
      items: checkItems,
      note,
    })
    onBack()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button className="btn-secondary flex items-center gap-1.5" onClick={onBack}>
          <RotateCcw size={14} /> 返回
        </button>
        <h2 className="text-xl font-bold">发起盘点</h2>
      </div>

      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>盘点标题 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="input-field" placeholder="请输入盘点标题" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>盘点人 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="input-field" placeholder="请输入盘点人姓名" value={checkerName} onChange={(e) => setCheckerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>盘点范围 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select className="select-field" value={scope} onChange={(e) => { setScope(e.target.value as CheckScope); setScopeIds([]) }}>
              <option value="category">按分类</option>
              <option value="location">按存放点</option>
              <option value="responsible">按责任人</option>
              <option value="specific_items">指定物品</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>盘点备注</label>
            <input className="input-field" placeholder="请输入备注（可选）" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            选择范围项 <span style={{ color: 'var(--danger)' }}>*</span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>已选 {scopeIds.length} 项，涉及 {filteredItems.length} 件物品</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {scopeOptions.map((opt) => (
              <button
                key={opt.id}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${scopeIds.includes(opt.id) ? 'text-white' : ''}`}
                style={{ background: scopeIds.includes(opt.id) ? 'var(--accent)' : 'var(--bg-tertiary)', color: scopeIds.includes(opt.id) ? 'white' : 'var(--text-secondary)' }}
                onClick={() => toggleScopeId(opt.id)}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length > 0 && (
          <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <p className="text-sm font-medium mb-2">将盘点以下 {filteredItems.length} 件物品</p>
            <div className="flex flex-wrap gap-2">
              {filteredItems.map((item) => (
                <span key={item.id} className="badge badge-info">{item.name}（库存：{item.availableQuantity}）</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onBack}>取消</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!title || !checkerName || scopeIds.length === 0}>
            创建盘点任务
          </button>
        </div>
      </div>
    </div>
  )
}

function CheckDetailView({
  check, isReadOnly, onBack,
}: {
  check: InventoryCheck
  isReadOnly: boolean
  onBack: () => void
}) {
  const { items, categories, locations, responsibles, currentRole, updateInventoryCheck, completeInventoryCheck, updateItem } = useAppStore()
  const isAdmin = currentRole === 'admin'
  const [editItems, setEditItems] = useState<InventoryCheckItem[]>(check.items)
  const [checkNote, setCheckNote] = useState(check.note)
  const [showComplete, setShowComplete] = useState(false)
  const [adjustItems, setAdjustItems] = useState<Set<string>>(new Set())

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '-'
  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? '-'
  const respName = (id: string | null) => id ? responsibles.find((r) => r.id === id)?.name ?? '-' : '未指定'
  const getItem = (id: string) => items.find((i) => i.id === id)

  const handleActualQtyChange = (itemId: string, qty: number | null) => {
    setEditItems((prev) => prev.map((ci) => {
      if (ci.itemId !== itemId) return ci
      return { ...ci, actualQuantity: qty, difference: qty !== null ? qty - ci.bookQuantity : null }
    }))
  }

  const handleNoteChange = (itemId: string, note: string) => {
    setEditItems((prev) => prev.map((ci) => {
      if (ci.itemId !== itemId) return ci
      return { ...ci, note }
    }))
  }

  const handleSaveProgress = async () => {
    const updated: InventoryCheck = { ...check, items: editItems, note: checkNote, status: 'in_progress' }
    await updateInventoryCheck(updated)
  }

  const handleComplete = async () => {
    const allChecked = editItems.every((i) => i.actualQuantity !== null)
    if (!allChecked) return

    const updated: InventoryCheck = {
      ...check,
      items: editItems.map((i) => ({ ...i, difference: i.actualQuantity! - i.bookQuantity })),
      note: checkNote,
    }
    await updateInventoryCheck(updated)
    await completeInventoryCheck(check.id)

    if (adjustItems.size > 0) {
      for (const ci of editItems) {
        if (adjustItems.has(ci.itemId) && ci.difference !== null && ci.difference !== 0) {
          const item = getItem(ci.itemId)
          if (item) {
            await updateItem({
              ...item,
              availableQuantity: item.availableQuantity + ci.difference,
              totalQuantity: item.totalQuantity + ci.difference,
            })
          }
        }
      }
    }

    onBack()
  }

  const isCompleted = check.status === 'completed'
  const allChecked = editItems.every((i) => i.actualQuantity !== null)
  const diffItems = editItems.filter((i) => i.difference !== null && i.difference !== 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button className="btn-secondary flex items-center gap-1.5" onClick={onBack}>
          <RotateCcw size={14} /> 返回
        </button>
        <h2 className="text-xl font-bold">{isCompleted ? '盘点详情' : '盘点录入'}</h2>
      </div>

      <div className="card p-5 space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>盘点标题</span>
            <span className="text-sm font-medium">{check.title}</span>
          </div>
          <div>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>盘点人</span>
            <span className="text-sm">{check.checkerName}</span>
          </div>
          <div>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>创建时间</span>
            <span className="text-sm">{new Date(check.createdAt).toLocaleString()}</span>
          </div>
        </div>
        {!isReadOnly && !isCompleted && (
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>盘点备注</label>
            <input className="input-field" placeholder="请输入备注" value={checkNote} onChange={(e) => setCheckNote(e.target.value)} />
          </div>
        )}
        {isReadOnly && checkNote && (
          <div>
            <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>盘点备注</span>
            <span className="text-sm">{checkNote}</span>
          </div>
        )}
      </div>

      {isCompleted && diffItems.length > 0 && (
        <div className="card p-4" style={{ borderColor: 'var(--danger)', background: 'rgba(239,68,68,0.05)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            <span className="font-semibold text-sm">盘点差异（{diffItems.length}项）</span>
          </div>
          <div className="space-y-2">
            {diffItems.map((ci) => {
              const item = getItem(ci.itemId)
              return (
                <div key={ci.itemId} className="flex items-center gap-3 text-sm">
                  <span className="font-medium">{item?.name ?? '-'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>账面：{ci.bookQuantity}</span>
                  <span style={{ color: 'var(--text-muted)' }}>实盘：{ci.actualQuantity}</span>
                  <span className="font-semibold" style={{ color: ci.difference! < 0 ? 'var(--danger)' : 'var(--info)' }}>
                    差异：{ci.difference! > 0 ? '+' : ''}{ci.difference}
                  </span>
                  {isAdmin && (
                    <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adjustItems.has(ci.itemId)}
                        onChange={() => {
                          setAdjustItems((prev) => {
                            const next = new Set(prev)
                            if (next.has(ci.itemId)) next.delete(ci.itemId)
                            else next.add(ci.itemId)
                            return next
                          })
                        }}
                        className="rounded"
                      />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>确认调整库存</span>
                    </label>
                  )}
                </div>
              )
            })}
          </div>
          {isAdmin && adjustItems.size > 0 && (
            <div className="mt-3 flex justify-end">
              <button className="btn-danger flex items-center gap-1.5 text-xs" onClick={handleComplete}>
                <CheckCircle size={14} /> 确认调整库存并完成
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>物品名称</th>
                <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>分类</th>
                <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>存放点</th>
                <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>责任人</th>
                <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>账面数量</th>
                <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>实盘数量</th>
                <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>差异</th>
                <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>备注</th>
              </tr>
            </thead>
            <tbody>
              {editItems.map((ci) => {
                const item = getItem(ci.itemId)
                const diffColor = ci.difference === null ? 'var(--text-muted)' : ci.difference === 0 ? 'var(--accent)' : ci.difference > 0 ? 'var(--info)' : 'var(--danger)'
                return (
                  <tr key={ci.itemId} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="p-3 text-sm font-medium">{item?.name ?? '-'}</td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item ? catName(item.categoryId) : '-'}</td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item ? locName(item.locationId) : '-'}</td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item ? respName(item.responsibleId) : '-'}</td>
                    <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{ci.bookQuantity}</td>
                    <td className="p-3">
                      {!isReadOnly && !isCompleted ? (
                        <input
                          type="number"
                          className="input-field w-24"
                          min={0}
                          placeholder="实盘"
                          value={ci.actualQuantity ?? ''}
                          onChange={(e) => handleActualQtyChange(ci.itemId, e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                        />
                      ) : (
                        <span className="text-sm" style={{ color: ci.actualQuantity === null ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {ci.actualQuantity ?? '—'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-sm font-semibold" style={{ color: diffColor }}>
                      {ci.difference === null ? '—' : ci.difference === 0 ? '一致' : `${ci.difference > 0 ? '+' : ''}${ci.difference}`}
                    </td>
                    <td className="p-3">
                      {!isReadOnly && !isCompleted ? (
                        <input
                          className="input-field w-32"
                          placeholder="备注"
                          value={ci.note}
                          onChange={(e) => handleNoteChange(ci.itemId, e.target.value)}
                        />
                      ) : (
                        <span className="text-sm" style={{ color: ci.note ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{ci.note || '—'}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!isReadOnly && !isCompleted && (
        <div className="flex justify-end gap-3">
          <button className="btn-secondary flex items-center gap-1.5" onClick={handleSaveProgress}>
            <Package size={14} /> 保存进度
          </button>
          <button
            className="btn-primary flex items-center gap-1.5"
            onClick={() => setShowComplete(true)}
            disabled={!allChecked}
          >
            <CheckCircle size={14} /> 完成盘点
          </button>
        </div>
      )}

      <ConfirmDialog
        open={showComplete}
        title="确认完成盘点"
        message={`完成盘点后，系统将自动对比账面库存与实盘数量。如有差异，将自动生成"数量不符"异常记录。确定完成？`}
        confirmLabel="确认完成"
        cancelLabel="取消"
        variant="warning"
        onConfirm={handleComplete}
        onCancel={() => setShowComplete(false)}
      />
    </div>
  )
}
