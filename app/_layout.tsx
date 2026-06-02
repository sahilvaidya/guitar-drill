import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F2F2F7' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#F2F2F7' },
      }}
    />
  );
}
