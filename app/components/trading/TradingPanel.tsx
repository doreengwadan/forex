// components/trading/TradingPanel.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';
import { Slider } from '../../components/ui/slider';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/Alert';

interface TradingPanelProps {
  selectedAsset: string;
  tradeType: 'buy' | 'sell';
  onTradeTypeChange: (type: 'buy' | 'sell') => void;
  onTradeSuccess: (message: string) => void;
  onTradeError: (message: string) => void;
  currentPrice?: number | null;
}

const TradingPanel = ({
  selectedAsset,
  tradeType,
  onTradeTypeChange,
  onTradeSuccess,
  onTradeError,
  currentPrice
}: TradingPanelProps) => {
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState([10]);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  const calculateMargin = () => {
    if (!amount || !currentPrice) return 0;
    const margin = (parseFloat(amount) * currentPrice) / leverage[0];
    return parseFloat(margin.toFixed(2));
  };

  const calculatePotentialProfit = () => {
    if (!amount || !currentPrice || !takeProfit) return 0;
    const priceDiff = Math.abs(parseFloat(takeProfit) - currentPrice);
    const profit = priceDiff * parseFloat(amount) * leverage[0];
    return parseFloat(profit.toFixed(2));
  };

  const calculatePotentialLoss = () => {
    if (!amount || !currentPrice || !stopLoss) return 0;
    const priceDiff = Math.abs(currentPrice - parseFloat(stopLoss));
    const loss = priceDiff * parseFloat(amount) * leverage[0];
    return parseFloat(loss.toFixed(2));
  };

  const calculateRiskRewardRatio = () => {
    const profit = calculatePotentialProfit();
    const loss = calculatePotentialLoss();
    if (!profit || !loss) return 0;
    return (profit / loss).toFixed(2);
  };

  const handleOpenTrade = async () => {
    // Demo mode check
    if (!demoMode) {
      onTradeError('Real trading is disabled in demo mode');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      onTradeError('Please enter a valid amount');
      return;
    }

    const margin = calculateMargin();
    if (margin <= 0) {
      onTradeError('Invalid margin calculation');
      return;
    }

    setLoading(true);
    try {
      // Mock API call - in real app, this would be a real fetch
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock trade data
      const mockTrade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        asset: selectedAsset,
        type: tradeType,
        amount: parseFloat(amount),
        leverage: leverage[0],
        entry_price: currentPrice || this.getDefaultPrice(selectedAsset),
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        take_profit: takeProfit ? parseFloat(takeProfit) : null,
        created_at: new Date().toISOString(),
        status: 'open'
      };

      // Store in localStorage for demo (optional)
      const existingTrades = JSON.parse(localStorage.getItem('demo_trades') || '[]');
      localStorage.setItem('demo_trades', JSON.stringify([...existingTrades, mockTrade]));

      onTradeSuccess(`DEMO: Trade opened successfully! Trade ID: ${mockTrade.id}`);
      
      // Reset form
      setAmount('');
      setStopLoss('');
      setTakeProfit('');
      
    } catch (error) {
      console.error('Trade error:', error);
      onTradeError('Failed to open trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get default price for asset
  const getDefaultPrice = (asset: string): number => {
    switch (asset) {
      case 'BTC/USD': return 45000;
      case 'ETH/USD': return 3000;
      case 'EUR/USD': return 1.08;
      case 'GBP/USD': return 1.26;
      case 'XAU/USD': return 1950;
      default: return 100;
    }
  };

  const handleQuickAmount = (value: number) => {
    if (!currentPrice) {
      onTradeError('Please wait for price to load');
      return;
    }
    const calculatedAmount = (value * 100) / currentPrice; // Convert USD to units
    setAmount(calculatedAmount.toFixed(4));
  };

  const requiredMargin = calculateMargin();
  const potentialProfit = calculatePotentialProfit();
  const potentialLoss = calculatePotentialLoss();
  const riskRewardRatio = calculateRiskRewardRatio();

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trade Panel</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-gray-400">Leverage:</span>
            <span className="text-lg font-bold text-primary">{leverage[0]}x</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demo Mode Alert */}
        <Alert className="bg-blue-900/20 border-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Demo Mode Active - Trades are simulated
          </AlertDescription>
        </Alert>

        {/* Trade Type Selector */}
        <Tabs value={tradeType} onValueChange={(value) => onTradeTypeChange(value as 'buy' | 'sell')}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger 
              value="buy" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              BUY
            </TabsTrigger>
            <TabsTrigger 
              value="sell" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              SELL
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="amount">Amount (Units)</Label>
            {currentPrice && (
              <span className="text-sm text-gray-400">
                ≈ ${(parseFloat(amount || '0') * currentPrice).toFixed(2)} USD
              </span>
            )}
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="amount"
              type="number"
              step="0.001"
              min="0.001"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || parseFloat(value) >= 0) {
                  setAmount(value);
                }
              }}
              className="pl-10 bg-gray-800 border-gray-700"
            />
          </div>
          <div className="flex gap-2">
            {[10, 50, 100, 500, 1000].map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(value)}
                className="flex-1"
              >
                ${value}
              </Button>
            ))}
          </div>
        </div>

        {/* Leverage Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Leverage</Label>
            <span className="text-primary font-bold">{leverage[0]}x</span>
          </div>
          <Slider
            value={leverage}
            onValueChange={setLeverage}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-400">
            <span>1x</span>
            <span>25x</span>
            <span>50x</span>
            <span>75x</span>
            <span>100x</span>
          </div>
          <div className="text-xs text-yellow-500">
            Warning: Higher leverage increases both potential profit and loss
          </div>
        </div>

        {/* Stop Loss & Take Profit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="stop-loss">Stop Loss</Label>
              {stopLoss && currentPrice && (
                <span className={`text-xs ${parseFloat(stopLoss) > currentPrice ? 'text-red-400' : 'text-green-400'}`}>
                  {tradeType === 'buy' ? 'Below entry' : 'Above entry'}
                </span>
              )}
            </div>
            <Input
              id="stop-loss"
              type="number"
              step="0.01"
              placeholder="Optional"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="take-profit">Take Profit</Label>
              {takeProfit && currentPrice && (
                <span className={`text-xs ${parseFloat(takeProfit) > currentPrice ? 'text-green-400' : 'text-red-400'}`}>
                  {tradeType === 'buy' ? 'Above entry' : 'Below entry'}
                </span>
              )}
            </div>
            <Input
              id="take-profit"
              type="number"
              step="0.01"
              placeholder="Optional"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />
          </div>
        </div>

        {/* Risk/Reward Ratio */}
        {stopLoss && takeProfit && (
          <div className="p-3 bg-gray-800/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Risk/Reward Ratio</span>
              <span className={`font-bold ${parseFloat(riskRewardRatio) > 1 ? 'text-green-400' : 'text-red-400'}`}>
                1:{riskRewardRatio}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {parseFloat(riskRewardRatio) > 1 ? 'Good risk/reward ratio' : 'Consider adjusting your targets'}
            </div>
          </div>
        )}

        {/* Calculations */}
        <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg">
          <div className="flex justify-between">
            <span className="text-gray-400">Required Margin:</span>
            <span className="font-bold">${requiredMargin.toFixed(2)}</span>
          </div>
          {takeProfit && (
            <div className="flex justify-between">
              <span className="text-gray-400">Potential Profit:</span>
              <span className="font-bold text-green-400">+${potentialProfit.toFixed(2)}</span>
            </div>
          )}
          {stopLoss && (
            <div className="flex justify-between">
              <span className="text-gray-400">Potential Loss:</span>
              <span className="font-bold text-red-400">-${potentialLoss.toFixed(2)}</span>
            </div>
          )}
          {stopLoss && takeProfit && (
            <div className="pt-2 border-t border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Profit/Loss Ratio:</span>
                <span className={`font-bold ${potentialProfit > potentialLoss ? 'text-green-400' : 'text-red-400'}`}>
                  1:{calculateRiskRewardRatio()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Open Trade Button */}
        <Button
          onClick={handleOpenTrade}
          disabled={loading || !amount || parseFloat(amount) <= 0 || !currentPrice}
          className={`w-full py-6 text-lg font-bold transition-all duration-200 ${
            tradeType === 'buy'
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
          } ${(!amount || parseFloat(amount) <= 0 || !currentPrice) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Opening Trade...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>{`OPEN ${tradeType.toUpperCase()} TRADE`}</span>
              <span className="text-xs opacity-80">(Demo)</span>
            </div>
          )}
        </Button>

        {/* Risk Disclaimer */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 text-center">
            <span className="text-yellow-500 font-bold">⚠️ RISK WARNING:</span>
            <br />
            Trading involves significant risk of loss. This is a demonstration only.
            <br />
            Past performance is not indicative of future results.
          </div>
          <div className="text-xs text-center text-blue-400">
            Current Mode: <span className="font-bold">DEMO</span> • No real money is being traded
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingPanel;