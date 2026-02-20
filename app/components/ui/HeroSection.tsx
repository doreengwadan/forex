'use client'

import { useState } from 'react'
import { ArrowRight, Play, Users, TrendingUp, Shield, Target } from 'lucide-react'
import Link from 'next/link'

export default function HeroSection() {
  const [videoPlaying, setVideoPlaying] = useState(false)

  const stats = [
    { value: '2,500+', label: 'Active Traders', icon: <Users className="w-5 h-5" /> },
    { value: '85%', label: 'Success Rate', icon: <TrendingUp className="w-5 h-5" /> },
    { value: '50+', label: 'Expert Mentors', icon: <Shield className="w-5 h-5" /> },
    { value: '24/7', label: 'Live Support', icon: <Target className="w-5 h-5" /> },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-sm font-medium">LIMITED TIME: Get 14 Days Free Trial</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              Master Trading with
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Expert Mentors
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Join thousands of successful traders learning from experienced mentors. 
              Live classes, real-time signals, and personalized guidance to boost your trading confidence.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2" size={20} />
              </Link>
              
              <button
                onClick={() => setVideoPlaying(true)}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-800 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-3 group-hover:bg-white/20">
                  <Play size={20} className="ml-1" />
                </div>
                Watch Demo
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start mb-2">
                    {stat.icon}
                    <span className="ml-2 text-3xl font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Content - Platform Preview */}
          <div className="mt-12 lg:mt-0 relative">
            <div className="relative mx-auto max-w-md">
              {/* Floating Elements */}
              <div className="absolute -top-6 -left-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold">Live Signal</p>
                    <p className="text-xs text-gray-300">BTC: $42,850 → SELL</p>
                  </div>
                </div>
              </div>
              
              {/* Main Dashboard Preview */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-gray-700 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm">Live Dashboard</div>
                  <div className="w-20"></div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-xl font-bold">LT</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold">Welcome back, Trader!</h3>
                      <p className="text-sm text-gray-400">2 live classes today</p>
                    </div>
                  </div>
                  
                  {/* Mini Charts */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">BTC/USD</span>
                        <span className="text-green-400 text-sm">+2.4%</span>
                      </div>
                      <div className="h-8 w-full bg-gradient-to-r from-green-500/20 to-transparent rounded"></div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">ETH/USD</span>
                        <span className="text-red-400 text-sm">-1.2%</span>
                      </div>
                      <div className="h-8 w-full bg-gradient-to-r from-red-500/20 to-transparent rounded"></div>
                    </div>
                  </div>
                  
                  {/* Active Classes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-transparent rounded-xl border border-blue-500/20">
                      <div>
                        <p className="font-medium">Beginner Forex Class</p>
                        <p className="text-xs text-gray-400">Starts in 15 min</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Play size={14} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                      <div>
                        <p className="font-medium">Advanced Charting</p>
                        <p className="text-xs text-gray-400">Tomorrow, 10:00 AM</p>
                      </div>
                      <div className="text-xs px-2 py-1 bg-gray-700 rounded">PRO</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Chat Preview */}
              <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                    <span className="text-xs">M</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold">Mentor Chat</p>
                    <p className="text-xs text-gray-300">"Let's review your trade..."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {videoPlaying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setVideoPlaying(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              Close
            </button>
            <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Platform Demo"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}