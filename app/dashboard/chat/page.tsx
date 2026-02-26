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
} from 'lucide-react';
import { getEcho } from '../../lib/echo'; // Now configured for Reverb

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
  attachments?: string[];
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
  const isInitialLoad = useRef(true);

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

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !selectedConversation || isSending) return;

    setIsSending(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newMessage: Message = {
      id: tempId,
      sender: 'user',
      content: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      read: false,
      delivered: false,
      sent: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    scrollToBottom();

    try {
      if (useDemoMode) {
        // Demo mode
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === tempId ? { ...msg, delivered: true } : msg))
          );
          if (selectedConversation) {
            updateConversationList({
              conversation_id: selectedConversation.id,
              content: newMessage.content,
              created_at: new Date().toISOString(),
              sender_id: getUserId(),
            });
          }
          simulateMentorResponse(newMessage.content);
        }, 500);
        setIsSending(false);
        return;
      }

      // Real API call
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
          content: message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update optimistic message with real ID
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, id: data.message.id, delivered: true } : msg
          )
        );
        // No need to manually send via WebSocket – the backend broadcasts
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
        },
        // ... other demo mentors
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
          content: 'Hi! How can I help you with trading today?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender_type: 'mentor',
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
          // ... other demo messages
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
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
          {/* Sidebar Card - hidden on mobile when a conversation is selected */}
          <Card
            className={`
              border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
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
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            {conversation.mentor.profile_image ? (
                              <img src={conversation.mentor.profile_image} alt="" className="w-12 h-12 rounded-full object-cover" />
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
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                                {conversation.last_message?.content || 'Start a conversation'}
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
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                            {mentor.profile_image ? (
                              <img src={mentor.profile_image} alt="" className="w-12 h-12 rounded-full object-cover" />
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

          {/* Chat Window Card - hidden on mobile when no conversation selected */}
          <Card
            className={`
              border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
              flex flex-col overflow-hidden
              lg:col-span-8
              ${isMobile && !selectedConversation ? 'hidden' : 'block'}
            `}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b border-gray-200 dark:border-gray-700 py-3">
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
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {selectedConversation.mentor.profile_image ? (
                            <img 
                              src={selectedConversation.mentor.profile_image} 
                              alt={selectedConversation.mentor.name}
                              className="w-10 h-10 rounded-full object-cover"
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
                                {selectedConversation.mentor.status}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {selectedConversation.mentor.role}
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
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <>
                        {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
                          <div key={date}>
                            <div className="flex justify-center my-4">
                              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded-full">
                                {formatDateDisplay(date)}
                              </span>
                            </div>
                            
                            {msgs.map((msg) => (
                              <div
                                key={`msg-${msg.id}-${msg.timestamp}`}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
                              >
                                <div className={`max-w-[70%] ${
                                  msg.sender === 'user'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                } rounded-2xl px-4 py-2 ${
                                  msg.sender === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                                }`}>
                                  <p className="text-sm break-words">{msg.content}</p>
                                  
                                  <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                                    msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                                  }`}>
                                    <span>{msg.time}</span>
                                    {msg.sender === 'user' && (
                                      msg.read ? (
                                        <CheckCheck className="w-3 h-3" />
                                      ) : msg.delivered ? (
                                        <Check className="w-3 h-3" />
                                      ) : (
                                        <Clock className="w-3 h-3" />
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        
                        {selectedConversation.is_typing && (
                          <div className="flex justify-start mb-3">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3">
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
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Input
                        placeholder={`Message ${selectedConversation.mentor.name}...`}
                        className="flex-1 bg-gray-50 dark:bg-gray-700 border-0"
                        value={message}
                        onChange={handleTyping}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={isSending}
                      />
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                        <Smile className="w-5 h-5" />
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                        onClick={sendMessage}
                        disabled={!message.trim() || isSending}
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
              <CardContent className="flex-1 flex items-center justify-center">
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
    </div>
  );
}