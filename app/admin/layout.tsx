'use client'

import { useState, useEffect, ReactNode } from 'react'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminHeader from '../components/admin/AdminNavbar'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

export default function AdminLayout({ 
  children, 
  title = 'Admin Dashboard',
  description = 'Manage your trading platform'
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check for mobile on mount and resize
  useEffect(() => {
    setMounted(true)
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('admin-sidebar')
      const menuButton = document.getElementById('menu-button')
      
      if (isMobile && sidebarOpen && sidebar && menuButton) {
        if (!sidebar.contains(event.target as Node) && !menuButton.contains(event.target as Node)) {
          setSidebarOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, sidebarOpen])

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-gradient-to-r from-slate-800/95 to-indigo-900/95"></div>
          <div className="flex-1 p-6">
            <div className="space-y-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Sidebar Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <div 
        id="admin-sidebar"
        className={`
          fixed lg:sticky top-0 left-0 z-40 
          transform transition-transform duration-300 ease-in-out
          h-screen lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Admin Header */}
        <div className="fixed top-0 right-0 lg:left-0 z-30 bg-white dark:bg-gray-900 w-full lg:w-[calc(100%-theme(spacing.64))]">
          <AdminHeader 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            title={title}
            description={description}
          />
        </div>

        {/* Main Content Area - Added padding to account for fixed header */}
        <main className="flex-1 overflow-y-auto pt-16 lg:pl-0"> {/* Added pt-16 for header height */}
          <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                © {new Date().getFullYear()} Trading Platform Admin. All rights reserved.
              </div>
              <div className="flex items-center gap-6">
                <a href="/admin/privacy" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Privacy Policy
                </a>
                <a href="/admin/terms" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Terms of Service
                </a>
                <a href="/admin/support" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  Support
                </a>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">v1.0.0</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}