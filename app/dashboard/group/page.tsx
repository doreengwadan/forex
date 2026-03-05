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
  Search,
  Check,
  Lock,
  Globe,
  User,
  Shield,
  ShieldAlert,
  MessageSquare,
  LogIn,
  LogOut,
  Clock,
  BookOpen,
  Tag,
  ChevronRight,
  Home,
  Grid,
  List,
  Filter,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

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
  is_member?: boolean;
  membership_status?: 'pending' | 'approved' | 'banned' | null;
  joined_at?: string;
}

interface GroupModerator {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'moderator';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function UserGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Tab
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Selected group for details modal
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  
  // All available tags for filtering
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || '';
    }
    return '';
  };

  // Get current user ID from token
  const getCurrentUserId = () => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.user_id || payload.id;
    } catch {
      return null;
    }
  };

  // Load memberships from localStorage with user-specific key
  const loadMembershipsFromStorage = () => {
    const userId = getCurrentUserId();
    if (!userId) return {};
    
    const storageKey = `group_memberships_${userId}`;
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  };

  // Save memberships to localStorage with user-specific key
  const saveMembershipsToStorage = (memberships: Record<number, any>) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    const storageKey = `group_memberships_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(memberships));
  };

  // Fetch groups with membership status
  const fetchGroups = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      const userId = getCurrentUserId();
      
      // Load user-specific memberships from localStorage first
      const localMemberships = loadMembershipsFromStorage();
      
      // First, get all groups
      const response = await fetch(`${API_BASE_URL}/admin/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Try to fetch user's group memberships from API
        let apiMemberships: Record<number, { is_member: boolean; membership_status: string; joined_at?: string }> = {};
        
        try {
          const membershipsResponse = await fetch(`${API_BASE_URL}/user/group-memberships`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            credentials: 'include',
          });
          
          if (membershipsResponse.ok) {
            const membershipsData = await membershipsResponse.json();
            // Create a lookup object from API
            membershipsData.memberships?.forEach((m: any) => {
              apiMemberships[m.group_id] = {
                is_member: true,
                membership_status: m.status,
                joined_at: m.joined_at,
              };
            });
          }
        } catch (error) {
          console.error('Error fetching memberships from API:', error);
        }
        
        // Merge API memberships with localStorage memberships (API takes precedence)
        const allMemberships = { ...localMemberships, ...apiMemberships };
        
        // Merge membership data with groups
        const groupsWithMembership = data.groups?.map((group: Group) => ({
          ...group,
          is_member: allMemberships[group.id]?.is_member || false,
          membership_status: allMemberships[group.id]?.membership_status || null,
          joined_at: allMemberships[group.id]?.joined_at,
        })) || [];
        
        setGroups(groupsWithMembership);
        setFilteredGroups(groupsWithMembership);
        
        // Save to localStorage for persistence (using API data primarily)
        const membershipsToSave: Record<number, any> = {};
        groupsWithMembership.forEach((group: Group) => {
          if (group.is_member) {
            membershipsToSave[group.id] = {
              is_member: group.is_member,
              membership_status: group.membership_status,
              joined_at: group.joined_at,
            };
          }
        });
        saveMembershipsToStorage(membershipsToSave);
        
        // Extract all unique tags
        const tags = new Set<string>();
        groupsWithMembership.forEach((group: Group) => {
          group.tags?.forEach(tag => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());
      } else {
        // Demo data with membership status from localStorage
        const demoGroups = getDemoGroups();
        const memberships = localMemberships;
        
        const groupsWithMembership = demoGroups.map(group => ({
          ...group,
          is_member: memberships[group.id]?.is_member || false,
          membership_status: memberships[group.id]?.membership_status || null,
          joined_at: memberships[group.id]?.joined_at,
        }));
        
        setGroups(groupsWithMembership);
        setFilteredGroups(groupsWithMembership);
        
        const tags = new Set<string>();
        groupsWithMembership.forEach(group => {
          group.tags?.forEach(tag => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      // Demo data with localStorage
      const demoGroups = getDemoGroups();
      const memberships = loadMembershipsFromStorage();
      
      const groupsWithMembership = demoGroups.map(group => ({
        ...group,
        is_member: memberships[group.id]?.is_member || false,
        membership_status: memberships[group.id]?.membership_status || null,
        joined_at: memberships[group.id]?.joined_at,
      }));
      
      setGroups(groupsWithMembership);
      setFilteredGroups(groupsWithMembership);
      
      const tags = new Set<string>();
      groupsWithMembership.forEach(group => {
        group.tags?.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags).sort());
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch my groups
  const fetchMyGroups = async () => {
    if (activeTab !== 'my-groups') return;
    
    setIsLoading(true);
    
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/groups/my-groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyGroups(data.groups || []);
        
        // Update localStorage with latest memberships
        const memberships: Record<number, any> = {};
        data.groups?.forEach((group: Group) => {
          memberships[group.id] = {
            is_member: true,
            membership_status: group.membership_status || 'approved',
            joined_at: group.joined_at,
          };
        });
        saveMembershipsToStorage(memberships);
      } else {
        // Get from localStorage
        const memberships = loadMembershipsFromStorage();
        const memberGroupIds = Object.keys(memberships).map(Number);
        const demoGroups = getDemoGroups().filter(g => memberGroupIds.includes(g.id));
        
        setMyGroups(demoGroups.map(g => ({
          ...g,
          is_member: true,
          membership_status: memberships[g.id]?.membership_status || 'approved',
          joined_at: memberships[g.id]?.joined_at,
        })));
      }
    } catch (error) {
      console.error('Error fetching my groups:', error);
      // Get from localStorage
      const memberships = loadMembershipsFromStorage();
      const memberGroupIds = Object.keys(memberships).map(Number);
      const demoGroups = getDemoGroups().filter(g => memberGroupIds.includes(g.id));
      
      setMyGroups(demoGroups.map(g => ({
        ...g,
        is_member: true,
        membership_status: memberships[g.id]?.membership_status || 'approved',
        joined_at: memberships[g.id]?.joined_at,
      })));
    } finally {
      setIsLoading(false);
    }
  };

  // Join group
  const joinGroup = async (groupId: number) => {
    setIsJoining(groupId);
    setError(null);
    
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update localStorage for persistence
        const memberships = loadMembershipsFromStorage();
        
        memberships[groupId] = {
          is_member: true,
          membership_status: data.status || 'approved',
          joined_at: new Date().toISOString(),
        };
        
        saveMembershipsToStorage(memberships);
        
        // Update groups list
        setGroups(prev => prev.map(g => 
          g.id === groupId 
            ? { 
                ...g, 
                is_member: true, 
                membership_status: data.status || 'approved',
                members_count: g.members_count + 1,
                joined_at: new Date().toISOString(),
              } 
            : g
        ));
        
        setFilteredGroups(prev => prev.map(g => 
          g.id === groupId 
            ? { 
                ...g, 
                is_member: true, 
                membership_status: data.status || 'approved',
                members_count: g.members_count + 1,
                joined_at: new Date().toISOString(),
              } 
            : g
        ));
        
        if (data.status === 'pending') {
          setSuccess('Join request sent successfully! You will be notified when approved.');
        } else {
          setSuccess('Successfully joined the group!');
        }
        
        // Refresh my groups if on that tab
        if (activeTab === 'my-groups') {
          fetchMyGroups();
        }
      } else {
        setError(data.message || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsJoining(null);
    }
  };

  // Leave group
  const leaveGroup = async (groupId: number) => {
    setIsJoining(groupId);
    setError(null);
    
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        // Update localStorage
        const memberships = loadMembershipsFromStorage();
        
        delete memberships[groupId];
        saveMembershipsToStorage(memberships);
        
        // Update groups list
        setGroups(prev => prev.map(g => 
          g.id === groupId 
            ? { 
                ...g, 
                is_member: false, 
                membership_status: null,
                joined_at: undefined,
                members_count: Math.max(0, g.members_count - 1) 
              } 
            : g
        ));
        
        setFilteredGroups(prev => prev.map(g => 
          g.id === groupId 
            ? { 
                ...g, 
                is_member: false, 
                membership_status: null,
                joined_at: undefined,
                members_count: Math.max(0, g.members_count - 1) 
              } 
            : g
        ));
        
        // Remove from my groups
        setMyGroups(prev => prev.filter(g => g.id !== groupId));
        
        setSuccess('Successfully left the group');
        
        // Close details modal if open
        if (selectedGroup?.id === groupId) {
          setShowGroupDetails(false);
          setSelectedGroup(null);
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsJoining(null);
    }
  };

  // Demo data
  const getDemoGroups = (): Group[] => [
    {
      id: 1,
      name: 'to wind',
      description: 'This one as well the new one',
      slug: 'to-wind',
      icon: null,
      cover_image: null,
      members_count: 2,
      online_count: 2,
      is_private: true,
      requires_approval: false,
      created_by: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
      },
      moderators: [],
      tags: ['trading', 'general'],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-02-20T15:30:00Z',
      status: 'active',
    },
    {
      id: 2,
      name: 'forex trading',
      description: 'This is the group where we are to create learn forex trading here',
      slug: 'forex-trading',
      icon: null,
      cover_image: null,
      members_count: 1,
      online_count: 1,
      is_private: true,
      requires_approval: true,
      created_by: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
      },
      moderators: [],
      tags: ['forex', 'trading', 'learning'],
      created_at: '2024-02-01T14:00:00Z',
      updated_at: '2024-02-19T09:15:00Z',
      status: 'active',
    },
  ];

  // Initial load
  useEffect(() => {
    fetchGroups();
  }, []);

  // Load my groups when tab changes
  useEffect(() => {
    if (activeTab === 'my-groups') {
      fetchMyGroups();
    }
  }, [activeTab]);

  // Filter groups based on search and filters
  useEffect(() => {
    let filtered = groups;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(g => 
        selectedTags.every(tag => g.tags.includes(tag))
      );
    }
    
    // Privacy filter
    if (showPrivateOnly) {
      filtered = filtered.filter(g => g.is_private);
    }
    
    // Only show active groups
    filtered = filtered.filter(g => g.status === 'active');
    
    setFilteredGroups(filtered);
  }, [searchQuery, selectedTags, showPrivateOnly, groups]);

  // Toggle tag filter
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setShowPrivateOnly(false);
  };

  // Format member count
  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Get membership badge
  const getMembershipBadge = (group: Group) => {
    if (!group.is_member) return null;
    
    if (group.membership_status === 'pending') {
      return <Badge className="bg-amber-500">Pending Approval</Badge>;
    }
    
    return <Badge className="bg-emerald-500">Member</Badge>;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Trading Communities
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Join groups to discuss trading strategies and share insights
                </p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('discover')}
                className={`px-4 py-2 text-sm transition-all ${
                  activeTab === 'discover' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Globe className="w-4 h-4 mr-2" />
                Discover
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('my-groups')}
                className={`px-4 py-2 text-sm transition-all ${
                  activeTab === 'my-groups' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                My Groups
                {myGroups.length > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white">
                    {myGroups.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

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

        {/* Search and Filters */}
        <Card className="mb-6 border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
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
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {(selectedTags.length > 0 || showPrivateOnly) && (
                    <Badge className="ml-2 bg-blue-600 text-white">
                      {selectedTags.length + (showPrivateOnly ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
                
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-r-none ${
                      viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={`rounded-l-none ${
                      viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Filters</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Privacy Filter */}
                  <div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showPrivateOnly}
                        onChange={(e) => setShowPrivateOnly(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>Private groups only</span>
                      <Lock className="w-3 h-3 text-gray-400" />
                    </label>
                  </div>
                  
                  {/* Tags Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Filter by tags
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                      {availableTags.map(tag => (
                        <Badge
                          key={tag}
                          className={`cursor-pointer ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                          {selectedTags.includes(tag) && (
                            <X className="w-3 h-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Groups Display */}
        {activeTab === 'discover' ? (
          <>
            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredGroups.length} groups
              </p>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group) => (
                  <Card 
                    key={group.id} 
                    className="border-0 shadow-xl bg-white dark:bg-gray-800 overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowGroupDetails(true);
                    }}
                  >
                    {/* Colored Header based on privacy */}
                    <div className={`h-2 w-full ${
                      group.is_private ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {group.is_private ? (
                              <>
                                <Lock className="w-3 h-3 text-amber-500" />
                                <span className="text-xs text-gray-500">Private</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-3 h-3 text-emerald-500" />
                                <span className="text-xs text-gray-500">Public</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Membership Badge */}
                        {getMembershipBadge(group) && (
                          <div>{getMembershipBadge(group)}</div>
                        )}
                      </div>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {group.description}
                      </p>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-3 text-sm mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{formatMemberCount(group.members_count)} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-xs text-emerald-600">{group.online_count} online</span>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      {group.is_member ? (
                        group.membership_status === 'pending' ? (
                          <Button 
                            className="w-full bg-amber-500 hover:bg-amber-600 cursor-default"
                            disabled
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Pending Approval
                          </Button>
                        ) : (
                          <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/groups/${group.id}/chat`;
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Chat
                          </Button>
                        )
                      ) : (
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            joinGroup(group.id);
                          }}
                          disabled={isJoining === group.id}
                        >
                          {isJoining === group.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            <>
                              <LogIn className="w-4 h-4 mr-2" />
                              Join Group
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <Card 
                    key={group.id} 
                    className="border-0 shadow-xl bg-white dark:bg-gray-800 hover:shadow-2xl transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowGroupDetails(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {group.name}
                            </h3>
                            {group.is_private ? (
                              <Lock className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Globe className="w-4 h-4 text-emerald-500" />
                            )}
                            {getMembershipBadge(group)}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {group.description}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span>{formatMemberCount(group.members_count)} members</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                              <span className="text-emerald-600">{group.online_count} online</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {group.is_member ? (
                            group.membership_status === 'pending' ? (
                              <Badge className="bg-amber-500">Pending</Badge>
                            ) : (
                              <Button 
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/groups/${group.id}/chat`;
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Chat
                              </Button>
                            )
                          ) : (
                            <Button 
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-purple-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                joinGroup(group.id);
                              }}
                              disabled={isJoining === group.id}
                            >
                              {isJoining === group.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <LogIn className="w-4 h-4 mr-2" />
                                  Join
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredGroups.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No groups found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery || selectedTags.length > 0 || showPrivateOnly
                    ? 'Try adjusting your filters'
                    : 'Check back later for new groups'}
                </p>
                {(searchQuery || selectedTags.length > 0 || showPrivateOnly) && (
                  <Button onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          /* My Groups Tab */
          <div>
            {myGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  You haven't joined any groups yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Discover and join groups to start chatting with fellow traders
                </p>
                <Button onClick={() => setActiveTab('discover')}>
                  <Globe className="w-4 h-4 mr-2" />
                  Discover Groups
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.map((group) => (
                  <Card key={group.id} className="border-0 shadow-xl bg-white dark:bg-gray-800 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {group.is_private ? (
                              <Lock className="w-3 h-3 text-amber-500" />
                            ) : (
                              <Globe className="w-3 h-3 text-emerald-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {group.is_private ? 'Private' : 'Public'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {group.description}
                      </p>
                      
                      <div className="flex items-center gap-3 text-sm mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{formatMemberCount(group.members_count)} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-xs text-emerald-600">{group.online_count} online</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                          onClick={() => {
                            window.location.href = `/groups/${group.id}/chat`;
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Chat
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => leaveGroup(group.id)}
                          disabled={isJoining === group.id}
                        >
                          {isJoining === group.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Group Details Modal - FIXED TRANSPARENCY */}
      {showGroupDetails && selectedGroup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="max-w-2xl w-full">
            <Card className="border-0 shadow-2xl bg-white dark:bg-gray-800 overflow-hidden">
              {/* Colored Header based on privacy */}
              <div className={`h-2 w-full ${
                selectedGroup.is_private ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedGroup.name}</CardTitle>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        {selectedGroup.is_private ? (
                          <>
                            <Lock className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Private Group</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Public Group</span>
                          </>
                        )}
                      </div>
                      {selectedGroup.requires_approval && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          Approval Required
                        </Badge>
                      )}
                      {getMembershipBadge(selectedGroup)}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="icon" onClick={() => setShowGroupDetails(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                {/* Description */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedGroup.description}
                  </p>
                </div>
                
                {/* Stats */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Group Stats</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Members</div>
                      <div className="text-xl font-bold">{selectedGroup.members_count}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Online Now</div>
                      <div className="text-xl font-bold text-emerald-600">{selectedGroup.online_count}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Created</div>
                      <div className="text-sm">{new Date(selectedGroup.created_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Tags</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedGroup.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {selectedGroup.is_member ? (
                    selectedGroup.membership_status === 'pending' ? (
                      <Button disabled className="flex-1 bg-amber-500">
                        <Clock className="w-4 h-4 mr-2" />
                        Pending Approval
                      </Button>
                    ) : (
                      <>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                          onClick={() => {
                            window.location.href = `/groups/${selectedGroup.id}/chat`;
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Open Chat
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => leaveGroup(selectedGroup.id)}
                          disabled={isJoining === selectedGroup.id}
                          className="px-6"
                        >
                          {isJoining === selectedGroup.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    )
                  ) : (
                    <>
                      <Button 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                        onClick={() => joinGroup(selectedGroup.id)}
                        disabled={isJoining === selectedGroup.id}
                      >
                        {isJoining === selectedGroup.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Join Group
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowGroupDetails(false)}
                      >
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}