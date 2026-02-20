// lib/types.ts
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
  token?: string
}

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
  data?: any
}

// User types
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  email_verified_at?: string
  created_at: string
  updated_at: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
}

export interface LoginData {
  email: string
  password: string
  remember?: boolean
}