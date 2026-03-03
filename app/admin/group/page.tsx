'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import {
  Users,
  Hash,
  Loader2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Check,
  UserPlus,
  UserMinus,
  Shield,
  ShieldAlert,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Image as ImageIcon,
  Upload,
  Copy,
  CheckCheck,
  User,
  Activity,
  Calendar,
  TrendingUp,
  MessageCircle,
  Clock
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

// Interfaces
interface Group {
  id: number;
  name: string;
  description: string;
  slug: string;
  icon?: string;
  cover_image?: string;
  members_count: number;
  online_count: number;
  is_private: boolean;
  requires_approval: boolean;
  created_by: {
    id: number;
    name: string;
    email: string;
  };
  moderators: GroupModerator[];
  rules?: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'suspended';
  
  // Stats fields
  total_messages?: number;
  messages_today?: number;
  new_members_week?: number;
  activity_level?: 'high' | 'medium' | 'low';
  last_active?: string;
  
  // Pending approvals count
  pending_approvals_count?: number;
}

interface GroupModerator {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'moderator';
  permissions: string[];
}

interface GroupFormData {
  name: string;
  description: string;
  slug: string;
  is_private: boolean;
  requires_approval: boolean;
  rules: string[];
  tags: string[];
  icon?: File | null;
  cover_image?: File | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
}

