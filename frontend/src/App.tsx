import { useState } from 'react';
import { getDailyPath, submitGuess } from './api';
import type { GameRoundData, GuessResult } from './api';
import { DailyBriefing } from './components/DailyBriefing';
import { VideoPlayer } from './components/VideoPlayer';
import { GuessingGame } from './components/GuessingGame';
import { AfterActionReport } from './components/AfterActionReport';

function App() {
  const [gameState, setGameState] = useState<'briefing' | 'playing' | 'gameover' | 'victory'>('briefing');
  const [dailyPath, setDailyPath] = useState<GameRoundData[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPath = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDailyPath();
      setDailyPath(data);
      setCurrentRoundIndex(0);
      setGameState('playing');
    } catch (error) {
      console.error("Failed to fetch daily path", error);
      setError("Failed to establish secure connection to HQ.");
      setGameState('briefing');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    fetchPath();
  };

  const handleGuess = async (commentId: string | null) => {
    if (!dailyPath[currentRoundIndex]) return;
    const currentRound = dailyPath[currentRoundIndex];
    
    setLoading(true);
    try {
      const idToSubmit = commentId || "TIMEOUT";

      const result = await submitGuess(currentRound.roundId, idToSubmit);
      
      if (result.isCorrect) {
         if (currentRoundIndex < dailyPath.length - 1) {
             setCurrentRoundIndex(prev => prev + 1);
         } else {
             setGameState('victory');
             setLastResult(null); 
         }
      } else {
         setLastResult(result);
         setGameState('gameover');
      }
    } catch (error) {
      console.error("Failed to submit guess", error);
    } finally {
        setLoading(false);
    }
  };

  const handleRestart = () => {
     setGameState('briefing');
     setDailyPath([]);
     setCurrentRoundIndex(0);
     setLastResult(null);
  };

  const currentRound = dailyPath[currentRoundIndex];

  return (
    <div className="min-h-screen bg-soviet-charcoal text-soviet-cream font-body overflow-hidden relative">
      <div className="scanlines"></div>
      <div className="noise-overlay"></div>

      {gameState === 'briefing' && (
        <DailyBriefing 
            onStart={handleStart} 
            loading={loading} 
            error={error}
        />
      )}

      {gameState === 'playing' && currentRound && (
        <>
            <VideoPlayer videoLink={currentRound.videoLink} />
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-soviet-red text-soviet-cream font-soviet text-2xl px-4 py-2 shadow-lg border-2 border-soviet-cream">
                    Level: {dailyPath.length - currentRoundIndex} Options
                </div>
                <div className="text-right mt-1 font-mono text-xs opacity-70">
                    Round {currentRoundIndex + 1}/{dailyPath.length}
                </div>
            </div>
            <div className="relative z-20">
                <GuessingGame 
                    key={currentRound.roundId}
                    roundData={currentRound}
                    onGuess={handleGuess}
                    loading={loading}
                />
            </div>
        </>
      )}

      {(gameState === 'gameover' || gameState === 'victory') && (
        <AfterActionReport 
            victory={gameState === 'victory'} 
            roundNumber={currentRoundIndex + 1}
            result={lastResult} 
            onRestart={handleRestart} 
        />
      )}
    </div>
  );
}

export default App;
