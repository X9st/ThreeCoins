export enum CoinFace {
  Back = 2, // Yin (Flower/Pattern)
  Front = 3, // Yang (Value/Word)
}

export enum LineType {
  OldYin = 6,   // 2+2+2 (Moving)
  YoungYang = 7, // 3+2+2 (Static)
  YoungYin = 8,  // 3+3+2 (Static)
  OldYang = 9,   // 3+3+3 (Moving)
}

export interface LineResult {
  position: number; // 1-6
  coins: [CoinFace, CoinFace, CoinFace];
  total: number;
  type: LineType;
  timestamp: number;
}

export interface LineInterpretation {
  name: string;      // e.g., "初九", "六二"
  positionDesc: string; // e.g., "基层/起步阶段"
  advice: string;    // Specific advice based on position and Yin/Yang
}

export interface HexagramData {
  code: string; // binary key
  name: string;
  pinyin: string;
  description: string; // Short summary
  // Detailed interpretation fields
  overview: string;      // 总体运势
  career: string;        // 事业职场
  love: string;          // 情感婚姻
  strategy: string;      // 曾老指引/处世智慧
  lines: LineInterpretation[]; // Detailed reading for each of the 6 lines
}

export interface ReadingRecord {
  id: string;
  timestamp: number;
  question: string;
  lines: LineResult[];
  originalHexagram: HexagramData;
  changedHexagram: HexagramData;
}

export type AppScreen = 'WELCOME' | 'TOSS' | 'RESULT' | 'HISTORY';