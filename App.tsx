import React, { useState, useEffect, useRef } from 'react';
import { AppScreen, CoinFace, LineResult, LineType, ReadingRecord } from './types';
import { tossCoin, calculateLine, generateReading, formatDate, saveReading, getHistory, clearHistory, deleteReading } from './utils';
import { RefreshCcw, History as HistoryIcon, ArrowLeft, Share2, Trash2, Info, BookOpen, Briefcase, Heart, Lightbulb, Compass, TrendingUp } from 'lucide-react';

// --- Sub-Components ---

// 1. Hexagram Visualizer
const HexagramLines = ({ lines, isOriginal }: { lines: LineResult[], isOriginal: boolean }) => {
  // Render from Top (index 5) to Bottom (index 0)
  const reversedLines = [...lines].reverse();

  return (
    <div className="flex flex-col gap-3 w-32 items-center bg-stone-50 p-4 border border-stone-200 rounded shadow-sm">
      <div className="text-center font-bold text-stone-800 mb-2 font-serif border-b border-stone-300 w-full pb-1">
        {isOriginal ? '本卦' : '变卦'}
      </div>
      {reversedLines.map((line, idx) => {
        // True position 6 down to 1
        const actualIndex = 6 - idx; 
        
        let isYang = false;
        let isMoving = false;
        
        if (isOriginal) {
           isYang = (line.type === LineType.YoungYang || line.type === LineType.OldYang);
           isMoving = (line.type === LineType.OldYang || line.type === LineType.OldYin);
        } else {
           // Logic for Changed Hexagram
           if (line.type === LineType.OldYang) isYang = false; // Old Yang becomes Yin
           else if (line.type === LineType.OldYin) isYang = true; // Old Yin becomes Yang
           else isYang = (line.type === LineType.YoungYang); // Static stays same
        }

        return (
          <div key={idx} className="w-full h-4 flex justify-between items-center relative">
             <span className="absolute -left-6 text-xs text-stone-400 scale-75 font-serif">
               {isOriginal ? (actualIndex === 6 ? '上' : actualIndex === 1 ? '初' : actualIndex) : ''}
             </span>
            {isYang ? (
              <div className={`w-full h-3 ${isOriginal && isMoving ? 'bg-red-700' : 'bg-stone-800'}`}></div>
            ) : (
              <>
                <div className={`w-[45%] h-3 ${isOriginal && isMoving ? 'bg-red-700' : 'bg-stone-800'}`}></div>
                <div className={`w-[45%] h-3 ${isOriginal && isMoving ? 'bg-red-700' : 'bg-stone-800'}`}></div>
              </>
            )}
             {isOriginal && isMoving && (
                <span className="absolute -right-5 text-[10px] text-red-600 font-bold">
                    {line.type === LineType.OldYang ? '○' : '×'}
                </span>
             )}
          </div>
        );
      })}
    </div>
  );
};

