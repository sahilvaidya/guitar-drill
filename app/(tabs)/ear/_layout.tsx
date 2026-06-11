import { Stack } from 'expo-router';

export default function EarLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F2F2F7' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#F2F2F7' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Ear Training', headerLargeTitle: true }}
      />
      <Stack.Screen
        name="intervals"
        options={{ title: 'Intervals' }}
      />
      <Stack.Screen
        name="notes"
        options={{ title: 'Note ID' }}
      />
    </Stack>
  );
}
