'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  AlertCircle
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function ProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    created_at: ''
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
        // Backend returns user object directly, not wrapped in "user"
        setProfile(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

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
          last_name: profile.last_name
          // Note: email and phone are not updatable via this endpoint (backend only updates first_name, last_name, username)
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update profile')
      }

      const data = await res.json()
      // Backend returns updated user directly under "user" in update response?
      // Let's handle both possibilities
      setProfile(data.user || data)
      setIsEditing(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-gray-500">Manage your account information</p>
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-1" /> Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-14 h-14 text-white" />
            </div>
            {isEditing && (
              <button className="absolute bottom-1 right-1 bg-white border rounded-full p-2">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          <h2 className="text-2xl font-bold">
            {profile.first_name} {profile.last_name}
          </h2>

          <div className="flex justify-center gap-2 mt-2">
            <Badge>{profile.role}</Badge>
            <Badge variant="outline">{profile.status}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            value={profile.first_name}
            disabled={!isEditing}
            onChange={(v) => setProfile({ ...profile, first_name: v })}
          />

          <InputField
            label="Last Name"
            value={profile.last_name}
            disabled={!isEditing}
            onChange={(v) => setProfile({ ...profile, last_name: v })}
          />

          <InputField
            label="Email"
            value={profile.email}
            disabled={true} // Email should not be editable via this form
            icon={<Mail className="w-4 h-4" />}
          />

          <InputField
            label="Phone"
            value={profile.phone || ''}
            disabled={!isEditing}
            icon={<Phone className="w-4 h-4" />}
            onChange={(v) => setProfile({ ...profile, phone: v })}
          />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold">Security</h3>
              <p className="text-sm text-gray-500">Account protection</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Lock className="w-4 h-4" />
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function InputField({
  label,
  value,
  disabled,
  onChange,
  icon
}: {
  label: string
  value: string
  disabled: boolean
  onChange?: (v: string) => void
  icon?: React.ReactNode
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
          className={`${icon ? 'pl-9' : ''} ${disabled ? 'bg-gray-100' : ''}`}
        />
      </div>
    </div>
  )
}