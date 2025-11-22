import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface Comment {
  id: string;
  text: string;
  likes?: number;
  isCorrect?: boolean;
}

export interface DailyChallengeData {
  roundId: string;
  videoLink: string;
  theme: string;
  comments: Comment[];
}

export interface RankingResult {
  score: number;
  userRanking: string[];
  correctRanking: Comment[];
}

export interface GameRoundData {
  roundId: string;
  videoLink: string;
  duration: number;
  options: {
    commentId: string;
    text: string;
  }[];
}

export interface GuessResult {
  isCorrect: boolean;
  selectedOptionId: string;
  options: {
    commentId: string;
    text: string;
    likes: number;
    isTop: boolean;
  }[];
}

export const getDailyPath = async (): Promise<GameRoundData[]> => {
  const response = await axios.get(`${API_URL}/daily-challenge`);
  return response.data;
};

export const submitGuess = async (roundId: string, commentId: string): Promise<GuessResult> => {
  const response = await axios.post(`${API_URL}/submit-guess`, {
    roundId,
    commentId,
  });
  return response.data;
};

export const getDailyChallenge = async (): Promise<DailyChallengeData> => {
  const response = await axios.get(`${API_URL}/daily-challenge`);
  return response.data;
};

export const submitRank = async (roundId: string, userRanking: string[]): Promise<RankingResult> => {
  const response = await axios.post(`${API_URL}/submit-rank`, {
    roundId,
    userRanking,
  });
  return response.data;
};

