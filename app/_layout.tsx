import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ensureStorageVersion } from '@/services/statsStore';

export default function RootLayout() {
  useEffect(() => { ensureStorageVersion(); }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F2F2F7' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#F2F2F7' },
      }}
    >
      {/* Tabs group: header managed inside by each tab's own navigator */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
