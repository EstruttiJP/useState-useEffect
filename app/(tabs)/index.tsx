import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, Battery, CheckCircle, Pause, Play } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CircularProgress } from '@/components/CircularProgress';
import { MetricCard } from '@/components/MetricCard';
import { RealTimeChart } from '@/components/RealTimeChart';
import { useSensors } from '@/hooks/useSensors';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';

export default function MonitorScreen() {
  const {
    sensorData,
    metrics,
    isRecording,
    batteryLevel,
    permissionsGranted,
    error,
    toggleRecording,
  } = useSensors();

  const { saveWorkoutSession } = useWorkoutStorage();

  const [accelerationHistory, setAccelerationHistory] = useState<number[]>([]);
  const [rotationHistory, setRotationHistory] = useState<number[]>([]);

  // Update chart data
  useEffect(() => {
    if (isRecording) {
      setAccelerationHistory(prev => [...prev, sensorData.accelerometer.magnitude].slice(-50));
      setRotationHistory(prev => [...prev, sensorData.gyroscope.magnitude].slice(-50));
    }
  }, [sensorData, isRecording]);

  const handleRecordingToggle = async () => {
    if (isRecording && metrics.duration > 10) {
      // Save session before stopping
      try {
        await saveWorkoutSession(metrics);
        Alert.alert('Sucesso', 'Treino salvo com sucesso!');
      } catch (error) {
        Alert.alert('Erro', 'Falha ao salvar treino');
      }
    }
    toggleRecording();
  };

  const getIntensityColor = () => {
    switch (metrics.intensity) {
      case 'alta': return '#ff0040';
      case 'média': return '#ffaa00';
      default: return '#00ff41';
    }
  };

  const getMovementEmoji = () => {
    switch (metrics.movementType) {
      case 'correndo': return '🏃‍♂️';
      case 'caminhando': return '🚶‍♂️';
      case 'saltando': return '🤸‍♂️';
      default: return '🧍‍♂️';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#ff0040" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permissionsGranted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <AlertTriangle size={48} color="#ffaa00" />
          <Text style={styles.permissionText}>
            Permissões de sensores necessárias
          </Text>
          <Text style={styles.permissionSubtext}>
            O app precisa acessar sensores para monitorar exercícios
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.statusRow}>
            <View style={styles.batteryContainer}>
              <Battery size={16} color={batteryLevel > 0.2 ? '#00ff41' : '#ff0040'} />
              <Text style={styles.batteryText}>{Math.round(batteryLevel * 100)}%</Text>
            </View>
            {permissionsGranted && (
              <View style={styles.statusIndicator}>
                <CheckCircle size={16} color="#00ff41" />
                <Text style={styles.statusText}>Conectado</Text>
              </View>
            )}
          </View>

          <View style={styles.movementStatus}>
            <Text style={styles.movementEmoji}>{getMovementEmoji()}</Text>
            <View>
              <Text style={styles.movementType}>{metrics.movementType}</Text>
              <Text style={[styles.intensity, { color: getIntensityColor() }]}>
                Intensidade {metrics.intensity}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard
            title="Passos"
            value={metrics.steps}
            color="#00ff41"
            intensity={metrics.steps / 100}
          />
          <MetricCard
            title="Calorias"
            value={metrics.calories}
            unit="kcal"
            color="#ff6b35"
            intensity={metrics.calories / 50}
          />
        </View>

        <View style={styles.metricsRow}>
          <MetricCard
            title="Duração"
            value={formatDuration(metrics.duration)}
            color="#4f9eff"
          />
          <MetricCard
            title="Aceleração"
            value={metrics.avgAcceleration}
            unit="m/s²"
            color="#ff4081"
            intensity={metrics.avgAcceleration / 5}
          />
        </View>

        {/* Circular Progress Indicators */}
        <View style={styles.progressRow}>
          <CircularProgress
            size={100}
            strokeWidth={8}
            progress={Math.min(sensorData.accelerometer.magnitude / 20, 1)}
            color="#00ff41"
            label="Acelerômetro"
            value={sensorData.accelerometer.magnitude.toFixed(1)}
          />
          <CircularProgress
            size={100}
            strokeWidth={8}
            progress={Math.min(sensorData.gyroscope.magnitude / 10, 1)}
            color="#4f9eff"
            label="Giroscópio"
            value={sensorData.gyroscope.magnitude.toFixed(1)}
          />
          <CircularProgress
            size={100}
            strokeWidth={8}
            progress={Math.min(metrics.steps / 1000, 1)}
            color="#ff6b35"
            label="Meta Passos"
            value={`${Math.round((metrics.steps / 1000) * 100)}%`}
          />
        </View>

        {/* Real-time Charts */}
        {isRecording && (
          <>
            <RealTimeChart
              data={accelerationHistory}
              color="#00ff41"
              title="Aceleração em Tempo Real"
            />
            <RealTimeChart
              data={rotationHistory}
              color="#4f9eff"
              title="Rotação em Tempo Real"
            />
          </>
        )}
      </ScrollView>

      {/* Recording Button */}
      <View style={styles.recordingContainer}>
        <TouchableOpacity
          style={[
            styles.recordingButton,
            { backgroundColor: isRecording ? '#ff0040' : '#00ff41' }
          ]}
          onPress={handleRecordingToggle}
        >
          <LinearGradient
            colors={isRecording ? ['#ff0040', '#ff4081'] : ['#00ff41', '#00cc35']}
            style={styles.buttonGradient}
          >
            {isRecording ? (
              <Pause size={32} color="white" />
            ) : (
              <Play size={32} color="white" />
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.recordingText}>
          {isRecording ? 'Pausar Treino' : 'Iniciar Treino'}
        </Text>
      </View>
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
  header: {
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#00ff41',
    marginLeft: 4,
    fontSize: 12,
  },
  movementStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  movementEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  movementType: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  intensity: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#111',
  },
  recordingButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  buttonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#ff0040',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#00ff41',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '600',
  },
  permissionSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
});