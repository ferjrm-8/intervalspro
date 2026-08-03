/**
 * Types for the Workout Interval Timer application.
 */

export interface Routine {
  id: string;
  name: string;
  series: number;
  exercisesCount: number;
  workTime: number; // in seconds
  restTime: number; // in seconds
  seriesRestTime: number; // in seconds
  exerciseNames?: string[]; // Custom names for each exercise
  isPreset?: boolean;
}

export type TimerPhase = 'prep' | 'work' | 'rest_exercise' | 'rest_series';

export interface WorkoutStep {
  id: string;
  type: TimerPhase;
  seriesIndex: number; // 0-based
  exerciseIndex: number; // 0-based
  duration: number; // in seconds
  label: string;
}

export interface WorkoutStats {
  totalDuration: number;
  completedExercises: number;
  completedSeries: number;
  caloriesBurnedEstimate: number;
}
