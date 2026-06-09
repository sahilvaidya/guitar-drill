import { Stack } from 'expo-router';

export default function StudyLayout() {
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
        options={{ title: 'Study', headerLargeTitle: true }}
      />
      <Stack.Screen
        name="triads"
        options={{ title: 'Triads' }}
      />
      <Stack.Screen
        name="caged"
        options={{ title: 'CAGED System' }}
      />
      <Stack.Screen
        name="chords"
        options={{ title: 'Chord Shapes' }}
      />
    </Stack>
  );
}
