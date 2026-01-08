
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Megaphone, 
  PlusCircle, 
  History, 
  LogOut,
  Info,
  Zap,
  Skull,
  ArrowUpCircle,
  X,
  Radar
} from 'lucide-react';
import { Coin, PortfolioItem, NewsItem, UserState, PricePoint } from './types';
import { INITIAL_BALANCE, INITIAL_COINS, UPDATE_INTERVAL, NEWS_TEMPLATES, NEWS_SOURCES, RUG_PULL_LESSONS } from './constants';
import TradingChart from './components/TradingChart';
import StatsPanel from './components/StatsPanel';

const App: React.FC = () => {
  // Initialize with initial coins immediately to prevent "undefined" crashes on first render
  const [coins, setCoins] = useState<Coin[]>(() => 
    INITIAL_COINS.map(c => ({
      ...c,
      history: [{ time: Date.now(), value: c.price }],
      liquidityPool: 50000 + Math.random() * 100000,
      volume24h: Math.random() * 50000
    }))
  );
  const [selectedCoinId, setSelectedCoinId] = useState<string>(INITIAL_COINS[0]?.id || '');
  const [user, setUser] = useState<UserState>({
    balance: INITIAL_BALANCE,
    portfolio: [],
    fomoMeter: 0,
    greedScore: 0
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showRugModal, setShowRugModal] = useState<{ isOpen: boolean; summary: string; coinName: string }>({
    isOpen: false,
    summary: '',
    coinName: ''
  });
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [tradeAmount, setTradeAmount] = useState<string>('10');

  const [creatorForm, setCreatorForm] = useState({
    name: '',
    symbol: '',
    tax: 5,
    initialLiquidity: 20
  });

  const updateCounterRef = useRef(0);

  // --- Local News Generator ---
  const pushNews = useCallback((coin: Coin, type: keyof typeof NEWS_TEMPLATES) => {
    if (!coin || !coin.symbol) return;
    const templates = NEWS_TEMPLATES[type];
    const rawTemplate = templates[Math.floor(Math.random() * templates.length)];
    const randHex = Math.random().toString(16).slice(2, 6).toUpperCase();
    const randAmount = (Math.random() * 5000).toLocaleString(undefined, { maximumFractionDigits: 0 });
    
    const title = rawTemplate
      .replace(/\[SYMBOL\]/g, coin.symbol || '???')
      .replace(/\[RAND\]/g, randHex)
      .replace(/\[AMOUNT\]/g, randAmount);

    const newEvent: NewsItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: type === 'RUG' ? '🚨 RUG PULL ALERT' : type === 'HYPE' ? '🔥 TRENDING' : '📰 MARKET UPDATE',
      content: title,
      source: NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)],
      timestamp: Date.now(),
      isFake: type === 'HYPE' && Math.random() > 0.5,
      impact: type === 'RUG' || type === 'WARNING' ? 'negative' : 'positive'
    };

    setNews(prev => [newEvent, ...prev].slice(0, 15));
  }, []);

  // Game Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCoins(prevCoins => {
        let nextCoins = [...prevCoins];
        
        // Spawn bot coins
        if (updateCounterRef.current % 20 === 0 && nextCoins.length < 15) {
          const botCoin = generateBotCoin();
          nextCoins.push(botCoin);
          pushNews(botCoin, 'MARKET');
        }

        return nextCoins.map(coin => {
          if (!coin || coin.isRugged) return coin;

          // Base price movement
          let changePercent = (Math.random() - 0.495) * 0.08; 
          
          // Random bot hype
          if (Math.random() < 0.02) {
            pushNews(coin, Math.random() > 0.3 ? 'HYPE' : 'WARNING');
          }

          // Random Whale Activity
          if (Math.random() < 0.02) {
            changePercent = (Math.random() - 0.5) * 0.6; // Volatility spike
            if (changePercent < -0.3) pushNews(coin, 'WARNING');
            else if (changePercent > 0.3) pushNews(coin, 'HYPE');
          }

          let isRugged = coin.isRugged;
          let newPrice = coin.price * (1 + changePercent);
          
          // --- Dynamic Pool & Volume Simulation ---
          // Every tick, we simulate "Simulated Volume" (bots trading)
          // Volume is roughly proportional to price volatility and market cap
          const simulatedTradeVol = Math.abs(changePercent) * (coin.marketCap || 10000) * (2 + Math.random() * 10);
          const currentPool = coin.liquidityPool || 1000;
          
          // If price went up, net inflow to pool. If price went down, net outflow.
          const poolNetFlow = changePercent * simulatedTradeVol * 0.5;
          const newLiquidityPool = Math.max(100, currentPool + poolNetFlow);
          const newVolume24h = (coin.volume24h || 0) * 0.95 + simulatedTradeVol; // Decay volume over time
          
          // Random Rug Pull for non-user coins
          if (!coin.isUserCreated && Math.random() < (coin.scamLikelihood || 0) * 0.012) {
            isRugged = true;
            newPrice = 0.00000001;
            pushNews(coin, 'RUG');
            
            const userOwns = user.portfolio.find(p => p.coinId === coin.id && p.amount > 0);
            if (userOwns) {
              const loss = (userOwns.amount * coin.price).toFixed(2);
              const lesson = RUG_PULL_LESSONS[Math.floor(Math.random() * RUG_PULL_LESSONS.length)];
              setShowRugModal({ 
                isOpen: true, 
                summary: `You lost $${loss}. ${lesson}`, 
                coinName: coin.name || 'Unknown Asset'
              });
            }
          }

          const newHistory = [...(coin.history || []), { time: Date.now(), value: newPrice }].slice(-30);
          return { 
            ...coin, 
            price: newPrice, 
            isRugged, 
            history: newHistory,
            liquidityPool: newLiquidityPool,
            volume24h: newVolume24h,
            change24h: (coin.history && coin.history.length > 0) ? ((newPrice - coin.history[0].value) / coin.history[0].value) * 100 : 0
          };
        });
      });

      updateCounterRef.current++;
    }, UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, [user.portfolio, pushNews]);

  const generateBotCoin = (): Coin => {
    const prefixes = ["Safe", "Pepe", "Elon", "Moon", "Turbo", "Alpha", "Baby", "Doge"];
    const suffixes = ["Inu", "Mars", "Cash", "Protocol", "Swap", "Rich", "Rocket"];
    const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    const symbol = (name.split(' ').map(n => n[0]).join('') + Math.floor(Math.random()*99)).toUpperCase();
    const id = symbol.toLowerCase() + '-' + Date.now();
    const price = Math.random() * 0.2;
    
    return {
      id, symbol, name, price,
      change24h: 0,
      volume24h: Math.random() * 5000,
      scamLikelihood: Math.random() * 0.9,
      isRugged: false,
      history: [{ time: Date.now(), value: price }],
      creatorWallet: '0x' + Math.random().toString(16).slice(2, 6),
      description: 'Community-driven moonshot.',
      tax: Math.floor(Math.random() * 15),
      marketCap: 5000 + Math.random() * 200000,
      liquidityPool: 2000 + Math.random() * 5000
    };
  };

  const handleCreateCoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.balance < creatorForm.initialLiquidity + 10) return;

    const newCoin: Coin = {
      id: `user-${creatorForm.symbol.toLowerCase()}-${Date.now()}`,
      name: creatorForm.name,
      symbol: creatorForm.symbol.toUpperCase(),
      price: 1.0,
      change24h: 0,
      volume24h: 0,
      scamLikelihood: 0.05,
      isRugged: false,
      history: [{ time: Date.now(), value: 1.0 }],
      creatorWallet: 'YOU',
      description: 'A masterpiece created by you.',
      tax: creatorForm.tax,
      marketCap: creatorForm.initialLiquidity,
      isUserCreated: true,
      liquidityPool: creatorForm.initialLiquidity
    };

    setCoins(prev => [...prev, newCoin]);
    setUser(prev => ({ ...prev, balance: prev.balance - (creatorForm.initialLiquidity + 10) }));
    setIsCreatorOpen(false);
    setSelectedCoinId(newCoin.id);
    pushNews(newCoin, 'HYPE');
  };

  const handleDevRug = () => {
    const coin = coins.find(c => c.id === selectedCoinId);
    if (!coin || !coin.isUserCreated) return;
    const profit = coin.liquidityPool || 0;
    setCoins(prev => prev.map(c => c.id === selectedCoinId ? { ...c, isRugged: true, price: 0.00000001, liquidityPool: 0 } : c));
    setUser(prev => ({ ...prev, balance: prev.balance + profit, greedScore: 100 }));
    pushNews(coin, 'RUG');
  };

  const handleDevPump = () => {
    const coin = coins.find(c => c.id === selectedCoinId);
    if (!coin || !coin.isUserCreated || coin.isRugged) return;
    setCoins(prev => prev.map(c => {
      if (c.id === selectedCoinId) {
        return { 
          ...c, 
          price: c.price * 1.5, 
          scamLikelihood: Math.min(1, (c.scamLikelihood || 0) + 0.15),
          liquidityPool: (c.liquidityPool || 0) * 1.3 // Artificially pump pool
        };
      }
      return c;
    }));
    pushNews(coin, 'HYPE');
  };

  const selectedCoin = coins.find(c => c.id === selectedCoinId) || coins[0];

  const handleBuy = () => {
    const amountToSpend = parseFloat(tradeAmount);
    if (!selectedCoin || isNaN(amountToSpend) || amountToSpend <= 0 || amountToSpend > user.balance || selectedCoin.isRugged) return;
    const coinsToBuy = (amountToSpend / selectedCoin.price) * (1 - (selectedCoin.tax || 0) / 100);

    setCoins(prev => prev.map(c => 
      c.id === selectedCoinId 
        ? { ...c, liquidityPool: (c.liquidityPool || 0) + (amountToSpend * 0.9), volume24h: (c.volume24h || 0) + amountToSpend } 
        : c
    ));

    setUser(prev => {
      const existing = prev.portfolio.find(p => p.coinId === selectedCoin.id);
      const newPortfolio = existing 
        ? prev.portfolio.map(p => p.coinId === selectedCoin.id ? { ...p, amount: p.amount + coinsToBuy } : p)
        : [...prev.portfolio, { coinId: selectedCoin.id, amount: coinsToBuy, avgBuyPrice: selectedCoin.price }];
      
      return { ...prev, balance: prev.balance - amountToSpend, portfolio: newPortfolio, fomoMeter: Math.min(100, prev.fomoMeter + 10) };
    });
  };

  const handleSell = () => {
    const holding = user.portfolio.find(p => p.coinId === selectedCoinId);
    if (!selectedCoin || !holding || holding.amount <= 0 || selectedCoin.isRugged) return;
    const saleValue = holding.amount * selectedCoin.price;
    
    setCoins(prev => prev.map(c => 
      c.id === selectedCoinId 
        ? { ...c, liquidityPool: Math.max(0, (c.liquidityPool || 0) - saleValue), volume24h: (c.volume24h || 0) + saleValue } 
        : c
    ));

    setUser(prev => ({
      ...prev,
      balance: prev.balance + saleValue,
      portfolio: prev.portfolio.map(p => p.coinId === selectedCoinId ? { ...p, amount: 0 } : p)
    }));
  };

  const calculateTotalValue = () => {
    let portfolioValue = 0;
    user.portfolio.forEach(item => {
      const coin = coins.find(c => c.id === item.coinId);
      if (coin) portfolioValue += item.amount * coin.price;
    });
    return user.balance + portfolioValue;
  };

  const getSentiment = (coin?: Coin) => {
    if (!coin) return { label: 'LOADING', color: 'text-gray-500', score: 50 };
    if (coin.isRugged) return { label: 'CRITICAL', color: 'text-red-600', score: 0 };
    const priceChange = coin.change24h || 0;
    if (priceChange > 30) return { label: 'MOONING', color: 'text-green-400', score: 95 };
    if (priceChange > 10) return { label: 'BULLISH', color: 'text-green-500', score: 75 };
    if (priceChange < -20) return { label: 'BLOOD IN STREETS', color: 'text-red-500', score: 15 };
    if (priceChange < -5) return { label: 'BEARISH', color: 'text-red-400', score: 35 };
    return { label: 'NEUTRAL', color: 'text-gray-400', score: 50 };
  };

  const sentiment = getSentiment(selectedCoin);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#0a0a0c] text-gray-200">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-pink-500/20">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">MEME<span className="text-pink-500">TRAP</span></h1>
            <p className="text-xs text-gray-500 font-mono uppercase tracking-tighter">Real-time Scam Simulator</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">No Real Assets Involved</span>
        </div>

        <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Total Portfolio Value</p>
            <p className="text-2xl font-black text-green-400 font-mono">${calculateTotalValue().toFixed(2)}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <StatsPanel balance={user.balance} fomoMeter={user.fomoMeter} greedScore={user.greedScore} />

          <div className="bg-[#111114] rounded-2xl border border-[#1e1e22] p-6 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border-2 ${selectedCoin?.isUserCreated ? 'bg-pink-500/20 border-pink-500' : 'bg-gray-800 border-[#333]'}`}>
                  {selectedCoin?.symbol?.[0] || '?'}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-2">
                    {selectedCoin?.name || 'Select a Coin'}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-mono font-bold uppercase tracking-widest">{selectedCoin?.symbol || '---'}</span>
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        <Radar className={`w-3 h-3 ${sentiment.color}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${sentiment.color}`}>
                            {sentiment.label}
                        </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black font-mono text-white tracking-tighter">
                    ${selectedCoin?.price?.toFixed((selectedCoin?.price || 0) < 0.01 ? 8 : 4) || '0.00'}
                </p>
                <div className={`text-sm font-bold font-mono ${(selectedCoin?.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(selectedCoin?.change24h || 0) > 0 ? '+' : ''}{(selectedCoin?.change24h || 0).toFixed(2)}%
                </div>
              </div>
            </div>

            <TradingChart data={selectedCoin?.history || []} isRugged={selectedCoin?.isRugged || false} />

            <div className="mt-6 p-5 bg-black/40 border border-white/5 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Liquidity Pool</p>
                  <p className={`text-lg font-black font-mono ${selectedCoin?.isRugged ? 'text-red-500' : 'text-white'}`}>
                    ${selectedCoin?.liquidityPool?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">24h Volume</p>
                  <p className="text-lg font-black font-mono text-white">
                    ${selectedCoin?.volume24h?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Risk Level</p>
                  <p className={`text-lg font-black font-mono ${selectedCoin?.scamLikelihood && selectedCoin.scamLikelihood > 0.6 ? 'text-red-500' : 'text-yellow-500'}`}>
                    {Math.round((selectedCoin?.scamLikelihood || 0) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Creator</p>
                  <p className="text-lg font-black font-mono text-white truncate">
                    {selectedCoin?.creatorWallet || 'Unknown'}
                  </p>
                </div>
            </div>

            {selectedCoin?.isUserCreated && !selectedCoin.isRugged && (
                <div className="mt-6 p-5 bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/20 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-black text-pink-500 flex items-center gap-2 uppercase">
                            <Skull className="w-5 h-5" /> DEV CONSOLE
                        </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleDevPump} className="group relative flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl transition-all overflow-hidden shadow-lg shadow-green-500/20">
                            <ArrowUpCircle className="w-5 h-5 group-hover:scale-125 transition-transform" /> 
                            <span>FORCE PUMP</span>
                        </button>
                        <button onClick={handleDevRug} className="group relative flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all overflow-hidden shadow-lg shadow-red-500/20">
                            <Skull className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
                            <span>DRAIN POOL</span>
                        </button>
                    </div>
                </div>
            )}
          </div>

          <div className="bg-[#111114] rounded-2xl border border-[#1e1e22] overflow-hidden">
            <div className="p-5 border-b border-[#1e1e22] flex justify-between items-center bg-[#0d0d10]">
                <h3 className="font-black text-lg uppercase tracking-tighter">Market Activity</h3>
                <button 
                    onClick={() => setIsCreatorOpen(true)}
                    className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-black shadow-xl shadow-pink-500/30 transition-all active:scale-95"
                >
                    <PlusCircle className="w-4 h-4" /> CREATE TOKEN
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-black/40 text-[10px] uppercase text-gray-500 font-black tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Asset Name</th>
                            <th className="px-6 py-4">Price (USD)</th>
                            <th className="px-6 py-4">Pool Depth</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {coins.slice().reverse().map(coin => {
                            if (!coin) return null;
                            return (
                              <tr 
                                  key={coin.id} 
                                  className={`hover:bg-white/5 cursor-pointer transition-colors group ${selectedCoinId === coin.id ? 'bg-white/5 border-l-4 border-pink-500' : 'border-l-4 border-transparent'}`}
                                  onClick={() => setSelectedCoinId(coin.id)}
                              >
                                  <td className="px-6 py-5">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${coin.isUserCreated ? 'bg-pink-500/20 text-pink-500' : 'bg-gray-800 text-gray-400'}`}>
                                              {coin.symbol?.[0] || '?'}
                                          </div>
                                          <div>
                                              <p className="font-black text-white text-base leading-none mb-1 group-hover:text-pink-400 transition-colors">{coin.name}</p>
                                              <p className="text-[10px] text-gray-500 font-bold font-mono tracking-widest uppercase">{coin.symbol} {coin.isUserCreated && '• DEVELOPER'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5 font-mono text-sm font-bold text-gray-300">
                                      ${coin.price?.toFixed(coin.price < 0.01 ? 8 : 4) || '0.00'}
                                  </td>
                                  <td className="px-6 py-5 font-mono text-sm font-bold text-gray-500">
                                      ${coin.liquidityPool?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </td>
                                  <td className="px-6 py-5">
                                      {coin.isRugged ? (
                                          <span className="text-[9px] bg-red-600 text-white px-2 py-1 rounded-sm font-black italic shadow-lg shadow-red-600/20">REKT</span>
                                      ) : (
                                          <div className="flex items-center gap-2">
                                              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${(coin.change24h || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                              <span className={`text-xs font-black font-mono ${(coin.change24h || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                  {(coin.change24h || 0).toFixed(1)}%
                                              </span>
                                          </div>
                                      )}
                                  </td>
                              </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111114] rounded-2xl border border-[#1e1e22] p-6 sticky top-4 shadow-xl">
            <h3 className="font-black text-xl mb-5 flex items-center gap-2 tracking-tighter uppercase">
                Trade <span className="text-pink-500">{selectedCoin?.symbol || '...'}</span>
            </h3>
            
            <div className="space-y-4">
                <div className="bg-black/60 p-5 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-3 font-black uppercase tracking-widest">
                        <span>Swap Value (USD)</span>
                        <span className="text-gray-300">MAX: ${user.balance.toFixed(2)}</span>
                    </div>
                    <input 
                        type="number" 
                        className="bg-transparent text-3xl font-black outline-none w-full font-mono text-white placeholder-gray-800" 
                        placeholder="0.00" 
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                    />
                </div>

                <div className="space-y-3 pt-2">
                    <button 
                        disabled={!selectedCoin || selectedCoin.isRugged || parseFloat(tradeAmount) > user.balance}
                        className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl transition-all active:scale-95 ${
                            !selectedCoin || selectedCoin.isRugged 
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                        }`}
                        onClick={handleBuy}
                    >
                        {selectedCoin?.isRugged ? 'MARKET COLLAPSED' : 'EXECUTE BUY'}
                    </button>
                    <button 
                        disabled={!selectedCoin || selectedCoin.isRugged || !(user.portfolio.find(p => p.coinId === selectedCoinId)?.amount)}
                        className="w-full py-4 rounded-2xl font-black text-sm border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-widest"
                        onClick={handleSell}
                    >
                        DUMP POSITION
                    </button>
                </div>

                <div className="bg-black/20 p-4 rounded-xl space-y-2 border border-white/5">
                    <div className="flex justify-between text-[10px] font-black text-gray-600 uppercase">
                        <span>Security Tax</span>
                        <span className={(selectedCoin?.tax || 0) > 10 ? 'text-red-500' : 'text-gray-400'}>{selectedCoin?.tax || 0}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-gray-600 uppercase">
                        <span>Slippage Info</span>
                        <span className="text-gray-400">Low Liquidity</span>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                    <History className="w-4 h-4" /> Active Holdings
                </h4>
                <div className="space-y-3">
                    {user.portfolio.filter(p => p.amount > 0).length === 0 ? (
                        <div className="text-center py-6 opacity-30">
                            <Zap className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No exposure detected</p>
                        </div>
                    ) : (
                        user.portfolio.filter(p => p.amount > 0).map(item => {
                            const coin = coins.find(c => c.id === item.coinId);
                            if (!coin) return null;
                            const currentVal = item.amount * coin.price;
                            return (
                                <div key={item.coinId} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer" onClick={() => setSelectedCoinId(coin.id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center font-black text-xs">{coin.symbol?.[0] || '?'}</div>
                                        <div>
                                            <p className="font-black text-sm text-white">{coin.symbol}</p>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">{item.amount.toLocaleString(undefined, {maximumFractionDigits: 0})} tokens</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-sm text-white font-mono">${currentVal.toFixed(2)}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
          </div>

          <div className="bg-[#111114] rounded-2xl border border-[#1e1e22] p-6 shadow-xl">
            <h3 className="font-black text-lg mb-6 flex items-center gap-2 uppercase tracking-tighter">
                <Radar className="w-5 h-5 text-pink-500" />
                Live Social Scanner
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {news.map(item => (
                    <div key={item.id} className={`p-4 rounded-2xl bg-black/40 border-l-4 transition-all hover:scale-[1.02] ${item.impact === 'negative' ? 'border-red-500' : 'border-pink-500'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black text-pink-500 uppercase px-2 py-0.5 bg-pink-500/10 rounded-full tracking-tighter">
                                {item.source}
                            </span>
                            <span className="text-[9px] text-gray-600 font-bold font-mono">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                        <h4 className="text-xs font-black text-white leading-relaxed mb-1">
                            {item.content}
                        </h4>
                        {item.isFake && (
                            <span className="text-[8px] font-black text-yellow-500/50 uppercase tracking-widest italic flex items-center gap-1">
                                <AlertTriangle className="w-2 h-2" /> Artificial Hype Detected
                            </span>
                        )}
                    </div>
                ))}
            </div>
          </div>
        </div>
      </main>

      {isCreatorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-[#111114] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-black text-white tracking-tighter">LAUNCH <span className="text-pink-500">PROJECT</span></h2>
                      <button onClick={() => setIsCreatorOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="text-gray-500" /></button>
                  </div>
                  <form onSubmit={handleCreateCoin} className="space-y-6">
                      <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Brand Name</label>
                            <input required className="w-full bg-black/60 border border-white/5 p-4 rounded-xl outline-none focus:border-pink-500 font-bold text-white transition-all" placeholder="e.g. Diamond Hand Dog" value={creatorForm.name} onChange={e => setCreatorForm({...creatorForm, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Ticker Symbol</label>
                            <input required className="w-full bg-black/60 border border-white/5 p-4 rounded-xl outline-none focus:border-pink-500 uppercase font-mono font-bold text-white transition-all" placeholder="e.g. DHD" maxLength={6} value={creatorForm.symbol} onChange={e => setCreatorForm({...creatorForm, symbol: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Dev Tax (%)</label>
                                <input type="number" className="w-full bg-black/60 border border-white/5 p-4 rounded-xl outline-none focus:border-pink-500 font-mono text-white" value={creatorForm.tax} onChange={e => setCreatorForm({...creatorForm, tax: parseInt(e.target.value) || 0})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Liquidity ($)</label>
                                <input type="number" className="w-full bg-black/60 border border-white/5 p-4 rounded-xl outline-none focus:border-pink-500 font-mono text-white" value={creatorForm.initialLiquidity} onChange={e => setCreatorForm({...creatorForm, initialLiquidity: parseInt(e.target.value) || 0})} />
                            </div>
                        </div>
                      </div>
                      <div className="p-5 bg-pink-500/5 rounded-2xl border border-pink-500/20 text-xs font-bold text-pink-300 leading-relaxed italic">
                        By launching, you acknowledge that you are responsible for the 'well-being' of your investors. Total cost: ${creatorForm.initialLiquidity + 10}
                      </div>
                      <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-pink-500/20 transition-all active:scale-95">
                          DEPLOY TO MAINNET
                      </button>
                  </form>
              </div>
          </div>
      )}

      {showRugModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
              <div className="bg-[#111114] border-2 border-red-600 rounded-3xl p-10 max-w-lg w-full shadow-[0_0_100px_rgba(220,38,38,0.2)]">
                  <div className="bg-red-600/20 w-20 h-20 rounded-full flex items-center justify-center mb-8 mx-auto border-4 border-red-600/50">
                      <Skull className="w-10 h-10 text-red-600 animate-bounce" />
                  </div>
                  <h2 className="text-4xl font-black text-center text-white mb-3 uppercase tracking-tighter italic">REKT. RUGGED. GONE.</h2>
                  <p className="text-center text-gray-500 mb-8 uppercase text-xs font-black tracking-[0.3em]">{showRugModal.coinName} has exited the chat.</p>
                  
                  <div className="bg-black/40 rounded-3xl p-8 mb-10 border border-red-900/30">
                      <p className="text-gray-300 italic leading-relaxed text-base font-bold text-center">
                        "{showRugModal.summary}"
                      </p>
                  </div>

                  <button 
                    className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-gray-200 transition-all text-lg shadow-2xl active:scale-95"
                    onClick={() => setShowRugModal({ ...showRugModal, isOpen: false })}
                  >
                      I LEARNED MY LESSON
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
