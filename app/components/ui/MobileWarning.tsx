'use client'

import { useState, useEffect } from 'react'
import { Smartphone, X } from 'lucide-react'

export default function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Show warning only on mobile and if not dismissed
    if (isMobile) {
      const hasDismissed = localStorage.getItem('mobileWarningDismissed')
      setIsVisible(!hasDismissed)
    }
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('mobileWarningDismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 shadow-2xl animate-slide-up">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Better on Mobile App</h3>
              <p className="text-xs text-white/90">
                For the best experience, download our mobile app. Get push notifications for trading signals and faster access.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <a
            href="#"
            className="flex-1 bg-white text-blue-600 text-xs font-semibold py-2 px-3 rounded-lg text-center hover:bg-gray-100 transition-colors"
          >
            Download App
          </a>
          <a
            href="/mobile-tips"
            className="flex-1 bg-white/20 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center hover:bg-white/30 transition-colors"
          >
            Mobile Tips
          </a>
        </div>
      </div>
    </div>
  )
}