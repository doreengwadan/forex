// utils/agora.ts
import AgoraRTC, { 
    IAgoraRTCClient, 
    ICameraVideoTrack, 
    IMicrophoneAudioTrack,
    ILocalVideoTrack,
    ILocalAudioTrack,
    UID,
    IAgoraRTCRemoteUser,
    ScreenVideoTrackInitConfig,
    ILocalVideoTrack
} from 'agora-rtc-sdk-ng';

export interface AgoraConfig {
    appId: string;
    token: string;
    channel: string;
    uid: UID;
    role?: 'host' | 'audience';
}

export interface RemoteUser {
    uid: UID;
    hasVideo: boolean;
    hasAudio: boolean;
    videoTrack?: ILocalVideoTrack;
    audioTrack?: ILocalAudioTrack;
}

export class AgoraService {
    private client: IAgoraRTCClient | null = null;
    private localVideoTrack: ILocalVideoTrack | null = null;
    private localAudioTrack: ILocalAudioTrack | null = null;
    private screenTrack: ILocalVideoTrack | null = null;
    private remoteUsers: Map<UID, RemoteUser> = new Map();
    
    private onUserJoined?: (user: RemoteUser) => void;
    private onUserLeft?: (uid: UID) => void;
    private onUserPublished?: (user: RemoteUser) => void;
    private onUserUnpublished?: (uid: UID, mediaType: 'video' | 'audio') => void;
    private onConnectionStateChange?: (state: string) => void;
    
    constructor() {
        // Initialize with default config
        AgoraRTC.setLogLevel(2); // 0: DEBUG, 1: INFO, 2: WARNING, 3: ERROR, 4: NONE
    }
    
