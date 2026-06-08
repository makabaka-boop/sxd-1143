import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { ArrowRightLeft, Package, Calendar, FileText, Check } from 'lucide-react'

type BorrowTab = 'borrow' | 'return'

export default function Borrow() {
  const { items, borrowRecords, categories, locations, responsibles, addBorrowRecord, returnBorrowRecord } = useAppStore()
  const [tab, setTab] = useState<BorrowTab>('borrow')

  const [borrowForm, setBorrowForm] = useState({
    itemId: '',
    borrowerName: '',
    quantity: 1,
    purpose: '',
    expectedReturnDate: '',
  })

  const [returnForm, setReturnForm] = useState({
    recordId: '',
    actualReturnDate: new Date().toISOString().split('T')[0],
  })

  const [successMsg, setSuccessMsg] = useState('')

  const activeBorrows = borrowRecords.filter((r) => r.status === 'borrowed' || r.status === 'overdue')
  const selectedItem = items.find((i) => i.id === borrowForm.itemId)
  const selectedReturnRecord = borrowRecords.find((r) => r.id === returnForm.recordId)
  const returnItem = selectedReturnRecord ? items.find((i) => i.id === selectedReturnRecord.itemId) : null

  const handleBorrow = async () => {
    if (!borrowForm.itemId || !borrowForm.borrowerName || !borrowForm.purpose || !borrowForm.expectedReturnDate) return
    if (!selectedItem || borrowForm.quantity > selectedItem.availableQuantity) return

    await addBorrowRecord({
      itemId: borrowForm.itemId,
      borrowerName: borrowForm.borrowerName,
      quantity: borrowForm.quantity,
      purpose: borrowForm.purpose,
      borrowDate: new Date().toISOString(),
      expectedReturnDate: new Date(borrowForm.expectedReturnDate).toISOString(),
      actualReturnDate: null,
    })

    setSuccessMsg(`成功领用 ${selectedItem.name} x${borrowForm.quantity}`)
    setBorrowForm({ itemId: '', borrowerName: '', quantity: 1, purpose: '', expectedReturnDate: '' })
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleReturn = async () => {
    if (!returnForm.recordId || !returnForm.actualReturnDate) return

    await returnBorrowRecord(returnForm.recordId, new Date(returnForm.actualReturnDate).toISOString())

    const itemName = returnItem?.name || '物品'
    setSuccessMsg(`成功归还 ${itemName}`)
    setReturnForm({ recordId: '', actualReturnDate: new Date().toISOString().split('T')[0] })
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '-'
  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? '-'

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">领用登记</h2>

      {successMsg && (
        <div className="card px-4 py-3 flex items-center gap-2" style={{ borderColor: 'var(--accent)', background: 'rgba(16,185,129,0.1)' }}>
          <Check size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{successMsg}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab('borrow')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ background: tab === 'borrow' ? 'var(--accent)' : 'var(--bg-tertiary)', color: tab === 'borrow' ? 'white' : 'var(--text-secondary)' }}
        >
          <ArrowRightLeft size={16} /> 领用登记
        </button>
        <button
          onClick={() => setTab('return')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ background: tab === 'return' ? 'var(--accent)' : 'var(--bg-tertiary)', color: tab === 'return' ? 'white' : 'var(--text-secondary)' }}
        >
          <Package size={16} /> 归还登记
        </button>
      </div>

      {tab === 'borrow' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-base flex items-center gap-2"><ArrowRightLeft size={18} style={{ color: 'var(--accent)' }} /> 新增领用</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>选择物品 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select className="select-field" value={borrowForm.itemId} onChange={(e) => setBorrowForm({ ...borrowForm, itemId: e.target.value, quantity: 1 })}>
                <option value="">请选择物品</option>
                {items.filter((i) => i.availableQuantity > 0).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}（库存：{item.availableQuantity}）</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>领用人 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="input-field" placeholder="请输入领用人姓名" value={borrowForm.borrowerName} onChange={(e) => setBorrowForm({ ...borrowForm, borrowerName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>领用数量 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="number" className="input-field" min={1} max={selectedItem?.availableQuantity ?? 1} value={borrowForm.quantity} onChange={(e) => setBorrowForm({ ...borrowForm, quantity: Math.max(1, Number(e.target.value)) })} />
              {selectedItem && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>最大可领：{selectedItem.availableQuantity}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>预计归还日期 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="date" className="input-field" value={borrowForm.expectedReturnDate} onChange={(e) => setBorrowForm({ ...borrowForm, expectedReturnDate: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>用途 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea className="input-field" rows={3} placeholder="请说明领用用途" value={borrowForm.purpose} onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })} />
            </div>
          </div>
          {selectedItem && (
            <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm font-medium mb-2">物品信息</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span style={{ color: 'var(--text-muted)' }}>分类：</span>{catName(selectedItem.categoryId)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>存放点：</span>{locName(selectedItem.locationId)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>库存：</span>{selectedItem.availableQuantity} / {selectedItem.totalQuantity}</div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button className="btn-primary" onClick={handleBorrow} disabled={!borrowForm.itemId || !borrowForm.borrowerName || !borrowForm.purpose || !borrowForm.expectedReturnDate}>
              提交领用
            </button>
          </div>
        </div>
      )}

      {tab === 'return' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-base flex items-center gap-2"><Package size={18} style={{ color: 'var(--accent)' }} /> 归还登记</h3>
          {activeBorrows.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <Package size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无待归还记录</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>选择领用记录 <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select className="select-field" value={returnForm.recordId} onChange={(e) => setReturnForm({ ...returnForm, recordId: e.target.value })}>
                    <option value="">请选择领用记录</option>
                    {activeBorrows.map((r) => {
                      const item = items.find((i) => i.id === r.itemId)
                      return (
                        <option key={r.id} value={r.id}>
                          {r.borrowerName} - {item?.name || '物品'} x{r.quantity}（{r.status === 'overdue' ? '已超期' : '借用中'}）
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>实际归还日期 <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="date" className="input-field" value={returnForm.actualReturnDate} onChange={(e) => setReturnForm({ ...returnForm, actualReturnDate: e.target.value })} />
                </div>
              </div>
              {selectedReturnRecord && returnItem && (
                <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <p className="text-sm font-medium mb-2">领用记录详情</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span style={{ color: 'var(--text-muted)' }}>领用人：</span>{selectedReturnRecord.borrowerName}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>物品：</span>{returnItem.name}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>数量：</span>{selectedReturnRecord.quantity}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>用途：</span>{selectedReturnRecord.purpose}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>领用日期：</span>{new Date(selectedReturnRecord.borrowDate).toLocaleDateString()}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>应还日期：</span><span style={{ color: selectedReturnRecord.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>{new Date(selectedReturnRecord.expectedReturnDate).toLocaleDateString()}</span></div>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <button className="btn-primary" onClick={handleReturn} disabled={!returnForm.recordId || !returnForm.actualReturnDate}>
                  确认归还
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><FileText size={16} style={{ color: 'var(--accent)' }} /> 最近领用记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>领用人</th>
                <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>物品</th>
                <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>数量</th>
                <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>用途</th>
                <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>领用日期</th>
                <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>应还日期</th>
                <th className="p-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {borrowRecords.slice(0, 10).map((r) => {
                const item = items.find((i) => i.id === r.itemId)
                const statusMap: Record<string, [string, string]> = {
                  borrowed: ['badge-info', '借用中'],
                  overdue: ['badge-danger', '超期'],
                  returned: ['badge-success', '已归还'],
                }
                const [cls, label] = statusMap[r.status] ?? ['badge', r.status]
                return (
                  <tr key={r.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="p-2.5 text-sm">{r.borrowerName}</td>
                    <td className="p-2.5 text-sm">{item?.name ?? '-'}</td>
                    <td className="p-2.5 text-sm">{r.quantity}</td>
                    <td className="p-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.purpose}</td>
                    <td className="p-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(r.borrowDate).toLocaleDateString()}</td>
                    <td className="p-2.5 text-sm" style={{ color: r.status === 'overdue' ? 'var(--danger)' : 'var(--text-muted)' }}>{new Date(r.expectedReturnDate).toLocaleDateString()}</td>
                    <td className="p-2.5"><span className={`badge ${cls}`}>{label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
