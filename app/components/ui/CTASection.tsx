import { ArrowRight, Shield, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Start Your
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Trading Journey?
          </span>
        </h2>
        
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Join the fastest growing community of traders. Get expert mentorship, 
          real-time signals, and everything you need to succeed.
        </p>
        
        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="font-bold mb-2">Risk-Free Trial</h4>
            <p className="text-sm text-gray-400">14 days free, cancel anytime</p>
          </div>
          
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="font-bold mb-2">Instant Access</h4>
            <p className="text-sm text-gray-400">Start learning immediately</p>
          </div>
          
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="font-bold mb-2">Expert Community</h4>
            <p className="text-sm text-gray-400">50+ verified mentors</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            Start 14-Day Free Trial
            <ArrowRight className="ml-2" />
          </Link>
          
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-8 py-4 bg-gray-800 text-white font-bold rounded-xl border border-gray-700 hover:bg-gray-700 transition-all"
          >
            View All Plans
          </Link>
        </div>
        
        <p className="text-sm text-gray-400 mt-8">
          No credit card required • Local payments accepted • 100% secure
        </p>
      </div>
    </section>
  )
}