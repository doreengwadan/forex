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
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { getEcho } from '../../lib/echo';

// Interfaces for mentor chat
interface Student {
  id: number;
  name: string;
  status?: string; // online/offline (optional)
  profile_image?: string;
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
  user: Student; // student info
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function MentorChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Echo instance
  const echoRef = useRef<any>(null);

  // Message pagination
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesPerPage = 20;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

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

  // --- Echo Initialization ---
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        echoRef.current = getEcho(token);
      } catch (err) {
        console.error('Failed to initialize Echo', err);
        setError('WebSocket connection failed. Messages may be delayed.');
      }
    }

    return () => {
      if (echoRef.current) {
        echoRef.current.disconnect();
      }
    };
  }, []);

  // --- Subscribe to selected conversation channel ---
  useEffect(() => {
    if (!selectedConversation || !echoRef.current) return;

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

    // Listen for read receipts
    channel.listen('.MessageRead', (e: { message_id: number }) => {
      handleMessageRead(e.message_id);
    });

    return () => {
      echoRef.current?.leave(`chat.${selectedConversation.id}`);
    };
  }, [selectedConversation]);

  // --- WebSocket message handlers ---
  const handleNewMessage = (message: any) => {
    if (selectedConversation && message.conversation_id === selectedConversation.id) {
      const newMessage: Message = {
        id: message.id,
        sender: message.sender_id === getUserId() ? 'mentor' : 'user', // mentor is current user
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

      // Mark as read if from student
      if (message.sender_id !== getUserId()) {
        sendReadReceipt(message.id);
      }
    }

    // Update conversation list
    updateConversationList(message);
  };

  const handleMessageRead = (messageId: number) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
    );
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if (!selectedConversation || !echoRef.current) return;
    echoRef.current
      .private(`chat.${selectedConversation.id}`)
      .whisper('typing', { typing: isTyping });
  };

  const sendReadReceipt = (messageId: number) => {
    if (!selectedConversation || !echoRef.current) return;
    echoRef.current
      .private(`chat.${selectedConversation.id}`)
      .whisper('read', { message_id: messageId });
  };

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
          sender_type: message.sender_id === getUserId() ? 'mentor' : 'user',
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
      sender: 'mentor',
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
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/mentor/chat/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, id: data.message_data.id, delivered: true } : msg
          )
        );
        refreshConversations();
      } else {
        throw new Error('Failed to send');
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

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/mentor/chat/conversations`, {
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

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: number) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/mentor/chat/conversations/${conversationId}/messages?page=1&limit=${messagesPerPage}`,
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
        // Mark as read via API
        markAsRead(conversation.id);
      }

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  };

  const markAsRead = async (conversationId: number) => {
    try {
      const token = getToken();
      await fetch(`${API_BASE_URL}/mentor/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const refreshConversations = async () => {
    setIsLoading(true);
    try {
      const convos = await fetchConversations();
      setConversations(convos);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshConversations();
  }, []);

  // Cleanup typing timeout
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

  const filteredConversations = conversations.filter(
    (c) =>
      c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && !selectedConversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your conversations...</p>
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
              Mentor Inbox
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Chat with your students
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Chat Container */}
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Sidebar */}
          <Card
            className={`
              border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
              flex flex-col overflow-hidden
              lg:col-span-4
              ${isMobile && selectedConversation ? 'hidden' : 'block'}
            `}
          >
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  className="pl-9 bg-gray-50 dark:bg-gray-700 border-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No conversations yet</h3>
                  <p className="text-sm text-gray-500">When students message you, they'll appear here</p>
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
                          {conversation.user.profile_image ? (
                            <img src={conversation.user.profile_image} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {conversation.user.name}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {conversation.last_message?.time}
                          </span>
                        </div>

                        {conversation.is_typing ? (
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 italic">typing...</p>
                        ) : (
                          <div className="flex items-center gap-1">
                            {conversation.last_message?.sender_type === 'mentor' && (
                              conversation.last_message.read ? (
                                <CheckCheck className="w-3 h-3 text-blue-600" />
                              ) : conversation.last_message.delivered ? (
                                <Check className="w-3 h-3 text-gray-400" />
                              ) : (
                                <Clock className="w-3 h-3 text-gray-400" />
                              )
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                              {conversation.last_message?.content || 'Start of conversation'}
                            </p>
                          </div>
                        )}
                      </div>

                      {conversation.unread_count > 0 && (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-600 border-0">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Chat Window */}
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
                          {selectedConversation.user.profile_image ? (
                            <img
                              src={selectedConversation.user.profile_image}
                              alt={selectedConversation.user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {selectedConversation.user.name}
                        </h3>
                        {selectedConversation.is_typing && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">typing...</span>
                        )}
                      </div>
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
                                key={msg.id}
                                className={`flex ${msg.sender === 'mentor' ? 'justify-end' : 'justify-start'} mb-3`}
                              >
                                <div
                                  className={`max-w-[70%] ${
                                    msg.sender === 'mentor'
                                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                  } rounded-2xl px-4 py-2 ${
                                    msg.sender === 'mentor' ? 'rounded-br-none' : 'rounded-bl-none'
                                  }`}
                                >
                                  <p className="text-sm break-words">{msg.content}</p>

                                  <div
                                    className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                                      msg.sender === 'mentor' ? 'text-blue-200' : 'text-gray-500'
                                    }`}
                                  >
                                    <span>{msg.time}</span>
                                    {msg.sender === 'mentor' && (
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
                              Send a message to {selectedConversation.user.name}
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
                        placeholder={`Message ${selectedConversation.user.name}...`}
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
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </Button>
                    </div>
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
                    Choose a student from the list to start chatting
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