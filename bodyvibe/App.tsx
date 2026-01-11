import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
global.process = require('process');
if (!global.process.version) global.process.version = 'v16.0.0';

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddMeasurementScreen } from './src/screens/AddMeasurementScreen';
import { VerifyMeasurementScreen } from './src/screens/VerifyMeasurementScreen';
import { MeasurementDetailsScreen } from './src/screens/MeasurementDetailsScreen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/store/database';
import { useStore } from './src/store/useStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const loadData = useStore((state) => state.loadData);

  useEffect(() => {
    initDatabase();
    loadData();
  }, [loadData]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#050505' }
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddMeasurement" component={AddMeasurementScreen} />
          <Stack.Screen name="VerifyMeasurement" component={VerifyMeasurementScreen} />
          <Stack.Screen name="MeasurementDetails" component={MeasurementDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
