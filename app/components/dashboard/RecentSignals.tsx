'use client';

import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TrendingUp, TrendingDown, Minus, Clock, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Signal {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: string;
  confidence: number;
  timestamp: Date;
  status: 'active' | 'hit_tp' | 'hit_sl' | 'closed';
}

const recentSignals: Signal[] = [
  {
    id: 1,
    symbol: 'EUR/USD',
    type: 'BUY',
    entryPrice: 1.0850,
    stopLoss: 1.0800,
    takeProfit: 1.0950,
    timeframe: '1H',
    confidence: 4,
    timestamp: new Date(Date.now() - 3600000),
    status: 'active',
  },
  {
    id: 2,
    symbol: 'BTC/USDT',
    type: 'SELL',
    entryPrice: 42000,
    stopLoss: 43000,
    takeProfit: 40000,
    timeframe: '4H',
    confidence: 3,
    timestamp: new Date(Date.now() - 7200000),
    status: 'hit_tp',
  },
  {
    id: 3,
    symbol: 'GBP/USD',
    type: 'HOLD',
    entryPrice: 1.2650,
    stopLoss: 1.2600,
    takeProfit: 1.2750,
    timeframe: '15M',
    confidence: 2,
    timestamp: new Date(Date.now() - 14400000),
    status: 'hit_sl',
  },
  {
    id: 4,
    symbol: 'AAPL',
    type: 'BUY',
    entryPrice: 185.50,
    stopLoss: 180.00,
    takeProfit: 195.00,
    timeframe: '1D',
    confidence: 5,
    timestamp: new Date(Date.now() - 21600000),
    status: 'active',
  },
];

export default function RecentSignals() {
  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Active</Badge>;
      case 'hit_tp':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">TP Hit</Badge>;
      case 'hit_sl':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">SL Hit</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Closed</Badge>;
    }
  };

  const getConfidenceBars = (confidence: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`w-1.5 h-3 rounded-full transition-all ${
              level <= confidence 
                ? level <= 2 ? 'bg-red-500' : 
                  level <= 3 ? 'bg-yellow-500' : 
                  'bg-green-500'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  return (
    <div className="space-y-4">
      {recentSignals.map((signal) => (
        <Card 
          key={signal.id} 
          className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-gray-200 dark:border-gray-800"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {getSignalIcon(signal.type)}
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                      {signal.symbol}
                    </h3>
                  </div>
                  
                  <Badge
                    variant={
                      signal.type === 'BUY'
                        ? 'default'
                        : signal.type === 'SELL'
                        ? 'destructive'
                        : 'outline'
                    }
                    className="text-xs"
                  >
                    {signal.type}
                  </Badge>
                  
                  {getStatusBadge(signal.status)}
                  
                  <div className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(signal.timestamp, { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Entry</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${formatPrice(signal.entryPrice)}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-red-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Stop Loss</p>
                    </div>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      ${formatPrice(signal.stopLoss)}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-green-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Take Profit</p>
                    </div>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      ${formatPrice(signal.takeProfit)}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                    <div className="flex items-center gap-2">
                      {getConfidenceBars(signal.confidence)}
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {signal.confidence}/5
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                      {signal.timeframe}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Risk: {Math.abs(((signal.stopLoss - signal.entryPrice) / signal.entryPrice * 100)).toFixed(2)}%
                    </span>
                  </div>
                  
                  <button className="text-primary hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {recentSignals.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No signals received yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Upgrade to premium to start receiving trading signals
            </p>
            <button className="mt-4 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
              Upgrade Now
            </button>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <button className="text-sm text-primary hover:text-purple-700 dark:hover:text-purple-400 font-medium transition-colors">
          View All Signals →
        </button>
      </div>
    </div>
  );
}