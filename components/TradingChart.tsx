
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PricePoint } from '../types';

interface TradingChartProps {
  data: PricePoint[];
  isRugged: boolean;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, isRugged }) => {
  const chartColor = isRugged ? "#ef4444" : "#22c55e";

  return (
    <div className="h-[300px] w-full bg-[#111114] rounded-lg p-4 border border-[#1e1e22]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" vertical={false} />
          <XAxis 
            dataKey="time" 
            hide 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right" 
            stroke="#4b5563"
            fontSize={12}
            tickFormatter={(val) => `$${val.toFixed(6)}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a1d', border: '1px solid #333' }}
            labelStyle={{ display: 'none' }}
            itemStyle={{ color: chartColor }}
            formatter={(value: number) => [`$${value.toFixed(6)}`, 'Price']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={chartColor} 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      {isRugged && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-red-900/80 text-white font-bold px-8 py-4 rounded-xl border-4 border-red-500 transform rotate-12 text-4xl shadow-2xl uppercase">
            RUGGED!
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
