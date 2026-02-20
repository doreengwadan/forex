// components/trading/BalanceDisplay.tsx - Remove useSession
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { RefreshCw, Wallet, TrendingUp, DollarSign } from 'lucide-react';

interface BalanceData {
  total_balance: number;
  available_balance: number;
  margin_used: number;
  unrealized_pnl: number;
  account_type: 'real' | 'demo';
}

const BalanceDisplay = () => {
  const [balanceData, setBalanceData] = useState<BalanceData>({
    total_balance: 10000,
    available_balance: 8500,
    margin_used: 1500,
    unrealized_pnl: 234.56,
    account_type: 'demo',
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      // Mock data update
      setBalanceData(prev => ({
        ...prev,
        unrealized_pnl: prev.unrealized_pnl + (Math.random() - 0.5) * 100,
        available_balance: prev.total_balance - prev.margin_used,
      }));
      setRefreshing(false);
    }, 1000);
  };

  const switchAccountType = () => {
    setBalanceData(prev => ({
      ...prev,
      account_type: prev.account_type === 'real' ? 'demo' : 'real',
      total_balance: prev.account_type === 'real' ? 10000 : 5000, // Reset to demo/real amounts
      available_balance: prev.account_type === 'real' ? 8500 : 4250,
    }));
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">Account Balance</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBalance}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Type Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Account Type</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={switchAccountType}
            className={`${
              balanceData.account_type === 'real'
                ? 'border-green-500 text-green-500'
                : 'border-blue-500 text-blue-500'
            }`}
          >
            {balanceData.account_type === 'real' ? 'REAL ACCOUNT' : 'DEMO ACCOUNT'}
          </Button>
        </div>

        {/* Total Balance */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Balance</span>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-2xl font-bold">
                ${balanceData.total_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Available Balance */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Available Balance</span>
            <span className="text-lg font-semibold text-green-400">
              ${balanceData.available_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{
                width: `${Math.min(100, (balanceData.available_balance / balanceData.total_balance) * 100)}%`
              }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-gray-400">Margin Used</span>
            </div>
            <span className="text-sm font-medium">
              ${balanceData.margin_used.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className={`h-3 w-3 ${balanceData.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              <span className="text-xs text-gray-400">Unrealized P&L</span>
            </div>
            <span className={`text-sm font-medium ${balanceData.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {balanceData.unrealized_pnl >= 0 ? '+' : ''}$
              {balanceData.unrealized_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => alert('Deposit feature - Coming soon!')}>
            Deposit
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => alert('Withdraw feature - Coming soon!')}>
            Withdraw
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceDisplay;