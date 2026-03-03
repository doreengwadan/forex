'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Edit,
  X,
  Shield,
  Lock,
  AlertCircle,
  Loader2,
  Upload,
  Trash2,
  Check
} from 'lucide-react'
import { useToast } from '../../hooks/use-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface ProfileData {
  id?: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  status: string
  created_at: string
  avatar?: string
  avatar_url?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    created_at: '',
    avatar: ''
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          router.push('/login')
          return
        }

        const res = await fetch(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        })

        if (res.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          router.push('/login')
          return
        }

        if (!res.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await res.json()
        
        // Handle both response formats
        const userData = data.user || data
        
        // Construct avatar URL if needed
        if (userData.avatar && !userData.avatar.startsWith('http')) {
          userData.avatar_url = `${API_URL.replace('/api', '')}/storage/${userData.avatar}`
        } else if (userData.avatar) {
          userData.avatar_url = userData.avatar
        }
        
        setProfile(userData)
      } catch (err: any) {
        setError(err.message)
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router, toast])

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update profile')
      }

      const data = await res.json()
      const updatedProfile = data.user || data
      
      // Preserve avatar URL
      if (updatedProfile.avatar && !updatedProfile.avatar.startsWith('http')) {
        updatedProfile.avatar_url = `${API_URL.replace('/api', '')}/storage/${updatedProfile.avatar}`
      }
      
      setProfile(updatedProfile)
      setIsEditing(false)
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, GIF, or WEBP image',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 2MB',
        variant: 'destructive'
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      setUploading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch(`${API_URL}/profile/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to upload avatar')
      }

      const data = await res.json()
      const updatedProfile = data.user || data
      
      // Update avatar URL
      if (updatedProfile.avatar) {
        if (!updatedProfile.avatar.startsWith('http')) {
          updatedProfile.avatar_url = `${API_URL.replace('/api', '')}/storage/${updatedProfile.avatar}`
        } else {
          updatedProfile.avatar_url = updatedProfile.avatar
        }
      }
      
      setProfile(updatedProfile)
      setAvatarPreview(null)
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully'
      })
    } catch (err: any) {
      setAvatarPreview(null)
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle avatar removal
  const handleAvatarRemove = async () => {
    if (!profile.avatar && !avatarPreview) return

    try {
      setUploading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_URL}/profile/avatar`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to remove avatar')
      }

      setProfile({ ...profile, avatar: '', avatar_url: '' })
      setAvatarPreview(null)
      
      toast({
        title: 'Success',
        description: 'Profile picture removed successfully'
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleAvatarUpload(file)
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-gray-500">Manage your account information</p>
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-1" /> Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card with Avatar Upload */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="relative inline-block mb-4">
            {/* Avatar Display */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>

            {/* Upload Overlay - Always visible but disabled when not editing */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-32 h-32 rounded-full transition-opacity ${
                isEditing ? 'bg-black bg-opacity-0 hover:bg-opacity-50' : ''
              } flex items-center justify-center`}>
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white opacity-0 hover:opacity-100 transition-opacity"
                      onClick={triggerFileInput}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Upload Progress Indicator */}
            {uploading && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                Uploading...
              </div>
            )}

            {/* Remove Avatar Button */}
            {isEditing && (profile.avatar || avatarPreview) && !uploading && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute -bottom-2 -right-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full w-8 h-8"
                onClick={handleAvatarRemove}
                title="Remove avatar"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <h2 className="text-2xl font-bold">
            {profile.first_name} {profile.last_name}
          </h2>

          <div className="flex justify-center gap-2 mt-2">
            <Badge className="bg-blue-100 text-blue-700">{profile.role}</Badge>
            <Badge variant="outline" className={
              profile.status === 'active' ? 'text-emerald-600 border-emerald-200' : 'text-gray-600'
            }>
              {profile.status}
            </Badge>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <InputField
            label="First Name"
            value={profile.first_name}
            disabled={!isEditing || saving}
            onChange={(v) => setProfile({ ...profile, first_name: v })}
          />

          <InputField
            label="Last Name"
            value={profile.last_name}
            disabled={!isEditing || saving}
            onChange={(v) => setProfile({ ...profile, last_name: v })}
          />

          <InputField
            label="Email"
            value={profile.email}
            disabled={true}
            icon={<Mail className="w-4 h-4" />}
            helpText="Email cannot be changed"
          />

          <InputField
            label="Phone"
            value={profile.phone || ''}
            disabled={!isEditing || saving}
            icon={<Phone className="w-4 h-4" />}
            onChange={(v) => setProfile({ ...profile, phone: v })}
            placeholder="+1 234 567 8900"
          />
        </CardContent>

        {/* Edit Hint */}
        {!isEditing && (
          <CardContent className="pt-0 text-sm text-gray-500 border-t mt-4">
            <p>Click "Edit Profile" to update your information</p>
          </CardContent>
        )}
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-semibold">Password</h3>
              <p className="text-sm text-gray-500">Change your password regularly to keep your account secure</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Check className="w-6 h-6 text-emerald-600" />
            <div className="flex-1">
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Button variant="outline">Enable 2FA</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Input Field Component
function InputField({
  label,
  value,
  disabled,
  onChange,
  icon,
  placeholder,
  helpText
}: {
  label: string
  value: string
  disabled: boolean
  onChange?: (v: string) => void
  icon?: React.ReactNode
  placeholder?: string
  helpText?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-3 text-gray-400">{icon}</span>}
        <Input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className={`${icon ? 'pl-9' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
        />
      </div>
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  )
}