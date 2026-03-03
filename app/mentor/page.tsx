'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  Users,
  MessageSquare,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  DollarSign,
  Loader2,
  AlertCircle,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  Video,
  Phone,
  Mail,
  User,
  Settings,
  LogOut,
  Award,
  BookOpen,
  BarChart,
  PieChart,
  Download,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  Link,
  Upload,
  Image,
  Paperclip,
  Send,
  Smile,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bell,
  Calendar as CalendarIcon,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  Youtube,
  Twitch,
  Facebook,
  DollarSign as MoneyIcon,
  CreditCard,
  Wallet,
  TrendingUp as TrendingIcon,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  EyeOff,
  Eye as EyeIcon,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

// Types
interface MentorStats {
  total_students: number;
  active_students: number;
  total_sessions: number;
  upcoming_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  total_earnings: number;
  monthly_earnings: number;
  average_rating: number;
  total_reviews: number;
  response_rate: number;
  response_time: string;
  satisfaction_rate: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  joined_at: string;
  last_active: string;
  total_sessions: number;
  completed_sessions: number;
  rating?: number;
  status: 'active' | 'inactive' | 'blocked';
  membership_type: 'free' | 'premium' | 'pro';
}

interface Session {
  id: number;
  student_id: number;
  student_name: string;
  student_avatar?: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'video' | 'audio' | 'chat';
  price: number;
  payment_status: 'paid' | 'pending' | 'refunded';
  notes?: string;
  rating?: number;
  feedback?: string;
}

interface Earning {
  id: number;
  amount: number;
  type: 'session' | 'tip' | 'bonus';
  status: 'pending' | 'paid' | 'failed';
  date: string;
  student_name: string;
  session_title?: string;
}

interface Review {
  id: number;
  student_id: number;
  student_name: string;
  student_avatar?: string;
  rating: number;
  comment: string;
  date: string;
  session_title?: string;
  response?: string;
}

interface ScheduleSlot {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  recurring: boolean;
}

interface Notification {
  id: number;
  type: 'session' | 'message' | 'review' | 'payment' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  action_url?: string;
}

interface Message {
  id: number;
  student_id: number;
  student_name: string;
  student_avatar?: string;
  content: string;
  time: string;
  read: boolean;
  attachments?: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function MentorDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'sessions' | 'earnings' | 'reviews' | 'schedule' | 'messages' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Message states
  const [messageInput, setMessageInput] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  
  // Schedule states
  const [newScheduleSlot, setNewScheduleSlot] = useState<Partial<ScheduleSlot>>({
    day: 'Monday',
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    recurring: true,
  });

