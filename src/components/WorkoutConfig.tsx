import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Plus, Minus, Save, Trash2, Dumbbell, BookOpen,
  Timer, RotateCcw, Sparkles, AlertCircle, ChevronDown, ChevronUp, Check, Info
} from 'lucide-react';
import { Routine } from '../types';
import { getAllRoutines, saveAllRoutines } from '../utils/presets';

interface WorkoutConfigProps {
  onStart: (routine: Routine) => void;
}

export default function WorkoutConfig({ onStart }: WorkoutConfigProps) {
  // Load all routines
  const [routines, setRoutines] = useState<Routine[]>([]);
  
  // Current editing state
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('hiit-cardio');
  const [name, setName] = useState('Mi Rutina');
  const [series, setSeries] = useState(3);
  const [exercisesCount, setExercisesCount] = useState(4);
  const [workTime, setWorkTime] = useState(40);
  const [restTime, setRestTime] = useState(15);
  const [seriesRestTime, setSeriesRestTime] = useState(60);
  
  // Custom names for each exercise
  const [exerciseNames, setExerciseNames] = useState<string[]>([
    'Jumping Jacks',
    'Burpees de Impacto',
    'Sentadillas con Salto',
    'Escaladores (Mountain Climbers)'
  ]);

  // Collapsed states for routine list and customization
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [isExercisesCollapsed, setIsExercisesCollapsed] = useState(false);

  // Initialize
  useEffect(() => {
    const loaded = getAllRoutines();
    setRoutines(loaded);
    if (loaded.length > 0) {
      const exists = loaded.some(r => r.id === selectedRoutineId);
      if (!exists) {
        handleSelectRoutine(loaded[0]);
      }
    } else {
      handleCreateNewRoutine();
    }
  }, []);

  // Update exerciseNames array when exercisesCount changes
  useEffect(() => {
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
  }, [exercisesCount]);

  // Create a new routine from scratch
  const handleCreateNewRoutine = () => {
    setSelectedRoutineId('new-routine');
    setName('Nueva Rutina');
    setSeries(3);
    setExercisesCount(4);
    setWorkTime(30);
    setRestTime(10);
    setSeriesRestTime(60);
    setExerciseNames(['Ejercicio 1', 'Ejercicio 2', 'Ejercicio 3', 'Ejercicio 4']);
  };

  // Load selected routine
  const handleSelectRoutine = (routine: Routine) => {
    setSelectedRoutineId(routine.id);
    setName(routine.name);
    setSeries(routine.series);
    setExercisesCount(routine.exercisesCount);
    setWorkTime(routine.workTime);
    setRestTime(routine.restTime);
    setSeriesRestTime(routine.seriesRestTime);
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
      series,
      exercisesCount,
      workTime,
      restTime,
      seriesRestTime,
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
    
    // Fallback if we deleted the selected one
    if (selectedRoutineId === id) {
      if (updated.length > 0) {
        handleSelectRoutine(updated[0]);
      } else {
        handleCreateNewRoutine();
      }
    }
  };

  const handleDeleteSelected = (e: React.MouseEvent) => {
    if (selectedRoutineId !== 'new-routine') {
      handleDeleteRoutine(selectedRoutineId, e);
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
      series,
      exercisesCount,
      workTime,
      restTime,
      seriesRestTime,
      exerciseNames,
    };
    onStart(currentRoutine);
  };

  // Quick helper formatting for MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper calculation for total duration
  const calculateTotalDuration = () => {
    // Each series has:
    // - exercisesCount * workTime
    // - (exercisesCount - 1) * restTime
    // Between series:
    // - (series - 1) * seriesRestTime
    // Prep:
    // - 5 seconds prep
    const workDurationPerSeries = exercisesCount * workTime;
    const restDurationPerSeries = (exercisesCount - 1) * restTime;
    const seriesDuration = workDurationPerSeries + restDurationPerSeries;
    
    const totalWorkout = (series * seriesDuration) + ((series - 1) * seriesRestTime);
    return totalWorkout + 5; // adding 5 seconds of initial countdown
  };

  return (
    <div id="config-screen" className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10 text-white">
      <div className="flex flex-col gap-6 md:gap-8">
        
        {/* Banner header */}
        <div className="text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6 bg-[#0F0F0F] border border-zinc-800 p-8 rounded-2xl">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
              INTERVALS<span className="text-[#CCFF00]">PRO</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5 uppercase font-bold tracking-wider">
              Tus propios intervalos en tus rutinas
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end bg-black border border-zinc-800 px-6 py-4 rounded-xl min-w-[180px]">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">TIEMPO ESTIMADO</span>
            <span className="text-3xl font-black text-[#CCFF00] font-mono tracking-tighter mt-0.5">
              {formatTime(calculateTotalDuration())}
            </span>
            <span className="text-[9px] text-zinc-600 font-bold uppercase mt-1 tracking-wider">Incluye 5s Prep.</span>
          </div>
        </div>

        {/* Routine selector grid */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3.5">
            <h2 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#CCFF00]" /> SELECCIONA UNA RUTINA
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDeleteSelected}
                disabled={selectedRoutineId === 'new-routine'}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedRoutineId !== 'new-routine'
                    ? 'border-zinc-850 bg-black hover:bg-rose-950/20 hover:border-rose-900/50 text-rose-400 hover:scale-[1.02]'
                    : 'border-zinc-900 bg-[#0F0F0F]/60 text-zinc-600 cursor-not-allowed opacity-50'
                }`}
                title={selectedRoutineId !== 'new-routine' ? 'Eliminar rutina seleccionada' : 'No se puede eliminar una rutina no guardada'}
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar Rutina
              </button>
              <button
                onClick={handleCreateNewRoutine}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer ${
                  selectedRoutineId === 'new-routine'
                    ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-md shadow-[#CCFF00]/5'
                    : 'bg-black border-zinc-850 hover:border-zinc-700 text-white'
                }`}
              >
                <Plus className="w-4 h-4" /> Crear Rutina Nueva
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {routines.map((routine) => {
              const active = selectedRoutineId === routine.id;
              return (
                <div
                  key={routine.id}
                  onClick={() => handleSelectRoutine(routine)}
                  className={`group relative p-5 rounded-xl text-left transition-all border duration-200 hover:scale-[1.01] cursor-pointer ${
                    active 
                      ? 'bg-[#141414] border-[#CCFF00] shadow-md shadow-[#CCFF00]/5' 
                      : 'bg-[#0F0F0F] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoutine(routine.id, e);
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 text-rose-400 bg-black/90 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-900/50 rounded-lg transition-colors cursor-pointer z-10 opacity-85 hover:opacity-100"
                    title="Eliminar rutina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center justify-between gap-1.5 pr-8">
                    <h3 className="font-black text-white text-sm uppercase tracking-tight truncate">{routine.name}</h3>
                    {active && (
                      <span className="shrink-0 bg-[#CCFF00] text-black rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 text-[#CCFF00] border border-zinc-800">
                      {routine.series} {routine.series === 1 ? 'Ronda' : 'Rondas'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {routine.exercisesCount} {routine.exercisesCount === 1 ? 'Ejerc.' : 'Ejercs.'}
                    </span>
                  </div>
                  <div className="mt-3 text-[10px] text-zinc-400 flex items-center justify-between uppercase font-bold tracking-wider pt-2 border-t border-zinc-900">
                    <span>Trabajo: <strong className="text-[#CCFF00] font-mono">{routine.workTime}s</strong></span>
                    {routine.restTime > 0 && <span>Desc: <strong className="text-zinc-300 font-mono">{routine.restTime}s</strong></span>}
                  </div>
                </div>
              );
            })}

            {routines.length === 0 && (
              <div className="col-span-full py-12 px-6 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center bg-black/40">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-4 border border-zinc-800">
                  <BookOpen className="w-6 h-6 text-zinc-500" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">No tienes rutinas</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs font-bold uppercase tracking-wide">
                  Crea tu primera rutina de intervalos personalizada presionando "Crear Rutina Nueva".
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Config parameters form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Main Parameters Card */}
          <div className="bg-[#0F0F0F] border border-zinc-800 p-6 rounded-2xl flex flex-col gap-6">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.15em] border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#CCFF00]" /> Configurar Tiempos e Intervalos
            </h2>

            {/* Series selector */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Número de Series (Rondas)</label>
                <span className="text-2xl font-black text-white font-mono bg-black px-3 py-1 rounded-md border border-zinc-800">
                  {series < 10 ? `0${series}` : series}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSeries(Math.max(1, series - 1))}
                  className="flex-1 flex justify-center items-center py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSeries(series + 1)}
                  className="flex-1 flex justify-center items-center py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Exercises count */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Ejercicios por Serie</label>
                <span className="text-2xl font-black text-white font-mono bg-black px-3 py-1 rounded-md border border-zinc-800">
                  {exercisesCount < 10 ? `0${exercisesCount}` : exercisesCount}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExercisesCount(Math.max(1, exercisesCount - 1))}
                  className="flex-1 flex justify-center items-center py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExercisesCount(exercisesCount + 1)}
                  className="flex-1 flex justify-center items-center py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Work duration */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-[#CCFF00]" /> Tiempo de Trabajo
                </label>
                <span className="text-2xl font-black text-[#CCFF00] font-mono bg-black px-3 py-1 rounded-md border border-zinc-800">
                  {formatTime(workTime)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setWorkTime(Math.max(5, workTime - 5))}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  -5s
                </button>
                <button
                  onClick={() => setWorkTime(Math.max(1, workTime - 1))}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  -1s
                </button>
                <button
                  onClick={() => setWorkTime(workTime + 1)}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  +1s
                </button>
                <button
                  onClick={() => setWorkTime(workTime + 5)}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  +5s
                </button>
              </div>
            </div>

            {/* Rest between exercises */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-zinc-500" /> Descanso entre Ejercicios
                </label>
                <span className="text-2xl font-black text-white font-mono bg-black px-3 py-1 rounded-md border border-zinc-800">
                  {formatTime(restTime)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRestTime(Math.max(0, restTime - 5))}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  -5s
                </button>
                <button
                  onClick={() => setRestTime(Math.max(0, restTime - 1))}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  -1s
                </button>
                <button
                  onClick={() => setRestTime(restTime + 1)}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  +1s
                </button>
                <button
                  onClick={() => setRestTime(restTime + 5)}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  +5s
                </button>
              </div>
            </div>

            {/* Rest between series */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-zinc-500" /> Descanso entre Series
                </label>
                <span className="text-2xl font-black text-white font-mono bg-black px-3 py-1 rounded-md border border-zinc-800">
                  {formatTime(seriesRestTime)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSeriesRestTime(Math.max(0, seriesRestTime - 10))}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  -10s
                </button>
                <button
                  onClick={() => setSeriesRestTime(Math.max(0, seriesRestTime - 5))}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  -5s
                </button>
                <button
                  onClick={() => setSeriesRestTime(seriesRestTime + 5)}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  +5s
                </button>
                <button
                  onClick={() => setSeriesRestTime(seriesRestTime + 10)}
                  className="flex-1 py-1.5 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800 cursor-pointer"
                >
                  +10s
                </button>
              </div>
            </div>

          </div>

          {/* Exercise Names Customization Card */}
          <div className="bg-[#0F0F0F] border border-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#CCFF00]" /> Nombres de Ejercicios
              </h2>
              <button
                onClick={() => setIsExercisesCollapsed(!isExercisesCollapsed)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                {isExercisesCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 -mt-1 leading-relaxed font-bold uppercase tracking-wider">
              Personaliza el nombre de cada ejercicio para visualizarlo en pantalla mientras entrenas.
            </p>

            <AnimatePresence initial={false}>
              {!isExercisesCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1"
                >
                  {Array.from({ length: exercisesCount }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-black p-2 rounded-xl border border-zinc-800/80">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-400 font-mono">
                        {i + 1 < 10 ? `0${i + 1}` : i + 1}
                      </span>
                      <input
                        type="text"
                        value={exerciseNames[i] || ''}
                        onChange={(e) => handleExerciseNameChange(i, e.target.value)}
                        placeholder={`Ejercicio ${i + 1}`}
                        maxLength={28}
                        className="flex-1 bg-transparent border-0 text-white placeholder-zinc-700 text-xs font-bold uppercase tracking-wide focus:ring-0 focus:outline-none py-1"
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-auto pt-3 border-t border-zinc-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase font-bold tracking-wider">
                <Info className="w-3.5 h-3.5" /> Se repetirán en cada serie.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#CCFF00] text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Guardar Rutina
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Start Workout Button */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={handleStartWorkout}
            className="w-full flex items-center justify-center gap-2.5 py-5 md:py-6 px-6 rounded-2xl bg-[#CCFF00] text-black font-black text-2xl uppercase tracking-tighter hover:bg-[#b8e600] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-[#CCFF00]/10"
          >
            <Play className="w-6 h-6 fill-black stroke-black" /> EMPEZAR ENTRENAMIENTO
          </button>
          <div className="text-center">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
              Recuerda activar el sonido para recibir las alertas auditivas.
            </p>
          </div>
        </div>
      </div>

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
              <h3 className="text-lg font-black uppercase tracking-tighter text-[#CCFF00] mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Guardar Rutina
              </h3>
              <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-4">
                Asigna un nombre descriptivo para guardar esta rutina en tu listado de acceso rápido.
              </p>
              
              <div className="flex flex-col gap-1.5 mb-5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nombre de la Rutina</label>
                <input
                  type="text"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  placeholder="Ej: Cardio Intenso Piernas"
                  maxLength={24}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-700 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold uppercase tracking-wider transition-colors border border-zinc-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRoutine}
                  disabled={!newRoutineName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] disabled:opacity-40 disabled:hover:bg-[#CCFF00] text-black text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
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
