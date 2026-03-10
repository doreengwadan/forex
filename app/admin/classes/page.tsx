'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { 
  Search,
  Filter,
  Video,
  Calendar,
  Users,
  Clock,
  Eye,
  Edit,
  Trash,
  Play,
  Pause,
  MoreVertical,
  User,
  Download,
  X,
  Tag,
  TrendingUp,
  Zap,
  BookOpen,
  AlertCircle,
  Loader,
  FileText,
  Link as LinkIcon,
  Upload,
  LayoutGrid,
  CalendarDays
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../components/ui/DropdownMenu'
import { Badge } from '../../components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/Dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { toast } from 'react-hot-toast'
import { Class, ClassForm, Stats, ClassStatus, ClassType } from '../../types/class'

// --- Resource type definition ---
interface Resource {
  id: number
  class_id: number
  name: string
  type: 'file' | 'link'
  url: string
  size?: number
  uploaded_at: string
}

// API Base URL
const API_BASE_URL = 'http://localhost:8000/api'

// Categories from backend
const categories = ['All', 'Programming', 'Design', 'Data Science', 'Computer Science', 'Business', 'Finance', 'Trading']
const statuses = ['All', 'scheduled', 'ongoing', 'completed', 'cancelled', 'published']
const classTypes = ['All', 'live', 'recorded']
const tagOptions = ['JavaScript', 'React', 'Python', 'Web Development', 'Data Science', 'AI', 'UI/UX', 'Beginner', 'Advanced', 'Trading', 'Forex', 'Stocks', 'Crypto']

