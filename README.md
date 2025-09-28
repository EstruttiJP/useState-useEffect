# App de Monitoramento de Sensores - Apresentação useState e useEffect

## 📱 Visão Geral

Esta é uma aplicação React Native com Expo focada em **demonstrar o gerenciamento de estado** usando os hooks `useState` e `useEffect`. O app monitora sensores do dispositivo (acelerômetro, giroscópio, pedômetro) em tempo real, oferecendo uma demonstração prática de como os estados React funcionam.

## 🎯 Objetivo da Apresentação

Demonstrar claramente:
- **useState**: Como gerenciar estados reativos
- **useEffect**: Como executar efeitos colaterais e cleanup
- **Re-renderização**: Como mudanças de estado atualizam a UI

## 🔧 Tecnologias Utilizadas

- **React Native + Expo**: Framework multiplataforma
- **TypeScript**: Tipagem estática
- **Expo Sensors**: Acesso aos sensores do dispositivo
- **React Hooks**: useState, useEffect, useRef

## 📊 Funcionalidades

### Estados Principais (useState)
- `sensorData`: Dados em tempo real dos sensores
- `metrics`: Métricas calculadas (passos, calorias, duração)
- `isRecording`: Status da gravação
- `batteryLevel`: Nível da bateria
- `permissionsGranted`: Status das permissões
- `error`: Mensagens de erro

### Efeitos (useEffect)

1. **Setup Inicial** (executa uma vez)
   ```typescript
   useEffect(() => {
     // Pedir permissões dos sensores
     // Configurar monitoramento da bateria
   }, []); // Array vazio = executa apenas uma vez
   ```

2. **Cálculo de Métricas** (executa quando recording muda)
   ```typescript
   useEffect(() => {
     // Intervalo de 1 segundo para calcular métricas
     // Cleanup do intervalo quando para de gravar
   }, [isRecording]); // Depende de isRecording
   ```

3. **Atualização dos Gráficos** (executa quando dados mudam)
   ```typescript
   useEffect(() => {
     // Atualizar histórico dos gráficos
     // Limitar a 50 pontos
   }, [sensorData, isRecording]); // Depende dos dados
   ```

## 🏗️ Arquitetura dos Hooks

### useSensors.ts
Hook personalizado que encapsula toda a lógica dos sensores:
- **Estados internos**: Dados dos sensores, métricas, status
- **Lógica de permissões**: Setup inicial dos sensores
- **Listeners**: Monitoramento em tempo real
- **Cálculos**: Transformação de dados brutos em métricas

### Componentes Principais
- **MonitorScreen**: Tela principal com estados locais
- **MetricCard**: Exibe métricas individuais
- **CircularProgress**: Progresso circular animado

## 🔄 Fluxo de Estados

```
1. Usuário pressiona "Iniciar"
   ↓
2. useState: isRecording = true
   ↓
3. useEffect detecta mudança e inicia sensores
   ↓
4. Sensores enviam dados → useState: sensorData
   ↓
5. useEffect de métricas processa dados
   ↓
6. useState: metrics atualizado
   ↓
7. UI re-renderiza automaticamente
```

## 📝 Conceitos Demonstrados

### useState
- **Estado inicial**: Definição de valores padrão
- **Atualizações**: Como useState dispara re-renderização
- **Estados compostos**: Objetos e arrays como estado
- **Batching**: Múltiplas atualizações em uma renderização

### useEffect
- **Dependências**: Array de dependências controla execução
- **Cleanup**: Função de retorno limpa recursos
- **Timing**: Quando o efeito executa (mount, update, unmount)
- **Otimização**: Evitar loops infinitos

### useRef
- **Valores persistentes**: Dados que não causam re-render
- **Referências DOM**: Acesso direto a elementos
- **Performance**: Evitar recriação de objetos

## 🚀 Como Executar

### Desenvolvimento
```bash
npm install
npx expo start
```

### No dispositivo
1. Instale o **Expo Go** no seu celular
2. Escaneie o QR code gerado
3. O app carregará com todos os sensores funcionando

### Web (limitado)
```bash
npx expo start --web
```
*Nota: Sensores não funcionam no navegador*

## 📱 Demonstração ao Vivo

### Para a Apresentação:
1. **Abra o app no celular** via Expo Go
2. **Mostre a tela inicial** - Estados em estado padrão
3. **Pressione "Iniciar"** - Demonstra useState mudando isRecording
4. **Movimente o celular** - Sensores enviam dados em tempo real
5. **Observe os MetricCards** - useState atualizando métricas
6. **Veja a duração crescer** - useEffect executando a cada segundo

### Pontos de Destaque:
- ⏱️ **Duração**: Incrementa a cada segundo (useEffect com intervalo)
- 📊 **Aceleração/Rotação**: Atualizam em tempo real (useState dos sensores)
- 👣 **Passos**: Incrementam conforme movimento (pedômetro)
- 🔥 **Calorias**: Calculadas automaticamente (useEffect processando dados)
- 🔋 **Bateria**: Monitora em background (useEffect de setup)

## 💡 Conceitos Técnicos Avançados

### Performance
- **useRef** para dados que não precisam re-render
- **Dependências otimizadas** nos useEffect
- **Cleanup adequado** de listeners e intervalos

### TypeScript
- Interfaces bem definidas para estados
- Tipagem de hooks personalizados
- Props tipadas nos componentes

### Padrões React
- Separação de lógica em hooks customizados
- Estados derivados vs. calculados
- Composição de componentes

## 🎓 Para a Apresentação

Este app é perfeito para demonstrar:
1. **Por que useState e useEffect são fundamentais**
2. **Como estados complexos são gerenciados**
3. **Quando usar cada hook**
4. **Boas práticas de performance**
5. **Padrões reais de desenvolvimento**

A aplicação mostra React Hooks em ação com dados reais dos sensores, tornando a apresentação tangível e envolvente!