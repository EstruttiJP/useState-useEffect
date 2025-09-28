import * as Battery from 'expo-battery';
import { Accelerometer, Gyroscope, Pedometer } from 'expo-sensors';
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
  // DEMO useState: Estados principais para apresentação
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

  // Refs para controle interno (não re-render)
  const subscriptions = useRef<any[]>([]);
  const recordingStartTime = useRef<number>(0);
  const accelerationHistory = useRef<number[]>([]);
  const rotationHistory = useRef<number[]>([]);
  const initialSteps = useRef<number>(0);
  const currentSensorData = useRef<SensorData>({
    accelerometer: { x: 0, y: 0, z: 0, magnitude: 0 },
    gyroscope: { x: 0, y: 0, z: 0, magnitude: 0 },
    pedometer: { steps: 0 },
  });

  // DEMO useEffect: Setup inicial dos sensores
  useEffect(() => {
    const setupSensors = async () => {
      try {
        setError(null);
        
        // Pedir permissões dos sensores
        const { granted: accelGranted } = await Accelerometer.requestPermissionsAsync();
        const { granted: gyroGranted } = await Gyroscope.requestPermissionsAsync();
        const { granted: pedometerGranted } = await Pedometer.requestPermissionsAsync();

        setPermissionsGranted(accelGranted || gyroGranted || pedometerGranted);

        if (!accelGranted && !gyroGranted && !pedometerGranted) {
          setError('Permissões de sensores não concedidas');
          return;
        }

        // Monitorar bateria
        const batteryState = await Battery.getBatteryLevelAsync();
        setBatteryLevel(batteryState);

      } catch (err) {
        setError('Erro ao configurar sensores: ' + (err as Error).message);
      }
    };

    setupSensors();
  }, []); // Array vazio = executa apenas uma vez

  // Função simples para toggle do recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Parar recording
      setIsRecording(false);
      subscriptions.current.forEach(sub => sub?.remove?.());
      subscriptions.current = [];
    } else {
      // Iniciar recording
      if (!permissionsGranted) {
        setError('Permissões necessárias não concedidas');
        return;
      }

      try {
        setIsRecording(true);
        recordingStartTime.current = Date.now();
        accelerationHistory.current = [];
        rotationHistory.current = [];

        // Iniciar sensores
        Accelerometer.setUpdateInterval(100);
        const accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          accelerationHistory.current.push(magnitude);
          
          const newData = { x, y, z, magnitude };
          currentSensorData.current.accelerometer = newData;
          setSensorData(prev => ({ ...prev, accelerometer: newData }));
        });

        Gyroscope.setUpdateInterval(100);
        const gyroSubscription = Gyroscope.addListener(({ x, y, z }) => {
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          rotationHistory.current.push(magnitude);
          
          const newData = { x, y, z, magnitude };
          currentSensorData.current.gyroscope = newData;
          setSensorData(prev => ({ ...prev, gyroscope: newData }));
        });

        const pedometerSubscription = Pedometer.watchStepCount(result => {
          const currentSteps = Math.max(0, result.steps);
          const newData = { steps: currentSteps };
          currentSensorData.current.pedometer = newData;
          setSensorData(prev => ({ ...prev, pedometer: newData }));
        });

        subscriptions.current.push(accelSubscription, gyroSubscription, pedometerSubscription);

      } catch (err) {
        setError('Erro ao iniciar gravação: ' + (err as Error).message);
        setIsRecording(false);
      }
    }
  };

  // DEMO useEffect: Calcular métricas a cada segundo durante recording
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - recordingStartTime.current) / 1000);
      
      // Calcular médias dos últimos 10 valores
      const recentAccel = accelerationHistory.current.slice(-10);
      const recentRotation = rotationHistory.current.slice(-10);
      
      const avgAcceleration = recentAccel.length > 0 
        ? recentAccel.reduce((sum, val) => sum + val, 0) / recentAccel.length 
        : 0;
      
      const avgRotation = recentRotation.length > 0 
        ? recentRotation.reduce((sum, val) => sum + val, 0) / recentRotation.length 
        : 0;

      // Determinar tipo de movimento baseado na aceleração
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

      // Calcular calorias estimadas
      const currentSteps = currentSensorData.current.pedometer.steps;
      const calories = Math.floor(currentSteps * 0.04 + avgAcceleration * 0.1);

      // DEMO useState: Atualizar métricas (demonstra setState)
      setMetrics({
        steps: currentSteps,
        avgAcceleration: Number(avgAcceleration.toFixed(1)),
        avgRotation: Number(avgRotation.toFixed(1)),
        calories,
        duration,
        intensity,
        movementType,
      });

    }, 1000); // Executa a cada 1 segundo

    return () => clearInterval(interval); // Cleanup do useEffect
  }, [isRecording]); // Dependência: só executa quando isRecording muda

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