interface PendingMember {
  id: number;
  user_id: number;
  group_id: number;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: any; trend?: string }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      {trend && (
        <span className="text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
  </div>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Stats state
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeGroups, setActiveGroups] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showManageModeratorsModal, setShowManageModeratorsModal] = useState(false);
  const [showViewGroupModal, setShowViewGroupModal] = useState(false);
  const [showPendingApprovalsModal, setShowPendingApprovalsModal] = useState(false);
  
  // Selected group
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    slug: '',
    is_private: false,
    requires_approval: false,
    rules: [''],
    tags: [],
    icon: null,
    cover_image: null,
  });
  
  // Tag input
  const [tagInput, setTagInput] = useState('');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived' | 'suspended'>('all');
  
  // Users for moderator management
  const [users, setUsers] = useState<User[]>([]);
  const [selectedModerators, setSelectedModerators] = useState<number[]>([]);
  
  // Pending members for approval
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  
  // Image previews
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Copy slug state
  const [copiedSlug, setCopiedSlug] = useState<number | null>(null);
  
  const { toast } = useToast();

  // Get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || '';
    }
    return '';
  };

  // Enhanced fetch with error handling
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    
    const defaultHeaders: HeadersInit = {
      'Accept': 'application/json',
      ...(options.method !== 'GET' && !(options.body instanceof FormData) 
        ? { 'Content-Type': 'application/json' } 
        : {}),
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Fetch groups
  const fetchGroups = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/admin/groups`);
      const groupsData = data.groups || [];
      setGroups(groupsData);
      setFilteredGroups(groupsData);
      
      // Calculate stats from real data
      calculateStats(groupsData);
      
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to fetch groups. Using demo data.');
      
      // Demo data with stats
      const demoGroups = getDemoGroups();
      setGroups(demoGroups);
      setFilteredGroups(demoGroups);
      calculateStats(demoGroups);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from groups data
  const calculateStats = (groupsData: Group[]) => {
    setTotalGroups(groupsData.length);
    setActiveGroups(groupsData.filter(g => g.status === 'active').length);
    
    const totalMem = groupsData.reduce((acc, g) => acc + (g.members_count || 0), 0);
    setTotalMembers(totalMem);
    
    const totalMsgs = groupsData.reduce((acc, g) => acc + (g.total_messages || 0), 0);
    setTotalMessages(totalMsgs);
  };

  // Fetch users for moderator management
  const fetchUsers = async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/admin/users/list`);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers(getDemoUsers());
    }
  };

  // Fetch pending members for a group
  const fetchPendingMembers = async (groupId: number) => {
    setIsLoadingPending(true);
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/admin/groups/${groupId}/pending-members`);
      setPendingMembers(data.pending_members || []);
    } catch (error) {
      console.error('Error fetching pending members:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending members',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPending(false);
    }
  };

  // Approve a member
  const approveMember = async (groupId: number, userId: number) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/admin/groups/${groupId}/approve-member/${userId}`, {
        method: 'POST',
      });
      
      toast({
        title: 'Success',
        description: 'Member approved successfully',
      });
      
      // Refresh pending members list
      await fetchPendingMembers(groupId);
      // Refresh groups to update member count
      await fetchGroups();
    } catch (error) {
      console.error('Error approving member:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve member',
        variant: 'destructive',
      });
    }
  };

  // Reject a member
  const rejectMember = async (groupId: number, userId: number) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/admin/groups/${groupId}/reject-member/${userId}`, {
        method: 'POST',
      });
      
      toast({
        title: 'Success',
        description: 'Member rejected successfully',
      });
      
      // Refresh pending members list
      await fetchPendingMembers(groupId);
    } catch (error) {
      console.error('Error rejecting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject member',
        variant: 'destructive',
      });
    }
  };

  // Bulk approve all pending members
  const approveAllMembers = async (groupId: number) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/admin/groups/${groupId}/approve-all`, {
        method: 'POST',
      });
      
      toast({
        title: 'Success',
        description: 'All members approved successfully',
      });
      
      // Refresh pending members list
      await fetchPendingMembers(groupId);
      // Refresh groups to update member count
      await fetchGroups();
    } catch (error) {
      console.error('Error approving all members:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve all members',
        variant: 'destructive',
      });
    }
  };

  // Open pending approvals modal
  const openPendingApprovals = (group: Group) => {
    setSelectedGroup(group);
    fetchPendingMembers(group.id);
    setShowPendingApprovalsModal(true);
  };

  // Demo data with stats
  const getDemoGroups = (): Group[] => [
    {
      id: 1,
      name: 'Trading Strategies',
      description: 'Advanced trading strategies and discussion group for experienced traders',
      slug: 'trading-strategies',
      icon: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=64&h=64&fit=crop',
      cover_image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=400&fit=crop',
      members_count: 1234,
      online_count: 89,
      total_messages: 4567,
      messages_today: 23,
      new_members_week: 45,
      activity_level: 'high',
      last_active: new Date().toISOString(),
      is_private: false,
      requires_approval: false,
      pending_approvals_count: 0,
      created_by: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
      },
      moderators: [
        { id: 2, name: 'John Smith', email: 'john@example.com', role: 'admin', permissions: ['all'] },
        { id: 3, name: 'Sarah Chen', email: 'sarah@example.com', role: 'moderator', permissions: ['manage_messages', 'manage_members'] },
      ],
      rules: [
        'Be respectful to other members',
        'No spam or self-promotion',
        'Stay on topic',
      ],
      tags: ['trading', 'stocks', 'strategies'],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-02-20T15:30:00Z',
      status: 'active',
    },
    {
      id: 2,
      name: 'Crypto Enthusiasts',
      description: 'Discussion about cryptocurrency trading and blockchain technology',
      slug: 'crypto-enthusiasts',
      members_count: 856,
      online_count: 45,
      total_messages: 2341,
      messages_today: 12,
      new_members_week: 23,
      activity_level: 'medium',
      last_active: new Date(Date.now() - 3600000).toISOString(),
      is_private: true,
      requires_approval: true,
      pending_approvals_count: 3,
      created_by: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
      },
      moderators: [
        { id: 4, name: 'Mike Thompson', email: 'mike@example.com', role: 'moderator', permissions: ['manage_messages'] },
      ],
      rules: [
        'No price speculation',
        'DYOR before asking',
        'Respect community guidelines',
      ],
      tags: ['crypto', 'bitcoin', 'ethereum'],
      created_at: '2024-02-01T14:00:00Z',
      updated_at: '2024-02-19T09:15:00Z',
      status: 'active',
    },
    {
      id: 3,
      name: 'Technical Analysis',
      description: 'Learn and discuss technical analysis indicators and patterns',
      slug: 'technical-analysis',
      members_count: 567,
      online_count: 23,
      total_messages: 1234,
      messages_today: 5,
      new_members_week: 12,
      activity_level: 'low',
      last_active: new Date(Date.now() - 86400000).toISOString(),
      is_private: false,
      requires_approval: false,
      pending_approvals_count: 0,
      created_by: {
        id: 5,
        name: 'Emma Wilson',
        email: 'emma@example.com',
      },
      moderators: [],
      rules: [
        'Share charts with analysis',
        'Explain your reasoning',
        'Be constructive',
      ],
      tags: ['technical-analysis', 'charts', 'indicators'],
      created_at: '2024-02-10T09:00:00Z',
      updated_at: '2024-02-18T16:45:00Z',
      status: 'archived',
    },
  ];

  const getDemoUsers = (): User[] => [
    { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    { id: 2, name: 'John Smith', email: 'john@example.com', role: 'user' },
    { id: 3, name: 'Sarah Chen', email: 'sarah@example.com', role: 'user' },
    { id: 4, name: 'Mike Thompson', email: 'mike@example.com', role: 'user' },
    { id: 5, name: 'Emma Wilson', email: 'emma@example.com', role: 'moderator' },
    { id: 6, name: 'David Kim', email: 'david@example.com', role: 'user' },
    { id: 7, name: 'Lisa Wang', email: 'lisa@example.com', role: 'user' },
  ];

  const getDemoPendingMembers = (groupId: number): PendingMember[] => [
    {
      id: 1,
      user_id: 6,
      group_id: groupId,
      requested_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'pending',
      user: {
        id: 6,
        name: 'David Kim',
        email: 'david@example.com',
      }
    },
    {
      id: 2,
      user_id: 7,
      group_id: groupId,
      requested_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'pending',
      user: {
        id: 7,
        name: 'Lisa Wang',
        email: 'lisa@example.com',
      }
    },
    {
      id: 3,
      user_id: 3,
      group_id: groupId,
      requested_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      status: 'pending',
      user: {
        id: 3,
        name: 'Sarah Chen',
        email: 'sarah@example.com',
      }
    }
  ];

  // Initial load
  useEffect(() => {
    fetchGroups();
  }, []);

  // Filter groups based on search and status
  useEffect(() => {
    let filtered = groups;
    
    if (searchQuery) {
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter((g) => g.status === filterStatus);
    }
    
    setFilteredGroups(filtered);
  }, [searchQuery, filterStatus, groups]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      if (name === 'name' && !formData.slug) {
        setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
      }
    }
  };

  // Handle icon upload
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, icon: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cover image upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, cover_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle rules change
  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData((prev) => ({ ...prev, rules: newRules }));
  };

  const addRule = () => {
    setFormData((prev) => ({ ...prev, rules: [...prev.rules, ''] }));
  };

  const removeRule = (index: number) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, rules: newRules }));
  };

  // Handle tags
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // Create group
  const createGroup = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      if (!formData.name || !formData.description || !formData.slug) {
        setError('Please fill in all required fields');
        setIsSaving(false);
        return;
      }
      
      const token = getToken();
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('slug', formData.slug);
      formDataToSend.append('is_private', formData.is_private ? '1' : '0');
      formDataToSend.append('requires_approval', formData.requires_approval ? '1' : '0');
      formDataToSend.append('rules', JSON.stringify(formData.rules.filter(r => r.trim())));
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      
      if (formData.icon) {
        formDataToSend.append('icon', formData.icon);
      }
      
      if (formData.cover_image) {
        formDataToSend.append('cover_image', formData.cover_image);
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formDataToSend,
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Group created successfully',
        });
        resetForm();
        setShowCreateModal(false);
        fetchGroups();
      } else {
        if (response.status === 422 && data.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join(' | ');
          setError(`Validation failed: ${errorMessages}`);
        } else {
          setError(data.message || 'Failed to create group');
        }
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update group
  const updateGroup = async () => {
    if (!selectedGroup) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const token = getToken();
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('slug', formData.slug);
      formDataToSend.append('is_private', String(formData.is_private));
      formDataToSend.append('requires_approval', String(formData.requires_approval));
      formDataToSend.append('rules', JSON.stringify(formData.rules.filter(r => r.trim())));
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      formDataToSend.append('_method', 'PUT');
      
      if (formData.icon) {
        formDataToSend.append('icon', formData.icon);
      }
      
      if (formData.cover_image) {
        formDataToSend.append('cover_image', formData.cover_image);
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/groups/${selectedGroup.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formDataToSend,
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Group updated successfully',
        });
        resetForm();
        setShowEditModal(false);
        setSelectedGroup(null);
        fetchGroups();
      } else {
        setError(data.message || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete group
  const deleteGroup = async () => {
    if (!selectedGroup) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await fetchWithAuth(`${API_BASE_URL}/admin/groups/${selectedGroup.id}`, {
        method: 'DELETE',
      });
      
      toast({
        title: 'Success',
        description: 'Group deleted successfully',
      });
      setShowDeleteModal(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      setError('Failed to delete group. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update group status
  const updateGroupStatus = async (groupId: number, status: 'active' | 'archived' | 'suspended') => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/admin/groups/${groupId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      toast({
        title: 'Success',
        description: `Group status updated to ${status}`,
      });
      fetchGroups();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  // Manage moderators
  const openManageModerators = (group: Group) => {
    setSelectedGroup(group);
    setSelectedModerators(group.moderators.map(m => m.id));
    fetchUsers();
    setShowManageModeratorsModal(true);
  };

  const saveModerators = async () => {
    if (!selectedGroup) return;
    
    setIsSaving(true);
    
    try {
      await fetchWithAuth(`${API_BASE_URL}/admin/groups/${selectedGroup.id}/moderators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moderator_ids: selectedModerators }),
      });
      
      toast({
        title: 'Success',
        description: 'Moderators updated successfully',
      });
      setShowManageModeratorsModal(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      console.error('Error updating moderators:', error);
      toast({
        title: 'Error',
        description: 'Failed to update moderators',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      is_private: false,
      requires_approval: false,
      rules: [''],
      tags: [],
      icon: null,
      cover_image: null,
    });
    setIconPreview(null);
    setCoverPreview(null);
    setTagInput('');
    setError(null);
  };

  // Open edit modal
  const openEditModal = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      slug: group.slug,
      is_private: group.is_private,
      requires_approval: group.requires_approval,
      rules: group.rules?.length ? group.rules : [''],
      tags: group.tags || [],
      icon: null,
      cover_image: null,
    });
    setIconPreview(group.icon || null);
    setCoverPreview(group.cover_image || null);
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (group: Group) => {
    setSelectedGroup(group);
    setShowViewGroupModal(true);
  };

  // Copy slug to clipboard
  const copySlug = (slug: string, groupId: number) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(groupId);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  // Get activity badge
  const getActivityBadge = (level?: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    
    if (!level) return null;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[level]}`}>
        {level} activity
      </span>
    );
  };

  if (isLoading && groups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading groups...</p>
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
              Group Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage trading groups
            </p>
          </div>
          
          <Button 
            className="bg-gradient-to-r from-blue-600 to-purple-600"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Groups"
            value={totalGroups}
            icon={Hash}
            trend="+2 this week"
          />
          <StatsCard
            title="Total Members"
            value={totalMembers.toLocaleString()}
            icon={Users}
            trend="+156 this week"
          />
          <StatsCard
            title="Active Groups"
            value={activeGroups}
            icon={Activity}
            trend={`${Math.round((activeGroups / totalGroups) * 100)}% of total`}
          />
          <StatsCard
            title="Total Messages"
            value={totalMessages.toLocaleString()}
            icon={MessageCircle}
            trend="+234 today"
          />
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-center gap-3">
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
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

        {/* Filters and Search */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search groups by name, description, or tags..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="suspended">Suspended</option>
                </select>
                
                <Button variant="outline" size="icon" onClick={fetchGroups}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups Table */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          {group.icon ? (
                            <img src={group.icon} alt={group.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <Hash className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {group.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className="font-mono">{group.slug}</span>
                            <button
                              onClick={() => copySlug(group.slug, group.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              {copiedSlug === group.id ? (
                                <CheckCheck className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {group.description}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {group.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                        {group.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            +{group.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {group.members_count.toLocaleString()} members
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {group.total_messages?.toLocaleString() || 0} messages
                          </span>
                        </div>
                        {group.new_members_week && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              +{group.new_members_week} this week
                            </span>
                          </div>
                        )}
                        {group.requires_approval && group.pending_approvals_count && group.pending_approvals_count > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {group.pending_approvals_count} pending {group.pending_approvals_count === 1 ? 'approval' : 'approvals'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getActivityBadge(group.activity_level)}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {group.last_active ? (
                              <>Last active {new Date(group.last_active).toLocaleDateString()}</>
                            ) : (
                              'No activity'
                            )}
                          </span>
                        </div>
                        {group.messages_today ? (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {group.messages_today} messages today
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        {getStatusBadge(group.status)}
                        <div className="flex items-center gap-1">
                          {group.is_private ? (
                            <Lock className="w-3 h-3 text-amber-500" />
                          ) : (
                            <Globe className="w-3 h-3 text-emerald-500" />
                          )}
                          <span className="text-xs text-gray-500">
                            {group.is_private ? 'Private' : 'Public'}
                          </span>
                          {group.requires_approval && (
                            <Badge variant="outline" className="text-xs ml-1">
                              Approval
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewModal(group)}
                          className="text-gray-600 hover:text-blue-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(group)}
                          className="text-gray-600 hover:text-blue-600"
                          title="Edit Group"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openManageModerators(group)}
                          className="text-gray-600 hover:text-purple-600"
                          title="Manage Moderators"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        {group.requires_approval && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPendingApprovals(group)}
                            className="text-gray-600 hover:text-amber-600 relative"
                            title="Pending Approvals"
                          >
                            <UserPlus className="w-4 h-4" />
                            {group.pending_approvals_count && group.pending_approvals_count > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                                {group.pending_approvals_count}
                              </span>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowDeleteModal(true);
                          }}
                          className="text-gray-600 hover:text-red-600"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Quick status change */}
                      {group.status === 'active' && (
                        <div className="flex justify-end gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateGroupStatus(group.id, 'archived')}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Archive
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateGroupStatus(group.id, 'suspended')}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Suspend
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No groups found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Create your first group to get started'}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-3xl w-full">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle>Create New Group</CardTitle>
              </CardHeader>
              <CardContent className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <form onSubmit={(e) => { e.preventDefault(); createGroup(); }} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Group Name *</label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., Trading Strategies"
                          required
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Slug *</label>
                        <div className="flex gap-2">
                          <Input
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            placeholder="trading-strategies"
                            required
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }))}
                          >
                            Generate
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          URL-friendly name. Must be unique.
                        </p>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Description *</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                          placeholder="Describe the purpose of this group..."
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Group Icon</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                          {iconPreview ? (
                            <div className="relative">
                              <img src={iconPreview} alt="Icon preview" className="w-24 h-24 mx-auto rounded-lg object-cover" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0"
                                onClick={() => {
                                  setIconPreview(null);
                                  setFormData(prev => ({ ...prev, icon: null }));
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 mb-2">Upload icon (optional)</p>
                              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('icon-upload')?.click()}>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                              </Button>
                            </div>
                          )}
                          <input
                            id="icon-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleIconUpload}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Cover Image</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                          {coverPreview ? (
                            <div className="relative">
                              <img src={coverPreview} alt="Cover preview" className="w-full h-24 object-cover rounded-lg" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0"
                                onClick={() => {
                                  setCoverPreview(null);
                                  setFormData(prev => ({ ...prev, cover_image: null }));
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 mb-2">Upload cover image (optional)</p>
                              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('cover-upload')?.click()}>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                              </Button>
                            </div>
                          )}
                          <input
                            id="cover-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverUpload}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="is_private"
                          checked={formData.is_private}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <span className="font-medium">Private Group</span>
                          <p className="text-sm text-gray-500">
                            Only members can see posts and comments
                          </p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="requires_approval"
                          checked={formData.requires_approval}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <span className="font-medium">Requires Approval</span>
                          <p className="text-sm text-gray-500">
                            New members need admin approval to join
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tags</h3>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag}>Add</Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Rules */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Group Rules</h3>
                    <div className="space-y-3">
                      {formData.rules.map((rule, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={rule}
                            onChange={(e) => handleRuleChange(index, e.target.value)}
                            placeholder={`Rule ${index + 1}`}
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRule(index)}
                              className="text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addRule}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Rule
                      </Button>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setShowCreateModal(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Create Group
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-3xl w-full">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle>Edit Group: {selectedGroup.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <form onSubmit={(e) => { e.preventDefault(); updateGroup(); }} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Group Name *</label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Slug *</label>
                        <div className="flex gap-2">
                          <Input
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            required
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }))}
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">Description *</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Group Icon</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                          {iconPreview ? (
                            <div className="relative">
                              <img src={iconPreview} alt="Icon preview" className="w-24 h-24 mx-auto rounded-lg object-cover" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0"
                                onClick={() => {
                                  setIconPreview(null);
                                  setFormData(prev => ({ ...prev, icon: null }));
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 mb-2">
                                {selectedGroup.icon ? 'Replace icon' : 'Upload icon (optional)'}
                              </p>
                              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('edit-icon-upload')?.click()}>
                                <Upload className="w-4 h-4 mr-2" />
                                {selectedGroup.icon ? 'Change' : 'Choose File'}
                              </Button>
                            </div>
                          )}
                          <input
                            id="edit-icon-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleIconUpload}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Cover Image</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                          {coverPreview ? (
                            <div className="relative">
                              <img src={coverPreview} alt="Cover preview" className="w-full h-24 object-cover rounded-lg" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0"
                                onClick={() => {
                                  setCoverPreview(null);
                                  setFormData(prev => ({ ...prev, cover_image: null }));
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 mb-2">
                                {selectedGroup.cover_image ? 'Replace cover' : 'Upload cover image (optional)'}
                              </p>
                              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('edit-cover-upload')?.click()}>
                                <Upload className="w-4 h-4 mr-2" />
                                {selectedGroup.cover_image ? 'Change' : 'Choose File'}
                              </Button>
                            </div>
                          )}
                          <input
                            id="edit-cover-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverUpload}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="is_private"
                          checked={formData.is_private}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <span className="font-medium">Private Group</span>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="requires_approval"
                          checked={formData.requires_approval}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <span className="font-medium">Requires Approval</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tags</h3>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag}>Add</Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Rules */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Group Rules</h3>
                    <div className="space-y-3">
                      {formData.rules.map((rule, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={rule}
                            onChange={(e) => handleRuleChange(index, e.target.value)}
                            placeholder={`Rule ${index + 1}`}
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRule(index)}
                              className="text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addRule}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Rule
                      </Button>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setShowEditModal(false);
                        setSelectedGroup(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle>Delete Group</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <strong>{selectedGroup.name}</strong>? This action cannot be undone.
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                    <li>All group messages and content</li>
                    <li>Member associations</li>
                    <li>Group settings and rules</li>
                  </ul>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedGroup(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={deleteGroup}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Group
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Manage Moderators Modal */}
      {showManageModeratorsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle>Manage Moderators - {selectedGroup.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <p className="text-sm text-gray-500 mb-4">
                  Select users to add as moderators. Moderators can manage messages and members.
                </p>
                
                <div className="space-y-3 mb-6">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedModerators.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModerators([...selectedModerators, user.id]);
                            } else {
                              setSelectedModerators(selectedModerators.filter(id => id !== user.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                        {user.role}
                      </Badge>
                    </label>
                  ))}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManageModeratorsModal(false);
                      setSelectedGroup(null);
                      setSelectedModerators([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    onClick={saveModerators}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Save Moderators
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* View Group Modal */}
      {showViewGroupModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-4xl w-full">
            <Card className="border-0 shadow-xl overflow-hidden">
              {/* Cover Image */}
              {selectedGroup.cover_image && (
                <div className="h-48 w-full overflow-hidden">
                  <img 
                    src={selectedGroup.cover_image} 
                    alt={selectedGroup.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 relative">
                {!selectedGroup.cover_image && (
                  <div className="absolute -top-12 left-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center border-4 border-white dark:border-gray-800">
                      {selectedGroup.icon ? (
                        <img src={selectedGroup.icon} alt={selectedGroup.name} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <Hash className="w-10 h-10 text-white" />
                      )}
                    </div>
                  </div>
                )}
                
                <div className={selectedGroup.cover_image ? 'mt-0' : 'mt-12'}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedGroup.name}</CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedGroup.description}</p>
                    </div>
                    {getStatusBadge(selectedGroup.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Left Column - Stats */}
                  <div className="col-span-1 space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Group Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Members:</span>
                          <span className="font-medium">{selectedGroup.members_count.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Online now:</span>
                          <span className="font-medium text-emerald-600">{selectedGroup.online_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created:</span>
                          <span className="font-medium">{new Date(selectedGroup.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last updated:</span>
                          <span className="font-medium">{new Date(selectedGroup.updated_at).toLocaleDateString()}</span>
                        </div>
                        {selectedGroup.requires_approval && selectedGroup.pending_approvals_count && selectedGroup.pending_approvals_count > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Pending approvals:</span>
                            <span className="font-medium text-amber-600">{selectedGroup.pending_approvals_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Privacy</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {selectedGroup.is_private ? (
                            <Lock className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Globe className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className="text-sm">
                            {selectedGroup.is_private ? 'Private Group' : 'Public Group'}
                          </span>
                        </div>
                        {selectedGroup.requires_approval && (
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">Membership requires approval</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedGroup.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="bg-white dark:bg-gray-800">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Details */}
                  <div className="col-span-2 space-y-4">
                    {/* Created By */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Created By</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedGroup.created_by.name}</p>
                          <p className="text-sm text-gray-500">{selectedGroup.created_by.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Moderators */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Moderators</h4>
                      {selectedGroup.moderators.length > 0 ? (
                        <div className="space-y-3">
                          {selectedGroup.moderators.map((mod) => (
                            <div key={mod.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                  <Shield className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium">{mod.name}</p>
                                  <p className="text-xs text-gray-500">{mod.email}</p>
                                </div>
                              </div>
                              <Badge className={mod.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                                {mod.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No moderators assigned</p>
                      )}
                    </div>
                    
                    {/* Rules */}
                    {selectedGroup.rules && selectedGroup.rules.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Group Rules</h4>
                        <ol className="list-decimal list-inside space-y-2">
                          {selectedGroup.rules.map((rule, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                              {rule}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowViewGroupModal(false);
                      setSelectedGroup(null);
                    }}
                  >
                    Close
                  </Button>
                  {selectedGroup.requires_approval && selectedGroup.pending_approvals_count && selectedGroup.pending_approvals_count > 0 && (
                    <Button
                      onClick={() => {
                        setShowViewGroupModal(false);
                        openPendingApprovals(selectedGroup);
                      }}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Review Approvals ({selectedGroup.pending_approvals_count})
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setShowViewGroupModal(false);
                      openEditModal(selectedGroup);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Pending Approvals Modal */}
      {showPendingApprovalsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle>Pending Approvals - {selectedGroup.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Review and approve users who requested to join this group
                </p>
              </CardHeader>
              <CardContent className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {isLoadingPending ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : pendingMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No pending approvals</h3>
                    <p className="text-sm text-gray-500">
                      There are no users waiting to join this group
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Bulk Actions */}
                    <div className="flex justify-end mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveAllMembers(selectedGroup.id)}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve All ({pendingMembers.length})
                      </Button>
                    </div>

                    {/* Pending Members List */}
                    <div className="space-y-3">
                      {pendingMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              {member.user.avatar ? (
                                <img
                                  src={member.user.avatar}
                                  alt={member.user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {member.user.name}
                              </p>
                              <p className="text-sm text-gray-500">{member.user.email}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Requested {new Date(member.requested_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => approveMember(selectedGroup.id, member.user_id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => rejectMember(selectedGroup.id, member.user_id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Close Button */}
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPendingApprovalsModal(false);
                      setSelectedGroup(null);
                      setPendingMembers([]);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}