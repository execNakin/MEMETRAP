
import React from 'react';
import { Brain, Wallet, Zap, TrendingUp } from 'lucide-react';

interface StatsPanelProps {
  balance: number;
  fomoMeter: number;
  greedScore: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ balance, fomoMeter, greedScore }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-[#111114] p-4 rounded-xl border border-[#1e1e22] flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <Wallet className="text-blue-500 w-6 h-6" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Fake Balance</p>
          <p className="text-2xl font-bold font-mono text-white">${balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-[#111114] p-4 rounded-xl border border-[#1e1e22]">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${fomoMeter > 70 ? 'text-pink-500 fomo-glow' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-gray-400">FOMO Meter</span>
          </div>
          <span className={`text-sm font-bold ${fomoMeter > 70 ? 'text-pink-500' : 'text-white'}`}>
            {fomoMeter}%
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${fomoMeter > 70 ? 'bg-gradient-to-r from-pink-500 to-red-500' : 'bg-blue-500'}`} 
            style={{ width: `${fomoMeter}%` }}
          />
        </div>
      </div>

      <div className="bg-[#111114] p-4 rounded-xl border border-[#1e1e22]">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-400">Greed Score</span>
          </div>
          <span className="text-sm font-bold text-white">{greedScore}/100</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-green-400 transition-all duration-500" 
            style={{ width: `${greedScore}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
