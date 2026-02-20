'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  Video,
  TrendingUp,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
  FileText,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/Button'

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Classes', href: '/admin/classes', icon: Video },
  { name: 'Signals', href: '/admin/signals', icon: TrendingUp },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Mentors', href: '/admin/mentors', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/admin/Reports', icon: FileText },
  { name: 'Settings', href: '/admin/security', icon: Settings },
  { name: 'Security', href: '#', icon: Shield },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-md"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Sidebar for mobile */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform lg:translate-x-0 lg:static lg:inset-auto lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-800">
          <div className="w-8 h-8 bg-white rounded-lg"></div>
          <span className="ml-3 text-xl font-bold">Admin Panel</span>
        </div>

        {/* Admin info */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border-2 border-primary">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="font-semibold">Admin User</p>
              <p className="text-sm text-gray-400">Super Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="ml-3">{item.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <button
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('admin_token')
                window.location.href = '/login'
              }}
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Logout Admin</span>
            </button>
          </div>
        </nav>

        {/* Platform stats */}
        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-300">Platform Stats</p>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Online Users</span>
                <span className="text-green-400">247</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Live Classes</span>
                <span className="text-blue-400">8</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Today's Revenue</span>
                <span className="text-yellow-400">$1,240</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}