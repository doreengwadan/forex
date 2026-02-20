// components/trading/AssetSelector.tsx
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AssetSelectorProps {
  selectedAsset: string;
  onSelectAsset: (asset: string) => void;
}

const assets = [
  { symbol: 'BTC/USD', name: 'Bitcoin', change: '+2.5%', icon: '₿' },
  { symbol: 'ETH/USD', name: 'Ethereum', change: '+1.8%', icon: 'Ξ' },
  { symbol: 'EUR/USD', name: 'Euro', change: '-0.3%', icon: '€' },
  { symbol: 'GBP/USD', name: 'British Pound', change: '+0.5%', icon: '£' },
  { symbol: 'XAU/USD', name: 'Gold', change: '+0.9%', icon: '🪙' },
  { symbol: 'AAPL', name: 'Apple', change: '+1.2%', icon: '📱' },
  { symbol: 'TSLA', name: 'Tesla', change: '-2.1%', icon: '🚗' },
  { symbol: 'OIL', name: 'Crude Oil', change: '+3.2%', icon: '🛢️' },
];

const AssetSelector = ({ selectedAsset, onSelectAsset }: AssetSelectorProps) => {
  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="p-4">
        <div className="flex overflow-x-auto pb-2 space-x-2">
          {assets.map((asset) => {
            const isPositive = asset.change.startsWith('+');
            return (
              <Button
                key={asset.symbol}
                variant="outline"
                onClick={() => onSelectAsset(asset.symbol)}
                className={`flex-shrink-0 px-4 py-3 ${
                  selectedAsset === asset.symbol
                    ? 'bg-primary/20 border-primary'
                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{asset.icon}</span>
                    <span className="font-bold">{asset.symbol}</span>
                  </div>
                  <div className={`flex items-center text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {asset.change}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{asset.name}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetSelector;