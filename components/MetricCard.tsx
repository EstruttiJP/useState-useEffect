import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  color: string;
  intensity?: number;
}

export function MetricCard({ title, value, unit, color, intensity = 0 }: MetricCardProps) {
  const getGradientColors = () => {
    const opacity = Math.max(0.1, intensity / 10);
    return [`${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`, 'transparent'];
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color }]}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    margin: 6,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 4,
  },
  unit: {
    fontSize: 14,
    color: '#666',
  },
});