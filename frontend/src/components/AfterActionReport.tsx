import React from 'react';
import type { GuessResult } from '../api';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface AfterActionReportProps {
  victory: boolean;
  roundNumber: number;
  result: GuessResult | null;
  onRestart: () => void;
}

export const AfterActionReport: React.FC<AfterActionReportProps> = ({ victory, roundNumber, result, onRestart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-soviet-charcoal/95 relative z-30 p-4 overflow-y-auto">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-4xl w-full bg-soviet-cream text-soviet-charcoal p-8 shadow-2xl border-4 border-soviet-red"
      >
        <div className="flex justify-between items-start mb-8 border-b-4 border-soviet-charcoal pb-4">
            <div>
                <h1 className={clsx("text-5xl md:text-7xl font-soviet uppercase", victory ? "text-green-700" : "text-soviet-red")}>
                    {victory ? "Mission Complete" : "Failure"}
                </h1>
                <div className="text-xl font-mono">Date: {new Date().toLocaleDateString()}</div>
            </div>
            <div className="text-right">
                 <div className="text-2xl font-soviet uppercase text-soviet-charcoal">Completed</div>
                 <div className="text-6xl font-soviet">{victory ? 5 : roundNumber - 1}/5</div>
            </div>
        </div>

        <div className="space-y-4 mb-8">
            <h3 className="font-soviet text-2xl uppercase text-center mb-4">
                {victory ? "Dissident Status Confirmed" : "Conformity Detected"}
            </h3>
            
            {result && (
                <div className="grid grid-cols-1 gap-4">
                    {result.options.map((option) => (
                        <div 
                            key={option.commentId} 
                            className={clsx(
                                "p-4 border-2 flex justify-between items-center",
                                option.isTop ? "bg-red-100 border-red-600" : 
                                option.commentId === result.selectedOptionId ? "bg-green-100 border-green-600" : "bg-gray-100 border-gray-300 opacity-50"
                            )}
                        >
                            <div className="flex-1">
                                <p className="font-bold">{option.text}</p>
                                {option.isTop && <span className="text-xs uppercase text-red-700 font-bold">Sheep Choice (Top Comment)</span>}
                                {option.commentId === result.selectedOptionId && !option.isTop && <span className="text-xs uppercase text-green-700 font-bold">Your Choice (Safe)</span>}
                            </div>
                            <div className="font-mono text-xl ml-4">
                                {option.likes?.toLocaleString()} <span className="text-xs">likes</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="flex justify-center">
             <button 
                onClick={onRestart}
                className="bg-soviet-charcoal text-soviet-cream font-soviet text-2xl px-8 py-4 uppercase hover:bg-black transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
             >
                Re-Deploy
             </button>
        </div>
        
      </motion.div>
    </div>
  );
};
