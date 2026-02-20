import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

class ApiClient {
  private client: AxiosInstance
  private baseURL: string
  private csrfToken: string | null = null

  constructor() {
    this.baseURL = 'http://localhost:8000/api'
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      withCredentials: true,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if exists
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
        
        // For POST/PUT/DELETE requests, ensure CSRF token is set
        if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
          // If we don't have a CSRF token, get one
          if (!this.csrfToken) {
            await this.fetchCsrfToken()
          }
          
          if (this.csrfToken) {
            config.headers['X-CSRF-TOKEN'] = this.csrfToken
          }
        }
        
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
            localStorage.removeItem('user_data')
            window.location.href = '/login'
          }
        }
        
        if (error.response?.status === 419) {
          this.csrfToken = null
        }
        
        return Promise.reject(error)
      }
    )
  }

  // PUBLIC METHODS

  // Get CSRF token - this is the method you need!
  async getCsrfCookie() {
    if (!this.csrfToken) {
      await this.fetchCsrfToken()
    }
    return { csrfToken: this.csrfToken }
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  // PRIVATE METHODS

  private async fetchCsrfToken() {
    try {
      const response = await this.client.get('/csrf')
      if (response.data.csrfToken) {
        this.csrfToken = response.data.csrfToken
      }
      return this.csrfToken
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error)
      throw error
    }
  }
}

// Create and export the instance
const api = new ApiClient()

// Export the instance as default
export default api

// Also export individual methods for flexibility
export const getCsrfCookie = () => api.getCsrfCookie()
export const apiGet = api.get.bind(api)
export const apiPost = api.post.bind(api)
export const apiPut = api.put.bind(api)
export const apiDelete = api.delete.bind(api)

// Export the class for testing or extension
export { ApiClient }