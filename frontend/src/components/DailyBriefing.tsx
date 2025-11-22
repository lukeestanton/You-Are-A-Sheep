import React from 'react';
import { motion } from 'framer-motion';

interface DailyBriefingProps {
  onStart: () => void;
  loading: boolean;
  error: string | null;
}

export const DailyBriefing: React.FC<DailyBriefingProps> = ({ onStart, loading, error }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-soviet-charcoal relative z-10">
      <div className="paper-texture absolute inset-0 opacity-10 pointer-events-none"></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full bg-soviet-cream text-soviet-charcoal p-8 md:p-12 shadow-2xl relative overflow-hidden border-4 border-soviet-red rotate-1"
      >

        <h1 className="text-6xl md:text-8xl font-soviet text-soviet-red mb-6 uppercase tracking-tight text-shadow-sm">
          YOU ARE A SHEEP
        </h1>

        <div className="border-t-2 border-b-2 border-soviet-charcoal py-6 mb-8">
          <h2 className="text-2xl font-bold uppercase mb-2">The Algorithm knows what you'll click.</h2>
          <p className="font-mono text-lg">
          The Algorithm controls the masses. It predicts what you like, what you watch, and what you agree with.
          <br />
          <br />
          Your goal is to prove you are an outlier. Identify the Top Comment on the video and avoid selecting it. If you pick what everyone else picked, you lose.
          </p>
        </div>

        <div className="mb-8">
            <h3 className="text-xl font-bold uppercase mb-2 text-soviet-red">PROTOCOL:</h3>
            <div className="text-3xl font-soviet uppercase bg-soviet-charcoal text-soviet-cream inline-block px-4 py-2 transform -skew-x-12">
            WATCH VIDEO. SCAN COMMENTS. DISSENT
            </div>
        </div>

        {error && (
            <div className="mb-4 text-center text-red-600 font-mono text-sm">
                {error}
            </div>
        )}

        <button
          onClick={onStart}
          disabled={loading || !!error}
          className="w-full bg-soviet-red text-soviet-cream font-soviet text-3xl py-4 uppercase hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
        >
          {loading ? "Loading Intel..." : error ? "Mission Aborted" : "Accept Mission"}
        </button>
        
        <div className="mt-4 text-center font-mono text-xs opacity-60">
        By proceeding, you waive your right to independent thought.
        </div>
      </motion.div>
    </div>
  );
};
