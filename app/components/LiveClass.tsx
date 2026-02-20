// components/LiveClass.tsx
import React, { useState, useEffect } from 'react';
import { useAgora } from '../hooks/useAgora';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { 
    Mic, 
    MicOff, 
    Video, 
    VideoOff, 
    Monitor, 
    MonitorOff,
    PhoneOff,
    Users,
    Share2
} from 'lucide-react';

interface LiveClassProps {
    classId: number;
    channelName: string;
    role: 'instructor' | 'student';
    className?: string;
    onLeave?: () => void;
}

export const LiveClass: React.FC<LiveClassProps> = ({
    classId,
    channelName,
    role,
    className,
    onLeave
}) => {
    const [isStarting, setIsStarting] = useState(false);
    
    const {
        isJoined,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        remoteUsers,
        localVideoRef,
        remoteVideoContainerRef,
        joinClassChannel,
        leaveChannel,
        toggleAudio,
        toggleVideo,
        toggleScreenShare
    } = useAgora({
        appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
        autoJoin: false
    });
    
    // Join class on mount
    useEffect(() => {
        const startClass = async () => {
            setIsStarting(true);
            await joinClassChannel(classId, channelName, role);
            setIsStarting(false);
        };
        
        startClass();
        
        return () => {
            if (isJoined) {
                leaveChannel();
            }
        };
    }, [classId, channelName, role, joinClassChannel, leaveChannel, isJoined]);
    
    const handleLeave = async () => {
        await leaveChannel();
        onLeave?.();
    };
    
    if (isStarting) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Joining class...</p>
                </div>
            </div>
        );
    }
    
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Live Class - {role === 'instructor' ? 'Instructor' : 'Student'}</span>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-normal">
                            {remoteUsers.length + 1} participants
                        </span>
                    </div>
                </CardTitle>
            </CardHeader>
            
            <CardContent>
                <div className="space-y-6">
                    {/* Video Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Local Video */}
                        <div className="lg:col-span-1">
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                                <div 
                                    ref={localVideoRef}
                                    className="w-full h-full"
                                />
                                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                                    You ({role})
                                </div>
                                {isVideoMuted && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                        <VideoOff className="w-12 h-12 text-gray-400" />
                                        <span className="text-white ml-2">Camera off</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Remote Videos */}
                        <div className="lg:col-span-2">
                            <div 
                                ref={remoteVideoContainerRef}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[200px]"
                            />
                            
                            {remoteUsers.length === 0 && (
                                <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">Waiting for others to join...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            variant={isAudioMuted ? "destructive" : "outline"}
                            size="lg"
                            onClick={toggleAudio}
                            className="rounded-full p-3"
                        >
                            {isAudioMuted ? (
                                <MicOff className="w-6 h-6" />
                            ) : (
                                <Mic className="w-6 h-6" />
                            )}
                        </Button>
                        
                        <Button
                            variant={isVideoMuted ? "destructive" : "outline"}
                            size="lg"
                            onClick={toggleVideo}
                            className="rounded-full p-3"
                        >
                            {isVideoMuted ? (
                                <VideoOff className="w-6 h-6" />
                            ) : (
                                <Video className="w-6 h-6" />
                            )}
                        </Button>
                        
                        {role === 'instructor' && (
                            <Button
                                variant={isScreenSharing ? "default" : "outline"}
                                size="lg"
                                onClick={toggleScreenShare}
                                className="rounded-full p-3 bg-orange-500 hover:bg-orange-600"
                            >
                                {isScreenSharing ? (
                                    <MonitorOff className="w-6 h-6" />
                                ) : (
                                    <Monitor className="w-6 h-6" />
                                )}
                            </Button>
                        )}
                        
                        <Button
                            variant="destructive"
                            size="lg"
                            onClick={handleLeave}
                            className="rounded-full p-3"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </Button>
                    </div>
                    
                    {/* Participants List */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Participants ({remoteUsers.length + 1})</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            <div className="flex items-center justify-between p-2 bg-white rounded">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">Y</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">You</p>
                                        <p className="text-sm text-gray-500">{role}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-sm">
                                        {isAudioMuted ? '🔇' : '🎤'}
                                    </span>
                                    <span className="text-sm">
                                        {isVideoMuted ? '📷❌' : '📹'}
                                    </span>
                                </div>
                            </div>
                            
                            {remoteUsers.map((user) => (
                                <div key={user.uid} className="flex items-center justify-between p-2 bg-white rounded">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                                {String(user.uid).slice(-2)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium">Student</p>
                                            <p className="text-sm text-gray-500">Student</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-sm">
                                            {user.hasAudio ? '🎤' : '🔇'}
                                        </span>
                                        <span className="text-sm">
                                            {user.hasVideo ? '📹' : '📷❌'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};