import * as Battery from 'expo-battery';
import {
  Accelerometer,
  Gyroscope,
  Pedometer,
} from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

export interface SensorData {
  accelerometer: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
  };
  pedometer: {
    steps: number;
  };
}

export interface WorkoutMetrics {
  steps: number;
  avgAcceleration: number;
  avgRotation: number;
  calories: number;
  duration: number;
  intensity: 'baixa' | 'média' | 'alta';
  movementType: 'parado' | 'caminhando' | 'correndo' | 'saltando';
}

export function useSensors() {
  const [sensorData, setSensorData] = useState<SensorData>({
    accelerometer: { x: 0, y: 0, z: 0, magnitude: 0 },
    gyroscope: { x: 0, y: 0, z: 0, magnitude: 0 },
    pedometer: { steps: 0 },
  });

  const [metrics, setMetrics] = useState<WorkoutMetrics>({
    steps: 0,
    avgAcceleration: 0,
    avgRotation: 0,
    calories: 0,
    duration: 0,
    intensity: 'baixa',
    movementType: 'parado',
  });

  const [isRecording, setIsRecording] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscriptions = useRef<any[]>([]);
  const recordingStartTime = useRef<number>(0);
  const accelerationHistory = useRef<number[]>([]);
  const rotationHistory = useRef<number[]>([]);
  const initialSteps = useRef<number>(0);

  // Request permissions and setup sensors
  useEffect(() => {
    const setupSensors = async () => {
      try {
        setError(null);
        
        // Check sensor availability
        const accelerometerAvailable = await Accelerometer.isAvailableAsync();
        const gyroscopeAvailable = await Gyroscope.isAvailableAsync();
        const pedometerAvailable = await Pedometer.isAvailableAsync();

        if (!accelerometerAvailable && !gyroscopeAvailable && !pedometerAvailable) {
          setError('Nenhum sensor disponível neste dispositivo');
          return;
        }

        // Request permissions
        const { granted: accelGranted } = await Accelerometer.requestPermissionsAsync();
        const { granted: gyroGranted } = await Gyroscope.requestPermissionsAsync();
        const { granted: pedometerGranted } = await Pedometer.requestPermissionsAsync();

        setPermissionsGranted(accelGranted || gyroGranted || pedometerGranted);

        if (!accelGranted && !gyroGranted && !pedometerGranted) {
          setError('Permissões de sensores não concedidas');
          return;
        }

        // Setup battery monitoring
        const batteryState = await Battery.getBatteryLevelAsync();
        setBatteryLevel(batteryState);

        const batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setBatteryLevel(batteryLevel);
        });

        subscriptions.current.push(batterySubscription);

      } catch (err) {
        setError('Erro ao configurar sensores: ' + (err as Error).message);
      }
    };

    setupSensors();

    return () => {
      subscriptions.current.forEach(sub => sub?.remove?.());
      subscriptions.current = [];
    };
  }, []);

  // Start/stop recording
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    if (!permissionsGranted) {
      setError('Permissões necessárias não concedidas');
      return;
    }

    if (batteryLevel < 0.2) {
      setError('Bateria baixa. Conecte o carregador para continuar');
      return;
    }

    try {
      setIsRecording(true);
      recordingStartTime.current = Date.now();
      accelerationHistory.current = [];
      rotationHistory.current = [];

      // Get initial step count
      const pedometerResult = await Pedometer.getStepCountAsync(
        new Date(Date.now() - 1000),
        new Date()
      );
      initialSteps.current = pedometerResult.steps;

      // Start accelerometer
      Accelerometer.setUpdateInterval(100);
      const accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        accelerationHistory.current.push(magnitude);
        
        setSensorData(prev => ({
          ...prev,
          accelerometer: { x, y, z, magnitude }
        }));
      });

      // Start gyroscope
      Gyroscope.setUpdateInterval(100);
      const gyroSubscription = Gyroscope.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        rotationHistory.current.push(magnitude);
        
        setSensorData(prev => ({
          ...prev,
          gyroscope: { x, y, z, magnitude }
        }));
      });

      // Start pedometer
      const pedometerSubscription = Pedometer.watchStepCount(result => {
        const currentSteps = Math.max(0, result.steps - initialSteps.current);
        setSensorData(prev => ({
          ...prev,
          pedometer: { steps: currentSteps }
        }));
      });

      subscriptions.current.push(accelSubscription, gyroSubscription, pedometerSubscription);

    } catch (err) {
      setError('Erro ao iniciar gravação: ' + (err as Error).message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    subscriptions.current.forEach(sub => sub?.remove?.());
    subscriptions.current = [];
  };

  // Process metrics every second
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - recordingStartTime.current) / 1000);
      
      // Calculate averages
      const recentAccel = accelerationHistory.current.slice(-10);
      const recentRotation = rotationHistory.current.slice(-10);
      
      const avgAcceleration = recentAccel.length > 0 
        ? recentAccel.reduce((sum, val) => sum + val, 0) / recentAccel.length 
        : 0;
      
      const avgRotation = recentRotation.length > 0 
        ? recentRotation.reduce((sum, val) => sum + val, 0) / recentRotation.length 
        : 0;

      // Determine movement type and intensity
      let movementType: WorkoutMetrics['movementType'] = 'parado';
      let intensity: WorkoutMetrics['intensity'] = 'baixa';

      if (avgAcceleration > 8) {
        movementType = 'saltando';
        intensity = 'alta';
      } else if (avgAcceleration > 5) {
        movementType = 'correndo';
        intensity = 'alta';
      } else if (avgAcceleration > 1) {
        movementType = 'caminhando';
        intensity = 'média';
      }

      // Estimate calories (rough calculation)
      const calories = Math.floor(sensorData.pedometer.steps * 0.04 + avgAcceleration * 0.1);

      setMetrics({
        steps: sensorData.pedometer.steps,
        avgAcceleration,
        avgRotation,
        calories,
        duration,
        intensity,
        movementType,
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, sensorData]);

  return {
    sensorData,
    metrics,
    isRecording,
    batteryLevel,
    permissionsGranted,
    error,
    toggleRecording,
  };
}