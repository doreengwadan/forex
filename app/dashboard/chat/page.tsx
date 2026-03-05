'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Video,
  Phone,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Star,
  Calendar,
  Wifi,
  WifiOff,
  ArrowLeft,
  X,
  Download,
  Eye,
  File,
  Image as ImageIcon,
  FileText,
  Music,
  Video as VideoIcon,
  Archive
} from 'lucide-react';
import { getEcho } from '../../lib/echo';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';

// ... interfaces Mentor, Message, Conversation (unchanged) ...
interface Mentor {
  id: number;
  name: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  rating: number | string | null;
  expertise: string[];
  total_sessions: number;
  unread_count: number;
  profile_image?: string;
  last_seen?: string;
}

interface Message {
  id: number | string;
  sender: 'user' | 'mentor';
  content: string;
  time: string;
  date: string;
  timestamp: number;
  read: boolean;
  delivered: boolean;
  sent: boolean;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
}

interface Conversation {
  id: number;
  mentor: Mentor;
  last_message: {
    content: string;
    time: string;
    sender_type: 'user' | 'mentor';
    delivered?: boolean;
    read?: boolean;
    attachments?: Attachment[];
  } | null;
  unread_count: number;
  has_unread: boolean;
  last_message_at: string;
  is_typing?: boolean;
}

