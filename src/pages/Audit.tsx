import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { AnomalyType, AnomalyStatus } from '@/types'
import { ShieldCheck, ChevronDown, ChevronUp, Eye, Search, Filter } from 'lucide-react'

export default function Audit() {
  const { anomalies, borrowRecords, items, categories, responsibles, locations, currentRole } = useAppStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<AnomalyType | ''>('')
  const [filterStatus, setFilterStatus] = useState<AnomalyStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  const isReadOnly = currentRole === 'auditor'

  const typeConfig: Record<AnomalyType, { label: string; color: string; badge: string }> = {
    overdue: { label: '超期未还', color: 'text-red-400', badge: 'badge-danger' },
    damaged: { label: '损坏', color: 'text-amber-400', badge: 'badge-warning' },
    missing: { label: '丢失', color: 'text-red-400', badge: 'badge-danger' },
    quantity_mismatch: { label: '数量不符', color: 'text-amber-400', badge: 'badge-warning' },
    responsible_missing: { label: '责任人空缺', color: 'text-blue-400', badge: 'badge-info' },
  }

  const statusConfig: Record<AnomalyStatus, { label: string; badge: string }> = {
    pending: { label: '待核对', badge: 'badge-warning' },
    checked: { label: '已核对', badge: 'badge-info' },
    resolved: { label: '已解决', badge: 'badge-success' },
  }

  const filteredAnomalies = useMemo(() => anomalies.filter((a) => {
    if (filterType && a.type !== filterType) return false
    if (filterStatus && a.status !== filterStatus) return false
    if (searchQuery) {
      const item = items.find((i) => i.id === a.itemId)
      const record = borrowRecords.find((r) => r.id === a.borrowRecordId)
      const q = searchQuery.toLowerCase()
      if (
        !a.description.toLowerCase().includes(q) &&
        !(item?.name.toLowerCase().includes(q)) &&
        !(record?.borrowerName.toLowerCase().includes(q))
      ) return false
    }
    return true
  }), [anomalies, filterType, filterStatus, searchQuery, items, borrowRecords])

  const pendingCount = anomalies.filter((a) => a.status === 'pending').length
  const checkedCount = anomalies.filter((a) => a.status === 'checked').length
  const resolvedCount = anomalies.filter((a) => a.status === 'resolved').length

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck size={22} style={{ color: 'var(--accent)' }} /> 异常核对
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isReadOnly ? '您当前为审计员角色，仅可查看异常记录' : `共 ${anomalies.length} 条异常记录`}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="card px-4 py-2 flex items-center gap-2" style={{ borderColor: pendingCount > 0 ? 'var(--warning)' : 'var(--border-color)' }}>
            <span className="text-sm">待核对</span>
            <span className="badge badge-warning">{pendingCount}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2">
            <span className="text-sm">已核对</span>
            <span className="badge badge-info">{checkedCount}</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2">
            <span className="text-sm">已解决</span>
            <span className="badge badge-success">{resolvedCount}</span>
          </div>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input-field pl-9" placeholder="搜索异常描述、物品名称、领用人..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="select-field w-36" value={filterType} onChange={(e) => setFilterType(e.target.value as AnomalyType | '')}>
          <option value="">所有类型</option>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select className="select-field w-32" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AnomalyStatus | '')}>
          <option value="">所有状态</option>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filteredAnomalies.map((anomaly) => {
          const typeCfg = typeConfig[anomaly.type]
          const statusCfg = statusConfig[anomaly.status]
          const item = items.find((i) => i.id === anomaly.itemId)
          const record = borrowRecords.find((r) => r.id === anomaly.borrowRecordId)
          const responsible = item?.responsibleId ? responsibles.find((r) => r.id === item.responsibleId) : null
          const location = item?.locationId ? locations.find((l) => l.id === item.locationId) : null
          const isExpanded = expandedId === anomaly.id

          return (
            <div key={anomaly.id} className="card overflow-hidden" style={{ borderColor: anomaly.status === 'pending' ? 'var(--warning)' : 'var(--border-color)' }}>
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : anomaly.id)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeCfg.badge === 'badge-danger' ? 'bg-red-500/10' : typeCfg.badge === 'badge-warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                  <ShieldCheck size={18} className={typeCfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${typeCfg.badge}`}>{typeCfg.label}</span>
                    <span className={`badge ${statusCfg.badge}`}>{statusCfg.label}</span>
                  </div>
                  <p className="text-sm truncate">{anomaly.description}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {item && <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.name}</span>}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(anomaly.createdAt).toLocaleDateString()}</span>
                  {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-4 pt-0 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {item && (
                      <>
                        <div>
                          <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>物品名称</span>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div>
                          <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>分类</span>
                          <span className="text-sm">{categories.find((c) => c.id === item.categoryId)?.name ?? '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>存放点</span>
                          <span className="text-sm">{location?.name ?? '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>责任人</span>
                          <span className="text-sm">{responsible?.name ?? '未指定'}</span>
                        </div>
                        <div>
                          <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>库存</span>
                          <span className="text-sm">{item.availableQuantity} / {item.totalQuantity}</span>
                        </div>
                      </>
                    )}
                    {record && (
                      <>
                        <div>
                          <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>领用人</span>
                          <span className="text-sm">{record.borrowerName}</span>
                        </div>
                        <div>
                          <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>领用数量</span>
                          <span className="text-sm">{record.quantity}</span>
                        </div>
                        <div>
                          <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>领用日期</span>
                          <span className="text-sm">{new Date(record.borrowDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>应还日期</span>
                          <span className="text-sm" style={{ color: record.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>{new Date(record.expectedReturnDate).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>异常描述</span>
                      <span className="text-sm">{anomaly.description}</span>
                    </div>
                    <div>
                      <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>创建时间</span>
                      <span className="text-sm">{new Date(anomaly.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {isReadOnly && (
                    <div className="mt-4 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)' }}>
                      <Eye size={14} className="inline mr-1" /> 审计员角色仅可查看，不可修改
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filteredAnomalies.length === 0 && (
          <div className="card p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无异常记录</p>
          </div>
        )}
      </div>
    </div>
  )
}
