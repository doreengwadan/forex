// Create a new file: config/agora.config.ts
export const AGORA_CONFIG = {
    APP_ID: '3af2b8eaa7fe4784ad1ce648ae275218', // e.g., '12345678901234567890123456789012'
    TOKEN_EXPIRY: 3600, // 1 hour
    CHANNEL_PREFIX: 'trading-class-',


    ROLE_PUBLISHER: 1, // Host/Instructor
    ROLE_SUBSCRIBER: 2, // Student/Audience
  
    
  // Codec
  CODEC: 'h264',
  
  // Mode
  MODE: 'rtc', // Real-t


  };
  
  // Or as environment variables
  export const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
