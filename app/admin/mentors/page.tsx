'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, Filter, Download, Plus, Edit, Trash2, Eye, 
  MoreVertical, Check, X, Star, Clock, DollarSign, TrendingUp,
  Globe, Mail, Phone, Calendar, AlertCircle, Shield, Loader2,
  RefreshCw, UserCheck, UserX, Crown, BarChart3, ChevronLeft,
  ChevronRight, ChevronsUpDown, Settings, MessageSquare,
  Award, Target, Zap, Users2, Building, GraduationCap,
  Briefcase, Globe2, CreditCard, PieChart, Bell, 
  TrendingDown, ArrowUpRight, ArrowDownRight, CheckCircle,
  XCircle, Circle, ExternalLink, MoreHorizontal,
  Upload, Image as ImageIcon, FileText, Link, Globe as GlobeIcon,
  Facebook, Twitter, Linkedin, Instagram, Youtube, Github,
  Heart, ThumbsUp, MessageCircle, Share2, Copy, EyeOff,
  Lock, Unlock, Archive, ArchiveRestore, Ban, CheckSquare,
  Square, AlertTriangle, Info, HelpCircle, Maximize2,
  Minimize2, Grid, List, Table, ArrowUpDown, ZoomIn,
  ZoomOut, Home, UserPlus, UserMinus, UserCog, ShieldCheck,
  Percent, Target as TargetIcon, Trophy, TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon, Activity, BellRing,
  CalendarDays, Clock4, DollarSign as DollarSignIcon,
  CreditCard as CreditCardIcon, Wallet, Coins, Bitcoin,
  Sparkles, Rocket, Zap as ZapIcon, Sunrise, Sunset,
  Cloud, CloudRain, CloudSnow, Wind, Thermometer, Droplets,
  Umbrella, Sun, Moon, CloudSun, CloudMoon, CloudLightning,
  Eye as EyeIcon // Add Eye icon for password toggle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Mentor {
  id: number;
  name: string;
  email: string;
  title: string;
  bio: string;
  expertise: string[];
  rating: number;
  total_sessions: number;
  years_of_experience: number;
  status: 'online' | 'away' | 'offline';
  profile_image: string | null;
  profile_image_url: string;
  is_available: boolean;
  is_featured: boolean;
  hourly_rate: number | null;
  languages: string[];
  social_links: Record<string, string>;
  education: string | null;
  certifications: string | null;
  success_rate: number | null;
  conversations_count: number;
  created_at: string;
  updated_at: string;
  status_badge: [string, string];
}

interface Stats {
  totals: {
    total: number;
    online: number;
    available: number;
    featured: number;
    new_this_month: number;
  };
  averages: {
    rating: number;
    sessions: number;
    experience: number;
    success_rate: number;
  };
  distributions: {
    success_rate: {
      high: number;
      medium: number;
      low: number;
      unknown: number;
    };
    status: {
      online: number;
      away: number;
      offline: number;
    };
    top_expertise: Record<string, number>;
  };
  growth: {
    monthly: Record<string, number>;
    growth_rate: number;
  };
}

