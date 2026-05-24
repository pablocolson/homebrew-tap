import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useWaypointStore } from './src/stores/waypointStore';
import { useBoatStore } from './src/stores/boatStore';
import { useTrackStore } from './src/stores/trackStore';
import { colors, fontSize } from './src/utils/theme';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.title}>HelmChart</Text>
      <Text style={styles.tagline}>Navigation marine open source</Text>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 32 }} />
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      useWaypointStore.getState().init(),
      useBoatStore.getState().init(),
      useTrackStore.getState().init(),
    ]).then(() => setReady(true));
  }, []);

  if (!ready) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: 8,
  },
});