    // Initialize Agora client
    initialize(config: Partial<AgoraConfig> = {}) {
        this.client = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8'
        });
        
        // Setup event listeners
        this.setupEventListeners();
        
        return this.client;
    }
    
    // Setup event listeners
    private setupEventListeners() {
        if (!this.client) return;
        
        this.client.on('user-published', async (user, mediaType) => {
            await this.client!.subscribe(user, mediaType);
            
            const remoteUser = this.remoteUsers.get(user.uid) || {
                uid: user.uid,
                hasVideo: false,
                hasAudio: false
            };
            
            if (mediaType === 'video') {
                remoteUser.hasVideo = true;
                remoteUser.videoTrack = user.videoTrack as ILocalVideoTrack;
            }
            
            if (mediaType === 'audio') {
                remoteUser.hasAudio = true;
                remoteUser.audioTrack = user.audioTrack as ILocalAudioTrack;
            }
            
            this.remoteUsers.set(user.uid, remoteUser);
            this.onUserPublished?.(remoteUser);
        });
        
        this.client.on('user-unpublished', (user, mediaType) => {
            const remoteUser = this.remoteUsers.get(user.uid);
            if (remoteUser) {
                if (mediaType === 'video') {
                    remoteUser.hasVideo = false;
                    remoteUser.videoTrack = undefined;
                }
                if (mediaType === 'audio') {
                    remoteUser.hasAudio = false;
                    remoteUser.audioTrack = undefined;
                }
                
                this.remoteUsers.set(user.uid, remoteUser);
                this.onUserUnpublished?.(user.uid, mediaType);
            }
        });
        
        this.client.on('user-joined', (user) => {
            const remoteUser = {
                uid: user.uid,
                hasVideo: false,
                hasAudio: false
            };
            this.remoteUsers.set(user.uid, remoteUser);
            this.onUserJoined?.(remoteUser);
        });
        
        this.client.on('user-left', (user) => {
            this.remoteUsers.delete(user.uid);
            this.onUserLeft?.(user.uid);
        });
        
        this.client.on('connection-state-change', (curState, prevState) => {
            this.onConnectionStateChange?.(curState);
        });
    }
    
    // Join channel
    async joinChannel(config: AgoraConfig): Promise<boolean> {
        try {
            if (!this.client) {
                this.initialize();
            }
            
            await this.client!.join(
                config.appId,
                config.channel,
                config.token,
                config.uid
            );
            
            // Create local tracks
            this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
            
            // Publish local tracks
            await this.client!.publish([this.localAudioTrack, this.localVideoTrack]);
            
            return true;
        } catch (error) {
            console.error('Failed to join channel:', error);
            return false;
        }
    }
    
    // Leave channel
    async leaveChannel(): Promise<void> {
        try {
            // Unpublish and stop local tracks
            if (this.localVideoTrack) {
                this.localVideoTrack.stop();
                this.localVideoTrack.close();
            }
            if (this.localAudioTrack) {
                this.localAudioTrack.stop();
                this.localAudioTrack.close();
            }
            if (this.screenTrack) {
                this.screenTrack.stop();
                this.screenTrack.close();
            }
            
            // Leave channel
            if (this.client) {
                await this.client.leave();
            }
            
            // Clear tracks
            this.localVideoTrack = null;
            this.localAudioTrack = null;
            this.screenTrack = null;
            this.remoteUsers.clear();
            
        } catch (error) {
            console.error('Error leaving channel:', error);
        }
    }
    
    // Toggle audio
    async toggleAudio(enabled?: boolean): Promise<boolean> {
        if (!this.localAudioTrack) return false;
        
        const newState = enabled !== undefined ? enabled : !this.localAudioTrack.enabled;
        await this.localAudioTrack.setEnabled(newState);
        return newState;
    }
    
    // Toggle video
    async toggleVideo(enabled?: boolean): Promise<boolean> {
        if (!this.localVideoTrack) return false;
        
        const newState = enabled !== undefined ? enabled : !this.localVideoTrack.enabled;
        await this.localVideoTrack.setEnabled(newState);
        return newState;
    }
    
    // Start screen sharing
    async startScreenShare(config?: ScreenVideoTrackInitConfig): Promise<boolean> {
        try {
            // Stop camera if sharing
            if (this.localVideoTrack) {
                await this.client!.unpublish(this.localVideoTrack);
            }
            
            // Create screen track
            this.screenTrack = await AgoraRTC.createScreenVideoTrack(config || {
                encoderConfig: '1080p_1'
            });
            
            // Publish screen track
            await this.client!.publish(this.screenTrack);
            
            return true;
        } catch (error) {
            console.error('Screen share failed:', error);
            return false;
        }
    }
    
    // Stop screen sharing
    async stopScreenShare(): Promise<boolean> {
        try {
            if (this.screenTrack) {
                await this.client!.unpublish(this.screenTrack);
                this.screenTrack.stop();
                this.screenTrack.close();
                this.screenTrack = null;
            }
            
            // Restart camera
            if (this.localVideoTrack) {
                await this.client!.publish(this.localVideoTrack);
            }
            
            return true;
        } catch (error) {
            console.error('Stop screen share failed:', error);
            return false;
        }
    }
    
    // Get remote users
    getRemoteUsers(): RemoteUser[] {
        return Array.from(this.remoteUsers.values());
    }
    
    // Play local video in element
    playLocalVideo(element: HTMLElement | string): void {
        if (this.localVideoTrack) {
            this.localVideoTrack.play(element);
        }
    }
    
    // Play remote video in element
    playRemoteVideo(uid: UID, element: HTMLElement | string): void {
        const user = this.remoteUsers.get(uid);
        if (user?.videoTrack) {
            user.videoTrack.play(element);
        }
    }
    
    // Set event callbacks
    on(event: string, callback: Function): void {
        switch (event) {
            case 'userJoined':
                this.onUserJoined = callback as (user: RemoteUser) => void;
                break;
            case 'userLeft':
                this.onUserLeft = callback as (uid: UID) => void;
                break;
            case 'userPublished':
                this.onUserPublished = callback as (user: RemoteUser) => void;
                break;
            case 'userUnpublished':
                this.onUserUnpublished = callback as (uid: UID, mediaType: 'video' | 'audio') => void;
                break;
            case 'connectionStateChange':
                this.onConnectionStateChange = callback as (state: string) => void;
                break;
        }
    }
    
    // Cleanup
    destroy(): void {
        this.leaveChannel();
        this.client = null;
        this.remoteUsers.clear();
    }
}

// Singleton instance
export const agoraService = new AgoraService();