// Demo mentor responses for testing
const MENTOR_RESPONSES = [
  "Thanks for your message! I'll help you with that.",
  "Great question! Let me explain...",
  "I understand your concern. Here's what I think.",
  "That's a good point. Have you considered...",
  "Based on my experience, I'd recommend...",
  "Let me share some insights about that.",
  "I can definitely help you with trading strategies.",
  "Thanks for reaching out. How can I assist you today?",
  "That's an interesting perspective. Let me add...",
  "I appreciate your question. Here's my advice...",
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function ChatPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'conversations' | 'mentors'>('conversations');

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);

  // Demo mode fallback
  const [useDemoMode, setUseDemoMode] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Echo instance reference
  const echoRef = useRef<any>(null);

  // Message pagination
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesPerPage = 20;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || '';
    }
    return '';
  };

  // Get user ID from token
  const getUserId = () => {
    const token = getToken();
    if (!token) return 1;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.user_id || payload.id || 1;
    } catch {
      return 1;
    }
  };

  // Format rating
  const formatRating = (rating: number | string | null): string => {
    if (rating === null || rating === undefined) return '4.5';
    const numRating = typeof rating === 'string' ? parseFloat(rating) : Number(rating);
    return isNaN(numRating) ? '4.5' : Math.max(0, Math.min(numRating, 5)).toFixed(1);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (fileType.startsWith('video/')) return <VideoIcon className="w-8 h-8 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-8 h-8 text-yellow-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  // --- Echo Initialization ---
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        echoRef.current = getEcho(token);
        setUseDemoMode(false);
      } catch (err) {
        console.error('Failed to initialize Echo, switching to demo mode', err);
        setUseDemoMode(true);
      }
    } else {
      // No token -> demo mode
      setUseDemoMode(true);
    }

    // Cleanup Echo on unmount
    return () => {
      if (echoRef.current) {
        echoRef.current.disconnect();
      }
    };
  }, []);

  // --- Subscribe to selected conversation channel ---
  useEffect(() => {
    if (!selectedConversation || useDemoMode || !echoRef.current) return;

    const channel = echoRef.current.private(`chat.${selectedConversation.id}`);

    // Listen for new messages
    channel.listen('.NewMessage', (e: any) => {
      handleNewMessage(e.message);
    });

    // Listen for typing whispers
    channel.listenForWhisper('typing', (e: { typing: boolean }) => {
      setSelectedConversation((prev) =>
        prev ? { ...prev, is_typing: e.typing } : null
      );
    });

    // Listen for read receipts (if implemented)
    channel.listen('.MessageRead', (e: { message_id: number }) => {
      handleMessageRead(e.message_id);
    });

    return () => {
      echoRef.current?.leave(`chat.${selectedConversation.id}`);
    };
  }, [selectedConversation, useDemoMode]);

  // --- WebSocket message handlers ---
  const handleNewMessage = (message: any) => {
    if (selectedConversation && message.conversation_id === selectedConversation.id) {
      const newMessage: Message = {
        id: message.id,
        sender: message.sender_id === getUserId() ? 'user' : 'mentor',
        content: message.content,
        time: new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        date: new Date(message.created_at).toLocaleDateString(),
        timestamp: new Date(message.created_at).getTime(),
        read: false,
        delivered: true,
        sent: true,
        attachments: message.attachments || []
      };

      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();

      // Mark as read
      if (message.sender_id !== getUserId()) {
        sendReadReceipt(message.id);
      }
    }

    // Update conversation list
    updateConversationList(message);
  };

  const handleTypingStatus = (conversationId: number, isTyping: boolean) => {
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation((prev) => (prev ? { ...prev, is_typing: isTyping } : null));
    }
  };

  const handleMessageRead = (messageId: number) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
    );
  };

  // Send typing status via Echo whisper
  const sendTypingStatus = (isTyping: boolean) => {
    if (!selectedConversation) return;

    if (useDemoMode) {
      // Demo mode simulation
      if (isTyping && message.length > 0) {
        setSelectedConversation((prev) => (prev ? { ...prev, is_typing: true } : null));
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setSelectedConversation((prev) => (prev ? { ...prev, is_typing: false } : null));
        }, 2000);
      }
    } else if (echoRef.current) {
      echoRef.current
        .private(`chat.${selectedConversation.id}`)
        .whisper('typing', { typing: isTyping });
    }
  };

  // Send read receipt via Echo whisper (or you could call an API)
  const sendReadReceipt = (messageId: number) => {
    if (!selectedConversation || useDemoMode || !echoRef.current) return;
    echoRef.current
      .private(`chat.${selectedConversation.id}`)
      .whisper('read', { message_id: messageId });
  };

  // Update conversation list (same as before)
  const updateConversationList = (message: any) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === message.conversation_id);
      if (index === -1) return prev;

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        last_message: {
          content: message.content,
          time: new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          sender_type: message.sender_id === getUserId() ? 'user' : 'mentor',
          delivered: true,
          read: false,
          attachments: message.attachments || []
        },
        last_message_at: message.created_at,
        unread_count:
          message.sender_id !== getUserId()
            ? (updated[index].unread_count || 0) + 1
            : updated[index].unread_count,
      };

      // Move to top
      const [moved] = updated.splice(index, 1);
      return [moved, ...updated];
    });
  };

  // Demo mode mentor response
  const simulateMentorResponse = (userMessage: string) => {
    setTimeout(() => {
      const randomResponse =
        MENTOR_RESPONSES[Math.floor(Math.random() * MENTOR_RESPONSES.length)];

      const mentorMessage: Message = {
        id: `mentor-${Date.now()}-${Math.random()}`,
        sender: 'mentor',
        content: randomResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        read: false,
        delivered: true,
        sent: true,
      };

      setMessages((prev) => [...prev, mentorMessage]);

      if (selectedConversation) {
        updateConversationList({
          conversation_id: selectedConversation.id,
          content: randomResponse,
          created_at: new Date().toISOString(),
          sender_id: selectedConversation.mentor.id,
        });
      }

      scrollToBottom();
    }, 2000);
  };

  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle typing input
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingStatus(true);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1000);
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject: any) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadingFiles((prev) => [...prev, ...files]);
    setShowAttachmentMenu(false);
    
    // In demo mode, simulate upload
    if (useDemoMode) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const attachment: Attachment = {
            id: `file-${Date.now()}-${Math.random()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            url: reader.result as string,
            thumbnail: file.type.startsWith('image/') ? reader.result as string : undefined
          };
          
          // Add attachment to message
          const newMessage: Message = {
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: 'user',
            content: '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            read: false,
            delivered: true,
            sent: true,
            attachments: [attachment]
          };
          
          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom();
        };
        reader.readAsDataURL(file);
      });
      setUploadingFiles([]);
    }
  };

  // Upload files to server
  
  // Replace the existing uploadFiles function with this
const uploadFiles = async (files: File[]): Promise<any[]> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    const response = await fetch('http://localhost:8000/api/chat/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for multipart/form-data
      },
      body: formData,
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload files');
    }

    if (data.success && data.attachments) {
      return data.attachments.map((att: any) => att.url); // Return array of URLs
    }
    
    throw new Error(data.message || 'Upload failed');
  } catch (err) {
    console.error('Error uploading files:', err);
    throw err;
  }
};
  // Send message with attachments
  const sendMessageWithAttachments = async (content: string, attachments: File[]) => {
    if ((!content.trim() && attachments.length === 0) || !selectedConversation || isSending) return;

    setIsSending(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Create optimistic message with attachment previews
    const optimisticAttachments: Attachment[] = attachments.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    const newMessage: Message = {
      id: tempId,
      sender: 'user',
      content: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      read: false,
      delivered: false,
      sent: true,
      attachments: optimisticAttachments
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    setUploadingFiles([]);
    scrollToBottom();

    try {
      if (useDemoMode) {
        // Demo mode - simulate success
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) => 
              msg.id === tempId ? { ...msg, delivered: true, id: `msg-${Date.now()}` } : msg
            )
          );
          
          if (Math.random() > 0.5) {
            simulateMentorResponse(content || 'Thanks for the file!');
          }
        }, 1000);
        setIsSending(false);
        return;
      }

      // Real API call with attachments
      const uploadedAttachments = await uploadFiles(attachments);
      
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          mentor_id: selectedConversation.mentor.id,
          content: content,
          attachments: uploadedAttachments.map(a => a.id)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update optimistic message with real data
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { 
              ...msg, 
              id: data.message.id, 
              delivered: true,
              attachments: data.message.attachments || uploadedAttachments
            } : msg
          )
        );
        refreshConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, sent: false } : msg))
      );
    } finally {
      setIsSending(false);
    }
  };

  // Modified send message function
  const sendMessage = () => {
    sendMessageWithAttachments(message, uploadingFiles);
  };

  // --- API fetch functions (unchanged) ---
  const fetchMentors = async () => {
    if (useDemoMode) {
      return [
        {
          id: 1,
          name: 'John Smith',
          role: 'Senior Trading Mentor',
          status: 'online',
          rating: 4.8,
          expertise: ['Stocks', 'Options', 'Technical Analysis'],
          total_sessions: 156,
          unread_count: 0,
          profile_image: 'https://i.pravatar.cc/150?img=1'
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          role: 'Forex Specialist',
          status: 'away',
          rating: 4.9,
          expertise: ['Forex', 'Currency Trading', 'Risk Management'],
          total_sessions: 203,
          unread_count: 2,
          profile_image: 'https://i.pravatar.cc/150?img=2'
        },
        {
          id: 3,
          name: 'Michael Chen',
          role: 'Crypto Expert',
          status: 'online',
          rating: 4.7,
          expertise: ['Cryptocurrency', 'Blockchain', 'DeFi'],
          total_sessions: 98,
          unread_count: 0,
          profile_image: 'https://i.pravatar.cc/150?img=3'
        },
      ];
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/chat/mentors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        return data.mentors || [];
      }
      return [];
    } catch {
      return [];
    }
  };

  const fetchConversations = async () => {
    if (useDemoMode) {
      const mentors = await fetchMentors();
      return mentors.slice(0, 2).map((mentor, index) => ({
        id: index + 1,
        mentor,
        last_message: {
          content: index === 0 ? 'Hi! How can I help you with trading today?' : 'Did you see the market analysis I sent?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender_type: index === 0 ? 'mentor' : 'user',
          delivered: true,
          read: index !== 1,
        },
        unread_count: index === 1 ? 2 : 0,
        has_unread: index === 1,
        last_message_at: new Date().toISOString(),
      }));
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        return data.conversations || [];
      }
      return [];
    } catch {
      return [];
    }
  };

  const fetchMessages = async (conversationId: number) => {
    if (useDemoMode) {
      return {
        messages: [
          {
            id: 1,
            sender: 'mentor',
            content: "Hi there! I'm your trading mentor. How can I help you today?",
            time: new Date(Date.now() - 3600000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now() - 3600000,
            read: true,
            delivered: true,
            sent: true,
          },
          {
            id: 2,
            sender: 'user',
            content: "I'd like to learn more about options trading",
            time: new Date(Date.now() - 1800000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now() - 1800000,
            read: true,
            delivered: true,
            sent: true,
          },
          {
            id: 3,
            sender: 'mentor',
            content: "Great choice! Options trading can be very rewarding. Let me share some resources with you.",
            time: new Date(Date.now() - 1700000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            date: new Date().toLocaleDateString(),
            timestamp: Date.now() - 1700000,
            read: true,
            delivered: true,
            sent: true,
          },
        ],
        pagination: { hasMore: false },
      };
    }

    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/messages?page=1&limit=${messagesPerPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        return { messages: data.messages || [], pagination: data.pagination };
      }
      return { messages: [], pagination: null };
    } catch {
      return { messages: [], pagination: null };
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setIsLoading(true);

    try {
      const data = await fetchMessages(conversation.id);
      setMessages(data.messages);
      setHasMoreMessages(data.pagination?.hasMore || false);

      if (conversation.unread_count > 0) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversation.id ? { ...c, unread_count: 0, has_unread: false } : c
          )
        );
      }

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  };

  const startNewConversation = async (mentorId: number) => {
    const existing = conversations.find((c) => c.mentor.id === mentorId);
    if (existing) {
      selectConversation(existing);
      setActiveTab('conversations');
      return;
    }

    const mentor = mentors.find((m) => m.id === mentorId);
    if (!mentor) return;

    const newConversation: Conversation = {
      id: Date.now(),
      mentor,
      last_message: null,
      unread_count: 0,
      has_unread: false,
      last_message_at: new Date().toISOString(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    selectConversation(newConversation);
    setActiveTab('conversations');
  };

  const refreshConversations = async () => {
    setIsLoading(true);
    try {
      const [mentorsData, conversationsData] = await Promise.all([
        fetchMentors(),
        fetchConversations(),
      ]);
      setMentors(mentorsData);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    refreshConversations();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    messages.forEach((msg) => {
      if (!groups[msg.date]) groups[msg.date] = [];
      groups[msg.date].push(msg);
    });
    return groups;
  };

  const formatDateDisplay = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusDot = (status: string) => {
    const colors = {
      online: 'bg-emerald-500',
      away: 'bg-amber-500',
      offline: 'bg-gray-400',
    };
    return (
      <div
        className={`w-2.5 h-2.5 ${colors[status as keyof typeof colors]} rounded-full ring-2 ring-white dark:ring-gray-800`}
      />
    );
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mentor.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMentors = mentors
    .filter((m) => !conversations.some((c) => c.mentor.id === m.id))
    .filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.expertise?.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  // Attachment preview component
  const AttachmentPreview = ({ attachment }: { attachment: Attachment }) => {
    const [isImage, setIsImage] = useState(attachment.type?.startsWith('image/'));
    
    return (
      <div className="relative group">
        {isImage ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer" onClick={() => {
            setSelectedAttachment(attachment);
            setShowAttachmentPreview(true);
          }}>
            <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
              <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : (
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer" onClick={() => {
            setSelectedAttachment(attachment);
            setShowAttachmentPreview(true);
          }}>
            {getFileIcon(attachment.type)}
            <span className="text-xs truncate w-full text-center mt-1">{attachment.name.split('.').pop()}</span>
          </div>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full"
          onClick={() => {
            setUploadingFiles(prev => prev.filter(f => f.name !== attachment.name));
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  // Message attachments component
  const MessageAttachments = ({ attachments }: { attachments: Attachment[] }) => {
    const [showAll, setShowAll] = useState(false);
    const displayAttachments = showAll ? attachments : attachments.slice(0, 4);
    
    return (
      <div className="mt-2 space-y-2">
        <div className="grid grid-cols-4 gap-1">
          {displayAttachments.map((attachment, index) => (
            <div
              key={attachment.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => {
                setSelectedAttachment(attachment);
                setShowAttachmentPreview(true);
              }}
            >
              {attachment.type?.startsWith('image/') ? (
                <img
                  src={attachment.thumbnail || attachment.url}
                  alt={attachment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center p-2">
                  {getFileIcon(attachment.type)}
                  <span className="text-xs truncate w-full text-center mt-1">{attachment.name}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
        {attachments.length > 4 && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowAll(true)}
          >
            +{attachments.length - 4} more attachments
          </Button>
        )}
      </div>
    );
  };

  // Attachment preview modal
  const AttachmentPreviewModal = ({ attachment, onClose }: { attachment: Attachment; onClose: () => void }) => {
    const isImage = attachment.type?.startsWith('image/');
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon"
            variant="ghost"
            className="absolute -top-12 right-0 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          
          {isImage ? (
            <img src={attachment.url} alt={attachment.name} className="max-w-full max-h-[80vh] object-contain" />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md">
              <div className="flex items-center justify-center mb-4">
                {getFileIcon(attachment.type)}
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">{attachment.name}</h3>
              <p className="text-sm text-gray-500 text-center mb-4">{formatFileSize(attachment.size)}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = attachment.url;
                    a.download = attachment.name;
                    a.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading && !selectedConversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e5ddd5] dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mentor Chat
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {useDemoMode ? 'Demo Mode - Messages auto-respond' : 'Connect with expert trading mentors'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <Badge className={useDemoMode ? 'bg-amber-500' : 'bg-emerald-500'}>
              {useDemoMode ? (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Demo Mode
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Chat Container */}
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Sidebar Card */}
          <Card
            className={`
              border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
              flex flex-col overflow-hidden
              lg:col-span-4
              ${isMobile && selectedConversation ? 'hidden' : 'block'}
            `}
          >
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-lg">
                  {activeTab === 'conversations' ? 'Chats' : 'Available Mentors'}
                </CardTitle>
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('conversations')}
                    className={`px-3 py-1.5 text-sm transition-all ${
                      activeTab === 'conversations' 
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Chats
                    {conversations.some(c => c.unread_count > 0) && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {conversations.reduce((sum, c) => sum + c.unread_count, 0)}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('mentors')}
                    className={`px-3 py-1.5 text-sm transition-all ${
                      activeTab === 'mentors' 
                        ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Mentors
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={`Search ${activeTab === 'conversations' ? 'chats' : 'mentors'}...`}
                  className="pl-9 bg-gray-50 dark:bg-gray-700 border-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-y-auto">
              {activeTab === 'conversations' ? (
                filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No chats yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Start a conversation with a mentor</p>
                    <Button onClick={() => setActiveTab('mentors')} size="sm">
                      Browse Mentors
                    </Button>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                            {conversation.mentor.profile_image ? (
                              <img 
                                src={conversation.mentor.profile_image.startsWith('http') 
                                  ? conversation.mentor.profile_image 
                                  : `${API_BASE_URL.replace('/api', '')}/storage/${conversation.mentor.profile_image}`} 
                                alt="" 
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"><User class="w-6 h-6 text-white" /></div>';
                                }}
                              />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1">
                            {getStatusDot(conversation.mentor.status)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {conversation.mentor.name}
                            </h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {conversation.last_message?.time}
                            </span>
                          </div>
                          
                          {conversation.is_typing ? (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 italic">typing...</p>
                          ) : (
                            <div className="flex items-center gap-1">
                              {conversation.last_message?.sender_type === 'user' && (
                                conversation.last_message.read ? (
                                  <CheckCheck className="w-3 h-3 text-blue-600" />
                                ) : conversation.last_message.delivered ? (
                                  <Check className="w-3 h-3 text-gray-400" />
                                ) : (
                                  <Clock className="w-3 h-3 text-gray-400" />
                                )
                              )}
                              {conversation.last_message?.attachments && conversation.last_message.attachments.length > 0 && (
                                <Paperclip className="w-3 h-3 text-gray-400" />
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                                {conversation.last_message?.attachments 
                                  ? `📎 ${conversation.last_message.attachments.length} attachment(s)` 
                                  : conversation.last_message?.content || 'Start a conversation'}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {formatRating(conversation.mentor.rating)}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {conversation.mentor.role}
                            </span>
                          </div>
                        </div>
                        
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-600 border-0">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )
              ) : (
                filteredMentors.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No mentors available</h3>
                    <p className="text-sm text-gray-500">Check back later</p>
                  </div>
                ) : (
                  filteredMentors.map((mentor) => (
                    <button
                      key={mentor.id}
                      onClick={() => startNewConversation(mentor.id)}
                      className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center overflow-hidden">
                            {mentor.profile_image ? (
                              <img 
                                src={mentor.profile_image.startsWith('http') 
                                  ? mentor.profile_image 
                                  : `${API_BASE_URL.replace('/api', '')}/storage/${mentor.profile_image}`} 
                                alt="" 
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center"><User class="w-6 h-6 text-white" /></div>';
                                }}
                              />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1">
                            {getStatusDot(mentor.status)}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {mentor.name}
                            </h3>
                            <Badge variant="outline" className={`text-xs ${
                              mentor.status === 'online' ? 'text-emerald-600 border-emerald-200' :
                              mentor.status === 'away' ? 'text-amber-600 border-amber-200' :
                              'text-gray-600 border-gray-200'
                            }`}>
                              {mentor.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {mentor.role}
                          </p>
                          
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatRating(mentor.rating)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {mentor.total_sessions} sessions
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {mentor.expertise?.slice(0, 3).map((exp, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )
              )}
            </CardContent>
          </Card>

          {/* Chat Window Card */}
          <Card
            className={`
              border-0 shadow-xl bg-[#e5ddd5] dark:bg-gray-800
              flex flex-col overflow-hidden
              lg:col-span-8
              ${isMobile && !selectedConversation ? 'hidden' : 'block'}
            `}
            style={{
              backgroundImage: `url('/whatsapp-bg.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b border-gray-200 dark:border-gray-700 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Back button for mobile */}
                      {isMobile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedConversation(null)}
                          className="mr-1"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </Button>
                      )}
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                          {selectedConversation.mentor.profile_image ? (
                            <img 
                              src={selectedConversation.mentor.profile_image.startsWith('http') 
                                ? selectedConversation.mentor.profile_image 
                                : `${API_BASE_URL.replace('/api', '')}/storage/${selectedConversation.mentor.profile_image}`} 
                              alt={selectedConversation.mentor.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"><User class="w-5 h-5 text-white" /></div>';
                              }}
                            />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {getStatusDot(selectedConversation.mentor.status)}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {selectedConversation.mentor.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {selectedConversation.is_typing ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">typing...</span>
                          ) : (
                            <>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {selectedConversation.mentor.status === 'online' ? 'online' : 
                                 selectedConversation.mentor.last_seen ? `last seen ${format(new Date(selectedConversation.mentor.last_seen), 'HH:mm')}` : 'offline'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400">
                        <Video className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col bg-[#e5ddd5] dark:bg-gray-800/50">
                  <div 
                    ref={messagesContainerRef} 
                    className="flex-1 overflow-y-auto p-4"
                    style={{
                      backgroundImage: `url('/whatsapp-bg.png')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <>
                        {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
                          <div key={date}>
                            <div className="flex justify-center my-4">
                              <span className="px-3 py-1 bg-black/20 dark:bg-white/20 text-xs text-gray-700 dark:text-gray-300 rounded-full backdrop-blur-sm">
                                {formatDateDisplay(date)}
                              </span>
                            </div>
                            
                            {msgs.map((msg) => (
                              <div
                                key={`msg-${msg.id}-${msg.timestamp}`}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                    msg.sender === 'user'
                                      ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-gray-800 dark:text-white'
                                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
                                  }`}
                                >
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <MessageAttachments attachments={msg.attachments} />
                                  )}
                                  
                                  {msg.content && (
                                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                                  )}
                                  
                                  <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                                    msg.sender === 'user' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500'
                                  }`}>
                                    <span>{msg.time}</span>
                                    {msg.sender === 'user' && (
                                      msg.read ? (
                                        <CheckCheck className="w-3 h-3 text-blue-600" />
                                      ) : msg.delivered ? (
                                        <CheckCheck className="w-3 h-3" />
                                      ) : (
                                        <Check className="w-3 h-3" />
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        
                        {selectedConversation.is_typing && (
                          <div className="flex justify-start mb-2">
                            <div className="bg-white dark:bg-gray-700 rounded-lg rounded-bl-none px-4 py-3">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {messages.length === 0 && (
                          <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              No messages yet
                            </h3>
                            <p className="text-sm text-gray-500">
                              Send a message to {selectedConversation.mentor.name}
                            </p>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                    {/* Attachment Previews */}
                    {uploadingFiles.length > 0 && (
                      <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                        {uploadingFiles.map((file, index) => (
                          <AttachmentPreview
                            key={`${file.name}-${index}`}
                            attachment={{
                              id: `temp-${index}`,
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              url: URL.createObjectURL(file),
                              thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Attachment Button */}
                      <div className="relative" ref={attachmentMenuRef}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        >
                          <Paperclip className="w-5 h-5" />
                        </Button>
                        
                        {showAttachmentMenu && (
                          <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-48">
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            <Button
                              variant="ghost"
                              className="w-full justify-start mb-1"
                              onClick={() => {
                                if (fileInputRef.current) {
                                  fileInputRef.current.accept = 'image/*';
                                  fileInputRef.current.multiple = true;
                                  fileInputRef.current.click();
                                }
                                setShowAttachmentMenu(false);
                              }}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Photos & Videos
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full justify-start mb-1"
                              onClick={() => {
                                if (fileInputRef.current) {
                                  fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
                                  fileInputRef.current.multiple = true;
                                  fileInputRef.current.click();
                                }
                                setShowAttachmentMenu(false);
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Documents
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => {
                                if (fileInputRef.current) {
                                  fileInputRef.current.accept = 'audio/*';
                                  fileInputRef.current.multiple = true;
                                  fileInputRef.current.click();
                                }
                                setShowAttachmentMenu(false);
                              }}
                            >
                              <Music className="w-4 h-4 mr-2" />
                              Audio
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Emoji Button */}
                      <div className="relative" ref={emojiPickerRef}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          <Smile className="w-5 h-5" />
                        </Button>
                        
                        {showEmojiPicker && (
                          <div className="absolute bottom-full left-0 mb-2">
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                          </div>
                        )}
                      </div>

                      {/* Message Input */}
                      <Input
                        placeholder={`Message ${selectedConversation.mentor.name}...`}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-full"
                        value={message}
                        onChange={handleTyping}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={isSending}
                      />

                      {/* Send Button */}
                      <Button 
                        className="bg-[#00a884] hover:bg-[#008f6b] text-white rounded-full w-10 h-10 p-0"
                        onClick={sendMessage}
                        disabled={(!message.trim() && uploadingFiles.length === 0) || isSending}
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    
                    {useDemoMode && (
                      <p className="text-xs text-center text-gray-500 mt-2">
                        📱 Demo Mode - Mentors will auto-respond after 2 seconds
                      </p>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center bg-[#e5ddd5] dark:bg-gray-800">
                <div className="text-center max-w-sm">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a mentor from the list to start chatting
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Attachment Preview Modal */}
      {showAttachmentPreview && selectedAttachment && (
        <AttachmentPreviewModal
          attachment={selectedAttachment}
          onClose={() => {
            setShowAttachmentPreview(false);
            setSelectedAttachment(null);
          }}
        />
      )}
    </div>
  );
}