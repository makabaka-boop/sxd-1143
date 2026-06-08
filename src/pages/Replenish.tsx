import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { ReplenishStatus } from '@/types'
import { PackagePlus, Search, CheckCircle, XCircle, Truck, Clock, Filter, RotateCcw } from 'lucide-react'

const statusConfig: Record<ReplenishStatus, { label: string; badge: string; color: string }> = {
  pending: { label: '待审批', badge: 'badge-warning', color: 'text-amber-400' },
  approved: { label: '已审批/待入库', badge: 'badge-info', color: 'text-blue-400' },
  rejected: { label: '已驳回', badge: 'badge-danger', color: 'text-red-400' },
  warehoused: { label: '已入库', badge: 'badge-success', color: 'text-emerald-400' },
}

export default function Replenish() {
  const {
    replenishRequests, items, currentRole,
    approveReplenishRequest, rejectReplenishRequest, completeReplenishRequest,
  } = useAppStore()

  const [filterStatus, setFilterStatus] = useState<ReplenishStatus | ''>('')
  const [filterItemName, setFilterItemName] = useState('')
  const [filterApplicant, setFilterApplicant] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null)
  const [remark, setRemark] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const isAdmin = currentRole === 'admin'

  const filtered = useMemo(() => replenishRequests.filter((req) => {
    if (filterStatus && req.status !== filterStatus) return false
    if (filterItemName) {
      const item = items.find((i) => i.id === req.itemId)
      if (!item?.name.toLowerCase().includes(filterItemName.toLowerCase())) return false
    }
    if (filterApplicant && !req.applicantName.toLowerCase().includes(filterApplicant.toLowerCase())) return false
    return true
  }), [replenishRequests, filterStatus, filterItemName, filterApplicant, items])

  const pendingCount = replenishRequests.filter((r) => r.status === 'pending').length
  const approvedCount = replenishRequests.filter((r) => r.status === 'approved').length
  const warehousedCount = replenishRequests.filter((r) => r.status === 'warehoused').length
  const rejectedCount = replenishRequests.filter((r) => r.status === 'rejected').length

  const handleAction = async () => {
    if (!actionId || !actionType) return
    const handlerName = isAdmin ? '管理员' : '操作员'
    if (actionType === 'approve') {
      await approveReplenishRequest(actionId, handlerName, remark || undefined)
      setSuccessMsg('已审批通过，生成待入库记录')
    } else if (actionType === 'reject') {
      await rejectReplenishRequest(actionId, handlerName, remark || undefined)
      setSuccessMsg('已驳回申请')
    } else if (actionType === 'complete') {
      await completeReplenishRequest(actionId, handlerName, remark || undefined)
      setSuccessMsg('已完成入库，库存已更新')
    }
    setActionId(null)
    setActionType(null)
    setRemark('')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const openAction = (id: string, type: 'approve' | 'reject' | 'complete') => {
    setActionId(id)
    setActionType(type)
    setRemark('')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PackagePlus size={22} style={{ color: 'var(--accent)' }} /> 补货申请管理
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isAdmin ? `共 ${replenishRequests.length} 条补货申请` : '您当前角色仅可查看补货申请'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="card px-4 py-2 flex items-center gap-2" style={{ borderColor: pendingCount > 0 ? 'var(--warning)' : 'var(--border-color)' }}>
            <Clock size={16} style={{ color: 'var(--warning)' }} />
            <span className="text-sm">待审批</span>
            <span className="badge badge-warning">{pendingCount}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2" style={{ borderColor: approvedCount > 0 ? 'var(--info)' : 'var(--border-color)' }}>
            <Truck size={16} style={{ color: 'var(--info)' }} />
            <span className="text-sm">待入库</span>
            <span className="badge badge-info">{approvedCount}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2">
            <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm">已入库</span>
            <span className="badge badge-success">{warehousedCount}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2">
            <XCircle size={16} style={{ color: 'var(--danger)' }} />
            <span className="text-sm">已驳回</span>
            <span className="badge badge-danger">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="card px-4 py-3 flex items-center gap-2" style={{ borderColor: 'var(--accent)', background: 'rgba(16,185,129,0.1)' }}>
          <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{successMsg}</span>
        </div>
      )}

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-9" placeholder="搜索物品名称..." value={filterItemName} onChange={(e) => setFilterItemName(e.target.value)} />
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-9" placeholder="搜索申请人..." value={filterApplicant} onChange={(e) => setFilterApplicant(e.target.value)} />
        </div>
        <select className="select-field w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ReplenishStatus | '')}>
          <option value="">所有状态</option>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <button className="btn-secondary flex items-center gap-1.5" onClick={() => { setFilterStatus(''); setFilterItemName(''); setFilterApplicant('') }}>
          <RotateCcw size={14} /> 重置
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>物品名称</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>申请人</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>申请数量</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>用途说明</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>期望到货日期</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>状态</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>处理人</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>处理时间</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>备注</th>
                {isAdmin && (
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>操作</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const item = items.find((i) => i.id === req.itemId)
                const cfg = statusConfig[req.status]
                return (
                  <tr key={req.id} className="border-t transition-colors hover:bg-opacity-50" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="p-3 text-sm font-medium">
                      <div>{item?.name ?? '-'}</div>
                      {item && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          当前库存: {item.availableQuantity}/{item.totalQuantity}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-sm">{req.applicantName}</td>
                    <td className="p-3 text-sm">
                      <span className="font-semibold" style={{ color: 'var(--accent)' }}>+{req.quantity}</span>
                    </td>
                    <td className="p-3 text-sm max-w-[200px] truncate" title={req.purpose}>{req.purpose || '-'}</td>
                    <td className="p-3 text-sm">{req.expectedDate ? new Date(req.expectedDate).toLocaleDateString() : '-'}</td>
                    <td className="p-3"><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                    <td className="p-3 text-sm">{req.handlerName ?? '-'}</td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>{req.handledAt ? new Date(req.handledAt).toLocaleString() : '-'}</td>
                    <td className="p-3 text-sm max-w-[150px] truncate" title={req.remark ?? undefined}>{req.remark ?? '-'}</td>
                    {isAdmin && (
                      <td className="p-3">
                        <div className="flex gap-2">
                          {req.status === 'pending' && (
                            <>
                              <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1" onClick={() => openAction(req.id, 'approve')}>
                                <CheckCircle size={12} /> 审批通过
                              </button>
                              <button className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1" onClick={() => openAction(req.id, 'reject')}>
                                <XCircle size={12} /> 驳回
                              </button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1" onClick={() => openAction(req.id, 'complete')}>
                              <Truck size={12} /> 完成入库
                            </button>
                          )}
                          {req.status !== 'pending' && req.status !== 'approved' && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <PackagePlus size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无补货申请记录</p>
          </div>
        )}
      </div>

      {actionId && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setActionId(null); setActionType(null); setRemark('') }} />
          <div className="relative rounded-xl p-6 w-full max-w-md shadow-2xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-semibold text-base mb-4">
              {actionType === 'approve' ? '审批通过' : actionType === 'reject' ? '驳回申请' : '完成入库'}
            </h3>
            {(() => {
              const req = replenishRequests.find((r) => r.id === actionId)
              const item = items.find((i) => i.id === req?.itemId)
              return req ? (
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>物品名称</span>
                      <span className="text-sm">{item?.name ?? '-'}</span>
                    </div>
                    <div>
                      <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>申请人</span>
                      <span className="text-sm">{req.applicantName}</span>
                    </div>
                    <div>
                      <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>申请数量</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>+{req.quantity}</span>
                    </div>
                    <div>
                      <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>期望到货日期</span>
                      <span className="text-sm">{req.expectedDate ? new Date(req.expectedDate).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                  {req.purpose && (
                    <div>
                      <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>用途说明</span>
                      <span className="text-sm">{req.purpose}</span>
                    </div>
                  )}
                  {actionType === 'complete' && item && (
                    <div className="rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <p className="text-xs" style={{ color: 'var(--accent)' }}>
                        入库后库存：{item.availableQuantity} + {req.quantity} = <span className="font-bold">{item.availableQuantity + req.quantity}</span> 件
                      </p>
                    </div>
                  )}
                </div>
              ) : null
            })()}
            <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>备注（选填）</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder={actionType === 'reject' ? '请填写驳回原因...' : '填写备注信息...'}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button className="btn-secondary" onClick={() => { setActionId(null); setActionType(null); setRemark('') }}>取消</button>
              <button
                className={actionType === 'reject' ? 'btn-danger' : 'btn-primary'}
                onClick={handleAction}
              >
                {actionType === 'approve' ? '确认审批通过' : actionType === 'reject' ? '确认驳回' : '确认完成入库'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
