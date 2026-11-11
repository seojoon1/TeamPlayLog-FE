import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Button, ErrorText, Notice, Screen, Txt } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { Team } from '@/lib/types';
import { C, F, R } from '@/theme';

/** 초대 코드 입력 */
export default function JoinTeam() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const join = useMutation({
    mutationFn: () => api<Team>('/teams/join', { method: 'POST', body: { invite_code: code.trim() } }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      router.replace(`/team/${t.id}`);
    },
  });
  const ok = code.trim().length === 6;

  return (
    <Screen title="초대 코드 입력" footer={<Button label="팀 참여하기" onPress={() => join.mutate()} loading={join.isPending} disabled={!ok} grow />}>
      <Txt t="sm">조장에게 받은 6자리 코드를 입력해 주세요.</Txt>
      <TextInput
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        placeholder="K7M2QX"
        placeholderTextColor="#D3CCD0"
        style={st.code}
        onSubmitEditing={() => ok && join.mutate()}
      />
      <ErrorText message={join.error instanceof ApiError ? join.error.message : null} />
      <Notice icon="information-circle-outline">이미 역할 약속이 확정된 팀이라면, 들어가자마자 약속을 확인하고 동의해 달라는 알림이 와요.</Notice>
    </Screen>
  );
}

const st = StyleSheet.create({
  code: {
    height: 72,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
    textAlign: 'center',
    fontFamily: F.black,
    fontSize: 32,
    letterSpacing: 8,
    color: C.text,
  },
});
