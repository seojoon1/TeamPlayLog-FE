import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Noto Sans KR을 자주 쓰는 한글 2350자 + 영문·기호만 남겨 줄인 글꼴 (각 6MB → 0.5MB, scripts/subset_fonts.py).
// 목록에 없는 드문 글자는 휴대폰 기본 글꼴로 대신 그려진다. 라이선스: assets/fonts/OFL.txt
const FONTS = {
  NotoSansKR_400Regular: require('../../assets/fonts/NotoSansKR-400Regular-subset.ttf'),
  NotoSansKR_700Bold: require('../../assets/fonts/NotoSansKR-700Bold-subset.ttf'),
  NotoSansKR_900Black: require('../../assets/fonts/NotoSansKR-900Black-subset.ttf'),
};

function Routes() {
  const { ready, signedIn } = useAuth();
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const done = ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (done) SplashScreen.hideAsync().catch(() => {});
  }, [done]);

  if (!done) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="me" />
        <Stack.Screen name="team/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="team/join" options={{ presentation: 'modal' }} />
        <Stack.Screen name="team/[teamId]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } }));
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Routes />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
