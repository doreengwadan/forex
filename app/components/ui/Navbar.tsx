'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  User, 
  Bell, 
  MessageSquare, 
  BarChart3,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: <BarChart3 size={18} /> },
  { name: 'Live Classes', href: '/live-classes', icon: <MessageSquare size={18} /> },
  { name: 'Trading Signals', href: '/signals', icon: <Bell size={18} /> },
  { name: 'Forum', href: '/forum', icon: <MessageSquare size={18} /> },
  { name: 'Mentors', href: '/mentors', icon: <User size={18} /> },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()

  // Mock user data - replace with actual authentication
  const user = {
    name: 'John Trader',
    email: 'john@example.com',
    avatar: 'JT',
    subscription: 'Pro'
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg' 
        : 'bg-gradient-to-r from-gray-900 to-blue-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">LT</span>
              </div>
              <span className={`text-xl font-bold ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}>
                Limitless Trading
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isScrolled
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className={`p-2 rounded-full ${
              isScrolled 
                ? 'hover:bg-gray-100 text-gray-600' 
                : 'hover:bg-white/10 text-white'
            }`}>
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu (Desktop) */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all ${
                  isScrolled
                    ? 'hover:bg-gray-100'
                    : 'hover:bg-white/10'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{user.avatar}</span>
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`}>
                    {user.name}
                  </p>
                  <p className={`text-xs ${
                    isScrolled ? 'text-gray-500' : 'text-white/70'
                  }`}>
                    {user.subscription} Plan
                  </p>
                </div>
                <ChevronDown size={16} className={isScrolled ? 'text-gray-500' : 'text-white/70'} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 ${
                  isScrolled 
                    ? 'bg-white border border-gray-200' 
                    : 'bg-gray-900 border border-gray-700'
                }`}>
                  <Link
                    href="/profile"
                    className={`flex items-center px-4 py-2 text-sm ${
                      isScrolled 
                        ? 'text-gray-700 hover:bg-gray-100' 
                        : 'text-white hover:bg-gray-800'
                    }`}
                  >
                    <User size={16} className="mr-3" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className={`flex items-center px-4 py-2 text-sm ${
                      isScrolled 
                        ? 'text-gray-700 hover:bg-gray-100' 
                        : 'text-white hover:bg-gray-800'
                    }`}
                  >
                    <Settings size={16} className="mr-3" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                      isScrolled 
                        ? 'text-red-600 hover:bg-gray-100' 
                        : 'text-red-400 hover:bg-gray-800'
                    }`}
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <Link
              href="/pricing"
              className="hidden md:inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:shadow-lg transition-all"
            >
              Upgrade Plan
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden p-2 rounded-lg ${
                isScrolled 
                  ? 'text-gray-600 hover:bg-gray-100' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className={`md:hidden ${
          isScrolled 
            ? 'bg-white border-t border-gray-200' 
            : 'bg-gray-900 border-t border-gray-800'
        }`}>
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isScrolled
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              )
            })}
            
            {/* Mobile User Info */}
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold">{user.avatar}</span>
                </div>
                <div>
                  <p className={`font-medium ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                    {user.name}
                  </p>
                  <p className={`text-sm ${isScrolled ? 'text-gray-500' : 'text-white/70'}`}>
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 space-y-1">
                <Link
                  href="/profile"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isScrolled 
                      ? 'text-gray-700 hover:bg-gray-100' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isScrolled 
                      ? 'text-gray-700 hover:bg-gray-100' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Settings
                </Link>
                <button
                  className={`block w-full text-left px-4 py-2 rounded-lg text-sm ${
                    isScrolled 
                      ? 'text-red-600 hover:bg-gray-100' 
                      : 'text-red-400 hover:bg-white/10'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}