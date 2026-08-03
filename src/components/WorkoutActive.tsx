import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, X, 
  Volume2, VolumeX, Shield, Award, Activity, RotateCcw, Flame
} from 'lucide-react';
import { Routine, WorkoutStep, WorkoutStats } from '../types';
import { audio } from '../utils/audio';

interface WorkoutActiveProps {
  routine: Routine;
  onCancel: () => void;
  onComplete: (stats: WorkoutStats) => void;
}

export default function WorkoutActive({ routine, onCancel, onComplete }: WorkoutActiveProps) {
  // Generate all steps for the workout
  const steps = useRef<WorkoutStep[]>([]);
  if (steps.current.length === 0) {
    steps.current = buildSteps(routine);
  }

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(steps.current[0].duration);
  const [isActive, setIsActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Total elapsed workout time tracker
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);

  const currentStep = steps.current[currentStepIndex];
  const nextStep = currentStepIndex < steps.current.length - 1 ? steps.current[currentStepIndex + 1] : null;

  // Track if we already beeped on this second to avoid double beeping on fast renders
  const lastSoundTriggerRef = useRef<string>('');

  // Handle Mute initialization
  useEffect(() => {
    setIsMuted(audio.getMuted());
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.setMute(nextMuted);
  };

  // Main countdown ticker effect
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      // 1. Increment total elapsed time
      setTotalElapsedSeconds((prev) => prev + 1);

      // 2. Play sound alerts based on current seconds remaining
      // We look at the seconds remaining before decrementing
      const currentSecs = secondsRemaining;
      const soundKey = `${currentStep.id}_${currentSecs}`;

      if (lastSoundTriggerRef.current !== soundKey) {
        lastSoundTriggerRef.current = soundKey;

        // Sound requirement: Count down last 5 seconds of rest / prep
        const isCountdownPhase = currentStep.type === 'prep' || currentStep.type === 'rest_exercise' || currentStep.type === 'rest_series';
        if (isCountdownPhase && currentSecs <= 5 && currentSecs > 0) {
          audio.playTick();
        }
      }

      // 3. Decrement seconds remaining
      if (secondsRemaining > 1) {
        setSecondsRemaining((prev) => prev - 1);
      } else {
        // Transition to next step when it hits 0
        handleNextStep();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, secondsRemaining, currentStepIndex, currentStep]);

  // Audio trigger on step entering
  useEffect(() => {
    // Whenever currentStepIndex changes, we trigger start-of-step sounds
    const step = steps.current[currentStepIndex];
    if (!step) return;

    if (currentStepIndex > 0) {
      if (step.type === 'work') {
        audio.playWorkStart();
      } else if (step.type === 'rest_exercise' || step.type === 'rest_series') {
        audio.playWorkEnd(); // Plays the work end warning buzzer
      }
    } else {
      // Very first step (Prep)
      audio.playTick();
    }
  }, [currentStepIndex]);

  const handleNextStep = () => {
    if (currentStepIndex < steps.current.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setSecondsRemaining(steps.current[nextIdx].duration);
    } else {
      // Workout completed!
      handleWorkoutFinished();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setSecondsRemaining(steps.current[prevIdx].duration);
    } else {
      // Reset current prep step
      setSecondsRemaining(steps.current[0].duration);
    }
  };

  const handleWorkoutFinished = () => {
    setIsActive(false);
    audio.playSuccess();
    
    // Estimate burned calories: Roughly 0.12 calories per second of work
    const totalWorkSeconds = steps.current
      .filter((s) => s.type === 'work')
      .reduce((acc, curr) => acc + curr.duration, 0);
    const caloriesBurned = Math.round(totalWorkSeconds * 0.15);

    const stats: WorkoutStats = {
      totalDuration: totalElapsedSeconds,
      completedExercises: routine.exercisesCount,
      completedSeries: routine.series,
      caloriesBurnedEstimate: caloriesBurned || 15,
    };
    onComplete(stats);
  };

  // Helper calculation to build steps sequence
  function buildSteps(r: Routine): WorkoutStep[] {
    const list: WorkoutStep[] = [];
    
    // 1. Initial Prep (5 seconds)
    list.push({
      id: 'prep',
      type: 'prep',
      seriesIndex: 0,
      exerciseIndex: 0,
      duration: 5,
      label: 'Preparación'
    });

    // 2. Main series and exercises
    for (let s = 0; s < r.series; s++) {
      for (let e = 0; e < r.exercisesCount; e++) {
        const name = r.exerciseNames?.[e] || `Ejercicio ${e + 1}`;
        
        // Work interval
        list.push({
          id: `work_${s}_${e}`,
          type: 'work',
          seriesIndex: s,
          exerciseIndex: e,
          duration: r.workTime,
          label: name
        });

        // Rest intervals
        const isLastEx = e === r.exercisesCount - 1;
        const isLastSeries = s === r.series - 1;

        if (isLastEx) {
          // Last exercise of this series
          if (!isLastSeries) {
            // Not the last series: add series rest time or fallback to normal rest
            const restDuration = r.seriesRestTime > 0 ? r.seriesRestTime : r.restTime;
            if (restDuration > 0) {
              list.push({
                id: `rest_series_${s}`,
                type: 'rest_series',
                seriesIndex: s,
                exerciseIndex: e,
                duration: restDuration,
                label: r.seriesRestTime > 0 ? 'Descanso entre Series' : 'Descanso'
              });
            }
          }
          // If last series and last exercise: NO rest step!
        } else {
          // Normal exercise rest
          if (r.restTime > 0) {
            list.push({
              id: `rest_ex_${s}_${e}`,
              type: 'rest_exercise',
              seriesIndex: s,
              exerciseIndex: e,
              duration: r.restTime,
              label: 'Descanso'
            });
          }
        }
      }
    }
    return list;
  }

  // Get current color schemes based on step types
  const getPhaseColors = (type: string) => {
    switch (type) {
      case 'prep':
        return {
          bg: 'bg-[#0F0F0F] border-zinc-800',
          text: 'text-cyan-400',
          progress: 'stroke-cyan-400',
          badge: 'bg-black text-cyan-400 border-zinc-800',
          glow: 'shadow-none',
          title: 'PREPARACIÓN'
        };
      case 'work':
        return {
          bg: 'bg-[#0F0F0F] border-zinc-800',
          text: 'text-[#CCFF00]',
          progress: 'stroke-[#CCFF00]',
          badge: 'bg-black text-[#CCFF00] border-zinc-800',
          glow: 'shadow-none',
          title: 'TRABAJO'
        };
      case 'rest_exercise':
        return {
          bg: 'bg-[#0F0F0F] border-zinc-800',
          text: 'text-zinc-300',
          progress: 'stroke-zinc-600',
          badge: 'bg-black text-zinc-400 border-zinc-800',
          glow: 'shadow-none',
          title: 'DESCANSO'
        };
      case 'rest_series':
        return {
          bg: 'bg-[#0F0F0F] border-zinc-800',
          text: 'text-zinc-300',
          progress: 'stroke-zinc-600',
          badge: 'bg-black text-zinc-400 border-zinc-800',
          glow: 'shadow-none',
          title: 'DESCANSO DE SERIE'
        };
      default:
        return {
          bg: 'bg-[#0F0F0F] border-zinc-800',
          text: 'text-zinc-400',
          progress: 'stroke-zinc-700',
          badge: 'bg-black text-zinc-400 border-zinc-800',
          glow: 'shadow-none',
          title: 'ENTRENAMIENTO'
        };
    }
  };

  const scheme = getPhaseColors(currentStep.type);
  const maxDuration = currentStep.duration;
  const progressRatio = secondsRemaining / maxDuration;
  
  // Circular progress dimensions
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="active-screen" className="w-full max-w-4xl mx-auto px-4 py-4 md:py-8 text-white">
      <div className="flex flex-col gap-6">
        
        {/* Top bar header */}
        <div className="flex justify-between items-center bg-[#0F0F0F] border border-zinc-800 px-5 py-4 rounded-xl">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#CCFF00] animate-pulse" />
            <h1 className="font-black text-white text-base md:text-lg uppercase tracking-tight truncate max-w-[180px] sm:max-w-xs">
              {routine.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle button */}
            <button
              onClick={handleToggleMute}
              className={`p-2.5 rounded-xl transition-all border cursor-pointer ${
                isMuted 
                  ? 'bg-zinc-900 text-rose-400 border-zinc-800 hover:bg-zinc-800' 
                  : 'bg-zinc-900 text-[#CCFF00] border-zinc-800 hover:bg-zinc-800'
              }`}
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Stop / Cancel button */}
            <button
              onClick={() => setShowExitConfirm(true)}
              className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-rose-400 hover:border-zinc-700 transition-all cursor-pointer"
              title="Salir del entrenamiento"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Core visual countdown card */}
        <div className={`relative overflow-hidden border p-8 md:p-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${scheme.bg}`}>
          
          {/* Phase Badge */}
          <span className={`px-4.5 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border mb-6 ${scheme.badge}`}>
            {scheme.title}
          </span>

          {/* Large Digital Circular Countdown SVG */}
          <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
            <svg className="absolute transform -rotate-90 w-full h-full">
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                className="stroke-zinc-900"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Animated progress circle */}
              <motion.circle
                cx="50%"
                cy="50%"
                r={radius}
                className={`${scheme.progress} transition-all duration-300`}
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Central content */}
            <div className="text-center z-10 flex flex-col items-center">
              {/* Giant digits */}
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={secondsRemaining}
                  initial={{ scale: 0.8, opacity: 0.3 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`text-8xl md:text-9xl font-black font-mono tracking-tighter ${scheme.text}`}
                >
                  {secondsRemaining}
                </motion.span>
              </AnimatePresence>
              
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                SEGUNDOS
              </span>
            </div>
          </div>

          {/* Current Step Label / Instruction */}
          <div className="text-center mt-8 z-10 max-w-xl">
            {/* If rest or prep and last 5 seconds, show a giant PREPÁRATE alert */}
            {((currentStep.type === 'prep' || currentStep.type === 'rest_exercise' || currentStep.type === 'rest_series') && secondsRemaining <= 5) ? (
              <motion.h2 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-4xl md:text-5xl font-black text-[#CCFF00] uppercase tracking-tighter leading-none animate-pulse"
              >
                ¡PREPÁRATE PARA EMPEZAR!
              </motion.h2>
            ) : (
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                {currentStep.type === 'work' ? currentStep.label : 'DESCANSO'}
              </h2>
            )}
            
            {/* Upcoming exercise banner */}
            {(currentStep.type === 'prep' || currentStep.type === 'rest_exercise' || currentStep.type === 'rest_series') && nextStep && nextStep.type === 'work' && (
              <p className="text-lg md:text-xl text-zinc-400 font-black uppercase tracking-tight mt-3">
                Siguiente: <span className="text-white">{nextStep.label}</span>
              </p>
            )}

            {/* Round and Exercise specs - SIMPLIFIED AND SIGNIFICANTLY LARGER */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
              <div className="bg-black/60 border border-zinc-800 px-6 py-3 rounded-2xl text-center min-w-[160px] shadow-inner">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">RONDA</div>
                <div className="text-3xl font-black text-white font-mono mt-0.5">
                  {currentStep.seriesIndex + 1} <span className="text-zinc-600 text-base font-normal">/ {routine.series}</span>
                </div>
              </div>
              
              <div className="bg-black/60 border border-zinc-800 px-6 py-3 rounded-2xl text-center min-w-[160px] shadow-inner">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">EJERCICIO</div>
                <div className="text-3xl font-black text-[#CCFF00] font-mono mt-0.5">
                  {currentStep.exerciseIndex + 1} <span className="text-zinc-600 text-base font-normal">/ {routine.exercisesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Under dashboard metadata: Up next preview & stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Upcoming Step Preview Banner */}
          <div className="bg-[#0F0F0F] border border-zinc-800 p-5 rounded-xl flex flex-col justify-center">
            <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">PRÓXIMO INTERVALO</span>
            {nextStep ? (
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    nextStep.type === 'work' ? 'bg-[#CCFF00]' : nextStep.type === 'rest_series' ? 'bg-cyan-400' : 'bg-zinc-400'
                  }`} />
                  <span className="font-black text-white text-base uppercase tracking-tight truncate">
                    {nextStep.label}
                  </span>
                </div>
                <span className="text-sm font-black text-zinc-300 font-mono shrink-0 ml-3">
                  {formatTime(nextStep.duration)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <Award className="w-4 h-4 text-[#CCFF00]" />
                <span className="font-black text-[#CCFF00] text-sm uppercase tracking-tight">
                  FIN DE LA SESIÓN (¡ÚLTIMO ESFUERZO!)
                </span>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="bg-[#0F0F0F] border border-zinc-800 p-5 rounded-xl grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">TIEMPO TRANSCURRIDO</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {formatTime(totalElapsedSeconds)}
              </div>
            </div>
            <div>
              <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">TOTAL RUTINA</span>
              <div className="text-2xl font-black text-zinc-500 font-mono mt-0.5">
                {formatTime(steps.current.reduce((acc, curr) => acc + curr.duration, 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="flex justify-center items-center gap-4 bg-[#0F0F0F] border border-zinc-800 p-5 rounded-xl">
          {/* Previous Step */}
          <button
            onClick={handlePrevStep}
            className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 active:scale-95 transition-all cursor-pointer"
            title="Volver al intervalo anterior"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-18 h-18 rounded-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md ${
              isActive 
                ? 'bg-white hover:bg-zinc-100 text-black' 
                : 'bg-[#CCFF00] hover:bg-[#b8e600] text-black shadow-[#CCFF00]/5'
            }`}
            title={isActive ? 'Pausar' : 'Reanudar'}
          >
            {isActive ? (
              <Pause className="w-7 h-7 fill-black stroke-black" />
            ) : (
              <Play className="w-7 h-7 fill-black stroke-black ml-1" />
            )}
          </button>

          {/* Skip Step */}
          <button
            onClick={handleNextStep}
            className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 active:scale-95 transition-all cursor-pointer"
            title="Omitir este intervalo"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>



      </div>

      {/* Exit Workout Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F0F0F] border border-zinc-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-black uppercase tracking-tighter text-[#CCFF00] mb-2">
                ¿Abandonar entrenamiento?
              </h3>
              <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-5 leading-relaxed">
                ¿Estás seguro de que deseas salir? El progreso actual de esta sesión no se guardará en las estadísticas históricas.
              </p>
              
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold uppercase tracking-wider transition-colors border border-zinc-800 cursor-pointer"
                >
                  Continuar
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl bg-rose-650 hover:bg-rose-600 text-black bg-[#CCFF00] hover:bg-[#b8e600] text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Sí, Salir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
