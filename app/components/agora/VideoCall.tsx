'use client'

import { useState, useEffect, useRef } from 'react'
import AgoraRTC, { 
  IAgoraRTCClient, 
  ILocalVideoTrack, 
  ILocalAudioTrack,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  UID 
} from 'agora-rtc-sdk-ng'
import { Button } from '../ui/Button'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Maximize2, Minimize2, Share2, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import { toast } from 'react-hot-toast'
import { AGORA_CONFIG } from '../../lib/agora-config'

interface VideoCallProps {
  channelName: string
  token: string
  uid: number | string
  role: 'host' | 'audience'
  onLeave?: () => void
  className?: string
}

export default function VideoCall({ 
  channelName, 
  token, 
  uid, 
  role, 
  onLeave,
  className = ''
}: VideoCallProps) {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<{ uid: UID; hasVideo: boolean; hasAudio: boolean }[]>([])
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<{uid: UID, message: string, time: string}[]>([])
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenTrack, setScreenTrack] = useState<any>(null)

  const localPlayerRef = useRef<HTMLDivElement>(null)
  const remotePlayersRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const initAgora = async () => {
    try {
      setIsLoading(true)
      
      // Create Agora client
      const agoraClient = AgoraRTC.createClient({ 
        mode: AGORA_CONFIG.MODE, 
        codec: AGORA_CONFIG.CODEC 
      })
      
      // Handle remote user events
      agoraClient.on('user-published', async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType)
        
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack
          if (remoteVideoTrack) {
            setTimeout(() => {
              remoteVideoTrack.play(`remote-player-${user.uid}`)
            }, 100)
          }
        }
        
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack
          if (remoteAudioTrack) {
            remoteAudioTrack.play()
          }
        }
        
        // Update remote users list
        setRemoteUsers(prev => {
          const existing = prev.find(u => u.uid === user.uid)
          if (existing) {
            return prev.map(u => 
              u.uid === user.uid 
                ? { 
                    ...u, 
                    hasVideo: mediaType === 'video' || u.hasVideo,
                    hasAudio: mediaType === 'audio' || u.hasAudio
                  }
                : u
            )
          }
          return [...prev, { 
            uid: user.uid, 
            hasVideo: mediaType === 'video',
            hasAudio: mediaType === 'audio'
          }]
        })
      })

      agoraClient.on('user-unpublished', (user, mediaType) => {
        setRemoteUsers(prev => 
          prev.map(u => 
            u.uid === user.uid 
              ? { 
                  ...u, 
                  [mediaType === 'video' ? 'hasVideo' : 'hasAudio']: false 
                }
              : u
          )
        )
      })

      agoraClient.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
        toast.info(`User ${user.uid} left the class`)
      })

      setClient(agoraClient)
      
    } catch (error) {
      console.error('Error initializing Agora:', error)
      toast.error('Failed to initialize video call')
    } finally {
      setIsLoading(false)
    }
  }

  const joinChannel = async () => {
    if (!client) return

    try {
      // Use the provided token or generate a temporary one for testing
      const effectiveToken = token || 'test_token'
      
      // Join the channel
      await client.join(AGORA_CONFIG.APP_ID || AGORA_CONFIG.DEFAULT_APP_ID, channelName, effectiveToken, uid)
      
      if (role === 'host') {
        // Create local tracks for host
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        
        // Publish local tracks
        await client.publish([audioTrack, videoTrack])
        
        // Play local video
        if (localPlayerRef.current) {
          videoTrack.play(localPlayerRef.current)
        }
        
        setLocalVideoTrack(videoTrack)
        setLocalAudioTrack(audioTrack)
        
        // Add host to remote users list for UI
        setRemoteUsers(prev => [...prev, { 
          uid, 
          hasVideo: true, 
          hasAudio: true 
        }])
      }
      
      setIsJoined(true)
      toast.success(`Joined ${channelName} as ${role}`)
      
      // Send welcome message
      if (role === 'host') {
        const welcomeMsg = { uid, message: `Welcome to "${channelName}"!`, time: new Date().toLocaleTimeString() }
        setChatMessages(prev => [...prev, welcomeMsg])
      }
      
    } catch (error: any) {
      console.error('Failed to join channel:', error)
      
      // For development, fallback to test mode
      if (error.code === 'INVALID_PARAMS' && AGORA_CONFIG.APP_ID === 'test') {
        toast.warning('Using test mode. For production, get real Agora credentials.')
        setIsJoined(true) // Simulate joined state for UI testing
      } else {
        toast.error(error.message || 'Failed to join class')
      }
    }
  }

  const leaveChannel = async () => {
    try {
      // Stop screen sharing if active
      if (screenTrack) {
        await screenTrack.close()
        setScreenTrack(null)
        setIsScreenSharing(false)
      }
      
      // Stop and close local tracks
      if (localVideoTrack) {
        localVideoTrack.stop()
        localVideoTrack.close()
      }
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }
      
      // Leave channel
      if (client) {
        await client.leave()
      }
      
      // Reset state
      setLocalVideoTrack(null)
      setLocalAudioTrack(null)
      setRemoteUsers([])
      setIsJoined(false)
      
      toast.info('Left the class')
      
      if (onLeave) {
        onLeave()
      }
      
    } catch (error) {
      console.error('Error leaving channel:', error)
    }
  }

  const toggleAudio = async () => {
    if (localAudioTrack) {
      try {
        if (isAudioMuted) {
          await localAudioTrack.setMuted(false)
          toast.success('Microphone unmuted')
        } else {
          await localAudioTrack.setMuted(true)
          toast.info('Microphone muted')
        }
        setIsAudioMuted(!isAudioMuted)
      } catch (error) {
        console.error('Error toggling audio:', error)
      }
    }
  }

  const toggleVideo = async () => {
    if (localVideoTrack) {
      try {
        if (isVideoMuted) {
          await localVideoTrack.setMuted(false)
          toast.success('Camera turned on')
        } else {
          await localVideoTrack.setMuted(true)
          toast.info('Camera turned off')
        }
        setIsVideoMuted(!isVideoMuted)
      } catch (error) {
        console.error('Error toggling video:', error)
      }
    }
  }

  const startScreenShare = async () => {
    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: '1080p_1',
      })
      
      await client?.publish(screenTrack)
      setScreenTrack(screenTrack)
      setIsScreenSharing(true)
      toast.success('Started screen sharing')
    } catch (error: any) {
      console.error('Screen sharing error:', error)
      if (error.code === 'PERMISSION_DENIED') {
        toast.error('Screen sharing permission denied')
      } else if (error.code === 'NOT_SUPPORTED') {
        toast.error('Screen sharing not supported in this browser')
      } else {
        toast.error('Failed to start screen sharing')
      }
    }
  }

  const stopScreenShare = async () => {
    if (screenTrack) {
      await screenTrack.close()
      setScreenTrack(null)
      setIsScreenSharing(false)
      toast.info('Stopped screen sharing')
    }
  }

  const sendChatMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        uid,
        message: chatMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setChatMessages(prev => [...prev, newMessage])
      setChatMessage('')
      
      // Auto scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    }
  }

  useEffect(() => {
    initAgora()
    
    return () => {
      leaveChannel()
    }
  }, [])

  useEffect(() => {
    if (isJoined && client && localVideoTrack) {
      // Auto-join for testing
      setTimeout(() => {
        if (!isJoined) {
          joinChannel()
        }
      }, 1000)
    }
  }, [isJoined, client, localVideoTrack])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  if (isLoading) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Initializing video call...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-0 shadow-xl ${className}`}>
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row h-[600px]">
          {/* Main video area */}
          <div className="flex-1 flex flex-col">
            {/* Video header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">{channelName}</h3>
                <p className="text-sm text-gray-600">
                  {role === 'host' ? 'You are the host' : 'You are an audience member'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isJoined ? "default" : "secondary"}>
                  {isJoined ? 'Connected' : 'Disconnected'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Video container */}
            <div className="flex-1 relative bg-gray-900">
              {/* Local video (host only) */}
              {role === 'host' && (
                <div className="absolute top-4 right-4 w-48 h-32 z-10 rounded-lg overflow-hidden shadow-2xl border-2 border-white">
                  <div ref={localPlayerRef} className="w-full h-full bg-gray-800" />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    You {isVideoMuted ? '(Camera Off)' : ''}
                  </div>
                </div>
              )}

              {/* Remote videos grid */}
              <div ref={remotePlayersRef} className="w-full h-full p-4">
                {remoteUsers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">
                        {role === 'host' ? 'Waiting for students to join...' : 'Waiting for host to start...'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Share this link with others to join
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                    {remoteUsers.map(user => (
                      <div 
                        key={user.uid.toString()} 
                        className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video"
                      >
                        <div 
                          id={`remote-player-${user.uid}`}
                          className="w-full h-full"
                        />
                        {!user.hasVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-10 h-10 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          User {user.uid} 
                          {!user.hasVideo && ' (Camera Off)'}
                          {!user.hasAudio && ' (Mic Off)'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-2xl">
                  {/* Audio control */}
                  <Button
                    variant={isAudioMuted ? "destructive" : "default"}
                    size="lg"
                    className="rounded-full w-12 h-12 p-0"
                    onClick={toggleAudio}
                    disabled={role !== 'host'}
                    title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isAudioMuted ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                  
                  {/* Video control */}
                  <Button
                    variant={isVideoMuted ? "destructive" : "default"}
                    size="lg"
                    className="rounded-full w-12 h-12 p-0"
                    onClick={toggleVideo}
                    disabled={role !== 'host'}
                    title={isVideoMuted ? 'Turn camera on' : 'Turn camera off'}
                  >
                    {isVideoMuted ? (
                      <VideoOff className="w-5 h-5" />
                    ) : (
                      <Video className="w-5 h-5" />
                    )}
                  </Button>
                  
                  {/* Screen share */}
                  {role === 'host' && (
                    <Button
                      variant={isScreenSharing ? "default" : "outline"}
                      size="lg"
                      className="rounded-full w-12 h-12 p-0 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                      onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                      title={isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  )}
                  
                  {/* Leave button */}
                  <Button
                    variant="destructive"
                    size="lg"
                    className="rounded-full w-12 h-12 p-0"
                    onClick={leaveChannel}
                    title="Leave class"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Chat and Participants */}
          <div className="lg:w-80 border-l">
            <div className="flex border-b">
              <button className="flex-1 py-3 text-center font-medium text-gray-700 border-b-2 border-indigo-600">
                Participants ({remoteUsers.length + 1})
              </button>
              <button className="flex-1 py-3 text-center font-medium text-gray-600 hover:text-gray-900">
                Chat
              </button>
            </div>
            
            <div className="p-4">
              {/* Participants list */}
              <div className="space-y-3">
                {/* Host */}
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-white">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">You (Host)</p>
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        Host
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={isAudioMuted ? "secondary" : "default"} size="sm">
                        {isAudioMuted ? 'Mic Off' : 'Mic On'}
                      </Badge>
                      <Badge variant={isVideoMuted ? "secondary" : "default"} size="sm">
                        {isVideoMuted ? 'Cam Off' : 'Cam On'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Remote participants */}
                {remoteUsers.map(user => (
                  <div key={user.uid.toString()} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">User {user.uid}</p>
                        <Badge variant="outline">Student</Badge>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={user.hasAudio ? "default" : "secondary"} size="sm">
                          {user.hasAudio ? 'Mic On' : 'Mic Off'}
                        </Badge>
                        <Badge variant={user.hasVideo ? "default" : "secondary"} size="sm">
                          {user.hasVideo ? 'Cam On' : 'Cam Off'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Chat (collapsed by default) */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Quick Chat</h4>
                <div 
                  ref={chatContainerRef}
                  className="h-48 overflow-y-auto mb-3 space-y-3 p-2 bg-gray-50 rounded-lg"
                >
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.uid === uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.uid === uid ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'bg-white border'}`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.uid === uid ? 'text-indigo-100' : 'text-gray-500'}`}>
                          {msg.time} {msg.uid === uid ? '(You)' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <Button
                    onClick={sendChatMessage}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}