// 2. Realistic Five Emperor Coin Component (SVG)
const FiveEmperorCoin = ({ face }: { face: CoinFace }) => {
  const isFront = face === CoinFace.Front; // Front = 3 (Yang/Words), Back = 2 (Yin/Manchu)

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl overflow-visible">
      <defs>
        {/* Realistic Aged Bronze Gradient */}
        <linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c77e" /> {/* Highlight */}
          <stop offset="30%" stopColor="#d4af37" /> {/* Gold */}
          <stop offset="70%" stopColor="#9e7e38" /> {/* Shadow */}
          <stop offset="100%" stopColor="#59461d" /> {/* Deep Shadow */}
        </linearGradient>

        {/* Noise Filter for Metal Grain/Patina */}
        <filter id="metalGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" result="noise"/>
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.25 0" in="noise" result="coloredNoise"/>
          <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="grain"/>
          <feBlend mode="multiply" in="grain" in2="SourceGraphic"/>
        </filter>

        {/* Bevel/Emboss Filter */}
        <filter id="emboss">
           <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
           <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.8" specularExponent="15" lightingColor="#fffae0" result="specOut">
             <fePointLight x="-5000" y="-10000" z="20000"/>
           </feSpecularLighting>
           <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
           <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="0" result="litPaint"/>
        </filter>
        
        {/* Inner Shadow for Text (Stamped look) */}
        <filter id="textInset">
            <feOffset dx="0.5" dy="0.5" />
            <feGaussianBlur stdDeviation="0.5" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.7" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* Main Body with Gradient & Grain */}
      <circle cx="50" cy="50" r="48" fill="url(#bronzeGradient)" filter="url(#metalGrain)" />
      
      {/* Lighting Overlay */}
      <circle cx="50" cy="50" r="48" fill="url(#bronzeGradient)" filter="url(#emboss)" opacity="0.8" stroke="#5c4b28" strokeWidth="0.5" />

      {/* Outer Rim */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="#6b501f" strokeWidth="3.5" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#bronzeGradient)" strokeWidth="1" opacity="0.4" />

      {/* Square Hole Rim */}
      <rect x="36" y="36" width="28" height="28" fill="#241f1b" stroke="#6b501f" strokeWidth="3" />
      <rect x="36" y="36" width="28" height="28" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

      {/* Coin Content */}
      {isFront ? (
        // Front: Qian Long Tong Bao (汉字)
        <g fill="#3d2b0b" style={{ fontFamily: '"Kaiti SC", "STKaiti", "Noto Serif SC", serif', fontWeight: '900' }} filter="url(#textInset)">
           {/* Top: 乾 */}
           <text x="50" y="27" textAnchor="middle" fontSize="16" transform="scale(1, 1)">乾</text>
           {/* Bottom: 隆 */}
           <text x="50" y="87" textAnchor="middle" fontSize="16" transform="scale(1, 1)">隆</text>
           {/* Right: 通 */}
           <text x="81" y="56" textAnchor="middle" fontSize="16" transform="scale(1, 1)">通</text>
           {/* Left: 宝 */}
           <text x="19" y="56" textAnchor="middle" fontSize="16" transform="scale(1, 1)">宝</text>
        </g>
      ) : (
        // Back: Manchu Characters
        <g fill="none" stroke="#3d2b0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#textInset)">
           {/* Left: Manchu 'Boo' (宝) - Stylized */}
           <path d="M 24 35 Q 28 32 28 38 Q 28 44 24 44 Q 18 44 18 50 Q 18 56 24 60 L 24 66" />
           <circle cx="26" cy="36" r="1.5" fill="#3d2b0b" stroke="none"/>
           
           {/* Right: Manchu 'Ciowan' (源/泉) - Stylized */}
           <path d="M 76 30 L 76 70" />
           <path d="M 72 38 L 80 38" />
           <path d="M 72 58 L 82 50" /> 
           <circle cx="76" cy="30" r="1.5" fill="#3d2b0b" stroke="none"/>
        </g>
      )}
    </svg>
  );
};

type AnimationState = 'idle' | 'tossing' | 'settling';

