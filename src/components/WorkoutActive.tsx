import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, X, 
  Volume2, VolumeX, Volume1, Shield, Award, Activity, RotateCcw, Flame, Settings, Sparkles
} from 'lucide-react';
import { Routine, WorkoutStep, WorkoutStats, TimerPhase } from '../types';
import { audio } from '../utils/audio';
import AudioSettingsModal from './AudioSettingsModal';

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
  const [showAudioModal, setShowAudioModal] = useState(false);
  
  // Total elapsed workout time tracker
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);

  const currentStep = steps.current[currentStepIndex] || steps.current[0];
  const nextStep = currentStepIndex < steps.current.length - 1 ? steps.current[currentStepIndex + 1] : null;

  // Track if we already beeped on this second to avoid double triggers
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
      const currentSecs = secondsRemaining;
      const soundKey = `${currentStep.id}_${currentSecs}`;

      if (lastSoundTriggerRef.current !== soundKey) {
        lastSoundTriggerRef.current = soundKey;

        // Sound requirement: Count down last 5 seconds of any phase
        if (currentSecs <= 5 && currentSecs > 0) {
          audio.playTick(currentSecs);
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
    const step = steps.current[currentStepIndex];
    if (!step) return;

    if (currentStepIndex === 0) {
      // Very first step (Prep)
      audio.playTick();
    } else {
      if (step.type === 'warmup') {
        audio.playWarmupStart();
      } else if (step.type === 'work') {
        audio.playWorkStart(step.subLabel || step.label);
      } else if (step.type === 'rest_exercise') {
        audio.playWorkEnd(step.subLabel || 'Descanso');
      } else if (step.type === 'rest_series') {
        audio.playSeriesRestStart();
      } else if (step.type === 'cooldown') {
        audio.playCooldownStart();
      }
    }
  }, [currentStepIndex]);

  const handleNextStep = () => {
    if (currentStepIndex < steps.current.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setSecondsRemaining(steps.current[nextIdx].duration);
    } else {
      handleWorkoutFinished();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setSecondsRemaining(steps.current[prevIdx].duration);
    } else {
      setSecondsRemaining(steps.current[0].duration);
    }
  };

  const handleWorkoutFinished = () => {
    setIsActive(false);
    audio.playSuccess();
    
    // Estimate burned calories
    const totalWorkSeconds = steps.current
      .filter((s) => s.type === 'work' || s.type === 'warmup' || s.type === 'cooldown')
      .reduce((acc, curr) => {
        const rate = curr.type === 'work' ? 0.16 : 0.08;
        return acc + (curr.duration * rate);
      }, 0);
    const caloriesBurned = Math.round(totalWorkSeconds);

    const stats: WorkoutStats = {
      totalDuration: totalElapsedSeconds,
      completedExercises: routine.exercisesCount,
      completedSeries: routine.series,
      caloriesBurnedEstimate: Math.max(20, caloriesBurned),
      warmupDuration: routine.warmupTime || 0,
      cooldownDuration: routine.cooldownTime || 0,
    };
    onComplete(stats);
  };

  // Helper calculation to build multi-block steps sequence
  function buildSteps(r: Routine): WorkoutStep[] {
    const list: WorkoutStep[] = [];
    const mode = r.mode || 'classic';
    
    // 1. Initial Prep Countdown (5 seconds)
    list.push({
      id: 'prep',
      type: 'prep',
      seriesIndex: 0,
      exerciseIndex: 0,
      duration: 5,
      label: 'Preparación',
      subLabel: 'Prepárate para comenzar',
      blockTitle: 'PREPARACIÓN'
    });

    // 2. Bloque 1: Calentamiento / Warmup (if configured)
    if (r.warmupTime && r.warmupTime > 0) {
      list.push({
        id: 'warmup',
        type: 'warmup',
        seriesIndex: 0,
        exerciseIndex: 0,
        duration: r.warmupTime,
        label: 'Calentamiento (Puesta a Punto)',
        subLabel: 'Movilidad articular y trote suave',
        blockTitle: 'BLOQUE 1: CALENTAMIENTO'
      });
    }

    // 3. Bloque 2: Intervalos Centrales (Fartlek, HIIT, Tabata, EMOM, Circuitos)
    for (let s = 0; s < r.series; s++) {
      for (let e = 0; e < r.exercisesCount; e++) {
        let workName = r.exerciseNames?.[e] || `Ejercicio ${e + 1}`;
        let workSub = `Ronda ${s + 1} de ${r.series}`;
        let blockTitle = `BLOQUE CENTRAL (${s + 1}/${r.series})`;

        if (mode === 'fartlek') {
          workName = r.workLabel || 'Ritmo Fuerte (Sprint / Aceleración)';
          workSub = `Cambio de ritmo ${s + 1} de ${r.series}`;
          blockTitle = `FARTLEK: CAMBIO ${s + 1}/${r.series}`;
        } else if (mode === 'emom') {
          workName = r.workLabel || `Minuto ${s + 1}: Completar Repeticiones`;
          workSub = 'Realiza las repeticiones al inicio';
          blockTitle = `EMOM: MINUTO ${s + 1}/${r.series}`;
        } else if (mode === 'tabata') {
          workName = r.workLabel || 'Tabata: Esfuerzo Máximo (100%)';
          workSub = `Intervalo ${s + 1} de ${r.series}`;
          blockTitle = `TABATA: ROUND ${s + 1}/${r.series}`;
        }
        
        // Work interval
        list.push({
          id: `work_${s}_${e}`,
          type: 'work',
          seriesIndex: s,
          exerciseIndex: e,
          duration: r.workTime,
          label: workName,
          subLabel: workSub,
          blockTitle
        });

        // Rest intervals
        const isLastEx = e === r.exercisesCount - 1;
        const isLastSeries = s === r.series - 1;

        if (isLastEx) {
          if (!isLastSeries) {
            // Rest between series or Fartlek recovery
            const restDuration = r.seriesRestTime > 0 ? r.seriesRestTime : r.restTime;
            if (restDuration > 0) {
              let restName = r.seriesRestTime > 0 ? 'Descanso entre Series' : (r.restLabel || 'Ritmo Suave / Recuperación');
              let restSub = mode === 'fartlek' ? 'Trote suave y control de respiración' : 'Recupera pulsaciones para la siguiente ronda';

              list.push({
                id: `rest_series_${s}`,
                type: r.seriesRestTime > 0 ? 'rest_series' : 'rest_exercise',
                seriesIndex: s,
                exerciseIndex: e,
                duration: restDuration,
                label: restName,
                subLabel: restSub,
                blockTitle: mode === 'fartlek' ? `FARTLEK: RECUPERACIÓN ${s + 1}/${r.series}` : 'DESCANSO ENTRE SERIES'
              });
            }
          } else {
            // Last round: if Fartlek and has restTime and no cooldown block, add last rest
            if (mode === 'fartlek' && r.restTime > 0 && (!r.cooldownTime || r.cooldownTime <= 0)) {
              list.push({
                id: `rest_fartlek_last`,
                type: 'rest_exercise',
                seriesIndex: s,
                exerciseIndex: e,
                duration: r.restTime,
                label: r.restLabel || 'Ritmo Suave / Recuperación',
                subLabel: 'Trote suave final',
                blockTitle: 'RECUPERACIÓN FINAL'
              });
            }
          }
        } else {
          // Exercise rest
          if (r.restTime > 0) {
            list.push({
              id: `rest_ex_${s}_${e}`,
              type: 'rest_exercise',
              seriesIndex: s,
              exerciseIndex: e,
              duration: r.restTime,
              label: r.restLabel || 'Descanso',
              subLabel: 'Respira y prepárate para el siguiente',
              blockTitle: 'DESCANSO'
            });
          }
        }
      }
    }

    // 4. Bloque 3: Vuelta a la Calma / Cooldown (if configured)
    if (r.cooldownTime && r.cooldownTime > 0) {
      list.push({
        id: 'cooldown',
        type: 'cooldown',
        seriesIndex: r.series - 1,
        exerciseIndex: 0,
        duration: r.cooldownTime,
        label: 'Vuelta a la Calma / Enfriamiento',
        subLabel: 'Trote regenerativo, caminata y respiración profunda',
        blockTitle: 'BLOQUE 3: VUELTA A LA CALMA'
      });
    }

    return list;
  }

  // Visual color scheme based on step types
  const getPhaseColors = (type: TimerPhase) => {
    switch (type) {
      case 'prep':
        return {
          bg: 'bg-[#0F0F0F] border-cyan-900/60',
          text: 'text-cyan-400',
          progress: 'stroke-cyan-400',
          badge: 'bg-black text-cyan-400 border-cyan-800/80',
          title: 'PREPARACIÓN'
        };
      case 'warmup':
        return {
          bg: 'bg-[#0F0F0F] border-amber-900/50',
          text: 'text-amber-400',
          progress: 'stroke-amber-400',
          badge: 'bg-black text-amber-400 border-amber-800/80',
          title: 'CALENTAMIENTO'
        };
      case 'work':
        return {
          bg: 'bg-[#0F0F0F] border-zinc-800',
          text: 'text-[#CCFF00]',
          progress: 'stroke-[#CCFF00]',
          badge: 'bg-black text-[#CCFF00] border-[#CCFF00]/40',
          title: routine.mode === 'fartlek' ? 'RITMO FUERTE' : routine.mode === 'emom' ? 'MINUTO ACTIVO' : 'TRABAJO'
        };
      case 'rest_exercise':
        return {
          bg: 'bg-[#0F0F0F] border-sky-950',
          text: 'text-sky-400',
          progress: 'stroke-sky-400',
          badge: 'bg-black text-sky-400 border-sky-800/80',
          title: routine.mode === 'fartlek' ? 'RITMO SUAVE (RECUPERACIÓN)' : 'DESCANSO'
        };
      case 'rest_series':
        return {
          bg: 'bg-[#0F0F0F] border-purple-950',
          text: 'text-purple-400',
          progress: 'stroke-purple-400',
          badge: 'bg-black text-purple-400 border-purple-800/80',
          title: 'DESCANSO DE SERIE'
        };
      case 'cooldown':
        return {
          bg: 'bg-[#0F0F0F] border-emerald-950',
          text: 'text-emerald-400',
          progress: 'stroke-emerald-400',
          badge: 'bg-black text-emerald-400 border-emerald-800/80',
          title: 'VUELTA A LA CALMA'
        };
      default:
        return {
          bg: 'bg-[#0F0F0F] border-zinc-800',
          text: 'text-zinc-400',
          progress: 'stroke-zinc-700',
          badge: 'bg-black text-zinc-400 border-zinc-800',
          title: 'ENTRENAMIENTO'
        };
    }
  };

  const scheme = getPhaseColors(currentStep.type);
  const maxDuration = currentStep.duration;
  const progressRatio = Math.min(1, Math.max(0, secondsRemaining / maxDuration));
  
  // Circular progress dimensions
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalWorkoutSeconds = steps.current.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div id="active-screen" className="w-full max-w-4xl mx-auto px-4 py-4 md:py-8 text-white">
      <div className="flex flex-col gap-6">
        
        {/* Top bar header */}
        <div className="flex justify-between items-center bg-[#0F0F0F] border border-zinc-800 px-5 py-4 rounded-xl">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-2.5 w-2.5 rounded-full ${
              currentStep.type === 'work' ? 'bg-[#CCFF00]' : currentStep.type === 'warmup' ? 'bg-amber-400' : currentStep.type === 'cooldown' ? 'bg-emerald-400' : 'bg-sky-400'
            } animate-pulse`} />
            <h1 className="font-black text-white text-base md:text-lg uppercase tracking-tight truncate max-w-[180px] sm:max-w-xs">
              {routine.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Settings & Boost button */}
            <button
              onClick={() => setShowAudioModal(true)}
              className="p-2.5 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 hover:text-[#CCFF00] hover:border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
              title="Ajustar potencia de sonido y voz"
            >
              <Settings className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase hidden sm:inline">Audio</span>
            </button>

            {/* Audio Quick Mute button */}
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
          <div className="flex items-center gap-2 mb-6">
            <span className={`px-4.5 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${scheme.badge}`}>
              {scheme.title}
            </span>
            {currentStep.blockTitle && (
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                • {currentStep.blockTitle}
              </span>
            )}
          </div>

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
                  {secondsRemaining >= 60 ? formatTime(secondsRemaining) : secondsRemaining}
                </motion.span>
              </AnimatePresence>
              
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                {secondsRemaining >= 60 ? 'MINUTOS' : 'SEGUNDOS'}
              </span>
            </div>
          </div>

          {/* Current Step Label / Instruction */}
          <div className="text-center mt-8 z-10 max-w-xl">
            {/* If rest or prep and last 5 seconds, show a giant PREPÁRATE alert */}
            {((currentStep.type === 'prep' || currentStep.type === 'rest_exercise' || currentStep.type === 'rest_series' || currentStep.type === 'warmup') && secondsRemaining <= 5 && nextStep) ? (
              <motion.div 
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="flex flex-col items-center gap-1"
              >
                <h2 className="text-3xl md:text-4xl font-black text-[#CCFF00] uppercase tracking-tighter leading-none animate-pulse">
                  ¡PREPÁRATE: {nextStep.label}!
                </h2>
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Comienza en {secondsRemaining}s
                </span>
              </motion.div>
            ) : (
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight">
                  {currentStep.label}
                </h2>
                {currentStep.subLabel && (
                  <p className="text-xs md:text-sm text-zinc-400 font-bold uppercase tracking-wider mt-1.5">
                    {currentStep.subLabel}
                  </p>
                )}
              </div>
            )}
            
            {/* Upcoming exercise banner */}
            {(currentStep.type === 'prep' || currentStep.type === 'rest_exercise' || currentStep.type === 'rest_series' || currentStep.type === 'warmup') && nextStep && secondsRemaining > 5 && (
              <p className="text-xs md:text-sm text-zinc-400 font-black uppercase tracking-tight mt-3">
                Siguiente: <span className="text-white">{nextStep.label}</span> ({formatTime(nextStep.duration)})
              </p>
            )}

            {/* Round and Exercise specs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
              {currentStep.type === 'warmup' ? (
                <div className="bg-black/60 border border-amber-900/40 px-6 py-3 rounded-2xl text-center min-w-[200px] shadow-inner">
                  <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">FASE INICIAL</div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                    CALENTAMIENTO
                  </div>
                </div>
              ) : currentStep.type === 'cooldown' ? (
                <div className="bg-black/60 border border-emerald-900/40 px-6 py-3 rounded-2xl text-center min-w-[200px] shadow-inner">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">FASE FINAL</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    VUELTA A LA CALMA
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-black/60 border border-zinc-800 px-6 py-3 rounded-2xl text-center min-w-[160px] shadow-inner">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      {routine.mode === 'fartlek' ? 'CAMBIO DE RITMO' : routine.mode === 'emom' ? 'MINUTO' : 'RONDA'}
                    </div>
                    <div className="text-3xl font-black text-white font-mono mt-0.5">
                      {currentStep.seriesIndex + 1} <span className="text-zinc-600 text-base font-normal">/ {routine.series}</span>
                    </div>
                  </div>
                  
                  {routine.exercisesCount > 1 && (
                    <div className="bg-black/60 border border-zinc-800 px-6 py-3 rounded-2xl text-center min-w-[160px] shadow-inner">
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">EJERCICIO</div>
                      <div className="text-3xl font-black text-[#CCFF00] font-mono mt-0.5">
                        {currentStep.exerciseIndex + 1} <span className="text-zinc-600 text-base font-normal">/ {routine.exercisesCount}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
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
                    nextStep.type === 'work' ? 'bg-[#CCFF00]' : nextStep.type === 'cooldown' ? 'bg-emerald-400' : nextStep.type === 'warmup' ? 'bg-amber-400' : 'bg-sky-400'
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
                  ¡ÚLTIMO INTERVALO! (FIN DE SESIÓN)
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
              <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">TOTAL ESTIMADO</span>
              <div className="text-2xl font-black text-zinc-500 font-mono mt-0.5">
                {formatTime(totalWorkoutSeconds)}
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

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
      />

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
                  className="flex-1 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
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
