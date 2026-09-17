import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Plus, Minus, Save, Trash2, Dumbbell, BookOpen,
  Timer, RotateCcw, Sparkles, AlertCircle, ChevronDown, ChevronUp, Check, Info,
  Volume2, Flame, HeartPulse, Wind, Gauge, Layers, Footprints, Shield
} from 'lucide-react';
import { Routine, WorkoutMode } from '../types';
import { getAllRoutines, saveAllRoutines } from '../utils/presets';
import AudioSettingsModal from './AudioSettingsModal';

interface WorkoutConfigProps {
  onStart: (routine: Routine) => void;
}

export default function WorkoutConfig({ onStart }: WorkoutConfigProps) {
  // Load all routines
  const [routines, setRoutines] = useState<Routine[]>([]);
  
  // Current editing state
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('fartlek-running');
  const [name, setName] = useState('Fartlek Carrera (3 Bloques)');
  const [mode, setMode] = useState<WorkoutMode>('fartlek');

  // Multi-block times (in seconds)
  const [warmupTime, setWarmupTime] = useState<number>(300); // 5 min
  const [cooldownTime, setCooldownTime] = useState<number>(300); // 5 min
  const [hasWarmup, setHasWarmup] = useState<boolean>(true);
  const [hasCooldown, setHasCooldown] = useState<boolean>(true);

  // Interval Core parameters
  const [series, setSeries] = useState(8); // Fartlek: Cambios de ritmo / Rondas
  const [exercisesCount, setExercisesCount] = useState(1);
  const [workTime, setWorkTime] = useState(60); // Fartlek: Ritmo Fuerte
  const [restTime, setRestTime] = useState(60); // Fartlek: Ritmo Suave
  const [seriesRestTime, setSeriesRestTime] = useState(0);
  
  // Custom names and labels
  const [workLabel, setWorkLabel] = useState('Ritmo Fuerte (Sprint / Aceleración)');
  const [restLabel, setRestLabel] = useState('Ritmo Suave (Trote Regenerativo)');
  const [exerciseNames, setExerciseNames] = useState<string[]>([
    'Fartlek Carrera Continua'
  ]);

  // Modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [isExercisesCollapsed, setIsExercisesCollapsed] = useState(false);

  // Initialize from storage
  useEffect(() => {
    const loaded = getAllRoutines();
    setRoutines(loaded);
    if (loaded.length > 0) {
      const exists = loaded.find(r => r.id === selectedRoutineId) || loaded[0];
      handleSelectRoutine(exists);
    } else {
      handleCreateNewRoutine('fartlek');
    }
  }, []);

  // Update exerciseNames array when exercisesCount changes for classic mode
  useEffect(() => {
    if (mode === 'classic') {
      setExerciseNames((prev) => {
        const next = [...prev];
        if (next.length < exercisesCount) {
          for (let i = next.length; i < exercisesCount; i++) {
            next.push(`Ejercicio ${i + 1}`);
          }
        } else if (next.length > exercisesCount) {
          return next.slice(0, exercisesCount);
        }
        return next;
      });
    }
  }, [exercisesCount, mode]);

  // Handle Routine Mode Switching
  const handleModeChange = (newMode: WorkoutMode) => {
    setMode(newMode);
    if (newMode === 'fartlek') {
      setName('Nuevo Fartlek');
      setHasWarmup(true);
      setWarmupTime(300);
      setHasCooldown(true);
      setCooldownTime(300);
      setSeries(8);
      setExercisesCount(1);
      setWorkTime(60);
      setRestTime(60);
      setSeriesRestTime(0);
      setWorkLabel('Ritmo Fuerte (Sprint / Cambio)');
      setRestLabel('Ritmo Suave (Trote Suave)');
      setExerciseNames(['Fartlek Carrera']);
    } else if (newMode === 'tabata') {
      setName('Tabata 20/10');
      setHasWarmup(true);
      setWarmupTime(120);
      setHasCooldown(true);
      setCooldownTime(120);
      setSeries(8);
      setExercisesCount(1);
      setWorkTime(20);
      setRestTime(10);
      setSeriesRestTime(0);
      setWorkLabel('Esfuerzo Máximo (100%)');
      setRestLabel('Descanso Total');
      setExerciseNames(['Tabata Alta Intensidad']);
    } else if (newMode === 'emom') {
      setName('EMOM 10 Minutos');
      setHasWarmup(true);
      setWarmupTime(180);
      setHasCooldown(true);
      setCooldownTime(120);
      setSeries(10);
      setExercisesCount(1);
      setWorkTime(50);
      setRestTime(10);
      setSeriesRestTime(0);
      setWorkLabel('Minuto Activo (Completar Repeticiones)');
      setRestLabel('Transición');
      setExerciseNames(['EMOM Minuto']);
    } else {
      setName('HIIT Circuito');
      setHasWarmup(true);
      setWarmupTime(180);
      setHasCooldown(true);
      setCooldownTime(180);
      setSeries(3);
      setExercisesCount(4);
      setWorkTime(40);
      setRestTime(20);
      setSeriesRestTime(60);
      setWorkLabel('Trabajo');
      setRestLabel('Descanso');
      setExerciseNames(['Ejercicio 1', 'Ejercicio 2', 'Ejercicio 3', 'Ejercicio 4']);
    }
  };

  // Create a new routine from scratch
  const handleCreateNewRoutine = (initialMode: WorkoutMode = 'fartlek') => {
    setSelectedRoutineId('new-routine');
    handleModeChange(initialMode);
  };

  // Load selected routine
  const handleSelectRoutine = (routine: Routine) => {
    setSelectedRoutineId(routine.id);
    setName(routine.name);
    const rMode = routine.mode || (routine.workLabel?.toLowerCase().includes('fuerte') ? 'fartlek' : 'classic');
    setMode(rMode);
    
    // Warmup
    if (routine.warmupTime !== undefined && routine.warmupTime > 0) {
      setHasWarmup(true);
      setWarmupTime(routine.warmupTime);
    } else {
      setHasWarmup(false);
      setWarmupTime(180);
    }

    // Cooldown
    if (routine.cooldownTime !== undefined && routine.cooldownTime > 0) {
      setHasCooldown(true);
      setCooldownTime(routine.cooldownTime);
    } else {
      setHasCooldown(false);
      setCooldownTime(180);
    }

    setSeries(routine.series);
    setExercisesCount(routine.exercisesCount);
    setWorkTime(routine.workTime);
    setRestTime(routine.restTime);
    setSeriesRestTime(routine.seriesRestTime || 0);
    setWorkLabel(routine.workLabel || (rMode === 'fartlek' ? 'Ritmo Fuerte (Sprint)' : 'Trabajo'));
    setRestLabel(routine.restLabel || (rMode === 'fartlek' ? 'Ritmo Suave (Trote)' : 'Descanso'));

    if (routine.exerciseNames && routine.exerciseNames.length > 0) {
      setExerciseNames([...routine.exerciseNames]);
    } else {
      const initialNames = Array.from({ length: routine.exercisesCount }, (_, i) => `Ejercicio ${i + 1}`);
      setExerciseNames(initialNames);
    }
  };

  const handleSaveRoutine = () => {
    if (!newRoutineName.trim()) return;

    const newRoutine: Routine = {
      id: `custom_${Date.now()}`,
      name: newRoutineName.trim(),
      mode,
      warmupTime: hasWarmup ? warmupTime : 0,
      cooldownTime: hasCooldown ? cooldownTime : 0,
      series,
      exercisesCount,
      workTime,
      restTime,
      seriesRestTime,
      workLabel,
      restLabel,
      exerciseNames: [...exerciseNames],
      isPreset: false,
    };

    const updated = [...routines, newRoutine];
    setRoutines(updated);
    saveAllRoutines(updated);
    setSelectedRoutineId(newRoutine.id);
    setName(newRoutine.name);
    setShowSaveModal(false);
    setNewRoutineName('');
  };

  const handleDeleteRoutine = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = routines.filter((r) => r.id !== id);
    setRoutines(updated);
    saveAllRoutines(updated);
    
    if (selectedRoutineId === id) {
      if (updated.length > 0) {
        handleSelectRoutine(updated[0]);
      } else {
        handleCreateNewRoutine('fartlek');
      }
    }
  };

  const handleExerciseNameChange = (index: number, val: string) => {
    const updated = [...exerciseNames];
    updated[index] = val;
    setExerciseNames(updated);
  };

  const handleStartWorkout = () => {
    const currentRoutine: Routine = {
      id: selectedRoutineId,
      name,
      mode,
      warmupTime: hasWarmup ? warmupTime : 0,
      cooldownTime: hasCooldown ? cooldownTime : 0,
      series,
      exercisesCount,
      workTime,
      restTime,
      seriesRestTime,
      workLabel,
      restLabel,
      exerciseNames,
    };
    onStart(currentRoutine);
  };

  // Calculate Breakdown and Total Time
  const warmupSeconds = hasWarmup ? warmupTime : 0;
  const cooldownSeconds = hasCooldown ? cooldownTime : 0;
  
  let coreIntervalSeconds = 0;
  if (mode === 'fartlek' || mode === 'tabata' || mode === 'emom') {
    coreIntervalSeconds = series * (workTime + restTime);
    if (!hasCooldown && restTime > 0) {
      // Last rest counts as recovery
    }
  } else {
    // Classic / Circuitos
    const oneSeriesTime = exercisesCount * workTime + (exercisesCount > 1 ? (exercisesCount - 1) * restTime : 0);
    const totalSeriesTime = series * oneSeriesTime;
    const totalSeriesRestTime = series > 1 ? (series - 1) * (seriesRestTime > 0 ? seriesRestTime : restTime) : 0;
    coreIntervalSeconds = totalSeriesTime + totalSeriesRestTime;
  }

  const prepSeconds = 5;
  const totalWorkoutSeconds = prepSeconds + warmupSeconds + coreIntervalSeconds + cooldownSeconds;

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const formatDigital = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="config-screen" className="w-full max-w-4xl mx-auto px-4 py-4 md:py-8 text-white">
      <div className="flex flex-col gap-6">

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F0F] border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-[#CCFF00]">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Temporizador por Intervalos
              </h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Fartlek (3 Bloques) • Tabata • EMOM • HIIT • Boxeo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Settings & Boost button */}
            <button
              onClick={() => setShowAudioModal(true)}
              className="py-2.5 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Volume2 className="w-4 h-4 text-[#CCFF00]" />
              <span className="text-[10px] font-black uppercase tracking-wider">Sonido Ultra</span>
            </button>

            {/* Quick new routine button */}
            <button
              onClick={() => handleCreateNewRoutine('fartlek')}
              className="py-2.5 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Nueva</span>
            </button>
          </div>
        </div>

        {/* Presets Horizontal Carousel / Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#CCFF00]" />
              Rutinas Guardadas y Presets
            </label>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">
              {routines.length} Disponibles
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
            {routines.map((r) => {
              const isSelected = r.id === selectedRoutineId;
              const rMode = r.mode || 'classic';
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRoutine(r)}
                  className={`relative shrink-0 w-64 p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-black border-[#CCFF00] shadow-md shadow-[#CCFF00]/5'
                      : 'bg-[#0F0F0F] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                        rMode === 'fartlek' ? 'bg-amber-950/40 text-amber-400 border-amber-800/50' :
                        rMode === 'tabata' ? 'bg-rose-950/40 text-rose-400 border-rose-800/50' :
                        rMode === 'emom' ? 'bg-purple-950/40 text-purple-400 border-purple-800/50' :
                        'bg-zinc-900 text-zinc-300 border-zinc-700'
                      }`}>
                        {rMode}
                      </span>
                      {r.warmupTime && r.warmupTime > 0 && (
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">3 Bloques</span>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteRoutine(r.id, e)}
                      className="opacity-40 group-hover:opacity-100 hover:text-rose-400 p-1 rounded transition-opacity"
                      title="Eliminar rutina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2">
                    <h3 className={`text-xs font-black uppercase tracking-tight truncate ${
                      isSelected ? 'text-white' : 'text-zinc-300'
                    }`}>
                      {r.name}
                    </h3>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                      {r.series} {rMode === 'fartlek' ? 'cambios' : 'series'} • {formatMinSec(r.workTime)}/{formatMinSec(r.restTime)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workout Mode Selector Tabs */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-[#CCFF00]" />
            Tipo de Estructura de Entrenamiento
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'fartlek' as WorkoutMode, label: 'Fartlek (3 Bloques)', desc: 'Calentamiento + Fuerte/Suave + Enfriamiento' },
              { id: 'classic' as WorkoutMode, label: 'HIIT / Circuitos', desc: 'Series x Ejercicios con descansos' },
              { id: 'tabata' as WorkoutMode, label: 'Tabata 20/10', desc: '8 Rondas de máxima intensidad' },
              { id: 'emom' as WorkoutMode, label: 'EMOM (Por Minuto)', desc: 'Every Minute on the Minute' },
            ].map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    active
                      ? 'bg-black border-[#CCFF00] text-white shadow-sm shadow-[#CCFF00]/5'
                      : 'bg-[#0F0F0F] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-[#CCFF00]' : 'text-zinc-300'}`}>
                      {m.label}
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-[#CCFF00]" />}
                  </div>
                  <span className="text-[8.5px] text-zinc-500 font-bold uppercase mt-1 leading-tight">
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Routine Name Input */}
        <div className="bg-[#0F0F0F] border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 w-full">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
              Nombre de la Sesión
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm font-black uppercase tracking-tight text-white focus:border-[#CCFF00] outline-none"
              placeholder="Ej: Fartlek Carrera 8 Cambios"
            />
          </div>
          <button
            onClick={() => {
              setNewRoutineName(name);
              setShowSaveModal(true);
            }}
            className="w-full sm:w-auto py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#CCFF00]" />
            Guardar Como Nueva
          </button>
        </div>

        {/* THE 3 BLOCKS CONFIGURATION SECTION */}
        <div className="flex flex-col gap-4">

          {/* ========================================================= */}
          {/* BLOQUE 1: CALENTAMIENTO (WARMUP) */}
          {/* ========================================================= */}
          <div className="bg-[#0F0F0F] border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center justify-center text-amber-400">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-tight text-white">
                    Bloque 1: Calentamiento Progresivo
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase">
                    Trote suave y movilidad para preparar músculos y pulso
                  </p>
                </div>
              </div>

              {/* Warmup toggle */}
              <button
                onClick={() => setHasWarmup(!hasWarmup)}
                className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase border transition-colors cursor-pointer ${
                  hasWarmup
                    ? 'bg-amber-950/40 text-amber-400 border-amber-800/50'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
              >
                {hasWarmup ? 'ACTIVADO' : 'DESACTIVADO'}
              </button>
            </div>

            {hasWarmup && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Duración del Calentamiento
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                    {formatDigital(warmupTime)} <span className="text-xs text-zinc-500 font-normal">({formatMinSec(warmupTime)})</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {[
                    { label: '2 min', val: 120 },
                    { label: '3 min', val: 180 },
                    { label: '5 min', val: 300 },
                    { label: '10 min', val: 600 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => setWarmupTime(p.val)}
                      className={`py-1.5 px-2.5 rounded-lg text-[10px] font-black uppercase border transition-colors cursor-pointer ${
                        warmupTime === p.val
                          ? 'bg-amber-400 text-black border-amber-400'
                          : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setWarmupTime(Math.max(30, warmupTime - 30))}
                      className="p-2 rounded-lg bg-black border border-zinc-800 hover:border-zinc-700 text-zinc-300 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setWarmupTime(warmupTime + 30)}
                      className="p-2 rounded-lg bg-black border border-zinc-800 hover:border-zinc-700 text-zinc-300 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* BLOQUE 2: INTERVALOS CENTRALES (FARTLEK / HIIT / TABATA / EMOM) */}
          {/* ========================================================= */}
          <div className="bg-[#0F0F0F] border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-[#CCFF00]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-tight text-white">
                    Bloque 2: Intervalos Centrales ({mode.toUpperCase()})
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase">
                    {mode === 'fartlek' ? 'Alternancia de ritmos fuertes y suaves de recuperación' : 'Series y tiempos de esfuerzo'}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded text-[9px] font-black text-[#CCFF00] bg-black border border-zinc-800 uppercase">
                {formatMinSec(coreIntervalSeconds)}
              </span>
            </div>

            {/* Fartlek-specific simplified controls */}
            {mode === 'fartlek' ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Cambios de Ritmo (Series) */}
                <div className="bg-black border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Nº Cambios de Ritmo
                    </label>
                    <Footprints className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="text-3xl font-black text-white font-mono my-2">
                    {series} <span className="text-xs text-zinc-500 font-normal">repeticiones</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setSeries(Math.max(1, series - 1))}
                      className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSeries(series + 1)}
                      className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center cursor-pointer text-[#CCFF00]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Ritmo Fuerte (Work Time) */}
                <div className="bg-black border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <label className="text-[9px] font-black text-[#CCFF00] uppercase tracking-widest">
                      Ritmo Fuerte (Sprint)
                    </label>
                    <Flame className="w-4 h-4 text-[#CCFF00]" />
                  </div>
                  <div className="text-3xl font-black text-[#CCFF00] font-mono my-2">
                    {formatDigital(workTime)} <span className="text-xs text-zinc-500 font-normal">({formatMinSec(workTime)})</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setWorkTime(Math.max(10, workTime - (workTime > 60 ? 15 : 5)))}
                      className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setWorkTime(workTime + (workTime >= 60 ? 15 : 5))}
                      className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center cursor-pointer text-[#CCFF00]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Ritmo Suave / Recuperación (Rest Time) */}
                <div className="bg-black border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest">
                      Ritmo Suave (Trote)
                    </label>
                    <Wind className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-3xl font-black text-sky-400 font-mono my-2">
                    {formatDigital(restTime)} <span className="text-xs text-zinc-500 font-normal">({formatMinSec(restTime)})</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setRestTime(Math.max(5, restTime - (restTime > 60 ? 15 : 5)))}
                      className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRestTime(restTime + (restTime >= 60 ? 15 : 5))}
                      className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center cursor-pointer text-sky-400"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Classic / Tabata / EMOM Controls */
              <div className="mt-4 flex flex-col gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  
                  {/* Series / Rounds */}
                  <div className="bg-black border border-zinc-800 p-3.5 rounded-xl">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      {mode === 'emom' ? 'Minutos Totales' : mode === 'tabata' ? 'Rondas' : 'Series'}
                    </label>
                    <div className="text-2xl font-black text-white font-mono my-1">{series}</div>
                    <div className="flex gap-1">
                      <button onClick={() => setSeries(Math.max(1, series - 1))} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer"><Minus className="w-3 h-3" /></button>
                      <button onClick={() => setSeries(series + 1)} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer text-[#CCFF00]"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>

                  {/* Exercises Count (for classic) */}
                  {mode === 'classic' && (
                    <div className="bg-black border border-zinc-800 p-3.5 rounded-xl">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        Ejercicios / Serie
                      </label>
                      <div className="text-2xl font-black text-white font-mono my-1">{exercisesCount}</div>
                      <div className="flex gap-1">
                        <button onClick={() => setExercisesCount(Math.max(1, exercisesCount - 1))} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer"><Minus className="w-3 h-3" /></button>
                        <button onClick={() => setExercisesCount(exercisesCount + 1)} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer text-[#CCFF00]"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )}

                  {/* Work Time */}
                  <div className="bg-black border border-zinc-800 p-3.5 rounded-xl">
                    <label className="text-[9px] font-black text-[#CCFF00] uppercase tracking-widest">
                      Tiempo Trabajo
                    </label>
                    <div className="text-2xl font-black text-[#CCFF00] font-mono my-1">{formatDigital(workTime)}</div>
                    <div className="flex gap-1">
                      <button onClick={() => setWorkTime(Math.max(5, workTime - 5))} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer"><Minus className="w-3 h-3" /></button>
                      <button onClick={() => setWorkTime(workTime + 5)} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer text-[#CCFF00]"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>

                  {/* Rest Time */}
                  <div className="bg-black border border-zinc-800 p-3.5 rounded-xl">
                    <label className="text-[9px] font-black text-sky-400 uppercase tracking-widest">
                      Tiempo Descanso
                    </label>
                    <div className="text-2xl font-black text-sky-400 font-mono my-1">{formatDigital(restTime)}</div>
                    <div className="flex gap-1">
                      <button onClick={() => setRestTime(Math.max(0, restTime - 5))} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer"><Minus className="w-3 h-3" /></button>
                      <button onClick={() => setRestTime(restTime + 5)} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer text-sky-400"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>

                  {/* Series Rest (only classic) */}
                  {mode === 'classic' && (
                    <div className="bg-black border border-zinc-800 p-3.5 rounded-xl">
                      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                        Descanso Serie
                      </label>
                      <div className="text-2xl font-black text-purple-400 font-mono my-1">{formatDigital(seriesRestTime)}</div>
                      <div className="flex gap-1">
                        <button onClick={() => setSeriesRestTime(Math.max(0, seriesRestTime - 10))} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer"><Minus className="w-3 h-3" /></button>
                        <button onClick={() => setSeriesRestTime(seriesRestTime + 10)} className="flex-1 py-1 bg-zinc-900 rounded border border-zinc-800 flex justify-center cursor-pointer text-purple-400"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Exercise custom naming list for classic mode */}
                {mode === 'classic' && (
                  <div className="border-t border-zinc-800/80 pt-3">
                    <button
                      onClick={() => setIsExercisesCollapsed(!isExercisesCollapsed)}
                      className="flex items-center justify-between w-full text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer py-1"
                    >
                      <span>Nombrar Ejercicios ({exercisesCount})</span>
                      {isExercisesCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>

                    {!isExercisesCollapsed && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {exerciseNames.map((exName, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-black border border-zinc-800 px-3 py-2 rounded-lg">
                            <span className="text-[10px] font-mono text-zinc-500 font-bold w-5">{idx + 1}.</span>
                            <input
                              type="text"
                              value={exName}
                              onChange={(e) => handleExerciseNameChange(idx, e.target.value)}
                              className="bg-transparent text-xs text-white uppercase font-bold outline-none flex-1"
                              placeholder={`Ejercicio ${idx + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* BLOQUE 3: VUELTA A LA CALMA (COOLDOWN) */}
          {/* ========================================================= */}
          <div className="bg-[#0F0F0F] border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-tight text-white">
                    Bloque 3: Vuelta a la Calma y Enfriamiento
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase">
                    Trote regenerativo, caminata y recuperación cardiorrespiratoria
                  </p>
                </div>
              </div>

              {/* Cooldown toggle */}
              <button
                onClick={() => setHasCooldown(!hasCooldown)}
                className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase border transition-colors cursor-pointer ${
                  hasCooldown
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
              >
                {hasCooldown ? 'ACTIVADO' : 'DESACTIVADO'}
              </button>
            </div>

            {hasCooldown && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Duración del Enfriamiento
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    {formatDigital(cooldownTime)} <span className="text-xs text-zinc-500 font-normal">({formatMinSec(cooldownTime)})</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {[
                    { label: '2 min', val: 120 },
                    { label: '3 min', val: 180 },
                    { label: '5 min', val: 300 },
                    { label: '10 min', val: 600 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => setCooldownTime(p.val)}
                      className={`py-1.5 px-2.5 rounded-lg text-[10px] font-black uppercase border transition-colors cursor-pointer ${
                        cooldownTime === p.val
                          ? 'bg-emerald-400 text-black border-emerald-400'
                          : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setCooldownTime(Math.max(30, cooldownTime - 30))}
                      className="p-2 rounded-lg bg-black border border-zinc-800 hover:border-zinc-700 text-zinc-300 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCooldownTime(cooldownTime + 30)}
                      className="p-2 rounded-lg bg-black border border-zinc-800 hover:border-zinc-700 text-zinc-300 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Global Total Breakdown & Big Start Button */}
        <div className="bg-[#0F0F0F] border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full md:w-auto">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">
                TIEMPO TOTAL DE SESIÓN
              </span>
              <div className="text-4xl md:text-5xl font-black text-white font-mono tracking-tight mt-0.5">
                {formatDigital(totalWorkoutSeconds)}
              </div>
            </div>

            {/* Block breakdown pill tags */}
            <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase">
              {hasWarmup && (
                <span className="bg-amber-950/40 text-amber-400 border border-amber-800/50 px-2.5 py-1 rounded-lg">
                  1. Calent: {formatMinSec(warmupTime)}
                </span>
              )}
              <span className="bg-black text-[#CCFF00] border border-[#CCFF00]/40 px-2.5 py-1 rounded-lg">
                2. Intervalos: {formatMinSec(coreIntervalSeconds)}
              </span>
              {hasCooldown && (
                <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                  3. Enfriamiento: {formatMinSec(cooldownTime)}
                </span>
              )}
            </div>
          </div>

          {/* START BUTTON */}
          <button
            onClick={handleStartWorkout}
            className="w-full md:w-auto py-4 px-10 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase tracking-wider text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg shadow-[#CCFF00]/10 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-black stroke-black" />
            <span>Comenzar Entrenamiento</span>
          </button>
        </div>

      </div>

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
      />

      {/* Save Routine Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F0F0F] border border-zinc-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-base font-black uppercase tracking-tight text-white mb-2">
                Guardar Rutina Personalizada
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-4">
                Asigna un nombre a esta configuración para reutilizarla cuando quieras.
              </p>

              <input
                type="text"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                placeholder="Ej: Fartlek 8x1min (5k)"
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm font-black uppercase tracking-tight text-white focus:border-[#CCFF00] outline-none mb-5"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-wider transition-colors border border-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRoutine}
                  disabled={!newRoutineName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] disabled:opacity-40 text-black text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
