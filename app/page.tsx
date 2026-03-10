'use client'
import Link from 'next/link'
import { Button } from './components/ui/Button'
import { Card, CardContent } from './components/ui/Card'
import { 
  ArrowRight, 
  Users, 
  Signal, 
  Video, 
  MessageSquare, 
  BarChart, 
  Shield, 
  Zap,
  TrendingUp,
  Globe,
  DollarSign,
  Clock,
  Award,
  Target,
  Activity,
  CandlestickChart
} from 'lucide-react'

export default function LimitlessForexPage() {
  // Fixed positions that won't change between server and client
  const currencyPairs = [
    { pair: "EUR/USD", top: 20, left: 10, rotate: 15, delay: 0 },
    { pair: "GBP/USD", top: 35, left: 30, rotate: 30, delay: 0.5 },
    { pair: "USD/JPY", top: 50, left: 50, rotate: 45, delay: 1 },
    { pair: "AUD/USD", top: 65, left: 70, rotate: 60, delay: 1.5 },
    { pair: "USD/CAD", top: 80, left: 20, rotate: 75, delay: 2 },
    { pair: "GBP/JPY", top: 25, left: 80, rotate: 90, delay: 2.5 }
  ]

  const candlestickPositions = [
    { top: 10, left: 15, delay: 0, duration: 15 },
    { top: 25, left: 85, delay: 0.8, duration: 17 },
    { top: 45, left: 30, delay: 1.6, duration: 19 },
    { top: 60, left: 70, delay: 2.4, duration: 21 },
    { top: 75, left: 45, delay: 3.2, duration: 23 },
    { top: 90, left: 60, delay: 4, duration: 25 },
    { top: 15, left: 95, delay: 4.8, duration: 27 },
    { top: 55, left: 5, delay: 5.6, duration: 29 },
    { top: 85, left: 75, delay: 6.4, duration: 31 },
    { top: 40, left: 55, delay: 7.2, duration: 33 }
  ]

  const particlePositions = [
    { top: 97, left: 11, delay: 0, duration: 5 },
    { top: 14, left: 55, delay: 0.2, duration: 7 },
    { top: 88, left: 12, delay: 0.4, duration: 9 },
    { top: 54, left: 40, delay: 0.6, duration: 11 },
    { top: 24, left: 80, delay: 0.8, duration: 13 },
    { top: 18, left: 33, delay: 1, duration: 15 },
    { top: 59, left: 23, delay: 1.2, duration: 17 },
    { top: 13, left: 68, delay: 1.4, duration: 19 },
    { top: 38, left: 77, delay: 1.6, duration: 21 },
    { top: 58, left: 85, delay: 1.8, duration: 23 },
    { top: 40, left: 43, delay: 2, duration: 25 },
    { top: 60, left: 45, delay: 2.2, duration: 27 },
    { top: 33, left: 54, delay: 2.4, duration: 29 },
    { top: 24, left: 88, delay: 2.6, duration: 31 },
    { top: 74, left: 49, delay: 2.8, duration: 33 },
    { top: 41, left: 21, delay: 3, duration: 35 },
    { top: 30, left: 24, delay: 3.2, duration: 37 },
    { top: 69, left: 91, delay: 3.4, duration: 39 },
    { top: 68, left: 48, delay: 3.6, duration: 41 },
    { top: 38, left: 81, delay: 3.8, duration: 43 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Moving background animations */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        
        @keyframes float-slow {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-15px) translateX(-15px) rotate(2deg); }
          66% { transform: translateY(10px) translateX(15px) rotate(-2deg); }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
        }
        
        @keyframes drift {
          0% { transform: translateX(-10%) translateY(-5%); }
          50% { transform: translateX(10%) translateY(5%); }
          100% { transform: translateX(-10%) translateY(-5%); }
        }
        
        @keyframes drift-reverse {
          0% { transform: translateX(10%) translateY(5%) scale(1.1); }
          50% { transform: translateX(-10%) translateY(-5%) scale(0.9); }
          100% { transform: translateX(10%) translateY(5%) scale(1.1); }
        }
        
        @keyframes wave {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-5%) translateY(-2%); }
          50% { transform: translateX(-10%) translateY(0); }
          75% { transform: translateX(-5%) translateY(2%); }
          100% { transform: translateX(0) translateY(0); }
        }
        
        @keyframes pulse-glow {
          0% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        
        @keyframes chart-move {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
        
        .animate-drift {
          animation: drift 20s ease-in-out infinite;
        }
        
        .animate-drift-reverse {
          animation: drift-reverse 25s ease-in-out infinite;
        }
        
        .animate-wave {
          animation: wave 15s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        
        .chart-pattern {
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.1) 25%, 
            transparent 50%,
            rgba(16, 185, 129, 0.1) 75%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: chart-move 8s linear infinite;
        }
        
        .grid-pattern {
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: drift 30s linear infinite;
        }
        
        .moving-candlesticks {
          position: relative;
          overflow: hidden;
        }
        
        .moving-candlesticks::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            rgba(59, 130, 246, 0.03) 20px,
            rgba(59, 130, 246, 0.03) 40px
          );
          animation: drift 30s linear infinite;
        }
        
        .floating-currency {
          filter: blur(40px);
          transition: all 0.3s ease;
        }
        
        .parallax-bg {
          transform: translateZ(0);
          will-change: transform;
        }
      `}</style>

      {/* Animated Background Layer - Moving Images */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid pattern that moves */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
        
        {/* Moving candlestick patterns */}
        <div className="absolute inset-0 moving-candlesticks" />
        
        {/* Animated chart lines */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-10 animate-drift" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,300 Q150,250 300,300 T600,250 T900,300 T1200,250 T1500,300" 
                stroke="rgba(59, 130, 246, 0.3)" 
                fill="none" 
                strokeWidth="2">
            <animate attributeName="d" 
                     dur="20s" 
                     repeatCount="indefinite"
                     values="M0,300 Q150,250 300,300 T600,250 T900,300 T1200,250 T1500,300;
                             M0,250 Q150,300 300,250 T600,300 T900,250 T1200,300 T1500,250;
                             M0,300 Q150,250 300,300 T600,250 T900,300 T1200,250 T1500,300" />
          </path>
        </svg>
        
        {/* Second moving chart line */}
        <svg className="absolute top-20 left-0 w-full h-full opacity-10 animate-drift-reverse" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,400 Q200,350 400,400 T800,350 T1200,400 T1600,350" 
                stroke="rgba(16, 185, 129, 0.3)" 
                fill="none" 
                strokeWidth="2">
            <animate attributeName="d" 
                     dur="25s" 
                     repeatCount="indefinite"
                     values="M0,400 Q200,350 400,400 T800,350 T1200,400 T1600,350;
                             M0,350 Q200,400 400,350 T800,400 T1200,350 T1600,400;
                             M0,400 Q200,350 400,400 T800,350 T1200,400 T1600,350" />
          </path>
        </svg>

        {/* Floating currency symbols background layer - using deterministic positions */}
        <div className="absolute inset-0">
          {currencyPairs.map((pair, i) => (
            <div
              key={i}
              className={`absolute text-8xl font-bold text-slate-200 dark:text-slate-800/30 select-none
                ${i % 2 === 0 ? 'animate-float' : 'animate-float-slow'}`}
              style={{
                top: `${pair.top}%`,
                left: `${pair.left}%`,
                transform: `rotate(${pair.rotate}deg)`,
                animationDelay: `${pair.delay}s`,
                whiteSpace: 'nowrap'
              }}
            >
              {pair.pair}
            </div>
          ))}
        </div>

        {/* Floating candlestick icons - using deterministic positions */}
        <div className="absolute inset-0">
          {candlestickPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-6xl text-blue-500/5 dark:text-blue-400/5 animate-float-slow"
              style={{
                top: `${pos.top}%`,
                left: `${pos.left}%`,
                animationDelay: `${pos.delay}s`,
                animationDuration: `${pos.duration}s`
              }}
            >
              <CandlestickChart className="w-16 h-16" />
            </div>
          ))}
        </div>

        {/* Moving gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-drift" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-drift-reverse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-slate-200/50 dark:border-slate-800 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                  Limitless Forex
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Master the Currency Markets</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/forex-basics" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium">
                Forex 101
              </Link>
              <Link href="/pricing" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium">
                Pricing
              </Link>
              <Link href="/mentors" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium">
                Mentors
              </Link>
              <div className="flex items-center space-x-3 ml-4">
                <Link href="/login" className="text-slate-700 dark:text-slate-200 hover:text-blue-600 font-medium">
                  Login
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all">
                    Start Trading Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Moving chart pattern overlay */}
        <div className="absolute inset-0 chart-pattern opacity-20" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-6 backdrop-blur-sm">
            <DollarSign className="w-4 h-4 text-blue-600 mr-1" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Forex Trading Specialists • 10+ Years Experience</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            Master <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">Forex Trading</span> with Professional Mentors
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Learn to trade major, minor, and exotic currency pairs with institutional strategies. 
            Get real-time signals, 1-on-1 mentorship, and join a community of successful forex traders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white gap-3 text-lg px-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
                Start Learning Forex
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 gap-3">
                <Video className="w-5 h-5" />
                Watch Free Forex Class
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "28", label: "Currency Pairs" },
              { value: "24/5", label: "Market Coverage" },
              { value: "100+", label: "Trading Strategies" },
              { value: "$4.3B", label: "Daily Volume" }
            ].map((stat, i) => (
              <div key={i} className="text-center backdrop-blur-sm bg-white/30 dark:bg-slate-900/30 p-4 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Forex Section */}
      <section className="py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Why Trade <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Forex</span>?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              The world's largest financial market offers unique opportunities for dedicated traders
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Globe className="w-8 h-8 text-blue-600" />,
                title: "24-Hour Market",
                description: "Trade forex anytime during the week across Asian, London, and New York sessions"
              },
              {
                icon: <DollarSign className="w-8 h-8 text-emerald-600" />,
                title: "High Liquidity",
                description: "$6.6 trillion daily volume means tight spreads and fast execution"
              },
              {
                icon: <Target className="w-8 h-8 text-purple-600" />,
                title: "Leverage Up to 50:1",
                description: "Control larger positions with smaller capital (regulations apply)"
              },
              {
                icon: <Activity className="w-8 h-8 text-orange-600" />,
                title: "Low Volatility Options",
                description: "Choose from major pairs with lower volatility or exotics for bigger moves"
              }
            ].map((item, i) => (
              <Card key={i} className="border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all hover:-translate-y-2 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950 dark:to-emerald-950 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Forex Features */}
      <section className="py-20 bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-slate-950/50 dark:to-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need for <span className="text-blue-600">Forex Success</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Our platform is built specifically for currency traders, from beginners to professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Signal className="w-8 h-8 text-blue-600" />,
                title: "Forex Signals",
                description: "Real-time buy/sell alerts for EUR/USD, GBP/USD, USD/JPY and more",
                color: "blue"
              },
              {
                icon: <BarChart className="w-8 h-8 text-emerald-600" />,
                title: "Economic Calendar",
                description: "Track central bank decisions, NFP, CPI, and other high-impact events",
                color: "emerald"
              },
              {
                icon: <Video className="w-8 h-8 text-purple-600" />,
                title: "Live Market Analysis",
                description: "Daily video briefings on major currency pairs and market drivers",
                color: "purple"
              },
              {
                icon: <Users className="w-8 h-8 text-orange-600" />,
                title: "Forex Community",
                description: "Chat with traders during London and New York sessions",
                color: "orange"
              },
              {
                icon: <MessageSquare className="w-8 h-8 text-pink-600" />,
                title: "Mentor Q&A",
                description: "Get your forex questions answered by professional traders",
                color: "pink"
              },
              {
                icon: <Shield className="w-8 h-8 text-indigo-600" />,
                title: "Risk Management",
                description: "Learn position sizing, stop-loss placement, and risk-reward ratios",
                color: "indigo"
              }
            ].map((feature, i) => (
              <Card key={i} className="group hover:shadow-xl transition-all border border-slate-200 dark:border-slate-800 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 rounded-xl flex items-center justify-center mb-6`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Currency Pairs Coverage */}
      <section className="py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
                Master All Major <span className="text-blue-600">Currency Pairs</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                From majors to exotics, we cover every tradable currency pair with in-depth analysis and strategies.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { pair: "EUR/USD", spread: "0.8", volatility: "Medium" },
                  { pair: "GBP/USD", spread: "1.2", volatility: "High" },
                  { pair: "USD/JPY", spread: "0.9", volatility: "Medium" },
                  { pair: "AUD/USD", spread: "1.1", volatility: "Medium" },
                  { pair: "USD/CAD", spread: "1.3", volatility: "Medium" },
                  { pair: "NZD/USD", spread: "1.4", volatility: "Medium" },
                  { pair: "USD/CHF", spread: "1.2", volatility: "Low" },
                  { pair: "GBP/JPY", spread: "2.5", volatility: "High" }
                ].map((pair, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all backdrop-blur-sm">
                    <div className="font-bold text-slate-900 dark:text-white">{pair.pair}</div>
                    <div className="text-sm text-slate-500">Spread: {pair.spread} pips</div>
                    <div className="text-sm text-slate-500">Volatility: {pair.volatility}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-3xl opacity-20 blur-2xl animate-pulse-glow" />
              <Card className="relative bg-white dark:bg-slate-800 border-2 border-blue-600 backdrop-blur-sm">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Forex Trading Package</h3>
                  <ul className="space-y-4">
                    {[
                      "Major pairs analysis & signals",
                      "Cross pairs strategies",
                      "Exotic pairs guide",
                      "Central bank reaction strategies",
                      "Carry trade setups",
                      "News trading playbook"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/forex-package" className="block mt-8">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white gap-2">
                      View Full Curriculum
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trading Sessions */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Moving background for this section */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.1)_0%,_transparent_50%)] animate-drift" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.1)_0%,_transparent_50%)] animate-drift-reverse" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trade Around the Clock</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Forex market never sleeps. Join live sessions across all major trading sessions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                session: "Asian Session",
                hours: "7 PM - 4 AM EST",
                pairs: "JPY, AUD, NZD",
                volatility: "Low to Medium",
                icon: <Clock className="w-6 h-6" />
              },
              {
                session: "London Session",
                hours: "3 AM - 12 PM EST",
                pairs: "GBP, EUR, CHF",
                volatility: "High",
                icon: <Clock className="w-6 h-6" />
              },
              {
                session: "New York Session",
                hours: "8 AM - 5 PM EST",
                pairs: "USD, CAD",
                volatility: "High",
                icon: <Clock className="w-6 h-6" />
              }
            ].map((session, i) => (
              <Card key={i} className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-all hover:-translate-y-2 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                    {session.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{session.session}</h3>
                  <p className="text-slate-300 mb-4">{session.hours}</p>
                  <p className="text-sm text-slate-400 mb-2">Active Pairs: {session.pairs}</p>
                  <p className="text-sm text-slate-400">Volatility: {session.volatility}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-600">
          {/* Moving particles in CTA - using deterministic positions */}
          <div className="absolute inset-0 opacity-20">
            {particlePositions.map((pos, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full animate-float"
                style={{
                  top: `${pos.top}%`,
                  left: `${pos.left}%`,
                  animationDelay: `${pos.delay}s`,
                  animationDuration: `${pos.duration}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Master Forex Trading?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join 1,000+ traders who've transformed their forex trading with our mentorship program.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 gap-3 text-lg px-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                Start Your Forex Journey
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/curriculum">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 hover:-translate-y-1 transition-all">
                View Forex Curriculum
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/80">
            <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
              <Shield className="w-4 h-4" />
              <span>Regulated Education</span>
            </div>
            <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
              <DollarSign className="w-4 h-4" />
              <span>14-Day Money Back</span>
            </div>
            <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
              <Users className="w-4 h-4" />
              <span>Active Forex Community</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 bg-white dark:bg-slate-950 relative">
        {/* Subtle moving background in footer */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(59,130,246,0.1)_0%,_transparent_50%)] animate-drift" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                  Limitless Forex
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Professional forex mentorship for traders at every level.
              </p>
            </div>
            
            {[
              {
                title: "Forex Education",
                links: ["Basics", "Pairs", "Strategies", "Analysis"]
              },
              {
                title: "Resources",
                links: ["Economic Calendar", "Signals", "Webinars", "Blog"]
              },
              {
                title: "Company",
                links: ["About Us", "Our Mentors", "Contact", "Legal"]
              }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-bold mb-4 text-slate-900 dark:text-white">{section.title}</h4>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link href={`/${link.toLowerCase().replace(/\s+/g, '-')}`} 
                            className="text-slate-500 hover:text-blue-600 transition-all">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Limitless Forex Trading. All rights reserved.</p>
            <p className="mt-2">Forex trading involves substantial risk of loss. Not suitable for all investors.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}