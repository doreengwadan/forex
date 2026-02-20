'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  TrendingUp, 
  Users, 
  Shield, 
  DollarSign, 
  BarChart3,
  Activity,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  RefreshCw,
  Bell,
  Settings,
  UserPlus,
  Filter,
  Calendar,
  Clock,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  LogOut,
  User
} from 'lucide-react';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types
interface TradingStat {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  icon: any;
  prefix?: string;
  suffix?: string;
}

interface Trade {
  asset: string;
  type: 'Long' | 'Short';
  entry: number;
  exit: number;
  profit: number;
  time: string;
}

interface Asset {
  name: string;
  symbol: string;
  performance: number;
  volume: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  name: string;
  role: string;
  account_type: string;
  status: string;
  demo_balance: number;
  balance: number;
}

interface DashboardStats {
  total_trades: number;
  win_rate: number;
  avg_profit: number;
  max_drawdown: number;
  portfolio_value: number;
  portfolio_change: number;
  recent_trades: Trade[];
  top_assets: Asset[];
}

// Simple chart data without external dependencies
const PortfolioGrowth = ({ data = [] }: { data?: Array<{ month: string; value: number }> }) => {
  const defaultData = [
    { month: 'Jan', value: 10000 },
    { month: 'Feb', value: 11200 },
    { month: 'Mar', value: 10800 },
    { month: 'Apr', value: 12500 },
    { month: 'May', value: 11800 },
    { month: 'Jun', value: 13500 },
    { month: 'Jul', value: 14200 },
  ];
  
  const chartData = data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...chartData.map(d => d.value));
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-end space-x-2">
          {chartData.map((point, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-8 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg relative group"
                style={{ height: `${(point.value / maxValue) * 100}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  ${point.value.toLocaleString()}
                </div>
              </div>
              <span className="text-xs text-gray-600 mt-2">{point.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PortfolioDistribution = ({ data = [] }: { data?: Array<{ name: string; value: number; color: string }> }) => {
  const defaultData = [
    { name: 'Stocks', value: 45, color: '#3b82f6' },
    { name: 'Crypto', value: 30, color: '#8b5cf6' },
    { name: 'Forex', value: 15, color: '#10b981' },
    { name: 'Options', value: 8, color: '#f59e0b' },
    { name: 'Cash', value: 2, color: '#ef4444' },
  ];
  
  const chartData = data.length > 0 ? data : defaultData;
  const totalValue = 14200; // This should come from props in a real implementation
  
  return (
    <div className="h-full flex items-center justify-center">
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
        </div>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {chartData.reduce((acc: any, segment, index) => {
            const startAngle = acc;
            const endAngle = startAngle + (segment.value / 100) * 360;
            
            const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
            const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
            const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
            const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
            
            const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
            
            const pathData = [
              `M 50 50`,
              `L ${startX} ${startY}`,
              `A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `Z`
            ].join(' ');
            
            return (
              <>
                {acc}
                <path 
                  key={index} 
                  d={pathData} 
                  fill={segment.color}
                  className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                />
              </>
            );
          }, 0)}
        </svg>
      </div>
      <div className="ml-4 space-y-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
            <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  // State management
  const [timeRange, setTimeRange] = useState('month');
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  
  // Data state
  const [tradingStats, setTradingStats] = useState<TradingStat[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [topAssets, setTopAssets] = useState<Asset[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioChange, setPortfolioChange] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [growthData, setGrowthData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);

  // Fallback data (used only if API fails)
  const fallbackTradingStats: TradingStat[] = [
    { name: 'Total Trades', value: 156, change: 12, trend: 'up', icon: Activity },
    { name: 'Win Rate', value: 68, change: 5, trend: 'up', icon: TrendingUp, suffix: '%' },
    { name: 'Avg Profit', value: 245, change: 8, trend: 'up', icon: DollarSign, prefix: '$' },
    { name: 'Max Drawdown', value: 12, change: -3, trend: 'down', icon: TrendingDown, suffix: '%' },
  ];

  const fallbackRecentTrades: Trade[] = [
    { asset: 'TSLA', type: 'Long', entry: 235.40, exit: 248.20, profit: 12.80, time: '2 min ago' },
    { asset: 'AAPL', type: 'Short', entry: 178.90, exit: 175.30, profit: 3.60, time: '15 min ago' },
    { asset: 'BTC/USD', type: 'Long', entry: 42150, exit: 43280, profit: 1130, time: '1 hour ago' },
    { asset: 'MSFT', type: 'Long', entry: 405.60, exit: 412.40, profit: 6.80, time: '2 hours ago' },
  ];

  const fallbackTopAssets: Asset[] = [
    { name: 'Bitcoin', symbol: 'BTC', performance: 24.5, volume: 32.1 },
    { name: 'Tesla', symbol: 'TSLA', performance: 12.8, volume: 15.6 },
    { name: 'Apple', symbol: 'AAPL', performance: 8.3, volume: 28.4 },
    { name: 'Microsoft', symbol: 'MSFT', performance: 6.9, volume: 18.7 },
  ];

  // Helper function for API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      ...options
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
      
      if (response.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
        window.location.href = '/login';
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setMounted(true);
        setLoading(false);
        return;
      }

      try {
        const data = await apiCall('/user');
        if (data) {
          setUser(data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setMounted(true);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !mounted) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch dashboard stats
        const statsData = await apiCall('/dashboard/stats');
        if (statsData) {
          // Transform API data to component format
          const formattedStats: TradingStat[] = [
            { 
              name: 'Total Trades', 
              value: statsData.total_trades, 
              change: 12,   // If you have change data from API, use it; otherwise keep static or derive
              trend: 'up', 
              icon: Activity 
            },
            { 
              name: 'Win Rate', 
              value: statsData.win_rate, 
              change: 5, 
              trend: 'up', 
              icon: TrendingUp,
              suffix: '%'
            },
            { 
              name: 'Avg Profit', 
              value: statsData.avg_profit, 
              change: 8, 
              trend: 'up', 
              icon: DollarSign,
              prefix: '$'
            },
            { 
              name: 'Max Drawdown', 
              value: statsData.max_drawdown, 
              change: -3, 
              trend: 'down', 
              icon: TrendingDown,
              suffix: '%'
            },
          ];
          setTradingStats(formattedStats);
          
          // Set recent trades and top assets if available
          if (statsData.recent_trades) {
            setRecentTrades(statsData.recent_trades);
          }
          if (statsData.top_assets) {
            setTopAssets(statsData.top_assets);
          }

          // Set portfolio value and change from stats
          setPortfolioValue(statsData.portfolio_value || 0);
          setPortfolioChange(statsData.portfolio_change || 0);
        }

        // You can also fetch growth/distribution data from other endpoints if available
        // For now, keep them empty

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        
        // Set fallback data
        setTradingStats(fallbackTradingStats);
        setRecentTrades(fallbackRecentTrades);
        setTopAssets(fallbackTopAssets);
        // Also set fallback portfolio values if needed
        setPortfolioValue(14200.50);
        setPortfolioChange(24.5);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, mounted]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isAuthenticated) {
        const statsData = await apiCall('/dashboard/stats');
        if (statsData) {
          // Update state with new data (similar to above)
          setTradingStats([
            { name: 'Total Trades', value: statsData.total_trades, change: 12, trend: 'up', icon: Activity },
            { name: 'Win Rate', value: statsData.win_rate, change: 5, trend: 'up', icon: TrendingUp, suffix: '%' },
            { name: 'Avg Profit', value: statsData.avg_profit, change: 8, trend: 'up', icon: DollarSign, prefix: '$' },
            { name: 'Max Drawdown', value: statsData.max_drawdown, change: -3, trend: 'down', icon: TrendingDown, suffix: '%' },
          ]);
          if (statsData.recent_trades) setRecentTrades(statsData.recent_trades);
          if (statsData.top_assets) setTopAssets(statsData.top_assets);
          setPortfolioValue(statsData.portfolio_value);
          setPortfolioChange(statsData.portfolio_change);
        }
      }
      setHasUnreadNotifications(false);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const handleLogout = async () => {
    try {
      await apiCall('/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <ArrowUp className="w-4 h-4 text-green-500" /> : 
      <ArrowDown className="w-4 h-4 text-red-500" />;
  };

  // Navigation items for the sidebar card
  const navItems = [
    { name: 'Dashboard', icon: Zap, href: '/dashboard', color: 'blue' },
    { name: 'Trades', icon: Activity, href: '/trades', color: 'purple' },
    { name: 'Portfolio', icon: PieChartIcon, href: '/portfolio', color: 'green' },
    { name: 'Analysis', icon: BarChart3, href: '/analysis', color: 'orange' },
    { name: 'Settings', icon: Settings, href: '/settings', color: 'gray' },
    { name: 'Invite', icon: UserPlus, href: '/invite', color: 'red' },
  ];

  // Loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isAuthenticated ? 'Checking authentication...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Authenticated</h2>
          <p className="text-gray-600 mb-6">Please log in to access the trading dashboard.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      
      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tradingStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold mt-2">
                        {stat.prefix || ''}
                        {stat.value.toLocaleString()}
                        {stat.suffix || ''}
                      </p>
                      <div className="flex items-center mt-1">
                        {getTrendIcon(stat.trend)}
                        <span className={`text-sm ml-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.trend === 'up' ? '+' : ''}{stat.change}%
                        </span>
                        <span className="text-sm text-gray-500 ml-2">vs last month</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Portfolio Overview */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Portfolio Value Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100">Total Portfolio Value</p>
                  <h2 className="text-3xl font-bold mt-2">
                    ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  <div className="flex items-center mt-4">
                    <ArrowUp className="w-5 h-5 text-green-300 mr-2" />
                    <span className="text-green-300 font-medium">+{portfolioChange}%</span>
                    <span className="text-blue-200 ml-2">this month</span>
                  </div>
                </div>
                {/* Removed demo badge and starting balance text */}
              </div>
            </div>

            {/* Market Status */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Market Status</h3>
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Markets Open</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">NASDAQ</div>
                  <div className="text-xl font-bold text-gray-900">16,289.34</div>
                  <div className="text-sm text-green-600 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    +1.2%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">S&P 500</div>
                  <div className="text-xl font-bold text-gray-900">5,123.45</div>
                  <div className="text-sm text-green-600 flex items-center">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    +0.8%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Portfolio Growth */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LineChartIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Portfolio Growth</h3>
                    <p className="text-sm text-gray-600">Last 7 months</p>
                  </div>
                </div>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div className="h-64">
                <PortfolioGrowth data={growthData} />
              </div>
            </div>

            {/* Portfolio Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <PieChartIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Portfolio Allocation</h3>
                    <p className="text-sm text-gray-600">Asset distribution</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Rebalance
                </button>
              </div>
              <div className="h-64">
                <PortfolioDistribution data={distributionData} />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Trades */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Trades</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentTrades.map((trade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        trade.type === 'Long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        <span className="font-bold">{trade.asset.substring(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{trade.asset}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className={trade.type === 'Long' ? 'text-green-600' : 'text-red-600'}>
                            {trade.type}
                          </span>
                          <span>•</span>
                          <span>${trade.entry.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${trade.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.profit > 0 ? '+' : ''}$
                        {trade.profit > 1000 
                          ? (trade.profit/1000).toFixed(1) + 'k' 
                          : trade.profit.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {trade.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Assets */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Assets</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Explore
                </button>
              </div>
              <div className="space-y-4">
                {topAssets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {asset.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{asset.name}</div>
                        <div className="text-sm text-gray-600">{asset.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${asset.performance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {asset.performance > 0 ? '+' : ''}{asset.performance}%
                      </div>
                      <div className="text-sm text-gray-500">Vol: ${asset.volume}M</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Card (replaces Quick Actions) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Navigation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const colorClasses = {
                  blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
                  purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
                  green: 'from-green-50 to-green-100 border-green-200 text-green-600',
                  orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600',
                  gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-600',
                  red: 'from-red-50 to-red-100 border-red-200 text-red-600',
                }[item.color];

                return (
                  <Link key={item.name} href={item.href} passHref>
                    <div className={`flex flex-col items-center justify-center h-24 gap-2 bg-gradient-to-br ${colorClasses} hover:from-${item.color}-100 hover:to-${item.color}-200 border rounded-xl transition-all hover:scale-105 cursor-pointer`}>
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Demo Info section completely removed */}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-gray-200 bg-white">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Trading Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="/support" className="hover:text-blue-600 transition-colors">Support</a>
              {/* Removed account type indicator */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}