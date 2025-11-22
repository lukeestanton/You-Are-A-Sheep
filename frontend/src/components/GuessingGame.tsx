import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { GameRoundData } from '../api';

interface GuessingGameProps {
  roundData: GameRoundData;
  onGuess: (commentId: string | null) => void;
  loading?: boolean;
}

export const GuessingGame: React.FC<GuessingGameProps> = ({ roundData, onGuess, loading }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(roundData.duration);
  
  useEffect(() => {
    setTimeLeft(roundData.duration);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!selectedId && !loading) {
              onGuess(null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roundData, selectedId, loading, onGuess]);

  const handleSelect = (id: string) => {
    if (loading || selectedId || timeLeft === 0) return;
    setSelectedId(id);
    onGuess(id);
  };

  const progressPercentage = (timeLeft / roundData.duration) * 100;

  return (
    <div className="relative z-20 w-full h-screen flex items-center pointer-events-none">
      <div className="w-1/2 h-full ml-auto bg-soviet-charcoal border-l-4 border-soviet-red p-8 flex flex-col justify-center gap-8 shadow-2xl pointer-events-auto relative overflow-hidden overflow-y-auto max-h-screen">
        
        <div className="absolute top-0 left-0 w-full h-4 bg-soviet-charcoal">
             <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ ease: "linear", duration: 1 }}
                className={clsx(
                    "h-full transition-colors duration-300",
                    progressPercentage < 20 ? "bg-red-600 animate-pulse" : "bg-soviet-cream"
                )}
             />
        </div>
        <div className="absolute top-6 right-6 font-mono text-xl text-soviet-cream opacity-50">
            {timeLeft}s
        </div>

        <div className="text-center mt-8">
             <h2 className="text-soviet-cream font-soviet text-4xl mb-2 uppercase tracking-widest text-shadow-sm">
                Avoid the Propaganda
             </h2>
             <p className="text-soviet-cream/70 font-mono text-sm">
                Select any comment EXCEPT the most popular one.
             </p>
        </div>
        
        <div className="flex flex-col gap-4">
          {roundData.options.map((option, index) => (
            <motion.button
              key={option.commentId}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelect(option.commentId)}
              disabled={loading || !!selectedId || timeLeft === 0}
              className={clsx(
                "w-full p-4 text-left border-2 transition-all duration-200 group relative overflow-hidden min-h-[80px]",
                selectedId === option.commentId 
                  ? "bg-soviet-red border-soviet-red text-soviet-cream" 
                  : "bg-soviet-cream text-soviet-charcoal border-soviet-charcoal hover:border-soviet-red hover:translate-x-2"
              )}
            >
              <div className="font-body font-bold text-md leading-tight relative z-10 pr-8">
                "{option.text}"
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 font-soviet text-4xl">
                {index + 1}
              </div>
            </motion.button>
          ))}
        </div>

        {loading && (
          <div className="text-center text-soviet-red font-soviet text-xl animate-pulse">
             Analyzing Dissent...
          </div>
        )}
        
        {timeLeft === 0 && !selectedId && (
             <div className="text-center text-red-500 font-soviet text-2xl animate-bounce">
                TIME EXPIRED - FAILURE IMMINENT
             </div>
        )}
      </div>
    </div>
  );
};
