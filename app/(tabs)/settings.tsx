import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Battery, Smartphone, Shield, Trash2, Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExBattery from 'expo-battery';

export default function SettingsScreen() {
  const [batteryOptimization, setBatteryOptimization] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [deviceInfo, setDeviceInfo] = useState({
    isCharging: false,
    lowPowerMode: false,
  });

  useEffect(() => {
    loadSettings();
    loadBatteryInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setBatteryOptimization(parsed.batteryOptimization ?? true);
        setHighAccuracy(parsed.highAccuracy ?? false);
        setAutoSave(parsed.autoSave ?? true);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadBatteryInfo = async () => {
    try {
      const level = await ExBattery.getBatteryLevelAsync();
      const isCharging = await ExBattery.getBatteryStateAsync();
      const lowPowerMode = await ExBattery.isLowPowerModeEnabledAsync();

      setBatteryLevel(level);
      setDeviceInfo({
        isCharging: isCharging === ExBattery.BatteryState.CHARGING,
        lowPowerMode,
      });
    } catch (error) {
      console.error('Erro ao carregar informações da bateria:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const handleBatteryOptimizationChange = (value: boolean) => {
    setBatteryOptimization(value);
    saveSettings({
      batteryOptimization: value,
      highAccuracy,
      autoSave,
    });
  };

  const handleHighAccuracyChange = (value: boolean) => {
    if (value && batteryLevel < 0.5) {
      Alert.alert(
        'Bateria Baixa',
        'Alta precisão consome mais bateria. Recomendamos usar apenas com bateria acima de 50%.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            onPress: () => {
              setHighAccuracy(value);
              saveSettings({
                batteryOptimization,
                highAccuracy: value,
                autoSave,
              });
            },
          },
        ]
      );
    } else {
      setHighAccuracy(value);
      saveSettings({
        batteryOptimization,
        highAccuracy: value,
        autoSave,
      });
    }
  };

  const handleAutoSaveChange = (value: boolean) => {
    setAutoSave(value);
    saveSettings({
      batteryOptimization,
      highAccuracy,
      autoSave: value,
    });
  };

  const handleClearData = () => {
    Alert.alert(
      'Limpar Dados',
      'Esta ação irá remover todo o histórico de treinos. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('workoutHistory');
              Alert.alert('Sucesso', 'Dados limpos com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar dados');
            }
          },
        },
      ]
    );
  };

  const getBatteryColor = () => {
    if (batteryLevel > 0.6) return '#00ff41';
    if (batteryLevel > 0.2) return '#ffaa00';
    return '#ff0040';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Configurações</Text>

        {/* Battery Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status do Dispositivo</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Battery size={20} color={getBatteryColor()} />
              <Text style={styles.infoText}>
                Bateria: {Math.round(batteryLevel * 100)}%
                {deviceInfo.isCharging && ' (Carregando)'}
              </Text>
            </View>
            
            {deviceInfo.lowPowerMode && (
              <View style={styles.warningRow}>
                <Info size={16} color="#ffaa00" />
                <Text style={styles.warningText}>
                  Modo de economia de energia ativado
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Sensor Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensores</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Otimização de Bateria</Text>
              <Text style={styles.settingDescription}>
                Reduz a frequência de leitura dos sensores para economizar bateria
              </Text>
            </View>
            <Switch
              value={batteryOptimization}
              onValueChange={handleBatteryOptimizationChange}
              trackColor={{ false: '#333', true: '#00ff41' }}
              thumbColor={batteryOptimization ? '#fff' : '#999'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Alta Precisão</Text>
              <Text style={styles.settingDescription}>
                Aumenta a precisão dos sensores (consome mais bateria)
              </Text>
            </View>
            <Switch
              value={highAccuracy}
              onValueChange={handleHighAccuracyChange}
              trackColor={{ false: '#333', true: '#00ff41' }}
              thumbColor={highAccuracy ? '#fff' : '#999'}
            />
          </View>
        </View>

        {/* Data Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Salvamento Automático</Text>
              <Text style={styles.settingDescription}>
                Salva automaticamente as sessões de treino
              </Text>
            </View>
            <Switch
              value={autoSave}
              onValueChange={handleAutoSaveChange}
              trackColor={{ false: '#333', true: '#00ff41' }}
              thumbColor={autoSave ? '#fff' : '#999'}
            />
          </View>

          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
            <Trash2 size={20} color="#ff0040" />
            <Text style={styles.dangerButtonText}>Limpar Todos os Dados</Text>
          </TouchableOpacity>
        </View>

        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Smartphone size={16} color="#666" />
              <Text style={styles.infoText}>Versão do App: 1.0.0</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Shield size={16} color="#666" />
              <Text style={styles.infoText}>
                Todos os dados são armazenados localmente no dispositivo
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dicas de Performance</Text>
          
          <View style={styles.tipsCard}>
            <Text style={styles.tipText}>
              💡 Para melhor precisão, mantenha o celular no bolso ou braçadeira
            </Text>
            <Text style={styles.tipText}>
              🔋 Use otimização de bateria durante treinos longos
            </Text>
            <Text style={styles.tipText}>
              📱 Evite usar outros apps intensivos durante o monitoramento
            </Text>
            <Text style={styles.tipText}>
              ⚡ Carregue o dispositivo antes de treinos longos
            </Text>
          </View>
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
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1f00',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    color: '#ffaa00',
    fontSize: 12,
    marginLeft: 6,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#999',
    fontSize: 12,
    lineHeight: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a0a0a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff0040',
    marginTop: 8,
  },
  dangerButtonText: {
    color: '#ff0040',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsCard: {
    backgroundColor: '#0a1a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#004d00',
  },
  tipText: {
    color: '#00cc35',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});