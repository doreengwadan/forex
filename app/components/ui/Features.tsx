import { 
  Video, 
  MessageSquare, 
  Bell, 
  Users, 
  BarChart3, 
  Shield,
  Smartphone,
  Zap,
  Clock,
  TrendingUp,
  BookOpen,
  Headphones
} from 'lucide-react'

const features = [
  {
    icon: <Video className="w-8 h-8" />,
    title: "Live Interactive Classes",
    description: "Join real-time trading sessions with expert mentors. Ask questions, get instant feedback, and learn from actual market scenarios.",
    highlights: ["Schedule", "Replay", "Q&A", "Screen Sharing"],
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <MessageSquare className="w-8 h-8" />,
    title: "1-on-1 Mentor Chats",
    description: "Get personalized guidance through private messaging with your assigned mentor. Share trades, ask questions, and get tailored advice.",
    highlights: ["Private", "Real-time", "File Sharing", "Voice Notes"],
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: <Bell className="w-8 h-8" />,
    title: "Real-Time Trading Signals",
    description: "Receive instant buy/sell signals directly from mentors. Complete with entry points, stop loss, and take profit levels.",
    highlights: ["SMS Alerts", "Push Notifications", "Email", "In-App"],
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Community Forums",
    description: "Connect with fellow traders, share experiences, and discuss strategies in moderated community forums.",
    highlights: ["Groups", "Topics", "Polls", "Resources"],
    color: "from-orange-500 to-red-500"
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Progress Analytics",
    description: "Track your learning journey with detailed analytics. Monitor your progress, identify weaknesses, and improve systematically.",
    highlights: ["Dashboard", "Reports", "Goals", "Achievements"],
    color: "from-indigo-500 to-blue-500"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Secure Payments",
    description: "Pay safely using local payment methods. Bank transfers, Airtel Money, and Mpamba supported with encrypted transactions.",
    highlights: ["Encrypted", "Local Methods", "Auto-renew", "Receipts"],
    color: "from-yellow-500 to-amber-500"
  }
]

const platformFeatures = [
  {
    icon: <Smartphone />,
    title: "Mobile-First Design",
    description: "Optimized for smartphones with offline capabilities for low-connectivity areas."
  },
  {
    icon: <Zap />,
    title: "Fast Performance",
    description: "Pages load in under 3 seconds even on slower mobile networks."
  },
  {
    icon: <Clock />,
    title: "24/7 Availability",
    description: "Access learning materials and recorded sessions anytime, anywhere."
  },
  {
    icon: <TrendingUp />,
    title: "Scalable Infrastructure",
    description: "Built to handle thousands of concurrent users without performance issues."
  },
  {
    icon: <BookOpen />,
    title: "Structured Learning",
    description: "Progressive curriculum from beginner to advanced trading strategies."
  },
  {
    icon: <Headphones />,
    title: "Dedicated Support",
    description: "Technical and trading support available through multiple channels."
  }
]

export default function Features() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Succeed in Trading
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Our platform combines expert mentorship with cutting-edge technology 
            to provide the most comprehensive trading education experience.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon Gradient Background */}
              <div className={`absolute top-0 left-6 transform -translate-y-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
              
              {/* Icon */}
              <div className={`relative mb-4 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white`}>
                {feature.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {feature.description}
              </p>
              
              {/* Highlights */}
              <div className="flex flex-wrap gap-2">
                {feature.highlights.map((highlight, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
              
              {/* Hover Effect Line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl`}></div>
            </div>
          ))}
        </div>

        {/* Platform Features Section */}
        <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-3xl p-8 md:p-12 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">
                Built for
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Reliability & Performance
                </span>
              </h3>
              <p className="text-gray-300 text-lg">
                Our infrastructure ensures smooth operation regardless of your location or device
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <div className="text-blue-400">
                      {feature.icon}
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h4>
                  
                  <p className="text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Infrastructure Stats */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                  <div className="text-sm text-gray-300">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">&lt;3s</div>
                  <div className="text-sm text-gray-300">Load Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">256-bit</div>
                  <div className="text-sm text-gray-300">Encryption</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">24/7</div>
                  <div className="text-sm text-gray-300">Monitoring</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of traders who transformed their trading journey with our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1">
              Start 14-Day Free Trial
            </button>
            <button className="px-8 py-4 bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 transition-all">
              Schedule a Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}