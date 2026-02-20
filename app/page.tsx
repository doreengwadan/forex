import Link from 'next/link'
import { Button } from './components/ui/Button'
import { Card } from './components/ui/Card'
import { ArrowRight, Users, Signal, Video, MessageSquare, BarChart, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-indigo-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="border-b border-gray-200/50 dark:border-gray-800 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Limitless Trading
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mentorship Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors font-medium"
              >
                Login
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-grid-16 dark:bg-grid-gray-800/20 -z-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">🚀 Join 1,000+ Successful Traders</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            Master Trading with{' '}
            <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Expert Mentorship
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform your trading journey with personalized guidance, real-time market signals, 
            and a supportive community of successful traders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                size="lg" 
                className="gap-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
              >
                <span className="text-lg">Start Learning Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 hover:border-primary hover:bg-primary/5 gap-3"
              >
                <Video className="w-5 h-5" />
                Book a Live Demo
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">1,000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Live Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">50+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Expert Mentors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              Our comprehensive platform provides all the tools and support you need 
              to become a successful trader
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-8 text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-200/50 dark:border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">Live Classes</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Interactive sessions with expert mentors, recordings, and Q&A
              </p>
            </Card>

            <Card className="p-8 text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-200/50 dark:border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Signal className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-3 group-hover:text-green-600 transition-colors">Trading Signals</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time buy/sell alerts with precise entry and exit points
              </p>
            </Card>

            <Card className="p-8 text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-200/50 dark:border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-xl mb-3 group-hover:text-purple-600 transition-colors">1-on-1 Mentorship</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Personalized guidance and private chats with experienced mentors
              </p>
            </Card>

            <Card className="p-8 text-center group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-200/50 dark:border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-xl mb-3 group-hover:text-orange-600 transition-colors">Community</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Learn from peers in active discussion forums and groups
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Simple <span className="text-primary">3-Step</span> Process
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              Get started in minutes and begin your trading journey today
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="font-bold text-xl mb-3">Sign Up Free</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your account in 30 seconds. No credit card required for free tier.
              </p>
            </div>
            
            <div className="text-center relative">
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-primary/20 to-purple-600/20 top-10 left-1/2 transform -translate-x-1/2 md:block hidden" />
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="font-bold text-xl mb-3">Choose Your Mentor</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Browse expert mentors and select one that matches your trading style.
              </p>
            </div>
            
            <div className="text-center relative">
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-primary/20 to-purple-600/20 top-10 left-1/2 transform -translate-x-1/2 md:block hidden" />
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="font-bold text-xl mb-3">Start Trading</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Join live classes, receive signals, and grow with community support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-600/10 to-pink-600/10 -z-10" />
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-4xl mx-auto p-12 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200/50 dark:border-gray-800 shadow-2xl">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Trading Journey?
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto text-lg">
              Join hundreds of traders who have improved their skills, confidence, 
              and profitability with our mentorship platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="gap-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl px-8"
                >
                  <span className="text-lg">Create Free Account</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 hover:border-primary hover:bg-primary/5"
                >
                  Schedule Expert Call
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-blue-500" />
                  <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>14-Day Free Trial</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 dark:border-gray-800 py-12 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Limitless Trading
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Empowering traders worldwide</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 justify-center mb-6 md:mb-0">
              <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/mentors" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                Mentors
              </Link>
              <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                Terms
              </Link>
            </div>
            
            <div className="text-center md:text-right">
              <div className="text-gray-600 dark:text-gray-400 mb-2">
                © {new Date().getFullYear()} Limitless Trading. All rights reserved.
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Designed for traders, by traders
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}