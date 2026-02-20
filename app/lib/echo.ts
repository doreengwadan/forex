import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: any;
  }
}

export const getEcho = (token?: string) => {
  // Set Pusher on window only on the client
  if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
  }

  // Use Pusher broadcaster
  return new Echo({
    broadcaster: 'pusher',
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '2d1a6b94459df006a120', // fallback to hardcoded
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
    forceTLS: true,
    authEndpoint: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api') + '/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};