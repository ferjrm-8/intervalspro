import { Routine } from '../types';

export const DEFAULT_PRESETS: Routine[] = [
  {
    id: 'tabata',
    name: 'Tabata Clásico',
    series: 8,
    exercisesCount: 1,
    workTime: 20,
    restTime: 10,
    seriesRestTime: 0,
    exerciseNames: ['Ejercicio Máximo'],
    isPreset: true,
  },
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio Quemagrasa',
    series: 3,
    exercisesCount: 4,
    workTime: 45,
    restTime: 15,
    seriesRestTime: 60,
    exerciseNames: [
      'Jumping Jacks',
      'Burpees de Impacto',
      'Sentadillas con Salto',
      'Escaladores (Mountain Climbers)',
    ],
    isPreset: true,
  },
  {
    id: 'fuerza-express',
    name: 'Fuerza Corporal Express',
    series: 3,
    exercisesCount: 5,
    workTime: 40,
    restTime: 20,
    seriesRestTime: 90,
    exerciseNames: [
      'Flexiones de Pecho (Push-Ups)',
      'Sentadillas con Pausa',
      'Zancadas Alternas (Lunges)',
      'Plancha Abdominal',
      'Fondos de Tríceps',
    ],
    isPreset: true,
  },
  {
    id: 'boxeo-rounds',
    name: 'Asaltos de Boxeo',
    series: 4,
    exercisesCount: 1,
    workTime: 180, // 3 min
    restTime: 0,
    seriesRestTime: 60, // 1 min rest between rounds
    exerciseNames: ['Sombra o Saco de Boxeo'],
    isPreset: true,
  },
];

const LOCAL_STORAGE_KEY_ALL = 'workout_interval_routines_v3';

export function getAllRoutines(): Routine[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_ALL);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading routines from localStorage', error);
  }
  // First time initialization: clone the presets so they can be individually deleted/modified
  const initial = DEFAULT_PRESETS.map(r => ({ ...r, isPreset: false })); // Make them deleteable
  saveAllRoutines(initial);
  return initial;
}

export function saveAllRoutines(routines: Routine[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_ALL, JSON.stringify(routines));
  } catch (error) {
    console.error('Error saving routines to localStorage', error);
  }
}

const LOCAL_STORAGE_KEY = 'workout_interval_routines_v1';

export function getCustomRoutines(): Routine[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading routines from localStorage', error);
  }
  return [];
}

export function saveCustomRoutines(routines: Routine[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(routines));
  } catch (error) {
    console.error('Error saving routines to localStorage', error);
  }
}
