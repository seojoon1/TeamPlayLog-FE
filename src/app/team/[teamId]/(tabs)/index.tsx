import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar, Badge, Button, Card, Chip, Empty, Fab, IconButton, Loading, Row, Track, Txt } from '@/components/ui';
import { dDay, dueLabel, hoursUntil } from '@/lib/format';
import { useBoard, useMyMemberId, useTeam, useTeamId } from '@/lib/hooks';
import { TASK_STATUS } from '@/lib/status';
import type { Task } from '@/lib/types';
import { C, F, MAX_WIDTH, R, S } from '@/theme';


type Filter = 'all' | 'mine' | 'soon';

/** S-05 팀 보드 */
export default function BoardScreen() {
  const teamId = useTeamId();
  const [filter, setFilter] = useState<Filter>('all');
  const board = useBoard(teamId, filter === 'mine');
  const team = useTeam(teamId);
  const myId = useMyMemberId(teamId);
  const b = board.data;
  const tasks = (b?.tasks ?? []).filter((t) => filter !== 'soon' || (t.status !== 'DONE' && hoursUntil(t.due_at) <= 48));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <AppBar
        title={team.data?.project_name ?? ' '}
        back
        right={
          <>
            <IconButton icon="add" label="할 일 추가" onPress={() => router.push(`/team/${teamId}/task-edit`)} />
            <IconButton icon="ellipsis-horizontal" label="팀 메뉴" onPress={() => router.push(`/team/${teamId}/more`)} />
          </>
        }
      />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={board.isRefetching} onRefresh={() => void board.refetch()} tintColor={C.primary} />}>
          <View style={st.inner}>
            <View style={st.hero}>
              <Text style={st.heroL}>{team.data?.course_name ?? ' '} · 최종 마감까지</Text>
              <Row align="flex-end">
                <Text style={[st.heroBig, { flex: 1 }]}>{b ? dDay(b.d_day) : ' '}</Text>
                <Text style={st.heroS}>{b ? dueLabel(b.final_due_at) : ''}</Text>
              </Row>
              <Track value={b && b.tasks_total ? b.tasks_done / b.tasks_total : 0} light />
              <Text style={st.heroS}>{b ? `할 일 ${b.tasks_total}개 중 ${b.tasks_done}개 완료` : ' '}</Text>
            </View>

            {b && !b.agreement_confirmed ? (
              <Card onPress={() => router.push(`/team/${teamId}/agreement`)} style={{ backgroundColor: C.warn50, borderColor: C.warn50, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}>
                <Ionicons name="alert-circle-outline" size={18} color={C.warn} />
                <Txt t="sm" color={C.text} style={{ flex: 1 }}>
                  역할 약속이 아직 확정되지 않았어요. 모두 동의하면 약속한 할 일이 보드에 생겨요.
                </Txt>
                <Ionicons name="chevron-forward" size={18} color={C.warn} />
              </Card>
            ) : null}

            <Row gap={S.sm}>
              <Chip label="전체" selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="내 할 일" selected={filter === 'mine'} onPress={() => setFilter('mine')} />
              <Chip label="마감 임박" selected={filter === 'soon'} onPress={() => setFilter('soon')} />
            </Row>

            {board.isLoading ? <Loading /> : null}
            {b && tasks.length === 0 ? (
              <Empty
                icon="list-outline"
                title={filter === 'mine' ? '나에게 배정된 할 일이 없어요' : filter === 'soon' ? '48시간 안에 마감인 할 일이 없어요' : '아직 할 일이 없어요'}
                body={filter === 'all' ? '역할 약속을 확정하면 약속한 할 일이 여기에 생겨요.' : undefined}
                action={filter === 'all' ? <Button small kind="secondary" label="역할 약속 보기" onPress={() => router.push(`/team/${teamId}/agreement`)} /> : undefined}
              />
            ) : null}
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} mine={!!myId && (t.for_everyone || t.assignees.some((a) => a.member_id === myId))} onPress={() => router.push(`/team/${teamId}/task/${t.id}`)} />
            ))}
            <View style={{ height: 72 }} />
          </View>
        </ScrollView>
        <Fab label="기록하기" icon="create-outline" onPress={() => router.push(`/team/${teamId}/record`)} />
      </View>
    </SafeAreaView>
  );
}

function TaskCard({ task, mine, onPress }: { task: Task; mine: boolean; onPress: () => void }) {
  const s = TASK_STATUS[task.status];
  const who = task.for_everyone ? '전원' : task.assignees.map((a) => a.display_name).join(', ') || '담당자 없음';
  const late = task.status === 'OVERDUE';
  return (
    <Card onPress={onPress} style={[late && { borderColor: C.dangerLine }]}>
      <Row gap={S.sm} align="flex-start">
        <Txt t="h3" style={{ flex: 1 }} numberOfLines={2}>
          {task.title}
        </Txt>
        <Badge label={s.label} tone={s.tone} />
      </Row>
      <Row gap={5}>
        <Ionicons name="person-outline" size={14} color={C.sub} />
        <Txt t="sm">{who}</Txt>
        {mine ? <Badge label="내 담당" tone="brand" /> : null}
      </Row>
      <Row gap={5} style={{ flexWrap: 'wrap' }}>
        <Ionicons name="time-outline" size={14} color={late ? C.danger : C.sub} />
        <Txt t="sm" color={late ? C.danger : C.sub} style={late ? { fontFamily: F.bold } : undefined}>
          {dueLabel(task.due_at)}
        </Txt>
        <Txt t="tiny">
          · 기록 {task.record_count} · 확인 {task.confirmed_record_count}
        </Txt>
      </Row>
    </Card>
  );
}

const st = StyleSheet.create({
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: S.lg, paddingTop: S.xs, gap: S.md },
  hero: { backgroundColor: C.primary, borderRadius: R.lg, paddingVertical: S.lg, paddingHorizontal: 18, gap: 6 },
  heroL: { color: C.heroSub, fontFamily: F.bold, fontSize: 13, lineHeight: 19 },
  heroBig: { color: C.white, fontFamily: F.black, fontSize: 40, lineHeight: 50 },
  heroS: { color: C.white, fontFamily: F.bold, fontSize: 13, lineHeight: 19 },
});
