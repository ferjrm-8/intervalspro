import React from 'react';
import { Trophy, Flame, Timer, CheckCircle, RotateCcw, Home, Award } from 'lucide-react';
import { WorkoutStats, Routine } from '../types';
import { AccentColor, THEMES } from '../utils/theme';

interface WorkoutCompletedProps {
  stats: WorkoutStats;
  routine: Routine;
  onRestart: () => void;
  onGoHome: () => void;
  accentColor: AccentColor;
}

export default function WorkoutCompleted({ stats, routine, onRestart, onGoHome, accentColor }: WorkoutCompletedProps) {
  const theme = THEMES[accentColor];
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="completed-screen" className="w-full max-w-2xl mx-auto px-4 py-8 md:py-16 text-center text-white">
      
      {/* Trophy and Congrats Hero Card */}
      <div className="relative bg-[#0F0F0F] border border-zinc-800 p-8 rounded-2xl overflow-hidden flex flex-col items-center shadow-xl">
        
        {/* Animated Celebration Particle elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => {
            const size = Math.random() * 8 + 4;
            const left = Math.random() * 100;
            const duration = Math.random() * 4 + 3;
            const delay = Math.random() * 2;
            return (
              <div
                key={i}
                className="absolute rounded-full animate-bounce-slow"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  bottom: `-10px`,
                  backgroundColor: theme.hex,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>

        {/* Big trophy container */}
        <div className={`relative flex items-center justify-center w-20 h-20 rounded-xl bg-black border border-zinc-800 ${theme.text} mb-5`}>
          <Trophy className="w-10 h-10" />
          <div className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.bg} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4 ${theme.bg}`}></span>
          </div>
        </div>

        <span className={`text-[10px] font-black ${theme.text} tracking-widest uppercase`}>
          ¡TRABAJO TERMINADO!
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mt-1.5">
          ¡SESIÓN COMPLETADA!
        </h1>
        <p className="text-xs text-zinc-400 max-w-sm mt-3 leading-relaxed uppercase font-bold tracking-wider">
          Has completado todos los intervalos con éxito. ¡Excelente esfuerzo para mantenerte saludable!
        </p>

        {/* Quick Stats Summary Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 w-full mt-8">
          
          <div className="bg-black border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-inner">
            <Timer className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">DURACIÓN TOTAL</span>
            <span className="text-lg font-black text-white font-mono mt-1">
              {formatTime(stats.totalDuration)}
            </span>
          </div>

          <div className="bg-black border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-inner">
            <CheckCircle className={`w-5 h-5 ${theme.text} mb-1`} />
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-sans">RONDAS</span>
            <span className="text-lg font-black text-white font-mono mt-1">
              {stats.completedSeries} / {routine.series}
            </span>
          </div>

          <div className="bg-black border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-inner">
            <Flame className="w-5 h-5 text-zinc-400 mb-1" />
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest font-sans">CALORÍAS EST.</span>
            <span className="text-lg font-black text-white font-mono mt-1">
              ~{stats.caloriesBurnedEstimate} kcal
            </span>
          </div>

        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-wider text-xs transition-all hover:bg-zinc-800 hover:scale-[1.01] active:scale-98 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> REPETIR ENTRENAMIENTO
        </button>
        <button
          onClick={onGoHome}
          className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl ${theme.bg} text-black font-black uppercase tracking-wider text-xs transition-all ${theme.hoverBg} hover:scale-[1.01] active:scale-98 cursor-pointer shadow-md ${theme.shadow}`}
        >
          <Home className="w-4 h-4" /> VOLVER AL INICIO
        </button>
      </div>

      {/* Detailed Workout Summary */}
      <div className="mt-10 text-left bg-[#0F0F0F] border border-zinc-800 rounded-2xl p-6 shadow-lg">
        <h2 className={`text-xs font-black ${theme.text} uppercase tracking-widest flex items-center gap-2 mb-5 pb-3 border-b border-zinc-900`}>
          <Award className={`w-4 h-4 ${theme.text}`} /> RESUMEN DETALLADO DEL ENTRENAMIENTO
        </h2>
        
        {/* Interval Settings Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-black border border-zinc-900 p-3 rounded-xl shadow-inner">
            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Trabajo</div>
            <div className="text-base font-black text-white font-mono mt-0.5">{routine.workTime}s</div>
          </div>
          <div className="bg-black border border-zinc-900 p-3 rounded-xl shadow-inner">
            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Descanso</div>
            <div className="text-base font-black text-white font-mono mt-0.5">{routine.restTime}s</div>
          </div>
          <div className="bg-black border border-zinc-900 p-3 rounded-xl shadow-inner">
            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Desc. Series</div>
            <div className="text-base font-black text-white font-mono mt-0.5">{routine.seriesRestTime}s</div>
          </div>
          <div className="bg-black border border-zinc-900 p-3 rounded-xl shadow-inner">
            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider font-sans">Ejercicios</div>
            <div className={`text-base font-black ${theme.text} font-mono mt-0.5`}>{routine.exercisesCount}</div>
          </div>
        </div>

        {/* Exercises list executed */}
        <div className="bg-black/40 border border-zinc-900 p-4.5 rounded-xl">
          <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3.5">
            EJERCICIOS COMPLETADOS EN CADA SERIE:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from({ length: routine.exercisesCount }).map((_, idx) => {
              const name = routine.exerciseNames?.[idx] || `Ejercicio ${idx + 1}`;
              return (
                <div key={idx} className="flex items-center gap-3 bg-black px-3.5 py-3 rounded-xl border border-zinc-900">
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${theme.accentBg} ${theme.text}`}>
                    <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="truncate text-xs font-black text-zinc-200 uppercase tracking-wide">
                    <span className="text-[9px] text-zinc-500 font-mono mr-1">{idx + 1}.</span> {name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
