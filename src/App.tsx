import React, { useState } from 'react';
import WorkoutConfig from './components/WorkoutConfig';
import WorkoutActive from './components/WorkoutActive';
import WorkoutCompleted from './components/WorkoutCompleted';
import { Routine, WorkoutStats } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'config' | 'active' | 'completed'>('config');
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);

  const handleStartWorkout = (routine: Routine) => {
    setSelectedRoutine(routine);
    setCurrentScreen('active');
  };

  const handleWorkoutComplete = (stats: WorkoutStats) => {
    setWorkoutStats(stats);
    setCurrentScreen('completed');
  };

  const handleCancelWorkout = () => {
    setCurrentScreen('config');
  };

  const handleRestartWorkout = () => {
    if (selectedRoutine) {
      setCurrentScreen('active');
    }
  };

  const handleGoHome = () => {
    setCurrentScreen('config');
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-zinc-100 flex flex-col antialiased">
      <main className="flex-1 flex flex-col justify-center items-center">
        {currentScreen === 'config' && (
          <WorkoutConfig onStart={handleStartWorkout} />
        )}
        
        {currentScreen === 'active' && selectedRoutine && (
          <WorkoutActive
            routine={selectedRoutine}
            onCancel={handleCancelWorkout}
            onComplete={handleWorkoutComplete}
          />
        )}
        
        {currentScreen === 'completed' && selectedRoutine && workoutStats && (
          <WorkoutCompleted
            stats={workoutStats}
            routine={selectedRoutine}
            onRestart={handleRestartWorkout}
            onGoHome={handleGoHome}
          />
        )}
      </main>
      
      {/* Visual Footer */}
      <footer className="py-6 text-center border-t border-zinc-900 bg-black">
        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
          © {new Date().getFullYear()} TEMPORIZADOR DE INTERVALOS PRO • ALTO RENDIMIENTO
        </p>
      </footer>
    </div>
  );
}