export default function AdminClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // --- Resources state ---
  const [resources, setResources] = useState<Resource[]>([])
  const [showResourceDialog, setShowResourceDialog] = useState(false)
  const [uploadingResource, setUploadingResource] = useState(false)
  const [resourceForm, setResourceForm] = useState({
    type: 'file' as 'file' | 'link',
    name: '',
    file: null as File | null,
    link: ''
  })

  const [stats, setStats] = useState<Stats>({
    total: 0,
    live: 0,
    recorded: 0,
    upcoming: 0,
    participants: 0
  })

  // Form state for new/edit class
  const [classForm, setClassForm] = useState<ClassForm>({
    title: '',
    instructor: '',
    date: '',
    time: '',
    duration: '',
    maxAttendees: '',
    type: 'live',
    category: 'Programming',
    description: '',
    tags: [],
    recordingUrl: ''
  })

  // --- Resources API functions ---
  const fetchResources = async (classId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}/resources`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setResources(data.data || data)
      } else {
        toast.error('Failed to load resources')
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
      toast.error('Error loading resources')
    }
  }

  const uploadResource = async (classId: number, file: File, name: string) => {
    setUploadingResource(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No auth token')

      const formData = new FormData()
      formData.append('resources[]', file)

      const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}/upload-resources`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      })

      const responseData = await response.json()
      
      if (response.ok) {
        toast.success('Resource uploaded successfully')
        await fetchResources(classId)
        return true
      } else {
        console.error('Upload failed:', responseData)
        const errorMessage = responseData.errors?.['resources.0']?.[0] || 
                            responseData.message || 
                            'Upload failed'
        toast.error(errorMessage)
        return false
      }
    } catch (error) {
      console.error('Error uploading resource:', error)
      toast.error('Failed to upload resource')
      return false
    } finally {
      setUploadingResource(false)
    }
  }

  const addLinkResource = async (classId: number, name: string, link: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No auth token')

      const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}/resources/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, link })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Link added successfully')
        await fetchResources(classId)
        return true
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add link')
        return false
      }
    } catch (error) {
      console.error('Error adding link:', error)
      toast.error('Failed to add link')
      return false
    }
  }

  const deleteResource = async (resourceId: number, classId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No auth token')

      const response = await fetch(`${API_BASE_URL}/admin/classes/resources/${resourceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Resource deleted')
        await fetchResources(classId)
        return true
      } else {
        toast.error('Failed to delete resource')
        return false
      }
    } catch (error) {
      console.error('Error deleting resource:', error)
      toast.error('Error deleting resource')
      return false
    }
  }

  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setClasses(data.data || data)
      } else if (response.status === 401) {
        toast.error('Session expired. Please login again.')
        window.location.href = '/admin/login'
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to load classes')
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/admin/classes/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const saveClass = async (formData: ClassForm, classId?: number) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const url = classId 
        ? `${API_BASE_URL}/admin/classes/${classId}`
        : `${API_BASE_URL}/admin/classes`
      
      const method = classId ? 'PUT' : 'POST'

      const requestData = {
        title: formData.title,
        instructor: formData.instructor,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        max_attendees: parseInt(formData.maxAttendees),
        type: formData.type,
        category: formData.category,
        description: formData.description,
        tags: formData.tags,
        recording_url: formData.recordingUrl || null,
        status: formData.type === 'recorded' ? 'published' : 'scheduled'
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || (classId ? 'Class updated successfully' : 'Class created successfully'))
        fetchClasses()
        fetchStats()
        return true
      } else {
        const errorData = await response.json()
        if (response.status === 422) {
          const errorMessages = Object.values(errorData.errors || {}).flat()
          errorMessages.forEach(msg => toast.error(msg as string))
        } else {
          toast.error(errorData.message || 'Failed to save class')
        }
        return false
      }
    } catch (error) {
      console.error('Error saving class:', error)
      toast.error('Failed to connect to server')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteClass = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Class deleted successfully')
        fetchClasses()
        fetchStats()
        return true
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to delete class')
        return false
      }
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Failed to connect to server')
      return false
    }
  }

  const updateClassStatus = async (id: number, status: ClassStatus) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return false
      }

      const response = await fetch(`${API_BASE_URL}/admin/classes/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Class status updated successfully')
        fetchClasses()
        return true
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to update class status')
        return false
      }
    } catch (error) {
      console.error('Error updating class status:', error)
      toast.error('Failed to connect to server')
      return false
    }
  }

  useEffect(() => {
    fetchClasses()
    fetchStats()
  }, [])

  useEffect(() => {
    if (classes.length > 0) {
      const total = classes.length
      const live = classes.filter(c => c.type === 'live').length
      const recorded = classes.filter(c => c.type === 'recorded').length
      const upcoming = classes.filter(c => c.status === 'scheduled').length
      const participants = classes.reduce((sum, c) => sum + (c.attendees || 0), 0)
      
      if (stats.total === 0) {
        setStats({ total, live, recorded, upcoming, participants })
      }
    }
  }, [classes])

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cls.description && cls.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || cls.category === selectedCategory
    const matchesStatus = selectedStatus === 'All' || cls.status === selectedStatus
    const matchesType = selectedType === 'All' || cls.type === selectedType
    
    return matchesSearch && matchesCategory && matchesStatus && matchesType
  })

  const handleDeleteClass = async (id: number) => {
    const success = await deleteClass(id)
    if (success) {
      setShowDeleteDialog(false)
    }
  }

  const handleEditClass = (cls: Class) => {
    setSelectedClass(cls)
    setClassForm({
      title: cls.title,
      instructor: cls.instructor,
      date: cls.date,
      time: cls.time,
      duration: cls.duration,
      maxAttendees: cls.maxAttendees.toString(),
      type: cls.type,
      category: cls.category,
      description: cls.description || '',
      tags: cls.tags || [],
      recordingUrl: cls.recordingUrl || ''
    })
    setShowEditDialog(true)
  }

  const handleSaveClass = async () => {
    if (!classForm.title.trim()) {
      toast.error('Please enter a class title')
      return
    }
    if (!classForm.instructor.trim()) {
      toast.error('Please enter an instructor name')
      return
    }
    if (!classForm.date) {
      toast.error('Please select a date')
      return
    }
    if (!classForm.time) {
      toast.error('Please select a time')
      return
    }
    if (!classForm.duration.trim()) {
      toast.error('Please enter duration')
      return
    }
    if (!classForm.maxAttendees || parseInt(classForm.maxAttendees) <= 0) {
      toast.error('Please enter a valid number of maximum attendees')
      return
    }

    const success = await saveClass(classForm, selectedClass?.id)
    if (success) {
      setShowEditDialog(false)
      setShowScheduleDialog(false)
      resetForm()
    }
  }

  // New start handler: redirect to the live class page with instructor role
  const handleStartClass = (cls: Class) => {
    router.push(`/live-class/${cls.id}?role=instructor`)
  }

  const handleEndClass = async (id: number) => {
    await updateClassStatus(id, 'completed')
  }

  const handleCancelClass = async (id: number) => {
    await updateClassStatus(id, 'cancelled')
  }

  const resetForm = () => {
    setClassForm({
      title: '',
      instructor: '',
      date: '',
      time: '',
      duration: '',
      maxAttendees: '',
      type: 'live',
      category: 'Programming',
      description: '',
      tags: [],
      recordingUrl: ''
    })
    setSelectedClass(null)
    setTagInput('')
  }

  const addTag = (tag: string) => {
    if (tag && !classForm.tags.includes(tag)) {
      setClassForm({ ...classForm, tags: [...classForm.tags, tag] })
      setTagInput('')
      setShowTagSuggestions(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    setClassForm({
      ...classForm,
      tags: classForm.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const getStatusBadge = (status: ClassStatus): string => {
    const variants: Record<ClassStatus, string> = {
      scheduled: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      ongoing: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
      completed: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white',
      cancelled: 'bg-gradient-to-r from-rose-500 to-red-500 text-white',
      published: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadge = (type: ClassType): string => {
    return type === 'live' 
      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white' 
      : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white'
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Programming': 'from-sky-500 to-blue-600',
      'Design': 'from-fuchsia-500 to-pink-600',
      'Data Science': 'from-emerald-500 to-teal-600',
      'Computer Science': 'from-amber-500 to-orange-600',
      'Business': 'from-violet-500 to-purple-600',
      'Finance': 'from-green-500 to-emerald-600',
      'Trading': 'from-amber-500 to-yellow-600',
      'default': 'from-gray-500 to-gray-600'
    }
    return colors[category] || colors.default
  }

  const filteredTagOptions = tagOptions.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && 
    !classForm.tags.includes(tag)
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Class Management
          </h1>
          <p className="text-gray-600 mt-2">Manage all live and recorded classes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => {
              resetForm()
              setShowScheduleDialog(true)
            }}
          >
            <Video className="w-4 h-4" />
            Schedule New Class
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Live Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.live}</p>
                <p className="text-xs text-gray-500 mt-1">Active now</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl">
                <Zap className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recorded</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recorded}</p>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.participants}</p>
                <p className="text-xs text-gray-500 mt-1">Total joined</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
                <p className="text-gray-600">Loading classes...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      {!isLoading && classes.length > 0 && (
        <>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search classes, instructors, or descriptions..."
                      className="pl-10 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px] border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                      <Filter className="w-4 h-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryColor(category)}`}></div>
                            {category}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[180px] border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[180px] border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {classTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`px-3 py-2 rounded-none ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`px-3 py-2 rounded-none border-l border-gray-200 ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setViewMode('list')}
                    >
                      <CalendarDays className="w-4 h-4" />
                    </Button>
                  </div>

                  {(selectedCategory !== 'All' || selectedStatus !== 'All' || selectedType !== 'All') && (
                    <Button
                      variant="outline"
                      className="border-2 hover:bg-gray-50 hover:border-gray-300"
                      onClick={() => {
                        setSelectedCategory('All')
                        setSelectedStatus('All')
                        setSelectedType('All')
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classes Display - Cards/Grid View */}
          {filteredClasses.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
                  <Button 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('All')
                      setSelectedStatus('All')
                      setSelectedType('All')
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredClasses.map(cls => (
                <Card 
                  key={cls.id} 
                  className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${
                    viewMode === 'list' ? 'flex flex-row' : ''
                  }`}
                >
                  {/* Card Header - Gradient Strip */}
                  <div className={`h-2 bg-gradient-to-r ${getCategoryColor(cls.category)}`} />

                  <CardContent className={`${viewMode === 'list' ? 'p-4 flex-1' : 'p-6'}`}>
                    {/* Card Header with Title and Actions */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {cls.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getTypeBadge(cls.type)} text-xs`}>
                            {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                          </Badge>
                          <Badge className={`${getStatusBadge(cls.status)} text-xs`}>
                            {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEditClass(cls)} className="cursor-pointer">
                            <Edit className="w-4 h-4 mr-2 text-gray-500" />
                            Edit Class
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedClass(cls)
                              fetchResources(cls.id)
                              setShowResourceDialog(true)
                            }}
                            className="cursor-pointer"
                          >
                            <FileText className="w-4 h-4 mr-2 text-blue-500" />
                            Manage Resources
                          </DropdownMenuItem>
                          {cls.recordingUrl && (
                            <DropdownMenuItem 
                              onClick={() => window.open(cls.recordingUrl!, '_blank')}
                              className="cursor-pointer"
                            >
                              <Play className="w-4 h-4 mr-2 text-blue-500" />
                              View Recording
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => toast.success('Attendance downloaded')}
                            className="cursor-pointer"
                          >
                            <Download className="w-4 h-4 mr-2 text-emerald-500" />
                            Download Attendance
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toast.success('Email sent to participants')}
                            className="cursor-pointer"
                          >
                            <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                            Send Reminder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer"
                            onClick={() => {
                              setSelectedClass(cls)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete Class
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center ring-2 ring-blue-50 flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cls.instructor}</p>
                        <p className="text-xs text-gray-500">Instructor</p>
                      </div>
                    </div>

                    {/* Schedule Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{cls.date} at {cls.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{cls.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{cls.attendees} / {cls.maxAttendees} attendees</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Attendance</span>
                        <span className="font-semibold text-emerald-600">
                          {Math.round((cls.attendees / cls.maxAttendees) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (cls.attendees / cls.maxAttendees) >= 0.8 
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                              : (cls.attendees / cls.maxAttendees) >= 0.5 
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                              : 'bg-gradient-to-r from-rose-500 to-red-500'
                          }`}
                          style={{ width: `${(cls.attendees / cls.maxAttendees) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    {(cls.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(cls.tags || []).slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {(cls.tags || []).length > 3 && (
                          <span className="text-xs text-gray-500">+{(cls.tags || []).length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                      {cls.type === 'live' && cls.status === 'scheduled' && (
                        <Button
                          size="sm"
                          className="flex-1 gap-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                          onClick={() => handleStartClass(cls)}
                        >
                          <Play className="w-3 h-3" />
                          Start
                        </Button>
                      )}
                      {cls.type === 'live' && cls.status === 'ongoing' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 gap-1 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600"
                          onClick={() => handleEndClass(cls.id)}
                        >
                          <Pause className="w-3 h-3" />
                          End
                        </Button>
                      )}
                      {cls.status === 'scheduled' && cls.type === 'live' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1 border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleCancelClass(cls.id)}
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          toast.success(`Viewing details for ${cls.title}`)
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Error State - No Classes */}
      {!isLoading && classes.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-600 mb-6">Schedule your first class to get started</p>
              <Button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={() => setShowScheduleDialog(true)}
              >
                <Video className="w-4 h-4 mr-2" />
                Schedule First Class
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources Dialog */}
      <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Manage Resources - {selectedClass?.title}
            </DialogTitle>
            <DialogDescription>
              Upload files or add links for students to access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Resources */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Current Resources ({resources.length})
              </h3>
              
              {resources.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">No resources yet</p>
                  <p className="text-sm text-gray-500">Upload files or add links to share with students</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {resources.map(res => (
                    <div 
                      key={res.id} 
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {res.type === 'file' ? (
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <LinkIcon className="w-4 h-4 text-purple-600" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{res.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {res.type === 'file' && res.size && (
                              <>
                                <span>{(res.size / 1024).toFixed(2)} KB</span>
                                <span>•</span>
                              </>
                            )}
                            <span>Added {new Date(res.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => window.open(res.url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (await deleteResource(res.id, selectedClass!.id)) {
                              setResources(resources.filter(r => r.id !== res.id))
                            }
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Resource */}
            <div>
              <div className="flex gap-4 mb-4">
                <Button
                  variant={resourceForm.type === 'file' ? 'default' : 'outline'}
                  onClick={() => setResourceForm({ ...resourceForm, type: 'file' })}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </Button>
                <Button
                  variant={resourceForm.type === 'link' ? 'default' : 'outline'}
                  onClick={() => setResourceForm({ ...resourceForm, type: 'link' })}
                  className="gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  Add Link
                </Button>
              </div>

              {resourceForm.type === 'file' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Name
                    </label>
                    <Input
                      value={resourceForm.name}
                      onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                      placeholder="e.g., Course Presentation.pdf"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error('File size must be less than 10MB')
                              return
                            }
                            setResourceForm({ ...resourceForm, file })
                          }
                        }}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer block text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        {resourceForm.file ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">{resourceForm.file.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(resourceForm.file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Click to select a file</p>
                            <p className="text-xs text-gray-500 mt-1">PDF, Word, PowerPoint, Excel, images, video up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!resourceForm.name.trim() || !resourceForm.file || uploadingResource}
                    onClick={async () => {
                      if (!selectedClass || !resourceForm.file) return
                      const success = await uploadResource(selectedClass.id, resourceForm.file, resourceForm.name)
                      if (success) {
                        setResourceForm({ type: 'file', name: '', file: null, link: '' })
                        await fetchResources(selectedClass.id)
                      }
                    }}
                  >
                    {uploadingResource ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link Name
                    </label>
                    <Input
                      value={resourceForm.name}
                      onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                      placeholder="e.g., Documentation"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <Input
                      value={resourceForm.link}
                      onChange={(e) => setResourceForm({ ...resourceForm, link: e.target.value })}
                      placeholder="https://example.com"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!resourceForm.name.trim() || !resourceForm.link.trim()}
                    onClick={async () => {
                      if (!selectedClass) return
                      const success = await addLinkResource(selectedClass.id, resourceForm.name, resourceForm.link)
                      if (success) {
                        setResourceForm({ type: 'link', name: '', file: null, link: '' })
                        await fetchResources(selectedClass.id)
                      }
                    }}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowResourceDialog(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border-0 shadow-2xl">
          <div className="p-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-rose-100 to-red-100">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl text-gray-900">Delete Class</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{selectedClass?.title}"</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
              onClick={() => selectedClass && handleDeleteClass(selectedClass.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Delete Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule/Edit Class Dialog */}
      <Dialog open={showEditDialog || showScheduleDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEditDialog(false)
          setShowScheduleDialog(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {showEditDialog ? 'Edit Class' : 'Schedule New Class'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Class Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Class Title *</label>
              <Input
                value={classForm.title}
                onChange={(e) => setClassForm({...classForm, title: e.target.value})}
                placeholder="Enter class title"
                className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Instructor and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Instructor *</label>
                <Input
                  value={classForm.instructor}
                  onChange={(e) => setClassForm({...classForm, instructor: e.target.value})}
                  placeholder="Enter instructor name"
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category *</label>
                <Select 
                  value={classForm.category} 
                  onValueChange={(value) => setClassForm({...classForm, category: value})}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'All').map(category => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryColor(category)}`}></div>
                          {category}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Schedule - Date, Time, Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date *</label>
                <Input
                  type="date"
                  value={classForm.date}
                  onChange={(e) => setClassForm({...classForm, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Time *</label>
                <Input
                  type="time"
                  value={classForm.time}
                  onChange={(e) => setClassForm({...classForm, time: e.target.value})}
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Duration *</label>
                <Input
                  value={classForm.duration}
                  onChange={(e) => setClassForm({...classForm, duration: e.target.value})}
                  placeholder="e.g., 90 min"
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Max Attendees and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Maximum Attendees *</label>
                <Input
                  type="number"
                  min="1"
                  value={classForm.maxAttendees}
                  onChange={(e) => setClassForm({...classForm, maxAttendees: e.target.value})}
                  placeholder="Enter maximum attendees"
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Class Type *</label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`relative w-5 h-5 rounded-full border-2 ${classForm.type === 'live' ? 'border-rose-500' : 'border-gray-300'} group-hover:border-rose-400`}>
                      {classForm.type === 'live' && (
                        <div className="absolute inset-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600"></div>
                      )}
                    </div>
                    <input
                      type="radio"
                      name="type"
                      value="live"
                      checked={classForm.type === 'live'}
                      onChange={(e) => setClassForm({...classForm, type: e.target.value as ClassType})}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <span className="flex items-center gap-2 text-gray-700 group-hover:text-rose-600">
                      <Video className="w-4 h-4" />
                      Live Class
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`relative w-5 h-5 rounded-full border-2 ${classForm.type === 'recorded' ? 'border-indigo-500' : 'border-gray-300'} group-hover:border-indigo-400`}>
                      {classForm.type === 'recorded' && (
                        <div className="absolute inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600"></div>
                      )}
                    </div>
                    <input
                      type="radio"
                      name="type"
                      value="recorded"
                      checked={classForm.type === 'recorded'}
                      onChange={(e) => setClassForm({...classForm, type: e.target.value as ClassType})}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <span className="flex items-center gap-2 text-gray-700 group-hover:text-indigo-600">
                      <Clock className="w-4 h-4" />
                      Recorded
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tags</label>
              <div className="relative">
                <div className="flex gap-2 mb-2 flex-wrap">
                  {classForm.tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100">
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-blue-900"
                        disabled={isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value)
                      setShowTagSuggestions(true)
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    placeholder="Add tags..."
                    className="flex-1 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-gray-200 hover:border-indigo-500 hover:text-indigo-600"
                    onClick={() => {
                      if (tagInput.trim()) {
                        addTag(tagInput.trim())
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    Add
                  </Button>
                </div>
                {showTagSuggestions && filteredTagOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                    {filteredTagOptions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                        onClick={() => addTag(tag)}
                        disabled={isSubmitting}
                      >
                        <Tag className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium text-gray-700">{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Textarea
                value={classForm.description}
                onChange={(e) => setClassForm({...classForm, description: e.target.value})}
                placeholder="Enter class description"
                rows={4}
                className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Recording URL for recorded classes */}
            {classForm.type === 'recorded' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Recording URL</label>
                <Input
                  value={classForm.recordingUrl || ''}
                  onChange={(e) => setClassForm({...classForm, recordingUrl: e.target.value})}
                  placeholder="https://example.com/recording"
                  className="border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false)
                setShowScheduleDialog(false)
                resetForm()
              }}
              className="border-2 border-gray-300 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveClass}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {showEditDialog ? 'Updating...' : 'Saving...'}
                </>
              ) : showEditDialog ? 'Update Class' : 'Schedule Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}