export default function AdminMentorsPage() {
  const router = useRouter();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMentors, setSelectedMentors] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    is_available: '',
    is_featured: '',
    sort: 'created_at',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Mentor | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  const [meta, setMeta] = useState({
    total: 0,
    online: 0,
    available: 0,
    featured: 0,
    avg_rating: 0,
  });
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    title: '',
    bio: '',
    expertise: [] as string[],
    years_of_experience: '',
    status: 'offline' as 'online' | 'away' | 'offline',
    is_available: true,
    is_featured: false,
    hourly_rate: '',
    languages: [] as string[],
    social_links: {} as Record<string, string>,
    education: '',
    certifications: '',
    success_rate: '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');

  const API_BASE_URL = 'http://localhost:8000/api/admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => {
    return localStorage.getItem('auth_token') || '';
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: 'online' | 'away' | 'offline' }) => {
    const statusConfig = {
      online: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Online', dot: 'bg-green-500' },
      away: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'Away', dot: 'bg-yellow-500' },
      offline: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', label: 'Offline', dot: 'bg-gray-500' },
    };
    
    const config = statusConfig[status];
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  // Fetch mentors
  const fetchMentors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status && { status: filters.status }),
        ...(filters.is_available && { is_available: filters.is_available }),
        ...(filters.is_featured && { is_featured: filters.is_featured }),
        sort: filters.sort,
        direction: filters.direction,
      });

      console.log('Fetching mentors with params:', params.toString());

      const response = await fetch(`${API_BASE_URL}/mentors?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch mentors: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Mentors API response:', data);
      
      if (data.success) {
        // Updated to match Laravel pagination structure
        setMentors(data.data.data || []);
        setTotalPages(data.data.last_page || 1);
        setTotalItems(data.data.total || 0);
        setMeta(data.meta || {
          total: 0,
          online: 0,
          available: 0,
          featured: 0,
          avg_rating: 0,
        });
      } else {
        throw new Error(data.message || 'Failed to fetch mentors');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/mentors/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      console.log('Stats response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Stats API response:', data);
        if (data.success) {
          setStats(data.stats);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch stats:', errorText);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchMentors();
    fetchStats();
  }, [currentPage, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || filters.status || filters.is_available || filters.is_featured) {
        setCurrentPage(1);
        fetchMentors();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.status, filters.is_available, filters.is_featured]);

  // Handle mentor selection
  const handleSelectMentor = (id: number) => {
    setSelectedMentors(prev => 
      prev.includes(id) 
        ? prev.filter(mentorId => mentorId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedMentors.length === mentors.length) {
      setSelectedMentors([]);
    } else {
      setSelectedMentors(mentors.map(mentor => mentor.id));
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id: number, status: 'online' | 'away' | 'offline') => {
    try {
      setActionLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API_BASE_URL}/mentors/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMentors(prev => prev.map(mentor => 
            mentor.id === id ? { ...mentor, status } : mentor
          ));
          fetchStats();
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to update status:', errorText);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle toggle availability
  const handleToggleAvailability = async (id: number) => {
    try {
      setActionLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API_BASE_URL}/mentors/${id}/availability`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMentors(prev => prev.map(mentor => 
            mentor.id === id ? { ...mentor, is_available: !mentor.is_available } : mentor
          ));
          fetchStats();
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to toggle availability:', errorText);
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle toggle featured
  const handleToggleFeatured = async (id: number) => {
    try {
      setActionLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API_BASE_URL}/mentors/${id}/feature`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMentors(prev => prev.map(mentor => 
            mentor.id === id ? { ...mentor, is_featured: !mentor.is_featured } : mentor
          ));
          fetchStats();
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to toggle featured:', errorText);
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    try {
      setActionLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API_BASE_URL}/mentors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMentors(prev => prev.filter(mentor => mentor.id !== id));
          setSelectedMentors(prev => prev.filter(mentorId => mentorId !== id));
          setShowDeleteModal(null);
          fetchStats();
        } else {
          alert(data.message || 'Failed to delete mentor');
        }
      } else {
        const errorText = await response.text();
        alert(`Failed to delete mentor: ${errorText}`);
      }
    } catch (err) {
      console.error('Failed to delete mentor:', err);
      alert('Failed to delete mentor');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    try {
      setActionLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API_BASE_URL}/mentors/bulk-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedMentors,
          action,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(result.message);
          setSelectedMentors([]);
          setShowBulkActions(false);
          fetchMentors();
          fetchStats();
        } else {
          alert(result.message || 'Failed to perform bulk action');
        }
      } else {
        const errorText = await response.text();
        alert(`Failed to perform bulk action: ${errorText}`);
      }
    } catch (err) {
      console.error('Failed to perform bulk action:', err);
      alert('Failed to perform bulk action');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setActionLoading(true);
      const token = getToken();
      
      const response = await fetch(`${API_BASE_URL}/mentors/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Convert array of arrays to CSV string
          const csvContent = data.data.map((row: any[]) => row.join(',')).join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename || 'mentors_export.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          setShowExportModal(false);
        }
      } else {
        const errorText = await response.text();
        alert(`Failed to export: ${errorText}`);
      }
    } catch (err) {
      console.error('Failed to export:', err);
      alert('Failed to export mentors');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setProfileImage(file);
    }
  };

  // Add expertise
  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise.includes(expertiseInput.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, expertiseInput.trim()]
      }));
      setExpertiseInput('');
    }
  };

  // Remove expertise
  const removeExpertise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index)
    }));
  };

  // Add language
  const addLanguage = () => {
    if (languagesInput.trim() && !formData.languages.includes(languagesInput.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, languagesInput.trim()]
      }));
      setLanguagesInput('');
    }
  };

  // Remove language
  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  // Validate password strength
  const validatePasswordStrength = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) return { valid: false, message: 'Password must be at least 8 characters long' };
    if (!hasUpperCase) return { valid: false, message: 'Password must contain at least one uppercase letter' };
    if (!hasLowerCase) return { valid: false, message: 'Password must contain at least one lowercase letter' };
    if (!hasNumbers) return { valid: false, message: 'Password must contain at least one number' };
    if (!hasSpecialChar) return { valid: false, message: 'Password must contain at least one special character' };
    
    return { valid: true, message: 'Password is strong' };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password for new mentors
    if (!showEditModal) {
      if (!formData.password) {
        alert('Password is required for new mentors');
        return;
      }
      
      // Validate password strength
      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.valid) {
        alert(`Password strength validation failed: ${passwordValidation.message}`);
        return;
      }
      
      // Check password confirmation
      if (formData.password !== formData.password_confirmation) {
        alert('Password and confirmation do not match');
        return;
      }
    }
    
    // For editing, only validate if password is provided
    if (showEditModal && formData.password) {
      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.valid) {
        alert(`Password strength validation failed: ${passwordValidation.message}`);
        return;
      }
      
      if (formData.password !== formData.password_confirmation) {
        alert('Password and confirmation do not match');
        return;
      }
    }
    
    try {
      setActionLoading(true);
      const token = getToken();
      
      const formDataToSend = new FormData();
      
      // Append all form data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('title', formData.title || '');
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('years_of_experience', formData.years_of_experience || '0');
      formDataToSend.append('status', formData.status);
      
      // Append password only if provided (for new mentor it's required, for edit it's optional)
      if (formData.password) {
        formDataToSend.append('password', formData.password);
        if (formData.password_confirmation) {
          formDataToSend.append('password_confirmation', formData.password_confirmation);
        }
      }
      
      // Convert boolean values
      formDataToSend.append('is_available', formData.is_available ? '1' : '0');
      formDataToSend.append('is_featured', formData.is_featured ? '1' : '0');
      
      formDataToSend.append('hourly_rate', formData.hourly_rate || '');
      formDataToSend.append('success_rate', formData.success_rate || '');
      formDataToSend.append('education', formData.education || '');
      formDataToSend.append('certifications', formData.certifications || '');
      
      // Append arrays as JSON strings
      formDataToSend.append('expertise', JSON.stringify(formData.expertise));
      formDataToSend.append('languages', JSON.stringify(formData.languages));
      formDataToSend.append('social_links', JSON.stringify(formData.social_links));
      
      // Append image if exists
      if (profileImage) {
        formDataToSend.append('profile_image', profileImage);
      }
      
      const url = showEditModal 
        ? `${API_BASE_URL}/mentors/${showEditModal.id}`
        : `${API_BASE_URL}/mentors`;
      
      const method = showEditModal ? 'PUT' : 'POST';
      
      console.log('Sending form data to:', url, 'method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          alert(errorJson.message || `Error ${response.status}: ${errorText}`);
        } catch {
          alert(`Error ${response.status}: ${errorText}`);
        }
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        alert(showEditModal ? 'Mentor updated successfully' : 'Mentor created successfully');
        setShowAddModal(false);
        setShowEditModal(null);
        resetForm();
        fetchMentors();
        fetchStats();
      } else {
        alert(data.message || 'Failed to save mentor');
      }
    } catch (err: any) {
      console.error('Failed to save mentor:', err);
      alert(`Failed to save mentor: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      title: '',
      bio: '',
      expertise: [],
      years_of_experience: '',
      status: 'offline',
      is_available: true,
      is_featured: false,
      hourly_rate: '',
      languages: [],
      social_links: {},
      education: '',
      certifications: '',
      success_rate: '',
    });
    setProfileImage(null);
    setExpertiseInput('');
    setLanguagesInput('');
    setShowPassword(false);
    setShowPasswordConfirm(false);
  };

  // Load mentor data for editing
  useEffect(() => {
    if (showEditModal) {
      setFormData({
        name: showEditModal.name,
        email: showEditModal.email,
        password: '', // Leave password empty for editing
        password_confirmation: '', // Leave confirmation empty
        title: showEditModal.title || '',
        bio: showEditModal.bio || '',
        expertise: showEditModal.expertise || [],
        years_of_experience: showEditModal.years_of_experience?.toString() || '',
        status: showEditModal.status,
        is_available: showEditModal.is_available,
        is_featured: showEditModal.is_featured,
        hourly_rate: showEditModal.hourly_rate?.toString() || '',
        languages: showEditModal.languages || [],
        social_links: showEditModal.social_links || {},
        education: showEditModal.education || '',
        certifications: showEditModal.certifications || '',
        success_rate: showEditModal.success_rate?.toString() || '',
      });
      setProfileImage(null);
      setShowPassword(false);
      setShowPasswordConfirm(false);
    }
  }, [showEditModal]);

  if (loading && !mentors.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading mentors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentor Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and monitor all trading mentors in the platform
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Mentor
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Mentors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Mentors</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totals.total}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-sm ${stats.growth.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.growth.growth_rate >= 0 ? '+' : ''}{stats.growth.growth_rate}%
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">from last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Online Mentors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Online Now</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totals.online}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.totals.total > 0 ? Math.round((stats.totals.online / stats.totals.total) * 100) : 0}% of total
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Available Mentors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totals.available}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.totals.available === stats.totals.total ? 'All available' : `${stats.totals.total - stats.totals.available} busy`}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Featured Mentors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Featured</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totals.featured}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Avg rating: {stats.averages.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentors by name, email, title, or expertise..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Status</option>
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.is_available}
                onChange={(e) => setFilters(prev => ({ ...prev, is_available: e.target.value }))}
              >
                <option value="">All Availability</option>
                <option value="true">Available</option>
                <option value="false">Busy</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.is_featured}
                onChange={(e) => setFilters(prev => ({ ...prev, is_featured: e.target.value }))}
              >
                <option value="">All Featured</option>
                <option value="true">Featured</option>
                <option value="false">Regular</option>
              </select>

              {/* Bulk Actions Button */}
              {selectedMentors.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Bulk Actions ({selectedMentors.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Mentors
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchMentors}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : mentors.length === 0 && !loading ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Mentors Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {searchTerm || filters.status || filters.is_available || filters.is_featured
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first mentor'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add First Mentor
              </button>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedMentors.length === mentors.length && mentors.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Mentor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Availability
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Featured
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mentors.map((mentor) => (
                      <tr key={mentor.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedMentors.includes(mentor.id)}
                            onChange={() => handleSelectMentor(mentor.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={mentor.profile_image_url || '/images/default-avatar.png'}
                                alt={mentor.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/images/default-avatar.png';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {mentor.name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {mentor.email}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {mentor.title || 'No title'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={mentor.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        
                                        <span className="ml-1 text-sm font-medium">
                                          {(() => {
                                            const rating = mentor.rating;
                                            
                                            // Handle different data types
                                            if (rating === null || rating === undefined) {
                                              return '0.0';
                                            }
                                            
                                            // Convert to number if it's a string
                                            const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
                                            
                                            // Check if it's a valid number
                                            if (typeof numRating === 'number' && !isNaN(numRating)) {
                                              return numRating.toFixed(1);
                                            }
                                            
                                            return '0.0';
                                          })()}
                                        </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {mentor.total_sessions || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleAvailability(mentor.id)}
                            disabled={actionLoading}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              mentor.is_available
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {mentor.is_available ? (
                              <>
                                <Check className="w-3 h-3" />
                                Available
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" />
                                Busy
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleFeatured(mentor.id)}
                            disabled={actionLoading}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              mentor.is_featured
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {mentor.is_featured ? (
                              <>
                                <Crown className="w-3 h-3" />
                                Featured
                              </>
                            ) : (
                              <>
                                <Users className="w-3 h-3" />
                                Regular
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(mentor.id, 'online')}
                              disabled={actionLoading || mentor.status === 'online'}
                              className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Set Online"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(mentor.id, 'away')}
                              disabled={actionLoading || mentor.status === 'away'}
                              className="p-1 text-yellow-600 hover:text-yellow-800 disabled:opacity-50"
                              title="Set Away"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(mentor.id, 'offline')}
                              disabled={actionLoading || mentor.status === 'offline'}
                              className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                              title="Set Offline"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowEditModal(mentor)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(mentor.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <span className="font-semibold">{(currentPage - 1) * 12 + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(currentPage * 12, totalItems)}</span> of{' '}
                  <span className="font-semibold">{totalItems}</span> mentors
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Mentor Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {showEditModal ? 'Edit Mentor' : 'Add New Mentor'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Image */}
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img
                        src={URL.createObjectURL(profileImage)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : showEditModal?.profile_image_url ? (
                      <img
                        src={showEditModal.profile_image_url}
                        alt={showEditModal.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/default-avatar.png';
                        }}
                      />
                    ) : (
                      <UserPlus className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Upload Image
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Recommended: 500x500px, max 5MB
                    </p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Password Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {showEditModal ? 'New Password' : 'Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder={showEditModal ? 'Leave blank to keep current password' : 'Enter a secure password'}
                        required={!showEditModal}
                        minLength={8}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum 8 characters with uppercase, lowercase, number, and special character
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {showEditModal ? 'Confirm New Password' : 'Confirm Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswordConfirm ? 'text' : 'password'}
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleFormChange}
                        placeholder="Confirm the password"
                        required={!showEditModal && formData.password !== ''}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="e.g., Senior Trading Mentor"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleFormChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Expertise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expertise
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={expertiseInput}
                      onChange={(e) => setExpertiseInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                      placeholder="Add expertise (press Enter)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addExpertise}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.expertise.map((exp, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                      >
                        {exp}
                        <button
                          type="button"
                          onClick={() => removeExpertise(index)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status and Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="online">Online</option>
                      <option value="away">Away</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Success Rate (%)
                    </label>
                    <input
                      type="number"
                      name="success_rate"
                      value={formData.success_rate}
                      onChange={handleFormChange}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_available"
                      checked={formData.is_available}
                      onChange={handleFormChange}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Available for sessions</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleFormChange}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Featured Mentor</span>
                  </label>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : showEditModal ? (
                      'Update Mentor'
                    ) : (
                      'Create Mentor'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bulk Actions ({selectedMentors.length} mentors selected)
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                >
                  Activate Selected
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  Deactivate Selected
                </button>
                <button
                  onClick={() => handleBulkAction('feature')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                >
                  Mark as Featured
                </button>
                <button
                  onClick={() => handleBulkAction('unfeature')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  Remove Featured Status
                </button>
                <button
                  onClick={() => handleBulkAction('status_online')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                >
                  Set Status to Online
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  Delete Selected
                </button>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Export Mentors
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  Export as PDF
                </button>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
                Delete Mentor
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                Are you sure you want to delete this mentor? This action cannot be undone.
              </p>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}