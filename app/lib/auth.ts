// lib/auth.ts
import { api } from './api'
import { RegisterData, LoginData, User, ApiResponse } from './types'

export class AuthService {
  static async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // Get CSRF cookie first for Laravel Sanctum
      await api.getCsrfCookie()
      
      // Register the user
      const response = await api.post('/register', data)
      
      // Store token if successful
      if (response.success && response.token) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.data?.user))
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  static async login(data: LoginData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // Get CSRF cookie first
      await api.getCsrfCookie()
      
      const response = await api.post('/login', data)
      
      if (response.success && response.token) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.data?.user))
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/user')
      return response.data?.user || null
    } catch (error) {
      return null
    }
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  }

  static getToken(): string | null {
    return localStorage.getItem('token')
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }
}