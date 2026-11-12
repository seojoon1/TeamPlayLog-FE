import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { AttachmentChip, ConfirmActions } from '@/components/record-parts';
import { Avatar, Badge, Button, Card, Chip, Empty, ErrorText, Loading, Row, Screen, Section, TextLink, Txt } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { ago, dueLabel, RECORD_TYPE_LABEL, shortDate } from '@/lib/format';
import { useInbox, useMyMemberId, useTask, useTaskRecords, useTeam, useTeamId } from '@/lib/hooks';
import { RECORD_STATUS, TASK_STATUS } from '@/lib/status';
import type { TaskEvent, Team } from '@/lib/types';
import { C, S } from '@/theme';

/** S-06 할 일 상세 */
export default function TaskDetail() {
  const teamId = useTeamId();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const qc = useQueryClient();
  const task = useTask(taskId);
  const records = useTaskRecords(teamId, taskId);
  const team = useTeam(teamId);
  const myId = useMyMemberId(teamId);
  const t = task.data;
  const mine = !!t && !!myId && (t.for_everyone || t.assignees.some((a) => a.member_id === myId));
  const leader = team.data?.my_role === 'LEADER';
  const recs = records.data?.items ?? [];
  const confirmed = recs.filter((r) => r.status === 'CONFIRMED').length;
  // 내가 확인해야 하는 기록은 여기서도 바로 확인할 수 있게 한다
  const inbox = useInbox(teamId);
  const toConfirm = new Set(inbox.data?.map((r) => r.id));

  const setStatus = useMutation({
    mutationFn: (status: string) => api(`/tasks/${taskId}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['board', teamId] });
      qc.invalidateQueries({ queryKey: ['team', teamId] });
    },
  });

  if (!t) {
    return (
      <Screen title="할 일">
        <Loading />
      </Screen>
    );
  }
  const s = TASK_STATUS[t.status];
  const canEdit = mine || leader;
  const done = t.status === 'DONE';

  return (
    <Screen
      title="할 일"
      right={canEdit ? <TextLink label="편집" onPress={() => router.push({ pathname: '/team/[teamId]/task-edit', params: { teamId, taskId } })} /> : undefined}
      footer={
        <>
          {canEdit ? (
            <Button
              kind="ghost"
              icon={done ? 'refresh' : 'checkmark'}
              label={done ? '다시 진행' : '완료로 표시'}
              loading={setStatus.isPending}
              onPress={() => setStatus.mutate(done ? 'DOING' : 'DONE')}
            />
          ) : null}
          <Button grow icon="create-outline" label="기록하기" onPress={() => router.push({ pathname: '/team/[teamId]/record', params: { teamId, taskId } })} />
        </>
      }>
      <View style={{ gap: 10 }}>
        <Row gap={S.sm}>
          <Badge label={s.label} tone={s.tone} />
          {mine ? <Badge label="내 담당" tone="brand" /> : null}
        </Row>
        <Txt t="title">{t.title}</Txt>
        <Card style={{ gap: 10 }}>
          <Row gap={S.md}>
            <Txt t="sm" color={C.mute} style={st.k}>
              담당
            </Txt>
            {t.for_everyone ? (
              <Txt t="b">전원</Txt>
            ) : (
              <Row gap={S.md} style={{ flexWrap: 'wrap', flex: 1 }}>
                {t.assignees.map((a) => (
                  <Row key={a.member_id} gap={6}>
                    <Avatar name={a.display_name} seed={a.member_id} size={28} />
                    <Txt t="b">{a.display_name}</Txt>
                  </Row>
                ))}
              </Row>
            )}
          </Row>
          <Row gap={S.md}>
            <Txt t="sm" color={C.mute} style={st.k}>
              마감
            </Txt>
            <Txt t="b" color={t.status === 'OVERDUE' ? C.danger : C.text}>
              {dueLabel(t.due_at)}
            </Txt>
          </Row>
          {t.memo ? (
            <Row gap={S.md} align="flex-start">
              <Txt t="sm" color={C.mute} style={st.k}>
                메모
              </Txt>
              <Txt t="body" style={{ flex: 1 }}>
                {t.memo}
              </Txt>
            </Row>
          ) : null}
        </Card>
        <ErrorText message={setStatus.error instanceof ApiError ? setStatus.error.message : null} />
      </View>

      <Section title={`기록 ${recs.length}`} right={<Txt t="sm">확인 {confirmed}</Txt>}>
        {records.isLoading ? <Loading /> : null}
        {recs.length === 0 && !records.isLoading ? <Empty icon="create-outline" title="아직 기록이 없어요" body="한 일을 남기면 팀원이 확인해 줘요." /> : null}
        {recs.map((r) => {
          const rs = RECORD_STATUS[r.status];
          const by = r.confirmations.filter((c) => c.valid && c.decision === 'CONFIRM').map((c) => c.reviewer_name);
          return (
            <Card key={r.id}>
              <Row gap={S.sm}>
                <Badge label={RECORD_TYPE_LABEL[r.type]} tone="brand" />
                <Badge label={rs.label} tone={rs.tone} icon={r.status === 'CONFIRMED' ? 'checkmark' : undefined} />
                <View style={{ flex: 1 }} />
                <Txt t="tiny">{ago(r.created_at)}</Txt>
              </Row>
              <Txt t="tiny">{r.author_name}</Txt>
              {r.note ? <Txt t="body">{r.note}</Txt> : null}
              {r.link_url ? <Chip icon="link" label={r.link_url.replace(/^https?:\/\//, '').slice(0, 34)} onPress={() => Linking.openURL(r.link_url!)} /> : null}
              {r.file_key ? <AttachmentChip fileKey={r.file_key} authorName={r.author_name} /> : null}
              {by.length ? <Txt t="tiny">{by.join(', ')}님이 확인했어요</Txt> : null}
              {toConfirm.has(r.id) ? <ConfirmActions record={r} teamId={teamId} /> : null}
            </Card>
          );
        })}
      </Section>

      {t.events.length ? (
        <Section title="변경 이력">
          <View style={{ gap: 10 }}>
            {t.events.map((e, i) => (
              <Row key={i} gap={10}>
                <View style={st.dot} />
                <Txt t="sm" style={{ flex: 1 }}>
                  {describe(e, team.data)}
                </Txt>
                <Txt t="tiny">{shortDate(e.created_at)}</Txt>
              </Row>
            ))}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}

function describe(e: TaskEvent, team?: Team) {
  const who = team?.members.find((m) => m.member_id === e.actor_member_id)?.display_name ?? '팀원';
  if (e.kind === 'DUE_CHANGED') return `${who}님이 마감을 ${shortDate(String(e.before.due_at))} → ${shortDate(String(e.after.due_at))}로 바꿈`;
  if (e.kind === 'ASSIGNEES_CHANGED') return `${who}님이 담당자를 바꿈`;
  if (e.kind === 'STATUS_CHANGED') {
    const to = TASK_STATUS[String(e.after.status) as keyof typeof TASK_STATUS]?.label ?? String(e.after.status);
    return `${who}님이 상태를 ‘${to}’(으)로 바꿈`;
  }
  return `${who}님이 할 일을 고침`;
}

const st = StyleSheet.create({
  k: { width: 44 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9C1C5' },
});
