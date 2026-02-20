// services/agoraApi.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface TokenResponse {
    success: boolean;
    token: string;
    appId: string;
    channelName: string;
    uid: number | string;
    role?: string;
    expiresIn?: number;
}

export class AgoraApiService {
    private token: string | null = null;
    
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }
    
    // Generate token for channel
    async generateToken(
        channelName: string, 
        uid: string | number, 
        role: 'publisher' | 'subscriber' = 'publisher'
    ): Promise<TokenResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/agora/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    channelName,
                    uid,
                    role
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error generating Agora token:', error);
            throw error;
        }
    }
    
    // Generate token for class
    async generateClassToken(
        classId: number,
        channelName: string,
        role: 'instructor' | 'student'
    ): Promise<TokenResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/agora/token/class`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    classId,
                    channelName,
                    role
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error generating class token:', error);
            throw error;
        }
    }
    
    // Generate token for user with role
    async generateUserToken(
        channelName: string,
        role: 'publisher' | 'subscriber'
    ): Promise<TokenResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/agora/token/user`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    channelName,
                    role
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error generating user token:', error);
            throw error;
        }
    }
}

export const agoraApiService = new AgoraApiService();