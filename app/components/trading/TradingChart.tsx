// components/trading/TradingChart.tsx
'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TradingChartProps {
  asset: string;
  tradeType: 'buy' | 'sell';
  onPriceUpdate?: (price: number) => void;
}

const TradingChart = ({ asset, tradeType, onPriceUpdate }: TradingChartProps) => {
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateChartData = () => {
      const data = [];
      const basePrice = asset === 'BTC/USD' ? 45000 : 
                       asset === 'ETH/USD' ? 3000 : 
                       asset === 'EUR/USD' ? 1.08 : 
                       asset === 'GBP/USD' ? 1.26 : 1950;
      
      for (let i = 0; i < 50; i++) {
        const time = `${i}:00`;
        const variation = (Math.random() - 0.5) * basePrice * 0.02;
        const price = basePrice + variation;
        
        data.push({ time, price: parseFloat(price.toFixed(2)) });
      }
      
      setChartData(data);
      if (onPriceUpdate && data.length > 0) {
        onPriceUpdate(data[data.length - 1].price);
      }
      setLoading(false);
    };

    generateChartData();
    const interval = setInterval(() => {
      if (chartData.length > 0) {
        const lastPrice = chartData[chartData.length - 1].price;
        const variation = (Math.random() - 0.5) * lastPrice * 0.005;
        const newPrice = lastPrice + variation;
        
        const newData = [...chartData.slice(1), {
          time: `${chartData.length}:00`,
          price: parseFloat(newPrice.toFixed(2))
        }];
        
        setChartData(newData);
        if (onPriceUpdate) {
          onPriceUpdate(newPrice);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [asset, onPriceUpdate]);

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {tradeType === 'buy' ? (
            <TrendingUp className="text-green-400" size={24} />
          ) : (
            <TrendingDown className="text-red-400" size={24} />
          )}
          <span className="text-sm text-gray-400">Live {tradeType.toUpperCase()} Signal</span>
        </div>
        <div className="text-sm text-gray-400">
          {chartData.length} data points • Updated just now
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '0.5rem'
            }}
            formatter={(value) => [`$${value}`, 'Price']}
            labelStyle={{ color: '#D1D5DB' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={tradeType === 'buy' ? '#10B981' : '#EF4444'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: tradeType === 'buy' ? '#10B981' : '#EF4444' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradingChart;