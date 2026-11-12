import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar, Avatar, Badge, Button, Card, ErrorText, ListRow, Row, Txt, type IconName } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { dDay, dueLabel, daysUntil, shortDate } from '@/lib/format';
import { useAgreement, useMe, useReports, useTeam, useTeamId } from '@/lib/hooks';
import { leaveTeamScreens } from '@/lib/nav';
import type { Team } from '@/lib/types';
import { C, F, MAX_WIDTH, S } from '@/theme';

/** 팀 탭: 팀 정보·초대 코드·팀원·역할 약속·기여 리포트로 가는 길 */
export default function MoreScreen() {
  const teamId = useTeamId();
  const qc = useQueryClient();
  const { logout } = useAuth();
  const me = useMe();
  const team = useTeam(teamId);
  const ag = useAgreement(teamId);
  const reports = useReports(teamId);
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const t = team.data;
  const leader = t?.my_role === 'LEADER';

  const regen = useMutation({
    mutationFn: () => api<Team>(`/teams/${teamId}/invite-code`, { method: 'POST' }),
    onSuccess: (x) => qc.setQueryData(['team', teamId], x),
  });
  const leave = useMutation({
    mutationFn: () => api(`/teams/${teamId}/members/me`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      router.replace('/');
    },
  });

  const agStatus = ag.data?.current?.status;
  const agBadge = !ag.data
    ? null
    : agStatus === 'CONFIRMED' ? <Badge label="확정" tone="ok" icon="checkmark" /> : agStatus === 'PENDING' ? <Badge label="동의 대기" tone="warn" /> : agStatus === 'DRAFT' ? <Badge label="작성 중" tone="muted" /> : <Badge label="아직 없음" tone="muted" />;
  const latest = reports.data?.[0];
  const repBadge = latest ? <Badge label={latest.status === 'SUBMITTED' ? '제출됨' : '제출 전'} tone={latest.status === 'SUBMITTED' ? 'ok' : 'warn'} /> : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <AppBar title="팀" onBack={leaveTeamScreens} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={st.inner}>
          {t ? (
            <Card style={{ gap: 6 }}>
              <Row>
                <Txt t="sm" style={{ flex: 1 }}>
                  {t.course_name}
                </Txt>
                <Badge label={dDay(daysUntil(t.final_due_at))} tone="brand" />
              </Row>
              <Txt t="h2">{t.project_name}</Txt>
              <Txt t="sm">최종 마감 {dueLabel(t.final_due_at)}</Txt>
            </Card>
          ) : null}

          {leader && t?.invite_code ? (
            <Card style={{ gap: 10 }}>
              <Txt t="sec">초대 코드</Txt>
              <Row gap={S.md}>
                <Text style={st.code}>{t.invite_code}</Text>
                <View style={{ flex: 1 }} />
                <Button
                  small
                  kind="secondary"
                  icon={copied ? 'checkmark' : 'copy-outline'}
                  label={copied ? '복사됨' : '복사'}
                  onPress={async () => {
                    await Clipboard.setStringAsync(t.invite_code!);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                />
              </Row>
              <Row>
                <Txt t="tiny" style={{ flex: 1 }}>
                  {t.invite_expires_at ? `${shortDate(t.invite_expires_at)}까지 쓸 수 있어요 · 팀원 ${t.members.length}/${t.max_members}명` : ''}
                </Txt>
                <Button small kind="ghost" label="새 코드" loading={regen.isPending} onPress={() => regen.mutate()} />
              </Row>
            </Card>
          ) : null}

          <View style={{ gap: S.sm }}>
            <Txt t="sec">팀 활동</Txt>
            <Card style={{ paddingVertical: 4, gap: 0 }}>
              <Menu icon="people-outline" label="역할 약속" right={agBadge} onPress={() => router.push(`/team/${teamId}/agreement`)} />
              <Menu icon="document-text-outline" label="기여 리포트" right={repBadge} onPress={() => router.push(`/team/${teamId}/report`)} last />
            </Card>
          </View>

          <View style={{ gap: S.sm }}>
            <Txt t="sec">팀원 {t?.members.length ?? ''}</Txt>
            <Card style={{ paddingVertical: 4, gap: 0 }}>
              {t?.members.map((m, i) => (
                <ListRow key={m.member_id} last={i === t.members.length - 1}>
                  <Avatar name={m.display_name} seed={m.member_id} />
                  <Txt t="b" style={{ flex: 1 }}>
                    {m.display_name}
                    {m.user_id === me.data?.id ? <Txt t="sm"> (나)</Txt> : null}
                  </Txt>
                  {m.role === 'LEADER' ? <Badge label="조장" tone="brand" /> : null}
                </ListRow>
              ))}
            </Card>
          </View>

          <View style={{ gap: S.sm }}>
            <Card style={{ paddingVertical: 4, gap: 0 }}>
              <Menu icon="swap-horizontal" label="다른 팀 보기" onPress={() => router.replace('/')} />
              <Menu icon="exit-outline" label={confirmLeave ? '한 번 더 누르면 팀을 나가요' : '팀 나가기'} danger onPress={() => (confirmLeave ? leave.mutate() : setConfirmLeave(true))} />
              <Menu icon="log-out-outline" label="로그아웃" onPress={logout} last />
            </Card>
            <ErrorText message={leave.error instanceof ApiError ? leave.error.message : null} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Menu({ icon, label, right, onPress, last, danger }: { icon: IconName; label: string; right?: ReactNode; onPress: () => void; last?: boolean; danger?: boolean }) {
  return (
    <ListRow onPress={onPress} last={last}>
      <Ionicons name={icon} size={20} color={danger ? C.danger : C.primary} />
      <Txt t="b" color={danger ? C.danger : C.text} style={{ flex: 1 }}>
        {label}
      </Txt>
      {right}
      <Ionicons name="chevron-forward" size={18} color={C.mute} />
    </ListRow>
  );
}

const st = StyleSheet.create({
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: S.lg, paddingTop: S.xs, paddingBottom: S.xl, gap: S.lg },
  code: { fontFamily: F.black, fontSize: 28, lineHeight: 36, letterSpacing: 6, color: C.primary },
});
