import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Settings, FileText, ShieldCheck, Bell, ChevronLeft, ChevronRight, Users, UserCog, Eye } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import type { Role, AlertItem } from '@/types'

const navItems = [
  { path: '/', label: '物品总览', icon: LayoutDashboard, roles: ['admin', 'user', 'auditor'] },
  { path: '/manage', label: '物品管理', icon: Settings, roles: ['admin'] },
  { path: '/borrow', label: '领用登记', icon: FileText, roles: ['admin', 'user'] },
  { path: '/audit', label: '异常核对', icon: ShieldCheck, roles: ['admin', 'auditor'] },
]

const roleConfig: Record<Role, { label: string; icon: typeof Users; color: string }> = {
  admin: { label: '管理员', icon: UserCog, color: 'text-emerald-400' },
  user: { label: '普通用户', icon: Users, color: 'text-blue-400' },
  auditor: { label: '审计员', icon: Eye, color: 'text-amber-400' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const location = useLocation()
  const { currentRole, setRole, alerts } = useAppStore()

  const visibleNav = navItems.filter((item) => item.roles.includes(currentRole))
  const currentRoleConfig = roleConfig[currentRole]
  const RoleIcon = currentRoleConfig.icon

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className="flex flex-col border-r transition-all duration-300"
        style={{
          width: collapsed ? '64px' : '240px',
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-semibold text-sm whitespace-nowrap">办公室物品管理</span>}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {visibleNav.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'hover:bg-opacity-50'
                }`}
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="px-3 py-2">
            {!collapsed && (
              <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                当前角色
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <RoleIcon className={`w-4 h-4 flex-shrink-0 ${currentRoleConfig.color}`} />
              {!collapsed && <span className={`text-sm font-medium ${currentRoleConfig.color}`}>{currentRoleConfig.label}</span>}
            </div>
            {!collapsed && (
              <div className="flex gap-1">
                {(['admin', 'user', 'auditor'] as Role[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setRole(role)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                      currentRole === role ? 'text-white' : ''
                    }`}
                    style={{
                      background: currentRole === role ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: currentRole === role ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {roleConfig[role].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t transition-colors hover:bg-opacity-80"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center justify-between h-16 px-6 border-b"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <h1 className="text-lg font-semibold">
            {visibleNav.find((n) => n.path === location.pathname)?.label || '办公室物品管理'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative p-2 rounded-lg transition-colors hover:bg-opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white" style={{ background: 'var(--danger)' }}>
                    {alerts.length > 9 ? '9+' : alerts.length}
                  </span>
                )}
              </button>
              {showAlerts && (
                <AlertPanel alerts={alerts} onClose={() => setShowAlerts(false)} />
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6" style={{ background: 'var(--bg-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function AlertPanel({ alerts, onClose }: { alerts: AlertItem[]; onClose: () => void }) {
  const typeConfig = {
    low_stock: { label: '低库存', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    overdue: { label: '超期未还', color: 'text-red-400', bg: 'bg-red-500/10' },
    responsible_missing: { label: '责任人空缺', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto rounded-xl shadow-2xl z-50 border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <span className="font-semibold text-sm">提醒通知</span>
          <span className="badge badge-danger">{alerts.length}</span>
        </div>
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            暂无提醒
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {alerts.slice(0, 20).map((alert) => {
              const config = typeConfig[alert.type]
              return (
                <div key={alert.id} className="px-4 py-3 hover:bg-opacity-50 transition-colors" style={{ background: 'transparent' }}>
                  <div className="flex items-start gap-2">
                    <span className={`badge ${config.bg} ${config.color} mt-0.5`}>{config.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{alert.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
