import { Calendar, Clock, Trash2, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MetricCard } from '@/components/MetricCard';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';

export default function HistoryScreen() {
  const { workoutHistory, loading, deleteWorkoutSession, getWeeklyStats } = useWorkoutStorage();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'all'>('week');

  const weeklyStats = getWeeklyStats();

  const getFilteredWorkouts = () => {
    const today = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    switch (selectedPeriod) {
      case 'today':
        return workoutHistory.filter(session => session.date === today);
      case 'week':
        return workoutHistory.filter(session => 
          new Date(session.date) >= oneWeekAgo
        );
      default:
        return workoutHistory;
    }
  };

  const handleDeleteSession = (sessionId: string, date: string) => {
    Alert.alert(
      'Deletar Treino',
      `Deseja deletar o treino de ${date}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: () => deleteWorkoutSession(sessionId),
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'alta': return '#ff0040';
      case 'média': return '#ffaa00';
      default: return '#00ff41';
    }
  };

  const filteredWorkouts = getFilteredWorkouts();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando histórico...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Histórico de Treinos</Text>
          
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['today', 'week', 'all'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive
                ]}>
                  {period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Todos'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Stats */}
        {selectedPeriod === 'week' && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Estatísticas da Semana</Text>
            
            <View style={styles.statsRow}>
              <MetricCard
                title="Treinos"
                value={weeklyStats.totalWorkouts}
                color="#00ff41"
              />
              <MetricCard
                title="Passos"
                value={weeklyStats.totalSteps}
                color="#4f9eff"
              />
            </View>

            <View style={styles.statsRow}>
              <MetricCard
                title="Calorias"
                value={weeklyStats.totalCalories}
                unit="kcal"
                color="#ff6b35"
              />
              <MetricCard
                title="Tempo Total"
                value={formatDuration(weeklyStats.totalDuration)}
                color="#ff4081"
              />
            </View>

            <View style={styles.intensityContainer}>
              <TrendingUp size={16} color="#ffaa00" />
              <Text style={styles.intensityText}>
                {Math.round(weeklyStats.averageIntensity * 100)}% dos treinos foram de alta intensidade
              </Text>
            </View>
          </View>
        )}

        {/* Workout Sessions */}
        <View style={styles.sessionsContainer}>
          <Text style={styles.sessionsTitle}>
            {filteredWorkouts.length} treino{filteredWorkouts.length !== 1 ? 's' : ''}
          </Text>

          {filteredWorkouts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color="#666" />
              <Text style={styles.emptyText}>
                {selectedPeriod === 'today' 
                  ? 'Nenhum treino hoje' 
                  : selectedPeriod === 'week'
                  ? 'Nenhum treino esta semana'
                  : 'Nenhum treino registrado'
                }
              </Text>
            </View>
          ) : (
            filteredWorkouts.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View>
                    <Text style={styles.sessionDate}>
                      {new Date(session.date).toLocaleDateString('pt-BR')}
                    </Text>
                    <Text style={styles.sessionTime}>
                      {session.startTime} - {session.endTime}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteSession(session.id, session.date)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} color="#ff0040" />
                  </TouchableOpacity>
                </View>

                <View style={styles.sessionMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{session.metrics.steps}</Text>
                    <Text style={styles.metricLabel}>Passos</Text>
                  </View>
                  
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{session.metrics.calories}</Text>
                    <Text style={styles.metricLabel}>Calorias</Text>
                  </View>
                  
                  <View style={styles.metricItem}>
                    <Clock size={12} color="#666" />
                    <Text style={styles.metricValue}>
                      {formatDuration(session.metrics.duration)}
                    </Text>
                  </View>
                  
                  <View style={styles.metricItem}>
                    <Text style={[
                      styles.intensityBadge,
                      { backgroundColor: getIntensityColor(session.metrics.intensity) }
                    ]}>
                      {session.metrics.intensity}
                    </Text>
                  </View>
                </View>

                <View style={styles.movementTypeContainer}>
                  <Text style={styles.movementTypeText}>
                    Tipo: {session.metrics.movementType}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#00ff41',
  },
  periodButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  intensityText: {
    color: '#ffaa00',
    marginLeft: 8,
    fontSize: 14,
  },
  sessionsContainer: {
    marginBottom: 20,
  },
  sessionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionTime: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  sessionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metricLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  intensityBadge: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    textTransform: 'uppercase',
  },
  movementTypeContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
  },
  movementTypeText: {
    color: '#999',
    fontSize: 12,
    textTransform: 'capitalize',
  },
});