  // Get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || '';
    }
    return '';
  };

  // Fetch all mentor data
  const fetchMentorData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };

      // Fetch all data in parallel
      const [
        statsRes,
        studentsRes,
        sessionsRes,
        earningsRes,
        reviewsRes,
        scheduleRes,
        notificationsRes,
        messagesRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/mentor/stats`, { headers }),
        fetch(`${API_BASE_URL}/mentor/students`, { headers }),
        fetch(`${API_BASE_URL}/mentor/sessions`, { headers }),
        fetch(`${API_BASE_URL}/mentor/earnings`, { headers }),
        fetch(`${API_BASE_URL}/mentor/reviews`, { headers }),
        fetch(`${API_BASE_URL}/mentor/schedule`, { headers }),
        fetch(`${API_BASE_URL}/mentor/notifications`, { headers }),
        fetch(`${API_BASE_URL}/mentor/messages`, { headers }),
      ]);

      // Parse responses
      const statsData = await statsRes.json();
      const studentsData = await studentsRes.json();
      const sessionsData = await sessionsRes.json();
      const earningsData = await earningsRes.json();
      const reviewsData = await reviewsRes.json();
      const scheduleData = await scheduleRes.json();
      const notificationsData = await notificationsRes.json();
      const messagesData = await messagesRes.json();

      // Set states
      setStats(statsData.stats || getDemoStats());
      setStudents(studentsData.students || getDemoStudents());
      setSessions(sessionsData.sessions || getDemoSessions());
      setEarnings(earningsData.earnings || getDemoEarnings());
      setReviews(reviewsData.reviews || getDemoReviews());
      setSchedule(scheduleData.schedule || getDemoSchedule());
      setNotifications(notificationsData.notifications || getDemoNotifications());
      setMessages(messagesData.messages || getDemoMessages());

    } catch (error) {
      console.error('Error fetching mentor data:', error);
      // Use demo data as fallback
      setStats(getDemoStats());
      setStudents(getDemoStudents());
      setSessions(getDemoSessions());
      setEarnings(getDemoEarnings());
      setReviews(getDemoReviews());
      setSchedule(getDemoSchedule());
      setNotifications(getDemoNotifications());
      setMessages(getDemoMessages());
    } finally {
      setIsLoading(false);
    }
  };

  // Demo data generators
  const getDemoStats = (): MentorStats => ({
    total_students: 156,
    active_students: 89,
    total_sessions: 342,
    upcoming_sessions: 12,
    completed_sessions: 298,
    cancelled_sessions: 32,
    total_earnings: 28450,
    monthly_earnings: 4250,
    average_rating: 4.8,
    total_reviews: 127,
    response_rate: 98,
    response_time: '< 2 hours',
    satisfaction_rate: 96,
  });

  const getDemoStudents = (): Student[] => [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop',
      joined_at: '2024-01-15',
      last_active: '2024-02-20',
      total_sessions: 12,
      completed_sessions: 10,
      rating: 5,
      status: 'active',
      membership_type: 'premium',
    },
    {
      id: 2,
      name: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop',
      joined_at: '2024-02-01',
      last_active: '2024-02-19',
      total_sessions: 8,
      completed_sessions: 7,
      rating: 4,
      status: 'active',
      membership_type: 'pro',
    },
    {
      id: 3,
      name: 'Mike Thompson',
      email: 'mike.thompson@example.com',
      joined_at: '2024-01-20',
      last_active: '2024-02-15',
      total_sessions: 5,
      completed_sessions: 4,
      rating: 5,
      status: 'inactive',
      membership_type: 'free',
    },
  ];

  const getDemoSessions = (): Session[] => [
    {
      id: 1,
      student_id: 1,
      student_name: 'John Smith',
      student_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop',
      title: 'Advanced Trading Strategies',
      description: 'Discussion about advanced trading strategies and risk management',
      date: '2024-02-25',
      time: '14:00',
      duration: 60,
      status: 'scheduled',
      type: 'video',
      price: 150,
      payment_status: 'paid',
    },
    {
      id: 2,
      student_id: 2,
      student_name: 'Sarah Chen',
      student_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop',
      title: 'Technical Analysis Basics',
      description: 'Introduction to technical analysis and chart patterns',
      date: '2024-02-20',
      time: '10:00',
      duration: 45,
      status: 'completed',
      type: 'video',
      price: 100,
      payment_status: 'paid',
      rating: 5,
      feedback: 'Excellent session! Very knowledgeable and patient.',
    },
    {
      id: 3,
      student_id: 3,
      student_name: 'Mike Thompson',
      title: 'Risk Management',
      description: 'Understanding risk management in trading',
      date: '2024-02-18',
      time: '15:30',
      duration: 30,
      status: 'cancelled',
      type: 'audio',
      price: 75,
      payment_status: 'refunded',
    },
  ];

  const getDemoEarnings = (): Earning[] => [
    {
      id: 1,
      amount: 150,
      type: 'session',
      status: 'paid',
      date: '2024-02-20',
      student_name: 'Sarah Chen',
      session_title: 'Technical Analysis Basics',
    },
    {
      id: 2,
      amount: 50,
      type: 'tip',
      status: 'paid',
      date: '2024-02-19',
      student_name: 'John Smith',
    },
    {
      id: 3,
      amount: 200,
      type: 'session',
      status: 'pending',
      date: '2024-02-18',
      student_name: 'Emma Wilson',
      session_title: 'Options Trading',
    },
  ];

  const getDemoReviews = (): Review[] => [
    {
      id: 1,
      student_id: 1,
      student_name: 'John Smith',
      student_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop',
      rating: 5,
      comment: 'Excellent mentor! Very knowledgeable and explains complex concepts clearly.',
      date: '2024-02-15',
      session_title: 'Advanced Trading Strategies',
      response: 'Thank you John! Glad you enjoyed the session.',
    },
    {
      id: 2,
      student_id: 2,
      student_name: 'Sarah Chen',
      student_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop',
      rating: 4,
      comment: 'Good session, very helpful. Would recommend.',
      date: '2024-02-10',
      session_title: 'Technical Analysis Basics',
    },
  ];

  const getDemoSchedule = (): ScheduleSlot[] => [
    {
      id: 1,
      day: 'Monday',
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      recurring: true,
    },
    {
      id: 2,
      day: 'Wednesday',
      start_time: '10:00',
      end_time: '18:00',
      is_available: true,
      recurring: true,
    },
    {
      id: 3,
      day: 'Friday',
      start_time: '09:00',
      end_time: '13:00',
      is_available: true,
      recurring: true,
    },
  ];

  const getDemoNotifications = (): Notification[] => [
    {
      id: 1,
      type: 'session',
      title: 'New Session Request',
      message: 'John Smith requested a session for tomorrow at 2 PM',
      time: '5 minutes ago',
      read: false,
      action_url: '/mentor/sessions',
    },
    {
      id: 2,
      type: 'review',
      title: 'New Review',
      message: 'Sarah Chen left you a 5-star review',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment Received',
      message: 'You received $150 for a completed session',
      time: '1 day ago',
      read: true,
    },
  ];

  const getDemoMessages = (): Message[] => [
    {
      id: 1,
      student_id: 1,
      student_name: 'John Smith',
      student_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop',
      content: 'Hi, I have a question about the upcoming session.',
      time: '10:30 AM',
      read: false,
    },
    {
      id: 2,
      student_id: 2,
      student_name: 'Sarah Chen',
      student_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop',
      content: 'Thanks for the great session yesterday!',
      time: '9:15 AM',
      read: true,
    },
  ];

  // Initial load
  useEffect(() => {
    fetchMentorData();
  }, []);

  // Chart data
  const earningsChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Earnings',
        data: [3200, 3800, 4200, 4800, 5100, 5600, 5900, 6200, 5800, 6100, 6500, 6800],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const sessionsChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sessions',
        data: [4, 3, 5, 2, 6, 1, 0],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const ratingChartData = {
    labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
    datasets: [
      {
        data: [85, 10, 3, 1, 1],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'no-show': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status}
      </span>
    );
  };

  // Get session type icon
  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Phone className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading mentor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Mentor Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your students, sessions, and earnings
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Available Balance</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stats?.total_earnings || 0)}
                </p>
              </div>
              <Button variant="outline" onClick={fetchMentorData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-4 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'sessions', label: 'Sessions', icon: Calendar },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'schedule', label: 'Schedule', icon: Clock },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.id === 'messages' && messages.filter(m => !m.read).length > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">
                      {messages.filter(m => !m.read).length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-emerald-600 dark:text-emerald-400">{success}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={() => setSuccess(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={() => setError(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Students</p>
                      <p className="text-3xl font-bold text-blue-600">{stats?.total_students}</p>
                      <p className="text-xs text-emerald-600 mt-1">+12 this month</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Sessions</p>
                      <p className="text-3xl font-bold text-purple-600">{stats?.total_sessions}</p>
                      <p className="text-xs text-emerald-600 mt-1">{stats?.upcoming_sessions} upcoming</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Earnings</p>
                      <p className="text-3xl font-bold text-emerald-600">{formatCurrency(stats?.total_earnings || 0)}</p>
                      <p className="text-xs text-emerald-600 mt-1">{formatCurrency(stats?.monthly_earnings || 0)} this month</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Average Rating</p>
                      <p className="text-3xl font-bold text-amber-600">{stats?.average_rating}</p>
                      <p className="text-xs text-gray-500 mt-1">{stats?.total_reviews} reviews</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-amber-600 fill-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Earnings Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line data={earningsChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Sessions by Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar data={sessionsChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Response Rate</h3>
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{stats?.response_rate}%</p>
                  <p className="text-sm text-gray-500 mt-1">Average response time: {stats?.response_time}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Satisfaction Rate</h3>
                    <ThumbsUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">{stats?.satisfaction_rate}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full" 
                      style={{ width: `${stats?.satisfaction_rate}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Rating Distribution</h3>
                    <PieChart className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="h-24">
                    <Pie data={ratingChartData} options={pieChartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sessions & Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Sessions */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('sessions')}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessions.filter(s => s.status === 'scheduled').slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            {session.student_avatar ? (
                              <img src={session.student_avatar} alt={session.student_name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{session.student_name}</p>
                            <p className="text-sm text-gray-500">{session.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{session.date}</span>
                              <Clock className="w-3 h-3 text-gray-400 ml-1" />
                              <span className="text-xs text-gray-500">{session.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSessionTypeIcon(session.type)}
                          {getStatusBadge(session.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reviews */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Reviews</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('reviews')}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              {review.student_avatar ? (
                                <img src={review.student_avatar} alt={review.student_name} className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{review.student_name}</p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < review.rating
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(review.date)}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search students by name or email..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFilters(!showFilters)}
                      className={showFilters ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                    
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">
                          <option value="all">All Students</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Membership</label>
                        <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">
                          <option value="all">All Types</option>
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                          <option value="pro">Pro</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Sort By</label>
                        <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">
                          <option value="recent">Most Recent</option>
                          <option value="name">Name</option>
                          <option value="sessions">Most Sessions</option>
                          <option value="rating">Highest Rated</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <Card key={student.id} className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-2xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-600">Sessions</p>
                        <p className="font-bold text-blue-800">{student.total_sessions}</p>
                      </div>
                      <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-xs text-purple-600">Completed</p>
                        <p className="font-bold text-purple-800">{student.completed_sessions}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Joined {formatDate(student.joined_at)}</span>
                      </div>
                      {student.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium">{student.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowMessageModal(true);
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" onClick={() => {/* View details */}}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.upcoming_sessions}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats?.completed_sessions}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.cancelled_sessions}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((stats?.completed_sessions || 0) / (stats?.total_sessions || 1) * 100)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sessions List */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>All Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {session.student_avatar ? (
                            <img src={session.student_avatar} alt={session.student_name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{session.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{session.student_name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{session.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{session.time} ({session.duration} min)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getSessionTypeIcon(session.type)}
                        {getStatusBadge(session.status)}
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedSession(session);
                          setShowSessionModal(true);
                        }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-3xl font-bold text-emerald-600">{formatCurrency(stats?.total_earnings || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats?.monthly_earnings || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-500">Average per Session</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency((stats?.total_earnings || 0) / (stats?.total_sessions || 1))}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Chart */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line data={earningsChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earnings.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          earning.type === 'session' ? 'bg-blue-100' :
                          earning.type === 'tip' ? 'bg-green-100' : 'bg-purple-100'
                        }`}>
                          {earning.type === 'session' ? (
                            <Calendar className={`w-5 h-5 ${
                              earning.type === 'session' ? 'text-blue-600' :
                              earning.type === 'tip' ? 'text-green-600' : 'text-purple-600'
                            }`} />
                          ) : earning.type === 'tip' ? (
                            <Heart className="w-5 h-5 text-green-600" />
                          ) : (
                            <Award className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{earning.student_name}</p>
                          <p className="text-sm text-gray-500">
                            {earning.session_title || `${earning.type} payment`}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(earning.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">+{formatCurrency(earning.amount)}</p>
                        {getStatusBadge(earning.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-amber-600">{stats?.average_rating}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.round(stats?.average_rating || 0)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{stats?.total_reviews} reviews</p>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-2 mb-2">
                          <span className="text-sm w-8">{rating} ★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-400 rounded-full"
                              style={{ 
                                width: `${rating === 5 ? 85 : 
                                       rating === 4 ? 10 : 
                                       rating === 3 ? 3 : 
                                       rating === 2 ? 1 : 1}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {rating === 5 ? '85%' : 
                             rating === 4 ? '10%' : 
                             rating === 3 ? '3%' : 
                             rating === 2 ? '1%' : '1%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Review Highlights</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm">Knowledgeable & experienced</span>
                      <Badge className="ml-auto">42</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm">Clear explanations</span>
                      <Badge className="ml-auto">38</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm">Patient & supportive</span>
                      <Badge className="ml-auto">35</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Too fast paced</span>
                      <Badge className="ml-auto">3</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviews List */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>All Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            {review.student_avatar ? (
                              <img src={review.student_avatar} alt={review.student_name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{review.student_name}</h4>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(review.date)}</span>
                            </div>
                          </div>
                        </div>
                        {review.session_title && (
                          <Badge variant="outline">{review.session_title}</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">{review.comment}</p>
                      {review.response && (
                        <div className="ml-12 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <span className="font-semibold">Your response: </span>
                            {review.response}
                          </p>
                        </div>
                      )}
                      {!review.response && (
                        <Button size="sm" variant="outline" className="ml-12">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Respond
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Availability Overview */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Weekly Schedule</CardTitle>
                <Button onClick={() => setShowScheduleModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Slot
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schedule.map((slot) => (
                    <div key={slot.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{slot.day}</h4>
                        {slot.is_available ? (
                          <Badge className="bg-emerald-500">Available</Badge>
                        ) : (
                          <Badge variant="outline">Unavailable</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {slot.start_time} - {slot.end_time}
                      </p>
                      {slot.recurring && (
                        <p className="text-xs text-gray-500 mt-2">Recurring weekly</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time Zone Settings */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Time Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <select className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="EST">Eastern Time (EST)</option>
                    <option value="CST">Central Time (CST)</option>
                    <option value="MST">Mountain Time (MST)</option>
                    <option value="PST">Pacific Time (PST)</option>
                    <option value="GMT">Greenwich Mean Time (GMT)</option>
                  </select>
                  <Button>Save</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden lg:col-span-1">
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => setSelectedConversation(message.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedConversation === message.id ? 'bg-blue-50 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            {message.student_avatar ? (
                              <img src={message.student_avatar} alt={message.student_name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          {!message.read && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm truncate">{message.student_name}</h4>
                            <span className="text-xs text-gray-500">{message.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden lg:col-span-2">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {messages.find(m => m.id === selectedConversation)?.student_avatar ? (
                            <img 
                              src={messages.find(m => m.id === selectedConversation)?.student_avatar} 
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {messages.find(m => m.id === selectedConversation)?.student_name}
                          </h3>
                          <p className="text-xs text-emerald-600">Online</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 flex flex-col h-[500px]">
                    <div className="flex-1 overflow-y-auto p-4">
                      {/* Messages would go here */}
                      <div className="flex justify-start mb-3">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-2 max-w-[70%]">
                          <p className="text-sm">Hi, I have a question about the upcoming session.</p>
                          <span className="text-xs text-gray-500 mt-1 block">10:30 AM</span>
                        </div>
                      </div>
                      <div className="flex justify-end mb-3">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-br-none px-4 py-2 max-w-[70%]">
                          <p className="text-sm">Sure, what would you like to know?</p>
                          <span className="text-xs text-blue-200 mt-1 block">10:32 AM</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Paperclip className="w-5 h-5" />
                        </Button>
                        <Input
                          placeholder="Type your message..."
                          className="flex-1"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && setMessageInput('')}
                        />
                        <Button variant="ghost" size="icon">
                          <Smile className="w-5 h-5" />
                        </Button>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choose a student to start messaging
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Settings */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm lg:col-span-2">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Photo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <Input placeholder="John" defaultValue="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <Input placeholder="Doe" defaultValue="Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                    placeholder="Tell students about yourself..."
                    defaultValue="Experienced trader with 10+ years in the market. Specializing in technical analysis and risk management."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expertise</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['Technical Analysis', 'Risk Management', 'Options Trading', 'Forex'].map((exp) => (
                      <Badge key={exp} className="bg-blue-100 text-blue-700">
                        {exp}
                        <X className="w-3 h-3 ml-1 cursor-pointer" />
                      </Badge>
                    ))}
                  </div>
                  <Input placeholder="Add expertise (e.g., Swing Trading)" />
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input type="email" value="mentor@example.com" readOnly className="bg-gray-100" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hourly Rate</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input className="pl-8" type="number" defaultValue="150" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                    Save Changes
                  </Button>
                </div>

                <div className="pt-4">
                  <Button variant="destructive" className="w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Deactivate Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}