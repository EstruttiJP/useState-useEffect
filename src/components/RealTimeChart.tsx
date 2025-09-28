import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface RealTimeChartProps {
  data: number[];
  color: string;
  title: string;
  maxDataPoints?: number;
}

export function RealTimeChart({ 
  data, 
  color, 
  title, 
  maxDataPoints = 50 
}: RealTimeChartProps) {
  const width = Dimensions.get('window').width - 40;
  const height = 80;

  // ========== ESTADO SIMPLIFICADO ==========
  
  // Use o próprio `data` da prop - não duplique o estado!
  // Apenas garanta que não exceda maxDataPoints
  const displayData = data.slice(-maxDataPoints);

  // ========== LÓGICA DO GRÁFICO ==========

  const createPath = () => {
    if (displayData.length < 2) return '';

    const maxValue = Math.max(...displayData, 1);
    const minValue = Math.min(...displayData, 0);
    const range = maxValue - minValue || 1;

    const points = displayData.map((value, index) => {
      const x = (index / (displayData.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      return `${x},${y}`;
    });

    return `M${points.join('L')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Svg width={width} height={height} style={styles.chart}>
        <Path
          d={createPath()}
          stroke={color}
          strokeWidth={2}
          fill="transparent"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chart: {
    backgroundColor: 'transparent',
  },
});