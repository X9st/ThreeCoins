import { CoinFace, LineType, LineResult, HexagramData, ReadingRecord } from './types';
import { getHexagramData } from './constants';

export const tossCoin = (): CoinFace => {
  // 50% chance
  return Math.random() > 0.5 ? CoinFace.Front : CoinFace.Back;
};

export const calculateLine = (coins: [CoinFace, CoinFace, CoinFace], position: number): LineResult => {
  const total = coins.reduce((acc, curr) => acc + curr, 0);
  let type: LineType;

  switch (total) {
    case 6: type = LineType.OldYin; break;
    case 7: type = LineType.YoungYang; break;
    case 8: type = LineType.YoungYin; break;
    case 9: type = LineType.OldYang; break;
    default: type = LineType.YoungYang; // Fallback
  }

  return {
    position,
    coins,
    total,
    type,
    timestamp: Date.now()
  };
};

// 0 for Yin, 1 for Yang
const lineTypeToBinary = (type: LineType, isOriginal: boolean): string => {
  switch (type) {
    case LineType.YoungYang: return '1';
    case LineType.YoungYin: return '0';
    case LineType.OldYang: 
      // Old Yang (9) is Yang in Original, Changes to Yin (0) in Changed
      return isOriginal ? '1' : '0';
    case LineType.OldYin:
      // Old Yin (6) is Yin in Original, Changes to Yang (1) in Changed
      return isOriginal ? '0' : '1';
    default: return '1';
  }
};

// Robust ID generator compatible with non-secure contexts
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const generateReading = (question: string, lines: LineResult[]): ReadingRecord => {
  // Build binary strings from Bottom (index 0) to Top (index 5)
  let originalBinary = '';
  let changedBinary = '';

  lines.forEach(line => {
    originalBinary += lineTypeToBinary(line.type, true);
    changedBinary += lineTypeToBinary(line.type, false);
  });
  
  const originalHex = getHexagramData(originalBinary);
  const changedHex = getHexagramData(changedBinary);

  return {
    id: generateId(),
    timestamp: Date.now(),
    question,
    lines,
    originalHexagram: originalHex,
    changedHexagram: changedHex
  };
};

export const formatDate = (ts: number): string => {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Local Storage Helpers
const STORAGE_KEY = 'zeng_iching_history';

export const saveReading = (reading: ReadingRecord) => {
  try {
    const history = getHistory();
    const newHistory = [reading, ...history];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.error("Save failed", e);
  }
};

export const getHistory = (): ReadingRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const deleteReading = (id: string) => {
    const history = getHistory();
    const newHistory = history.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
};