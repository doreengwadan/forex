// types/class.ts (extended version)

export type ClassStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'published'
export type ClassType = 'live' | 'recorded'
export type ResourceType = 'document' | 'video' | 'audio' | 'image' | 'presentation' | 'spreadsheet' | 'archive' | 'other'

// Base Resource Interface
export interface BaseResource {
  id: number
  name: string
  type: ResourceType
  size: number
  url: string
  uploadedAt?: string
  class_id?: number
  mime_type?: string
  description?: string
  created_at?: string
  updated_at?: string
}

// Video-specific resource
export interface VideoResource extends BaseResource {
  type: 'video'
  duration: number // in seconds
  thumbnail_url?: string
  resolution?: string
  codec?: string
  fps?: number
}

// Audio-specific resource
export interface AudioResource extends BaseResource {
  type: 'audio'
  duration: number // in seconds
  bitrate?: number
  sample_rate?: number
}

// Image-specific resource
export interface ImageResource extends BaseResource {
  type: 'image'
  width: number
  height: number
  thumbnail_url?: string
}

// Document-specific resource
export interface DocumentResource extends BaseResource {
  type: 'document'
  page_count?: number
  author?: string
}

// Presentation-specific resource
export interface PresentationResource extends BaseResource {
  type: 'presentation'
  slide_count?: number
  author?: string
}

// Spreadsheet-specific resource
export interface SpreadsheetResource extends BaseResource {
  type: 'spreadsheet'
  sheet_count?: number
  author?: string
}

// Archive-specific resource
export interface ArchiveResource extends BaseResource {
  type: 'archive'
  compression_ratio?: number
  file_count?: number
  original_size?: number
}

// Other resource type
export interface OtherResource extends BaseResource {
  type: 'other'
}

// Union type for all resources
export type LearningResource = 
  | VideoResource 
  | AudioResource 
  | ImageResource 
  | DocumentResource 
  | PresentationResource 
  | SpreadsheetResource 
  | ArchiveResource 
  | OtherResource

export interface Class {
  id: number
  title: string
  instructor: string
  date: string
  time: string
  duration: string
  maxAttendees: number
  attendees: number
  type: ClassType
  category: string
  description?: string
  status: ClassStatus
  tags: string[]
  recordingUrl?: string
  recordSession?: boolean
  recordingQuality?: 'low' | 'medium' | 'high'
  resources?: LearningResource[]
  created_at?: string
  updated_at?: string
}

export interface ClassForm {
  title: string
  instructor: string
  date: string
  time: string
  duration: string
  maxAttendees: string
  type: ClassType
  category: string
  description: string
  tags: string[]
  recordingUrl?: string
  recordSession?: boolean
  recordingQuality?: 'low' | 'medium' | 'high'
  resources?: any[] // Temporary resources for form state
}

export interface Stats {
  total: number
  live: number
  recorded: number
  upcoming: number
  participants: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface ClassListResponse {
  data: Class[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ResourceListResponse {
  data: LearningResource[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// Resource upload response
export interface ResourceUploadResponse {
  success: boolean
  message: string
  data: {
    resources: LearningResource[]
  }
}

// Resource delete response
export interface ResourceDeleteResponse {
  success: boolean
  message: string
}

// Helper type for resource filters
export interface ResourceFilters {
  type?: ResourceType
  search?: string
  sort_by?: 'name' | 'size' | 'uploadedAt' | 'type'
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}