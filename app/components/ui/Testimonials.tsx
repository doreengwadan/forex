'use client'

import { useState } from 'react'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    name: 'James Chibwe',
    role: 'Forex Trader, 2 years experience',
    content: 'The 1-on-1 mentorship completely transformed my trading. My portfolio grew by 45% in just 3 months!',
    rating: 5,
    avatar: 'JC',
    profit: '+45%'
  },
  {
    name: 'Sarah Banda',
    role: 'Beginner, 6 months experience',
    content: 'As a complete beginner, the structured learning path and live classes made everything so understandable.',
    rating: 5,
    avatar: 'SB',
    profit: 'First profitable month'
  },
  {
    name: 'Mike Phiri',
    role: 'Stock Trader, 1 year experience',
    content: 'The real-time signals are incredibly accurate. Saved me from several bad trades and boosted my confidence.',
    rating: 5,
    avatar: 'MP',
    profit: '+32%'
  },
  {
    name: 'Lisa Tembo',
    role: 'Crypto Trader, 8 months experience',
    content: 'The community support and mentor availability 24/7 is unmatched. Always someone to help when markets move.',
    rating: 5,
    avatar: 'LT',
    profit: '+68%'
  }
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Traders Worldwide
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of traders who transformed their journey with expert mentorship
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-shadow"
            >
              <Quote className="w-8 h-8 text-blue-500/30 mb-4" />
              
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
                <div className="ml-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {testimonial.profit}
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{testimonial.content}</p>
              
              <div className="flex">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation */}
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={prev}
            className="p-2 rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-blue-600 w-6' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          
          <button
            onClick={next}
            className="p-2 rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}