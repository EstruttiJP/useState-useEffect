import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { WorkoutMetrics } from './useSensors';

export interface WorkoutSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  metrics: WorkoutMetrics;
}

export function useWorkoutStorage() {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workout history on mount
  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('workoutHistory');
      if (stored) {
        setWorkoutHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkoutSession = async (metrics: WorkoutMetrics) => {
    try {
      const session: WorkoutSession = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        startTime: new Date(Date.now() - metrics.duration * 1000).toLocaleTimeString(),
        endTime: new Date().toLocaleTimeString(),
        metrics,
      };

      const updatedHistory = [session, ...workoutHistory].slice(0, 100); // Keep last 100 sessions
      setWorkoutHistory(updatedHistory);
      await AsyncStorage.setItem('workoutHistory', JSON.stringify(updatedHistory));
      
      return session;
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      throw error;
    }
  };

  const deleteWorkoutSession = async (sessionId: string) => {
    try {
      const updatedHistory = workoutHistory.filter(session => session.id !== sessionId);
      setWorkoutHistory(updatedHistory);
      await AsyncStorage.setItem('workoutHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
    }
  };

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyWorkouts = workoutHistory.filter(session => 
      new Date(session.date) >= oneWeekAgo
    );

    const totalSteps = weeklyWorkouts.reduce((sum, session) => sum + session.metrics.steps, 0);
    const totalCalories = weeklyWorkouts.reduce((sum, session) => sum + session.metrics.calories, 0);
    const totalDuration = weeklyWorkouts.reduce((sum, session) => sum + session.metrics.duration, 0);
    const averageIntensity = weeklyWorkouts.length > 0 
      ? weeklyWorkouts.filter(s => s.metrics.intensity === 'alta').length / weeklyWorkouts.length 
      : 0;

    return {
      totalWorkouts: weeklyWorkouts.length,
      totalSteps,
      totalCalories,
      totalDuration,
      averageIntensity,
      weeklyWorkouts,
    };
  };

  return {
    workoutHistory,
    loading,
    saveWorkoutSession,
    deleteWorkoutSession,
    getWeeklyStats,
  };
}