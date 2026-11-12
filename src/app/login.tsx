import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorText, Field, KeyboardScreen, SlowHint, Txt } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { C, F, MAX_WIDTH, S } from '@/theme';

/** S-01 로그인 */
export default function Login() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signupMode = mode === 'signup';
  const scroller = useRef<ScrollViewInstance>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (signupMode) await signup(email.trim(), password, name.trim());
      else await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '문제가 생겼습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardScreen>
      <SafeAreaView style={st.screen} edges={['top', 'bottom']}>
        {/* 키보드가 올라와 화면이 줄면 아래(로그인 버튼)까지 보이게 내린다 */}
        <ScrollView
          ref={scroller}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          onLayout={() => scroller.current?.scrollToEnd({ animated: true })}>
          <View style={st.inner}>
            <View style={st.hero}>
              <View style={st.logo}>
                <Text style={st.logoText}>팀</Text>
              </View>
              <Txt t="brand">팀플로그</Txt>
              <Txt t="sm">약속하고, 기록하고, 동료가 확인합니다.</Txt>
            </View>
            <View style={{ gap: S.lg }}>
              <Field label="학교 이메일" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="예: minsu@shinhan.ac.kr" />
              <Field
                label="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={signupMode ? 'new-password' : 'current-password'}
                hint={signupMode ? '8자 이상' : undefined}
                onSubmitEditing={signupMode ? undefined : submit}
              />
              {signupMode ? <Field label="이름" value={name} onChangeText={setName} placeholder="팀원에게 보일 이름 (2~12자)" maxLength={12} /> : null}
              <ErrorText message={error} />
              {busy ? <SlowHint /> : null}
              <Button label={signupMode ? '가입하고 시작하기' : '로그인'} onPress={submit} loading={busy} disabled={!email || !password || (signupMode && name.trim().length < 2)} />
            </View>
            <View style={{ flex: 1 }} />
            <View style={st.bottom}>
              <Pressable
                role="button"
                onPress={() => {
                  setMode(signupMode ? 'login' : 'signup');
                  setError(null);
                }}
                hitSlop={8}>
                <Txt t="sm">
                  {signupMode ? '이미 계정이 있나요? ' : '처음이신가요? '}
                  <Txt t="link">{signupMode ? '로그인' : '가입하기'}</Txt>
                </Txt>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardScreen>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: S.lg },
  hero: { alignItems: 'center', gap: 10, paddingTop: 56, paddingBottom: 32 },
  logo: { width: 72, height: 72, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: C.white, fontSize: 34, lineHeight: 44, fontFamily: F.black },
  bottom: { alignItems: 'center', gap: S.md, paddingBottom: 28, paddingTop: S.xl },
});
