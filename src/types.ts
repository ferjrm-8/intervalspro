/**
 * Types for the Workout Interval Timer application.
 */

export type WorkoutMode = 'classic' | 'fartlek' | 'emom' | 'tabata' | 'amrap' | 'pyramid';

export type SoundTheme = 'whistle' | 'boxing' | 'digital' | 'buzzer';
export type SoundVolume = 'normal' | 'high' | 'ultra';

export interface AudioSettings {
  volume: SoundVolume;
  theme: SoundTheme;
  voiceEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface Routine {
  id: string;
  name: string;
  mode?: WorkoutMode;
  
  // Blocks
  warmupTime?: number; // in seconds (0 = none)
  cooldownTime?: number; // in seconds (0 = none)
  
  // Core Interval parameters
  series: number; // rounds / repetitions
  exercisesCount: number;
  workTime: number; // in seconds (Fartlek: Ritmo Fuerte / Rápido)
  restTime: number; // in seconds (Fartlek: Ritmo Suave / Recuperación)
  seriesRestTime: number; // in seconds
  
  // Custom naming & labels
  exerciseNames?: string[];
  workLabel?: string; // e.g. "Ritmo Fuerte (Sprint)"
  restLabel?: string; // e.g. "Ritmo Suave (Trote)"
  
  isPreset?: boolean;
}

export type TimerPhase = 
  | 'prep' 
  | 'warmup' 
  | 'work' 
  | 'rest_exercise' 
  | 'rest_series' 
  | 'cooldown';

export interface WorkoutStep {
  id: string;
  type: TimerPhase;
  seriesIndex: number; // 0-based
  exerciseIndex: number; // 0-based
  duration: number; // in seconds
  label: string;
  subLabel?: string;
  blockTitle?: string;
}

export interface WorkoutStats {
  totalDuration: number;
  completedExercises: number;
  completedSeries: number;
  caloriesBurnedEstimate: number;
  warmupDuration?: number;
  cooldownDuration?: number;
}
