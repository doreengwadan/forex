// components/trading/OpenTrades.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertCircle, TrendingUp, TrendingDown, X, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';


interface Trade {
  id: string;
  asset: string;
  type: 'buy' | 'sell';
  amount: number;
  entryPrice: number;
  currentPrice: number;
  profitLoss: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: string;
}

const OpenTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOpenTrades = async () => {
    try {
      // Mock API call - replace with real API endpoint
      // const response = await fetch('/api/trade/open-trades');
      // const data = await response.json();
      
      // Mock data for demo
      const mockTrades: Trade[] = [
        {
          id: '1',
          asset: 'BTC/USD',
          type: 'buy',
          amount: 0.5,
          entryPrice: 45000,
          currentPrice: 45234.56,
          profitLoss: 117.28,
          leverage: 10,
          stopLoss: 44000,
          takeProfit: 46000,
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: '2',
          asset: 'ETH/USD',
          type: 'sell',
          amount: 2,
          entryPrice: 3000,
          currentPrice: 2987.45,
          profitLoss: 25.1,
          leverage: 5,
          stopLoss: 3100,
          takeProfit: 2900,
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        },
        {
          id: '3',
          asset: 'EUR/USD',
          type: 'buy',
          amount: 1000,
          entryPrice: 1.08,
          currentPrice: 1.0823,
          profitLoss: 2.3,
          leverage: 20,
          createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        },
      ];
      
      setTrades(mockTrades);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setError('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenTrades();
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      // Update prices with random fluctuations
      setTrades(prev => prev.map(trade => ({
        ...trade,
        currentPrice: trade.currentPrice + (Math.random() - 0.5) * trade.currentPrice * 0.001,
        profitLoss: trade.type === 'buy' 
          ? (trade.currentPrice - trade.entryPrice) * trade.amount * trade.leverage
          : (trade.entryPrice - trade.currentPrice) * trade.amount * trade.leverage,
      })));
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const closeTrade = async (tradeId: string) => {
    setClosingTradeId(tradeId);
    setError(null);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, this would be:
      // const response = await fetch(`/api/trade/close/${tradeId}`, {
      //   method: 'POST',
      // });
      // const data = await response.json();
      
      // Mock success
      // Remove closed trade from list
      setTrades(prev => prev.filter(trade => trade.id !== tradeId));
      
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setClosingTradeId(null);
    }
  };

  const closeAllTrades = async () => {
    if (!confirm('Are you sure you want to close all open trades?')) return;
    
    setError(null);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app:
      // const response = await fetch('/api/trade/close-all', {
      //   method: 'POST',
      // });
      // const data = await response.json();
      
      setTrades([]);
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const getAssetIcon = (asset: string) => {
    const icons: { [key: string]: string } = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'EUR': '€',
      'GBP': '£',
      'XAU': '🪙',
      'AAPL': '📱',
      'TSLA': '🚗',
      'OIL': '🛢️',
    };
    
    const symbol = asset.split('/')[0];
    return icons[symbol] || '💹';
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Open Trades</CardTitle>
        </CardHeader>
        <CardContent>
          
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Open Trades ({trades.length})</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOpenTrades}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {trades.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={closeAllTrades}
            >
              Close All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {trades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No open trades</div>
            <div className="text-sm text-gray-500">Open your first trade using the trading panel</div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className={`p-4 rounded-lg border ${
                  trade.type === 'buy'
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getAssetIcon(trade.asset)}</div>
                    <div>
                      <div className="font-bold">{trade.asset}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(trade.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={trade.type === 'buy' ? 'default' : 'destructive'}
                    className={trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}
                  >
                    {trade.type.toUpperCase()} {trade.leverage}x
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-400">Entry Price</div>
                    <div className="font-medium">${trade.entryPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Current Price</div>
                    <div className="font-medium">${trade.currentPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Amount</div>
                    <div className="font-medium">{trade.amount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">P&L</div>
                    <div className={`font-bold ${trade.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Stop Loss & Take Profit Indicators */}
                {(trade.stopLoss || trade.takeProfit) && (
                  <div className="flex gap-4 mb-3 text-xs">
                    {trade.stopLoss && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-gray-400">SL:</span>
                        <span>${trade.stopLoss.toFixed(2)}</span>
                      </div>
                    )}
                    {trade.takeProfit && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-400">TP:</span>
                        <span>${trade.takeProfit.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => closeTrade(trade.id)}
                    disabled={closingTradeId === trade.id}
                    className="gap-2"
                  >
                    {closingTradeId === trade.id ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Closing...
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        Close Trade
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {trades.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Unrealized P&L</span>
              <span className={`text-lg font-bold ${
                trades.reduce((sum, trade) => sum + trade.profitLoss, 0) >= 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {trades.reduce((sum, trade) => sum + trade.profitLoss, 0) >= 0 ? '+' : ''}$
                {trades.reduce((sum, trade) => sum + trade.profitLoss, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenTrades;