import { LayoutDashboard, Timer, CheckSquare, BarChart2, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const PROJECT_COLORS: string[] = [
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#f59e0b', // amber
  '#6b7280', // gray
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
]

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  att: 'ATT cluster configs — Envoy, Istio, OTel, Grafana, AKS',
  dn: 'Drivenets cluster configs — AKS, Istio, OTel',
  grafana: 'Grafana dashboards, export/import scripts, Tempo configs',
  admin: 'Administrative tasks, meetings, planning',
  other: 'Miscellaneous work and side tasks',
}

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/timer', label: 'Timer', icon: Timer },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/settings', label: 'Settings', icon: Settings },
]
