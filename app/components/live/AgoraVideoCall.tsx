'use client'

import { useEffect, useRef, useState } from 'react'
import { agoraService, useAgora } from '../../lib/api/agora'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, ScreenShare } from 'lucide-react'

interface AgoraVideoCallProps {
  channelName: string
  userId: string
  token: string
  isHost?: boolean
  onLeave?: () => void
  onError?: (error: any) => void
}

export default function AgoraVideoCall({
  channelName,
  userId,
  token,
  isHost = false,
  onLeave,
  onError,
}: AgoraVideoCallProps) {
  const [isJoined, setIsJoined] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [participants, setParticipants] = useState<string[]>([userId])
  const [messages, setMessages] = useState<Array<{ user: string; text: string; time: string }>>([])
  
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  
  const { joinChannel, leaveChannel } = useAgora()

  // Initialize Agora SDK
  useEffect(() => {
    const initAgora = async () => {
      try {
        const result = await joinChannel({
          appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
          channel: channelName,
          token,
          uid: userId,
        })

        if (result.success) {
          setIsJoined(true)
          console.log('Joined channel successfully:', result.connection)
        }
      } catch (error) {
        console.error('Error joining channel:', error)
        onError?.(error)
      }
    }

    if (channelName && token && userId) {
      initAgora()
    }

    return () => {
      // Cleanup on unmount
      if (isJoined) {
        leaveChannel({ channel: channelName, uid: userId })
      }
    }
  }, [channelName, token, userId])

  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted)
    // Implement actual audio mute logic with Agora SDK
  }

  const toggleVideo = () => {
    setIsVideoMuted(!isVideoMuted)
    // Implement actual video mute logic with Agora SDK
  }

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing)
    // Implement screen sharing logic
  }

  const handleLeave = async () => {
    try {
      await leaveChannel({ channel: channelName, uid: userId })
      setIsJoined(false)
      onLeave?.()
    } catch (error) {
      console.error('Error leaving channel:', error)
      onError?.(error)
    }
  }

  const sendMessage = (text: string) => {
    const newMessage = {
      user: userId,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, newMessage])
    // Implement actual messaging with Agora RTM
  }

  if (!isJoined) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white">Joining live class...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Video Container */}
      <div className="relative h-96 bg-black">
        {/* Remote Video */}
        <div ref={remoteVideoRef} className="absolute inset-0">
          {/* Remote video will be rendered here by Agora SDK */}
        </div>
        
        {/* Local Video (Picture-in-Picture) */}
        <div
          ref={localVideoRef}
          className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-blue-500"
        >
          {/* Local video will be rendered here */}
          {isVideoMuted && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-lg">
                    {userId.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-white text-sm">You</p>
              </div>
            </div>
          )}
        </div>

        {/* Participant Count */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center">
          <Users size={16} className="mr-2" />
          {participants.length} participants
        </div>

        {/* Screen Share Indicator */}
        {isScreenSharing && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm flex items-center">
            <ScreenShare size={16} className="mr-2" />
            Screen Sharing
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {/* Audio Control */}
            <button
              onClick={toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isAudioMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Video Control */}
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isVideoMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isScreenSharing ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <ScreenShare size={24} />
            </button>

            {/* Chat Toggle */}
            <button
              onClick={() => {/* Toggle chat */}}
              className="w-12 h-12 rounded-full bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center"
            >
              <MessageSquare size={24} />
            </button>
          </div>

          {/* Leave Call Button */}
          <button
            onClick={handleLeave}
            className="w-12 h-12 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>

      {/* Chat Panel (Collapsible) */}
      <div className="bg-gray-800 border-t border-gray-700 max-h-64 overflow-y-auto">
        <div className="p-4">
          <h4 className="text-white font-semibold mb-3">Chat</h4>
          
          {/* Messages */}
          <div className="space-y-3 mb-4">
            {messages.map((msg, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-blue-300 font-medium text-sm">
                    {msg.user === userId ? 'You' : `User ${msg.user}`}
                  </span>
                  <span className="text-gray-400 text-xs">{msg.time}</span>
                </div>
                <p className="text-white text-sm">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="flex">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  sendMessage(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}