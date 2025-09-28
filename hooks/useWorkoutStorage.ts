import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { WorkoutMetrics } from './useSensors';

// Interfaces mantidas (estão boas)
export interface WorkoutSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  metrics: WorkoutMetrics;
}

// Constantes para organização
const STORAGE_KEYS = {
  WORKOUT_HISTORY: 'workoutHistory',
} as const;

const HISTORY_LIMIT = 100; // Mantém apenas as últimas 100 sessões

// ========== HOOK PRINCIPAL ==========
export function useWorkoutStorage() {
  // ========== ESTADOS PRINCIPAIS ==========
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  // ========== EFFECT: CARREGAR HISTÓRICO ==========
  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  // ========== FUNÇÕES PRINCIPAIS ==========

  const loadWorkoutHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
      setWorkoutHistory(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setWorkoutHistory([]); // Fallback para array vazio
    } finally {
      setLoading(false);
    }
  }, []);

  const saveWorkoutSession = useCallback(async (metrics: WorkoutMetrics) => {
    try {
      const session: WorkoutSession = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        startTime: new Date(Date.now() - metrics.duration * 1000).toLocaleTimeString(),
        endTime: new Date().toLocaleTimeString(),
        metrics,
      };

      const updatedHistory = [session, ...workoutHistory].slice(0, HISTORY_LIMIT);
      
      // Otimização: atualizar estado e storage simultaneamente
      setWorkoutHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(updatedHistory));
      
      return session;
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      throw error;
    }
  }, [workoutHistory]);

  const deleteWorkoutSession = useCallback(async (sessionId: string) => {
    try {
      const updatedHistory = workoutHistory.filter(session => session.id !== sessionId);
      
      setWorkoutHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      throw error; // Propagar erro para tratamento externo
    }
  }, [workoutHistory]);

  const clearAllWorkouts = useCallback(async () => {
    try {
      setWorkoutHistory([]);
      await AsyncStorage.removeItem(STORAGE_KEYS.WORKOUT_HISTORY);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      throw error;
    }
  }, []);

  // ========== FUNÇÕES DE CONSULTA (SEM EFFECTS) ==========

  const getWeeklyStats = useCallback(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyWorkouts = workoutHistory.filter(session => 
      new Date(session.date) >= oneWeekAgo
    );

    // Cálculos otimizados em uma única passagem
    const stats = weeklyWorkouts.reduce((acc, session) => ({
      totalSteps: acc.totalSteps + session.metrics.steps,
      totalCalories: acc.totalCalories + session.metrics.calories,
      totalDuration: acc.totalDuration + session.metrics.duration,
      highIntensityCount: acc.highIntensityCount + (session.metrics.intensity === 'alta' ? 1 : 0),
    }), {
      totalSteps: 0,
      totalCalories: 0,
      totalDuration: 0,
      highIntensityCount: 0,
    });

    return {
      totalWorkouts: weeklyWorkouts.length,
      totalSteps: stats.totalSteps,
      totalCalories: stats.totalCalories,
      totalDuration: stats.totalDuration,
      averageIntensity: weeklyWorkouts.length > 0 
        ? stats.highIntensityCount / weeklyWorkouts.length 
        : 0,
      weeklyWorkouts,
    };
  }, [workoutHistory]);

  const getWorkoutById = useCallback((id: string) => {
    return workoutHistory.find(session => session.id === id);
  }, [workoutHistory]);

  const getRecentWorkouts = useCallback((limit: number = 10) => {
    return workoutHistory.slice(0, limit);
  }, [workoutHistory]);

  // ========== RETORNO DO HOOK ==========
  return {
    // Estado
    workoutHistory,
    loading,
    
    // Ações
    saveWorkoutSession,
    deleteWorkoutSession,
    clearAllWorkouts,
    refreshWorkoutHistory: loadWorkoutHistory,
    
    // Consultas
    getWeeklyStats,
    getWorkoutById,
    getRecentWorkouts,
  };
}