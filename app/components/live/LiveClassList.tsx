'use client'

import { useState } from 'react'
import LiveClassCard from './LiveClassCard'
import { LiveClassCardSkeleton } from './LiveClassCardSkeleton'
import { Filter, Search, Grid, List } from 'lucide-react'

interface LiveClass {
  id: string
  title: string
  description: string
  mentor: {
    id: string
    name: string
    rating: number
  }
  scheduledFor: Date
  duration: number
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  status: 'scheduled' | 'live' | 'completed'
  maxParticipants?: number
  currentParticipants?: number
}

interface LiveClassListProps {
  classes?: LiveClass[]
  isLoading?: boolean
  onJoinClass?: (classId: string) => void
  onBookmarkClass?: (classId: string) => void
  onShareClass?: (classId: string) => void
  userRole?: 'mentee' | 'mentor' | 'admin'
  showFilters?: boolean
}

export default function LiveClassList({
  classes = [],
  isLoading = false,
  onJoinClass,
  onBookmarkClass,
  onShareClass,
  userRole = 'mentee',
  showFilters = true,
}: LiveClassListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [bookmarkedClasses, setBookmarkedClasses] = useState<string[]>([])

  // Extract unique categories and levels from classes
  const categories = ['all', ...new Set(classes.map(c => c.category))]
  const levels = ['all', 'beginner', 'intermediate', 'advanced']
  const statuses = ['all', 'scheduled', 'live', 'completed']

  const handleBookmark = (classId: string) => {
    setBookmarkedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
    onBookmarkClass?.(classId)
  }

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch = searchQuery === '' || 
      classItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.mentor.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
      classItem.category === selectedCategory
    
    const matchesLevel = selectedLevel === 'all' || 
      classItem.level === selectedLevel
    
    const matchesStatus = selectedStatus === 'all' || 
      classItem.status === selectedStatus

    return matchesSearch && matchesCategory && matchesLevel && matchesStatus
  })

  const liveClasses = filteredClasses.filter(c => c.status === 'live')
  const upcomingClasses = filteredClasses.filter(c => c.status === 'scheduled')
  const completedClasses = filteredClasses.filter(c => c.status === 'completed')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LiveClassCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search classes, mentors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <List size={20} />
                </button>
              </div>
              
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <Filter size={18} className="mr-2" />
                Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {filteredClasses.length} classes found
        </h3>
        <div className="text-sm text-gray-500">
          {liveClasses.length} live • {upcomingClasses.length} upcoming • {completedClasses.length} completed
        </div>
      </div>

      {/* Live Classes Section */}
      {liveClasses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping mr-2"></div>
            Live Now
          </h3>
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {liveClasses.map((classItem) => (
              <LiveClassCard
                key={classItem.id}
                classItem={classItem}
                onJoin={onJoinClass}
                onBookmark={handleBookmark}
                onShare={onShareClass}
                isBookmarked={bookmarkedClasses.includes(classItem.id)}
                userRole={userRole}
                compact={viewMode === 'list'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Upcoming Classes</h3>
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {upcomingClasses.map((classItem) => (
              <LiveClassCard
                key={classItem.id}
                classItem={classItem}
                onJoin={onJoinClass}
                onBookmark={handleBookmark}
                onShare={onShareClass}
                isBookmarked={bookmarkedClasses.includes(classItem.id)}
                userRole={userRole}
                compact={viewMode === 'list'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Classes */}
      {completedClasses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Completed Classes</h3>
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {completedClasses.map((classItem) => (
              <LiveClassCard
                key={classItem.id}
                classItem={classItem}
                onJoin={onJoinClass}
                onBookmark={handleBookmark}
                onShare={onShareClass}
                isBookmarked={bookmarkedClasses.includes(classItem.id)}
                userRole={userRole}
                compact={viewMode === 'list'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredClasses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Video className="text-gray-400" size={48} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search term to find what you're looking for.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setSelectedLevel('all')
              setSelectedStatus('all')
            }}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}