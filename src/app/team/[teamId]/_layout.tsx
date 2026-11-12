import { Stack } from 'expo-router';

import { C } from '@/theme';

/** 팀 안의 화면들: 탭 4개 묶음 위로 상세 화면(할 일, 기록하기, 역할 약속, 리포트)이 겹쳐 열린다. */
export default function TeamStack() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="record" options={{ presentation: 'modal' }} />
      <Stack.Screen name="task/[taskId]" />
      <Stack.Screen name="task-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="agreement" />
      <Stack.Screen name="agreement-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="report" />
    </Stack>
  );
}