// 3. Coin Container (Handles animation wrapper)
const CoinVisual = ({ face, animState }: { face: CoinFace | null, animState: AnimationState }) => {
  // Logic: 
  // 'tossing': Always show front (or swap continuously if we had frames) - effectively spinning
  // 'settling': Show the ACTUAL result face. The CSS animation 'settle-bounce' handles the wobble.
  // 'idle': Show ACTUAL result face, static.
  
  const displayFace = (animState === 'tossing') ? CoinFace.Front : (face || CoinFace.Front);
  
  let animClass = '';
  if (animState === 'tossing') animClass = 'animate-toss';
  else if (animState === 'settling') animClass = 'animate-settle';

  return (
    <div className={`w-28 h-28 relative ${animClass}`}>
       <FiveEmperorCoin face={displayFace} />
       
       {animState === 'idle' && face === CoinFace.Front && (
         <div className="absolute -bottom-8 left-0 right-0 text-center text-xs tracking-widest opacity-60 font-serif">汉字面 (阳)</div>
       )}
       {animState === 'idle' && face === CoinFace.Back && (
         <div className="absolute -bottom-8 left-0 right-0 text-center text-xs tracking-widest opacity-60 font-serif">满文面 (阴)</div>
       )}
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('WELCOME');
  const [question, setQuestion] = useState('');
  
  // Toss State
  const [lines, setLines] = useState<LineResult[]>([]);
  const [animState, setAnimState] = useState<AnimationState>('idle');
  const [currentCoins, setCurrentCoins] = useState<[CoinFace, CoinFace, CoinFace] | null>(null);
  
  // Reading State
  const [currentReading, setCurrentReading] = useState<ReadingRecord | null>(null);

  // History State
  const [history, setHistory] = useState<ReadingRecord[]>([]);

  // Load History on Mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleStart = () => {
    setLines([]);
    setCurrentCoins(null);
    setScreen('TOSS');
  };

  const handleToss = () => {
    if (animState !== 'idle' || lines.length >= 6) return;

    setAnimState('tossing');
    
    // Phase 1: Toss (Air) - 0.8 seconds (Matches CSS animation duration)
    setTimeout(() => {
      // 1. Calculate Result IMMEDIATELY before settlement animation starts
      // This ensures the coin shows the correct face while it is "wobbling" to a stop
      const c1 = tossCoin();
      const c2 = tossCoin();
      const c3 = tossCoin();
      const newCoins: [CoinFace, CoinFace, CoinFace] = [c1, c2, c3];
      
      // 2. Lock the visual result
      setCurrentCoins(newCoins);
      
      // 3. Start Settlement Animation
      setAnimState('settling');

      // Phase 2: Settle (Land & Wobble) - 0.8 seconds (Matches CSS animation)
      setTimeout(() => {
        setAnimState('idle');
        
        // 4. Record the Line Data
        const newLine = calculateLine(newCoins, lines.length + 1);
        const newLines = [...lines, newLine];
        setLines(newLines);
        
        if (newLines.length === 6) {
          // Wait a moment for user to see final result then navigate
          setTimeout(() => {
             const reading = generateReading(question, newLines);
             setCurrentReading(reading);
             saveReading(reading);
             // Update local history state immediately
             setHistory(prev => [reading, ...prev]);
             setScreen('RESULT');
          }, 1500);
        }
      }, 800); // Settle duration
    }, 800); // Toss duration
  };

  const handleReset = () => {
    setQuestion('');
    setLines([]);
    setCurrentCoins(null);
    setCurrentReading(null);
    setScreen('WELCOME');
  };
  
  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Stop click from triggering card expansion
      if(window.confirm("确定删除这条记录吗？")) {
          // 1. Optimistic Update (Immediate UI response)
          const newHistory = history.filter(r => r.id !== id);
          setHistory(newHistory);
          
          // 2. Persist Change
          deleteReading(id);
      }
  }
  
  const handleClearHistory = () => {
      if(window.confirm("确定清空所有记录吗？此操作不可恢复。")) {
          setHistory([]); // Immediate UI clear
          clearHistory(); // Storage clear
      }
  }

  // --- Views ---

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-fade-in">
      <div className="w-24 h-24 mb-6 bg-stone-800 text-stone-100 rounded-full flex items-center justify-center text-4xl font-serif shadow-xl border-4 border-stone-600">
        易
      </div>
      <h1 className="text-3xl font-bold mb-2 text-stone-800 font-serif tracking-widest">三钱起卦法</h1>
      <p className="text-stone-500 mb-10 text-sm max-w-xs">
        "无事不占，不动不占，一事一占"
      </p>

      <div className="w-full max-w-sm space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-stone-200">
          <label className="block text-left text-stone-600 text-sm font-bold mb-2 font-serif">
            心中所求之事（可选）
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="如：今日出行是否顺利？"
            className="w-full px-4 py-3 border-b-2 border-stone-300 focus:border-stone-800 outline-none text-lg bg-transparent transition-colors placeholder-stone-300 text-center font-serif"
          />
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-stone-800 text-[#f5f5f0] py-4 rounded-lg text-xl font-bold font-serif shadow-lg hover:bg-stone-900 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-white"></div>
          诚心起卦
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </button>
        
        <button 
            onClick={() => setScreen('HISTORY')}
            className="text-stone-500 text-sm flex items-center justify-center gap-2 w-full hover:text-stone-800 transition-colors"
        >
            <HistoryIcon size={16} /> 查看历史记录
        </button>
      </div>
      
      <div className="mt-12 text-xs text-stone-400 font-serif">
        <p>至诚之道，可以前知</p>
        <p className="mt-2">作者：AsiaLee</p>
      </div>
    </div>
  );

  const renderToss = () => (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 flex flex-col items-center pt-8">
        <h2 className="text-xl font-bold text-stone-800 font-serif mb-8">
           {lines.length < 6 ? `第 ${lines.length + 1} 次抛掷` : '起卦完成'}
        </h2>

        {/* Coins Area */}
        <div className="flex gap-4 mb-16 min-h-[140px] items-center justify-center perspective-[1000px]">
           <CoinVisual face={currentCoins ? currentCoins[0] : null} animState={animState} />
           <CoinVisual face={currentCoins ? currentCoins[1] : null} animState={animState} />
           <CoinVisual face={currentCoins ? currentCoins[2] : null} animState={animState} />
        </div>

        {/* Current Result Info */}
        <div className="h-16 flex items-center justify-center mb-6">
            {animState === 'idle' && currentCoins && (
                <div className="text-center animate-fade-in-up">
                    <div className="text-2xl font-bold text-stone-800 font-serif">
                        {currentCoins.reduce((a,b) => a+b, 0)}
                    </div>
                    <div className="text-sm text-stone-500 font-serif">
                        {(() => {
                            const sum = currentCoins.reduce((a,b) => a+b, 0);
                            if(sum===6) return '老阴 (变)';
                            if(sum===9) return '老阳 (变)';
                            if(sum===7) return '少阳 (静)';
                            return '少阴 (静)';
                        })()}
                    </div>
                </div>
            )}
        </div>

        {/* Lines Preview (Building Up) */}
        <div className="w-64 bg-white/50 border border-stone-200 rounded-lg p-4 min-h-[200px] flex flex-col-reverse gap-2 shadow-inner">
             {lines.map((line, idx) => (
                 <div key={idx} className="flex items-center justify-between border-b border-stone-100 pb-1 last:border-0">
                     <span className="text-xs text-stone-400 font-serif">
                         {idx === 0 ? '初' : idx === 5 ? '上' : idx + 1}爻
                     </span>
                     <div className="flex-1 mx-4 flex items-center justify-center">
                         {(line.type === LineType.YoungYang || line.type === LineType.OldYang) ? (
                             <div className="w-full h-2 bg-stone-800 relative">
                                 {line.type === LineType.OldYang && <span className="absolute -right-4 top-[-4px] text-red-500 text-xs">○</span>}
                             </div>
                         ) : (
                             <div className="w-full flex justify-between relative">
                                 <div className="w-[45%] h-2 bg-stone-800"></div>
                                 <div className="w-[45%] h-2 bg-stone-800"></div>
                                 {line.type === LineType.OldYin && <span className="absolute -right-4 top-[-4px] text-red-500 text-xs">×</span>}
                             </div>
                         )}
                     </div>
                     <span className="text-xs text-stone-500 w-4">{line.total}</span>
                 </div>
             ))}
             {lines.length === 0 && <div className="text-center text-stone-300 text-sm py-10 font-serif">暂无爻象</div>}
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 bg-white border-t border-stone-200">
        <button
          onClick={handleToss}
          disabled={animState !== 'idle' || lines.length >= 6}
          className={`w-full py-4 rounded-lg text-xl font-bold font-serif shadow-lg transition-all
            ${animState !== 'idle' || lines.length >= 6 
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed' 
                : 'bg-stone-800 text-[#f5f5f0] hover:bg-stone-900 active:scale-95'}`}
        >
          {animState !== 'idle' ? '掷算中...' : lines.length >= 6 ? '正在生成结果...' : '抛掷硬币'}
        </button>
      </div>
    </div>
  );

  const renderResult = () => {
    if (!currentReading) return null;

    // Identify moving lines
    const movingLines = currentReading.lines.filter(l => l.total === 6 || l.total === 9);

    return (
      <div className="pb-24">
        {/* Header Section */}
        <div className="bg-stone-800 text-[#f5f5f0] p-6 rounded-b-3xl shadow-lg mb-6">
            <div className="text-xs opacity-70 mb-2 font-serif text-center">{formatDate(currentReading.timestamp)}</div>
            <h2 className="text-xl font-bold font-serif mb-4 text-center">
               {currentReading.question || '所测之事'}
            </h2>
            <div className="flex items-start justify-center gap-6 mt-4">
                <div className="flex flex-col items-center">
                    <HexagramLines lines={currentReading.lines} isOriginal={true} />
                    <div className="mt-2 text-lg font-bold font-serif">{currentReading.originalHexagram.name}</div>
                    <div className="text-xs text-stone-400 mt-1">{currentReading.originalHexagram.description}</div>
                </div>
                {/* Arrow indicator */}
                <div className="h-32 flex items-center justify-center opacity-50">
                   <div className="w-px h-full bg-stone-600"></div>
                </div>
                <div className="flex flex-col items-center">
                    <HexagramLines lines={currentReading.lines} isOriginal={false} />
                    <div className="mt-2 text-lg font-bold font-serif">{currentReading.changedHexagram.name}</div>
                    <div className="text-xs text-stone-400 mt-1">{currentReading.changedHexagram.description}</div>
                </div>
            </div>
        </div>

        <div className="px-6 space-y-6">
            {/* 1. Overview Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-2">
                    <Compass size={20} className="text-stone-600" />
                    <h3 className="text-lg font-bold text-stone-800 font-serif">运势总评</h3>
                </div>
                <p className="text-stone-700 text-sm leading-relaxed text-justify font-serif">
                    {currentReading.originalHexagram.overview}
                </p>
            </div>

            {/* 2. Detailed Grid */}
            <div className="grid grid-cols-1 gap-4">
                {/* Career */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                     <div className="flex items-center gap-2 mb-2 text-stone-800 font-bold font-serif">
                         <Briefcase size={18} /> 事业 / 职场
                     </div>
                     <p className="text-stone-600 text-xs leading-relaxed text-justify">
                         {currentReading.originalHexagram.career}
                     </p>
                </div>

                {/* Love */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                     <div className="flex items-center gap-2 mb-2 text-stone-800 font-bold font-serif">
                         <Heart size={18} /> 情感 / 婚姻
                     </div>
                     <p className="text-stone-600 text-xs leading-relaxed text-justify">
                         {currentReading.originalHexagram.love}
                     </p>
                </div>
            </div>

            {/* 3. Master Zeng's Advice (Highlighted) */}
            <div className="bg-amber-50 p-5 rounded-xl shadow-inner border border-amber-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Lightbulb size={64} className="text-amber-800" />
                </div>
                <div className="flex items-center gap-2 mb-3 relative z-10">
                    <Lightbulb size={20} className="text-amber-800" />
                    <h3 className="text-lg font-bold text-amber-900 font-serif">曾老指引</h3>
                </div>
                <p className="text-amber-900 text-sm leading-7 text-justify font-serif italic relative z-10">
                    “{currentReading.originalHexagram.strategy}”
                </p>
            </div>
            
            {/* 4. Moving Lines Detail (Improved) */}
            {movingLines.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Info size={20} className="text-stone-600" />
                        <h3 className="text-lg font-bold text-stone-800 font-serif">动爻变机</h3>
                    </div>
                    
                    {movingLines.map((line, idx) => {
                        // Get detailed line data from original hexagram
                        // line.position is 1-based index from bottom
                        const lineData = currentReading.originalHexagram.lines[line.position - 1]; 
                        
                        return (
                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                                {/* Card Header */}
                                <div className="bg-stone-100 px-4 py-3 flex justify-between items-center border-b border-stone-200">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg font-serif text-stone-800">{lineData.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${line.total === 9 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {line.total === 9 ? '老阳 · 动' : '老阴 · 动'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-stone-500 font-serif">
                                        变卦: {currentReading.changedHexagram.name}
                                    </div>
                                </div>
                                
                                {/* Card Body */}
                                <div className="p-4 space-y-3">
                                    {/* Position Analysis */}
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1">
                                            <Compass size={12} /> 时位分析
                                        </h4>
                                        <p className="text-sm text-stone-800 font-serif leading-relaxed">
                                            {lineData.positionDesc}
                                        </p>
                                    </div>
                                    
                                    {/* Actionable Advice */}
                                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                                        <h4 className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1">
                                            <Lightbulb size={12} /> 曾老指引
                                        </h4>
                                        <p className="text-sm text-stone-700 italic font-serif leading-relaxed">
                                            {lineData.advice}
                                        </p>
                                    </div>

                                    {/* Trend */}
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1">
                                            <TrendingUp size={12} /> 变化趋向
                                        </h4>
                                        <p className="text-xs text-stone-600 font-serif leading-relaxed">
                                            此爻变动后，由{line.total === 9 ? '阳变阴' : '阴变阳'}，局势将向“{currentReading.changedHexagram.name}”卦转变。
                                            {line.total === 9 
                                                ? ' 刚极则柔，需注意由强转弱，适度收敛。' 
                                                : ' 柔极则刚，新的力量正在生成，由弱转强。'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 flex gap-4 max-w-md mx-auto shadow-negative z-20">
            <button onClick={handleReset} className="flex-1 py-3 border border-stone-300 rounded-lg text-stone-600 font-serif flex items-center justify-center gap-2 hover:bg-stone-50 active:scale-95 transition-transform">
                <RefreshCcw size={18} /> 重新起卦
            </button>
            <button onClick={() => setScreen('HISTORY')} className="flex-1 py-3 bg-stone-800 text-white rounded-lg font-serif flex items-center justify-center gap-2 hover:bg-stone-900 active:scale-95 transition-transform">
                <HistoryIcon size={18} /> 历史记录
            </button>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="pb-6">
        <div className="sticky top-0 bg-[#f5f5f0]/95 backdrop-blur-sm p-4 border-b border-stone-200 flex items-center justify-between z-10">
            <button onClick={() => setScreen('WELCOME')} className="p-2 -ml-2 text-stone-600 hover:text-stone-900">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold font-serif text-stone-800">历史记录</h2>
            <div className="w-8"></div> {/* Spacer */}
        </div>
        
        <div className="p-4 space-y-4">
            {history.length === 0 ? (
                <div className="text-center py-20 text-stone-400 font-serif">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                    <p>暂无起卦记录</p>
                    <button onClick={handleReset} className="mt-4 text-stone-800 underline">去起一卦</button>
                </div>
            ) : (
                history.map(record => (
                    <div 
                        key={record.id} 
                        onClick={() => {
                            setCurrentReading(record);
                            setScreen('RESULT');
                        }}
                        className="bg-white p-4 rounded-lg shadow-sm border border-stone-200 active:scale-[0.98] transition-transform cursor-pointer relative"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-stone-500 font-serif bg-stone-100 px-2 py-1 rounded">
                                {formatDate(record.timestamp)}
                            </span>
                            {/* Increased touch target for delete button with higher z-index */}
                            <button 
                                onClick={(e) => handleDelete(record.id, e)} 
                                className="text-stone-300 hover:text-red-500 p-2 -mr-2 -mt-2 click-target-large z-10"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3 className="font-bold text-stone-800 font-serif mb-2 line-clamp-1 pr-6">
                            {record.question || '无事所求'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-stone-600 font-serif">
                             <span>本: {record.originalHexagram.name}</span>
                             <span className="text-stone-300">→</span>
                             <span>变: {record.changedHexagram.name}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
        
        {history.length > 0 && (
            <div className="p-4 text-center">
                 <button 
                    onClick={handleClearHistory}
                    className="text-stone-400 text-sm underline hover:text-red-500"
                >
                    清空所有记录
                </button>
            </div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#f5f5f0] shadow-2xl overflow-hidden relative font-sans">
      {screen === 'WELCOME' && renderWelcome()}
      {screen === 'TOSS' && renderToss()}
      {screen === 'RESULT' && renderResult()}
      {screen === 'HISTORY' && renderHistory()}
    </div>
  );
};

export default App;