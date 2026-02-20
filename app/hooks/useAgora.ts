// hooks/useAgora.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { agoraService, RemoteUser } from '../utils/agora';
import { agoraApiService } from '../services/agoraApi';
import { toast } from 'react-hot-toast';

interface UseAgoraOptions {
    appId: string;
    channel?: string;
    uid?: string | number;
    role?: 'host' | 'audience';
    autoJoin?: boolean;
}

export const useAgora = (options: UseAgoraOptions) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [connectionState, setConnectionState] = useState<string>('');
    
    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoContainerRef = useRef<HTMLDivElement>(null);
    
    // Initialize Agora
    const initialize = useCallback(async () => {
        try {
            agoraService.initialize();
            setIsInitialized(true);
            
            // Setup event listeners
            agoraService.on('userJoined', (user) => {
                setRemoteUsers(prev => [...prev, user]);
                toast.success(`User ${user.uid} joined`);
            });
            
            agoraService.on('userLeft', (uid) => {
                setRemoteUsers(prev => prev.filter(u => u.uid !== uid));
                toast.info(`User ${uid} left`);
            });
            
            agoraService.on('userPublished', (user) => {
                setRemoteUsers(prev => 
                    prev.map(u => u.uid === user.uid ? user : u)
                );
            });
            
            agoraService.on('userUnpublished', (uid, mediaType) => {
                setRemoteUsers(prev => 
                    prev.map(u => {
                        if (u.uid === uid) {
                            if (mediaType === 'video') {
                                return { ...u, hasVideo: false };
                            }
                            if (mediaType === 'audio') {
                                return { ...u, hasAudio: false };
                            }
                        }
                        return u;
                    })
                );
            });
            
            agoraService.on('connectionStateChange', (state) => {
                setConnectionState(state);
            });
            
        } catch (error) {
            console.error('Failed to initialize Agora:', error);
            toast.error('Failed to initialize video service');
        }
    }, []);
    
    // Join channel
    const joinChannel = useCallback(async (
        channel: string,
        uid: string | number,
        role: 'host' | 'audience' = 'host'
    ) => {
        try {
            // Get token from backend
            const tokenData = await agoraApiService.generateToken(
                channel,
                uid,
                role === 'host' ? 'publisher' : 'subscriber'
            );
            
            if (!tokenData.success) {
                throw new Error('Failed to get token');
            }
            
            // Join channel
            const success = await agoraService.joinChannel({
                appId: tokenData.appId,
                token: tokenData.token,
                channel,
                uid: tokenData.uid,
                role
            });
            
            if (success) {
                setIsJoined(true);
                
                // Play local video
                if (localVideoRef.current) {
                    agoraService.playLocalVideo(localVideoRef.current);
                }
                
                toast.success('Joined channel successfully');
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Failed to join channel:', error);
            toast.error('Failed to join video channel');
            return false;
        }
    }, []);
    
    // Join class channel
    const joinClassChannel = useCallback(async (
        classId: number,
        channel: string,
        role: 'instructor' | 'student'
    ) => {
        try {
            // Get class token from backend
            const tokenData = await agoraApiService.generateClassToken(
                classId,
                channel,
                role
            );
            
            if (!tokenData.success) {
                throw new Error('Failed to get class token');
            }
            
            // Join channel
            const success = await agoraService.joinChannel({
                appId: tokenData.appId,
                token: tokenData.token,
                channel,
                uid: tokenData.uid,
                role: role === 'instructor' ? 'host' : 'audience'
            });
            
            if (success) {
                setIsJoined(true);
                
                // Play local video
                if (localVideoRef.current) {
                    agoraService.playLocalVideo(localVideoRef.current);
                }
                
                toast.success(`Joined class as ${role}`);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Failed to join class channel:', error);
            toast.error('Failed to join class');
            return false;
        }
    }, []);
    
    // Leave channel
    const leaveChannel = useCallback(async () => {
        try {
            await agoraService.leaveChannel();
            setIsJoined(false);
            setRemoteUsers([]);
            setIsAudioMuted(false);
            setIsVideoMuted(false);
            setIsScreenSharing(false);
            
            toast.success('Left channel');
            
        } catch (error) {
            console.error('Failed to leave channel:', error);
            toast.error('Failed to leave channel');
        }
    }, []);
    
    // Toggle audio
    const toggleAudio = useCallback(async () => {
        try {
            const newState = await agoraService.toggleAudio();
            setIsAudioMuted(!newState);
            toast.success(newState ? 'Microphone unmuted' : 'Microphone muted');
            
        } catch (error) {
            console.error('Failed to toggle audio:', error);
            toast.error('Failed to toggle microphone');
        }
    }, []);
    
    // Toggle video
    const toggleVideo = useCallback(async () => {
        try {
            const newState = await agoraService.toggleVideo();
            setIsVideoMuted(!newState);
            toast.success(newState ? 'Camera turned on' : 'Camera turned off');
            
        } catch (error) {
            console.error('Failed to toggle video:', error);
            toast.error('Failed to toggle camera');
        }
    }, []);
    
    // Toggle screen share
    const toggleScreenShare = useCallback(async () => {
        try {
            if (!isScreenSharing) {
                await agoraService.startScreenShare();
                setIsScreenSharing(true);
                toast.success('Screen sharing started');
            } else {
                await agoraService.stopScreenShare();
                setIsScreenSharing(false);
                toast.success('Screen sharing stopped');
            }
        } catch (error) {
            console.error('Failed to toggle screen share:', error);
            toast.error('Failed to toggle screen sharing');
        }
    }, [isScreenSharing]);
    
    // Initialize on mount
    useEffect(() => {
        if (!isInitialized) {
            initialize();
        }
        
        // Cleanup on unmount
        return () => {
            if (isJoined) {
                leaveChannel();
            }
            agoraService.destroy();
        };
    }, [isInitialized, isJoined, initialize, leaveChannel]);
    
    // Auto-join if enabled
    useEffect(() => {
        if (options.autoJoin && options.channel && options.uid) {
            joinChannel(options.channel, options.uid, options.role);
        }
    }, [options.autoJoin, options.channel, options.uid, options.role, joinChannel]);
    
    return {
        // State
        isInitialized,
        isJoined,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        remoteUsers,
        connectionState,
        
        // Refs
        localVideoRef,
        remoteVideoContainerRef,
        
        // Methods
        initialize,
        joinChannel,
        joinClassChannel,
        leaveChannel,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        
        // Utility
        agoraService
    };
};