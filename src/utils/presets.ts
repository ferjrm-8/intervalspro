import { Routine } from '../types';

export const DEFAULT_PRESETS: Routine[] = [
  {
    id: 'fartlek-running',
    name: 'Fartlek Carrera (3 Bloques)',
    mode: 'fartlek',
    warmupTime: 300, // 5 min Calentamiento
    cooldownTime: 300, // 5 min Vuelta a la Calma
    series: 8, // 8 Cambios de ritmo
    exercisesCount: 1,
    workTime: 60, // 1 min Ritmo Fuerte / Aceleración
    restTime: 60, // 1 min Ritmo Suave / Recuperación
    seriesRestTime: 0,
    workLabel: 'Ritmo Fuerte (Sprint / Cambio)',
    restLabel: 'Ritmo Suave (Trote Regenerativo)',
    exerciseNames: ['Fartlek Carrera Continua'],
    isPreset: true,
  },
  {
    id: 'fartlek-piramide',
    name: 'Fartlek Intensivo (90s/45s)',
    mode: 'fartlek',
    warmupTime: 300, // 5 min
    cooldownTime: 300, // 5 min
    series: 6, // 6 cambios
    exercisesCount: 1,
    workTime: 90, // 1:30 min fuerte
    restTime: 45, // 45s suave
    seriesRestTime: 0,
    workLabel: 'Ritmo Umbral Fuerte',
    restLabel: 'Trote Suave Activo',
    exerciseNames: ['Fartlek Progresivo'],
    isPreset: true,
  },
  {
    id: 'emom-10min',
    name: 'EMOM 10 Minutos',
    mode: 'emom',
    warmupTime: 180, // 3 min calentamiento
    cooldownTime: 120, // 2 min enfriamiento
    series: 10, // 10 rondas de 1 minuto
    exercisesCount: 1,
    workTime: 50, // 50s para completar repeticiones
    restTime: 10, // 10s transición
    seriesRestTime: 0,
    workLabel: 'Minuto Activo (Completar Repeticiones)',
    restLabel: 'Transición / Descanso Restante',
    exerciseNames: ['EMOM En el Minuto'],
    isPreset: true,
  },
  {
    id: 'tabata',
    name: 'Tabata Clásico 20/10',
    mode: 'tabata',
    warmupTime: 120, // 2 min calentamiento
    cooldownTime: 120, // 2 min enfriamiento
    series: 8,
    exercisesCount: 1,
    workTime: 20,
    restTime: 10,
    seriesRestTime: 0,
    workLabel: 'Esfuerzo Máximo (100%)',
    restLabel: 'Descanso Total',
    exerciseNames: ['Tabata Alta Intensidad'],
    isPreset: true,
  },
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio Quemagrasa',
    mode: 'classic',
    warmupTime: 180, // 3 min
    cooldownTime: 180, // 3 min
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
    mode: 'classic',
    warmupTime: 180,
    cooldownTime: 120,
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
    name: 'Asaltos de Boxeo (4x3 min)',
    mode: 'classic',
    warmupTime: 180,
    cooldownTime: 180,
    series: 4,
    exercisesCount: 1,
    workTime: 180, // 3 min round
    restTime: 0,
    seriesRestTime: 60, // 1 min descanso entre asaltos
    exerciseNames: ['Sombra o Saco de Boxeo'],
    isPreset: true,
  },
];

const LOCAL_STORAGE_KEY_ALL = 'workout_interval_routines_v4';

// Highly robust localStorage wrapper with in-memory fallback to prevent crashes 
// on restricted mobile browsers, iOS/Android WebViews, and private windows.
const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (error) {
      console.warn('localStorage is blocked or unavailable, using in-memory storage:', error);
    }
    return memoryStorage[key] || null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (error) {
      console.warn('localStorage is blocked or unavailable, using in-memory storage:', error);
    }
    memoryStorage[key] = value;
  }
};

export function getAllRoutines(): Routine[] {
  try {
    const data = safeStorage.getItem(LOCAL_STORAGE_KEY_ALL);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading routines from safeStorage', error);
  }
  // First time initialization: clone the presets so they can be individually deleted/modified
  const initial = DEFAULT_PRESETS.map(r => ({ ...r, isPreset: false }));
  saveAllRoutines(initial);
  return initial;
}

export function saveAllRoutines(routines: Routine[]): void {
  try {
    safeStorage.setItem(LOCAL_STORAGE_KEY_ALL, JSON.stringify(routines));
  } catch (error) {
    console.error('Error saving routines to safeStorage', error);
  }
}
