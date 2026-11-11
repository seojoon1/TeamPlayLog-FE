import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, Button, Card, Divider, Empty, Loading, Row, Track, Txt } from '@/components/ui';
import { dDay, daysUntil } from '@/lib/format';
import { useBoard, useInbox, useMe, useTeam } from '@/lib/hooks';
import type { TeamSummary } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { C, MAX_WIDTH, S } from '@/theme';

/** S-02 내 팀 목록 */
export default function Teams() {
  const me = useMe();
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => api<TeamSummary[]>('/teams') });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={teams.isRefetching} onRefresh={() => void teams.refetch()} tintColor={C.primary} />}>
        <View style={st.inner}>
          <Row align="flex-end">
            <View style={{ flex: 1, gap: 2 }}>
              <Txt t="sm">안녕하세요</Txt>
              <Txt t="title">{me.data ? `${me.data.display_name}님의 팀` : ' '}</Txt>
            </View>
            {me.data ? <Avatar name={me.data.display_name} seed={me.data.id} /> : null}
          </Row>

          {teams.isLoading ? <Loading /> : null}
          {teams.data?.length === 0 ? <Empty icon="people-outline" title="아직 참여한 팀이 없어요" body="팀을 만들거나, 조장에게 받은 초대 코드를 입력해 주세요." /> : null}
          {teams.data?.map((t) => <TeamCard key={t.id} team={t} />)}

          <Row gap={10}>
            <Button kind="secondary" icon="add" label="팀 만들기" onPress={() => router.push('/team/new')} grow />
            <Button kind="ghost" label="초대 코드 입력" onPress={() => router.push('/team/join')} grow />
          </Row>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TeamCard({ team: t }: { team: TeamSummary }) {
  const detail = useTeam(t.id);
  const inbox = useInbox(t.id);
  const board = useBoard(t.id);
  const left = daysUntil(t.final_due_at);
  const total = detail.data?.tasks_total ?? 0;
  const done = detail.data?.tasks_done ?? 0;
  const waiting = inbox.data?.length ?? 0;
  const overdue = board.data?.tasks.filter((x) => x.status === 'OVERDUE').length ?? 0;

  return (
    <Card onPress={() => router.push(`/team/${t.id}`)} style={{ gap: S.md }}>
      <Row>
        <Txt t="sm" style={{ flex: 1 }}>
          {t.course_name}
        </Txt>
        <Badge label={dDay(left)} tone={left <= 10 && left >= 0 ? 'brand' : 'muted'} />
      </Row>
      <Txt t="h2">{t.project_name}</Txt>
      <Track value={total ? done / total : 0} />
      <Row>
        <Txt t="sm" style={{ flex: 1 }}>
          할 일 {total}개 중 {done}개 완료
        </Txt>
        <Txt t="sm">
          팀원 {t.member_count}명{t.my_role === 'LEADER' ? ' · 조장' : ''}
        </Txt>
      </Row>
      {waiting || overdue ? (
        <>
          <Divider />
          <Row gap={S.sm}>
            {waiting ? <Badge label={`확인 요청 ${waiting}`} tone="warn" icon="checkmark-done" /> : null}
            {overdue ? <Badge label={`마감 지남 ${overdue}`} tone="danger" icon="time-outline" /> : null}
          </Row>
        </>
      ) : null}
    </Card>
  );
}

const st = StyleSheet.create({
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.xl, gap: 20 },
});
