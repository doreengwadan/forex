'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'  // Add this import
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/Avatar'
import { Send, Users, Loader2, AlertCircle, ArrowLeft, MoreVertical, Phone, Video, Search, Check, CheckCheck } from 'lucide-react'
import { useToast } from '../../../hooks/use-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// ... rest of your code remains the same

interface Message {
  id: number
  user_id: number
  user_name: string
  user_avatar?: string
  content: string
  created_at: string
  status?: 'sent' | 'delivered' | 'read'
}

interface Group {
  id: number
  name: string
  description: string
  member_count: number
  avatar?: string
  is_member?: boolean
  role?: string
  online_count?: number
}

export default function GroupChatPage() {
  const params = useParams()
  const groupId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const [group, setGroup] = useState<Group | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  // Polling interval (in ms)
  const POLL_INTERVAL = 3000

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const res = await fetch(`${API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (res.ok) {
        const data = await res.json()
        setCurrentUserId(data.id)
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
    }
  }

  // Fetch group details
  const fetchGroup = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        router.push('/login')
        return
      }

      if (res.status === 404) {
        setError('Group not found')
        return
      }

      if (!res.ok) throw new Error('Failed to load group')

      const data = await res.json()
      
      const groupData = data.group || data.data || data
      setGroup({
        ...groupData,
        online_count: Math.floor(Math.random() * 10) + 1 // Mock online count
      })
    } catch (err: any) {
      setError(err.message)
    }
  }, [groupId, router])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const res = await fetch(`${API_URL}/groups/${groupId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (res.status === 403) {
        console.log('User is not a member of this group')
        setMessages([])
        return
      }

      if (res.status === 404) {
        console.error('Group not found')
        setMessages([])
        return
      }

      if (res.status === 401) {
        console.error('Unauthorized - redirecting to login')
        localStorage.removeItem('auth_token')
        router.push('/login')
        return
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || `Failed to load messages: ${res.status}`)
      }

      const responseText = await res.text()
      if (!responseText) {
        setMessages([])
        return
      }

      const data = JSON.parse(responseText)
      
      const messagesArray = Array.isArray(data) ? data : data.messages || data.data || []
      
      // Add mock status for demo purposes
      const messagesWithStatus = messagesArray.map((msg: Message, index: number) => ({
        ...msg,
        status: index === messagesArray.length - 1 ? 'read' : 
                index > messagesArray.length - 3 ? 'delivered' : 'sent'
      }))
      
      setMessages(messagesWithStatus)
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      if (!err.message?.includes('403')) {
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        })
      }
      setMessages([])
    }
  }, [groupId, router, toast])

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await fetchCurrentUser()
      await fetchGroup()
      await fetchMessages()
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load chat')
    } finally {
      setLoading(false)
    }
  }, [fetchGroup, fetchMessages])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Polling for new messages
  useEffect(() => {
    if (!group?.is_member) {
      return
    }

    const interval = setInterval(fetchMessages, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [groupId, fetchMessages, group?.is_member])

  // Auto-scroll to bottom with animation
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: messages.length > 0 ? 'smooth' : 'auto'
      })
    }
  }, [messages])

  // Send a new message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !group?.is_member) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    // Optimistic update
    const tempId = Date.now()
    const tempMessage: Message = {
      id: tempId,
      user_id: currentUserId!,
      user_name: 'You',
      content: messageContent,
      created_at: new Date().toISOString(),
      status: 'sent'
    }
    
    setMessages(prev => [...prev, tempMessage])

    setSending(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_URL}/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ content: messageContent }),
      })

      if (res.status === 403) {
        throw new Error('You are not a member of this group')
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to send message')
      }

      const responseText = await res.text()
      if (!responseText) {
        throw new Error('Empty response from server')
      }

      const sentMessage = JSON.parse(responseText)
      
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...sentMessage, status: 'delivered' } : msg
        )
      )
      
    } catch (err: any) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setNewMessage(messageContent)
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  // Format message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diff / 60000)
    const diffHours = Math.floor(diff / 3600000)
    const diffDays = Math.floor(diff / 86400000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(msg)
    })
    
    return groups
  }

  // Format date header
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffDays = Math.floor(diff / 86400000)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0B141A]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00A884] mx-auto" />
          <p className="mt-4 text-[#E9EDEF]">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0B141A]">
        <div className="text-center text-[#F15C6D]">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">{error || 'Group not found'}</p>
          <Button 
            variant="outline" 
            className="mt-4 border-[#00A884] text-[#00A884] hover:bg-[#00A884] hover:text-white"
            onClick={() => router.push('/groups')}
          >
            Back to Groups
          </Button>
        </div>
      </div>
    )
  }

  const isMember = group.is_member === true
  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-screen bg-[#0B141A]">
      {/* WhatsApp-style header */}
      <div className="bg-[#202C33] text-white px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/groups')}
            className="text-[#AEBAC1] hover:text-white hover:bg-[#2A3942] rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Avatar className="w-10 h-10">
            {group.avatar ? (
              <AvatarImage src={group.avatar} alt={group.name} />
            ) : (
              <AvatarFallback className="bg-[#00A884] text-white">
                {group.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-[#E9EDEF] truncate">{group.name}</h1>
            <p className="text-xs text-[#AEBAC1]">
              {group.online_count} online • {group.member_count} members
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-[#AEBAC1] hover:text-white hover:bg-[#2A3942] rounded-full">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#AEBAC1] hover:text-white hover:bg-[#2A3942] rounded-full">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#AEBAC1] hover:text-white hover:bg-[#2A3942] rounded-full">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#AEBAC1] hover:text-white hover:bg-[#2A3942] rounded-full">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages area - WhatsApp style */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 bg-[#0B141A] bg-[url('/whatsapp-bg.png')] bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23202C33' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '100px 100px',
          backgroundOpacity: '0.05'
        }}
      >
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex justify-center my-4">
              <span className="px-3 py-1 text-xs bg-[#1E2A32] text-[#AEBAC1] rounded-full shadow-sm">
                {formatDateHeader(date)}
              </span>
            </div>
            
            {/* Messages for this date */}
            {dateMessages.map((msg, index) => {
              const isCurrentUser = msg.user_id === currentUserId
              const showAvatar = !isCurrentUser && (
                index === 0 || 
                dateMessages[index - 1]?.user_id !== msg.user_id
              )
              
              return (
                <div
                  key={msg.id}
                  className={`flex mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <div className="w-8 mr-2 flex-shrink-0">
                      {showAvatar ? (
                        <Avatar className="w-8 h-8">
                          {msg.user_avatar ? (
                            <AvatarImage src={msg.user_avatar} alt={msg.user_name} />
                          ) : (
                            <AvatarFallback className="bg-[#00A884] text-white text-xs">
                              {msg.user_name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8" /> // Spacer for alignment
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[65%] ${isCurrentUser ? 'mr-2' : ''}`}>
                    {/* Show name for group messages (not current user) */}
                    {!isCurrentUser && showAvatar && (
                      <p className="text-xs text-[#00A884] mb-1 ml-1">{msg.user_name}</p>
                    )}
                    
                    {/* Message bubble */}
                    <div
                      className={`relative px-3 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-[#005C4B] text-white rounded-tr-none'
                          : 'bg-[#202C33] text-[#E9EDEF] rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words pr-12">
                        {msg.content}
                      </p>
                      
                      {/* Message time and status */}
                      <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[0.65rem] ${
                        isCurrentUser ? 'text-[#AEBAC1]' : 'text-[#8696A0]'
                      }`}>
                        <span>{formatMessageTime(msg.created_at)}</span>
                        {isCurrentUser && (
                          <span>
                            {msg.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input - WhatsApp style */}
      {isMember ? (
        <div className="bg-[#202C33] px-4 py-3">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-[#AEBAC1] hover:text-white hover:bg-[#2A3942] rounded-full flex-shrink-0"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <span className="text-xl">😊</span>
            </Button>
            
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message"
              disabled={sending}
              className="flex-1 bg-[#2A3942] border-0 text-white placeholder:text-[#8696A0] focus-visible:ring-1 focus-visible:ring-[#00A884] rounded-lg"
            />
            
            <Button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-[#00A884] hover:bg-[#00997A] text-white rounded-full w-10 h-10 p-0 flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="bg-[#202C33] p-6 text-center">
          <p className="text-[#AEBAC1] mb-3">You need to join this group to send messages.</p>
          <Button 
            onClick={handleJoinGroup} 
            className="bg-[#00A884] hover:bg-[#00997A] text-white px-6"
          >
            Join Group
          </Button>
        </div>
      )}
    </div>
  )
}