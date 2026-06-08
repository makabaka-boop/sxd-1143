import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { Category, Location, Responsible } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Plus, Pencil, Trash2, Tag, MapPin, User, X, Check } from 'lucide-react'

type Tab = 'categories' | 'locations' | 'responsibles'

export default function Manage() {
  const {
    categories, locations, responsibles,
    addCategory, updateCategory, deleteCategory,
    addLocation, updateLocation, deleteLocation,
    addResponsible, updateResponsible, deleteResponsible,
  } = useAppStore()

  const [tab, setTab] = useState<Tab>('categories')
  const [editId, setEditId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: Tab; id: string; name: string } | null>(null)

  const tabs: { key: Tab; label: string; icon: typeof Tag; count: number }[] = [
    { key: 'categories', label: '物品分类', icon: Tag, count: categories.length },
    { key: 'locations', label: '存放点', icon: MapPin, count: locations.length },
    { key: 'responsibles', label: '责任人', icon: User, count: responsibles.length },
  ]

  const handleDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'categories') await deleteCategory(deleteTarget.id)
    else if (deleteTarget.type === 'locations') await deleteLocation(deleteTarget.id)
    else await deleteResponsible(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">物品管理</h2>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => { setShowAdd(true); setEditId(null) }}>
          <Plus size={16} /> 新增
        </button>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setEditId(null); setShowAdd(false) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'text-white' : ''}`}
              style={{ background: tab === t.key ? 'var(--accent)' : 'var(--bg-tertiary)', color: tab === t.key ? 'white' : 'var(--text-secondary)' }}
            >
              <Icon size={16} /> {t.label}
              <span className={`badge ${tab === t.key ? 'badge-success' : 'badge-info'}`}>{t.count}</span>
            </button>
          )
        })}
      </div>

      {showAdd && (
        <AddForm tab={tab} onClose={() => setShowAdd(false)} />
      )}

      <div className="card overflow-hidden p-0">
        {tab === 'categories' && <CategoryTable items={categories} editId={editId} setEditId={setEditId} onDelete={(id, name) => setDeleteTarget({ type: 'categories', id, name })} />}
        {tab === 'locations' && <LocationTable items={locations} editId={editId} setEditId={setEditId} onDelete={(id, name) => setDeleteTarget({ type: 'locations', id, name })} />}
        {tab === 'responsibles' && <ResponsibleTable items={responsibles} editId={editId} setEditId={setEditId} onDelete={(id, name) => setDeleteTarget({ type: 'responsibles', id, name })} />}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除"
        message={`确定要删除"${deleteTarget?.name}"吗？此操作不可撤销。`}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function AddForm({ tab, onClose }: { tab: Tab; onClose: () => void }) {
  const { addCategory, addLocation, addResponsible } = useAppStore()
  const [form, setForm] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    if (tab === 'categories') {
      if (!form.name) return
      await addCategory({ name: form.name, description: form.description || '' })
    } else if (tab === 'locations') {
      if (!form.name) return
      await addLocation({ name: form.name, building: form.building || '', floor: form.floor || '', room: form.room || '' })
    } else {
      if (!form.name) return
      await addResponsible({ name: form.name, department: form.department || '', contact: form.contact || '' })
    }
    onClose()
  }

  const field = (key: string, label: string, placeholder: string, required = false) => (
    <div>
      <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      <input className="input-field" placeholder={placeholder} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  )

  return (
    <div className="card p-5 space-y-4" style={{ borderColor: 'var(--accent)' }}>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">新增{tab === 'categories' ? '分类' : tab === 'locations' ? '存放点' : '责任人'}</h3>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('name', '名称', `请输入${tab === 'categories' ? '分类' : tab === 'locations' ? '存放点' : '责任人'}名称`, true)}
        {tab === 'categories' && field('description', '描述', '请输入分类描述')}
        {tab === 'locations' && field('building', '楼栋', '请输入楼栋')}
        {tab === 'locations' && field('floor', '楼层', '请输入楼层')}
        {tab === 'locations' && field('room', '房间号', '请输入房间号')}
        {tab === 'responsibles' && field('department', '部门', '请输入部门')}
        {tab === 'responsibles' && field('contact', '联系方式', '请输入联系方式')}
      </div>
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>取消</button>
        <button className="btn-primary" onClick={handleSubmit}>确认新增</button>
      </div>
    </div>
  )
}

function CategoryTable({ items, editId, setEditId, onDelete }: { items: Category[]; editId: string | null; setEditId: (id: string | null) => void; onDelete: (id: string, name: string) => void }) {
  const { updateCategory } = useAppStore()
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  const startEdit = (item: Category) => {
    setEditId(item.id)
    setEditForm({ name: item.name, description: item.description })
  }

  const saveEdit = async () => {
    const item = items.find((i) => i.id === editId)
    if (item && editForm.name) {
      await updateCategory({ ...item, name: editForm.name, description: editForm.description || '' })
    }
    setEditId(null)
  }

  return (
    <table className="w-full">
      <thead>
        <tr style={{ background: 'var(--bg-tertiary)' }}>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>名称</th>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>描述</th>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>创建时间</th>
          <th className="p-3 text-right text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>操作</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
            {editId === item.id ? (
              <>
                <td className="p-3"><input className="input-field" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                <td className="p-3"><input className="input-field" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></td>
                <td className="p-3 text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="p-3 text-right"><button className="btn-primary text-xs px-3 py-1" onClick={saveEdit}><Check size={12} /></button></td>
              </>
            ) : (
              <>
                <td className="p-3 font-medium text-sm">{item.name}</td>
                <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.description || '-'}</td>
                <td className="p-3 text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="p-3 text-right space-x-2">
                  <button className="btn-secondary text-xs px-3 py-1" onClick={() => startEdit(item)}><Pencil size={12} /></button>
                  <button className="btn-danger text-xs px-3 py-1" onClick={() => onDelete(item.id, item.name)}><Trash2 size={12} /></button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function LocationTable({ items, editId, setEditId, onDelete }: { items: Location[]; editId: string | null; setEditId: (id: string | null) => void; onDelete: (id: string, name: string) => void }) {
  const { updateLocation } = useAppStore()
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  const startEdit = (item: Location) => {
    setEditId(item.id)
    setEditForm({ name: item.name, building: item.building, floor: item.floor, room: item.room })
  }

  const saveEdit = async () => {
    const item = items.find((i) => i.id === editId)
    if (item && editForm.name) {
      await updateLocation({ ...item, name: editForm.name, building: editForm.building || '', floor: editForm.floor || '', room: editForm.room || '' })
    }
    setEditId(null)
  }

  return (
    <table className="w-full">
      <thead>
        <tr style={{ background: 'var(--bg-tertiary)' }}>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>名称</th>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>楼栋</th>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>楼层</th>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>房间</th>
          <th className="p-3 text-right text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>操作</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
            {editId === item.id ? (
              <>
                <td className="p-3"><input className="input-field" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                <td className="p-3"><input className="input-field" value={editForm.building || ''} onChange={(e) => setEditForm({ ...editForm, building: e.target.value })} /></td>
                <td className="p-3"><input className="input-field w-20" value={editForm.floor || ''} onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })} /></td>
                <td className="p-3"><input className="input-field w-24" value={editForm.room || ''} onChange={(e) => setEditForm({ ...editForm, room: e.target.value })} /></td>
                <td className="p-3 text-right"><button className="btn-primary text-xs px-3 py-1" onClick={saveEdit}><Check size={12} /></button></td>
              </>
            ) : (
              <>
                <td className="p-3 font-medium text-sm">{item.name}</td>
                <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.building}</td>
                <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.floor}</td>
                <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.room}</td>
                <td className="p-3 text-right space-x-2">
                  <button className="btn-secondary text-xs px-3 py-1" onClick={() => startEdit(item)}><Pencil size={12} /></button>
                  <button className="btn-danger text-xs px-3 py-1" onClick={() => onDelete(item.id, item.name)}><Trash2 size={12} /></button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ResponsibleTable({ items, editId, setEditId, onDelete }: { items: Responsible[]; editId: string | null; setEditId: (id: string | null) => void; onDelete: (id: string, name: string) => void }) {
  const { updateResponsible } = useAppStore()
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  const startEdit = (item: Responsible) => {
    setEditId(item.id)
    setEditForm({ name: item.name, department: item.department, contact: item.contact })
  }

  const saveEdit = async () => {
    const item = items.find((i) => i.id === editId)
    if (item && editForm.name) {
      await updateResponsible({ ...item, name: editForm.name, department: editForm.department || '', contact: editForm.contact || '' })
    }
    setEditId(null)
  }

  return (
    <table className="w-full">
      <thead>
        <tr style={{ background: 'var(--bg-tertiary)' }}>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>姓名</th>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>部门</th>
          <th className="p-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>联系方式</th>
          <th className="p-3 text-right text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>操作</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
            {editId === item.id ? (
              <>
                <td className="p-3"><input className="input-field" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                <td className="p-3"><input className="input-field" value={editForm.department || ''} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} /></td>
                <td className="p-3"><input className="input-field" value={editForm.contact || ''} onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} /></td>
                <td className="p-3 text-right"><button className="btn-primary text-xs px-3 py-1" onClick={saveEdit}><Check size={12} /></button></td>
              </>
            ) : (
              <>
                <td className="p-3 font-medium text-sm">{item.name}</td>
                <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.department}</td>
                <td className="p-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.contact}</td>
                <td className="p-3 text-right space-x-2">
                  <button className="btn-secondary text-xs px-3 py-1" onClick={() => startEdit(item)}><Pencil size={12} /></button>
                  <button className="btn-danger text-xs px-3 py-1" onClick={() => onDelete(item.id, item.name)}><Trash2 size={12} /></button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
