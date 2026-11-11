import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Avatar, Button, Card, Chip, ErrorText, Field, Loading, Row, Screen, Section, Txt } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAgreement, useTeam, useTeamId } from '@/lib/hooks';
import type { Agreement, Member } from '@/lib/types';
import { C, S } from '@/theme';

type TaskDraft = { key: number; title: string; assignee: string | null; due: string | null };

/** 역할 약속 만들기·고치기 (조장). 기존 약속이 있으면 그 내용을 채운 채로 연다. */
export default function AgreementEdit() {
  const teamId = useTeamId();
  const team = useTeam(teamId);
  const q = useAgreement(teamId);
  if (q.isLoading || team.isLoading) {
    return (
      <Screen title="역할 약속 쓰기">
        <Loading />
      </Screen>
    );
  }
  return <Editor teamId={teamId} members={team.data?.members ?? []} initial={q.data?.current ?? null} />;
}

function Editor({ teamId, members, initial }: { teamId: string; members: Member[]; initial: Agreement | null }) {
  const qc = useQueryClient();
  const [roles, setRoles] = useState<Record<string, string>>(() => Object.fromEntries((initial?.roles ?? []).map((r) => [r.member_id, r.role_name])));
  const [tasks, setTasks] = useState<TaskDraft[]>(() =>
    (initial?.tasks ?? []).map((t, i) => ({ key: i, title: t.title, assignee: t.assignee_member_id, due: t.due_at })),
  );
  const [reply, setReply] = useState(initial?.reply_hours ?? 24);
  const [meeting, setMeeting] = useState(initial?.meeting_rule ?? '');
  const [rules, setRules] = useState<string[]>(initial?.free_rules.length ? initial.free_rules : ['']);

  const body = () => ({
    roles: members.filter((m) => roles[m.member_id]?.trim()).map((m) => ({ member_id: m.member_id, role_name: roles[m.member_id].trim() })),
    tasks: tasks.filter((t) => t.title.trim() && t.assignee && t.due).map((t) => ({ assignee_member_id: t.assignee, title: t.title.trim(), due_at: t.due })),
    reply_hours: reply,
    meeting_rule: meeting.trim() || null,
    free_rules: rules.map((r) => r.trim()).filter(Boolean),
  });
  const save = useMutation({
    mutationFn: async (andSubmit: boolean) => {
      const ag = await api<Agreement>(`/teams/${teamId}/agreement`, { method: 'PUT', body: body() });
      return andSubmit ? api<Agreement>(`/teams/${teamId}/agreement/submit`, { method: 'POST' }) : ag;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreement', teamId] });
      qc.invalidateQueries({ queryKey: ['board', teamId] });
      router.back();
    },
  });
  const hasRole = Object.values(roles).some((r) => r.trim());
  const incomplete = tasks.some((t) => t.title.trim() && (!t.assignee || !t.due));
  const update = (key: number, patch: Partial<TaskDraft>) => setTasks((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  return (
    <Screen
      title="역할 약속 쓰기"
      gap={20}
      footer={
        <>
          <Button kind="ghost" label="저장만" disabled={!hasRole} loading={save.isPending && save.variables === false} onPress={() => save.mutate(false)} />
          <Button grow icon="paper-plane-outline" label="저장하고 동의 요청" disabled={!hasRole} loading={save.isPending && save.variables === true} onPress={() => save.mutate(true)} />
        </>
      }>
      <Section title="누가 무엇을 맡나요">
        <Card style={{ gap: S.md }}>
          {members.map((m) => (
            <Row key={m.member_id} gap={S.md}>
              <Avatar name={m.display_name} seed={m.member_id} />
              <Txt t="b" style={{ width: 56 }} numberOfLines={1}>
                {m.display_name}
              </Txt>
              <View style={{ flex: 1 }}>
                <Field value={roles[m.member_id] ?? ''} onChangeText={(v) => setRoles({ ...roles, [m.member_id]: v })} maxLength={30} placeholder="예: 자료 조사" />
              </View>
            </Row>
          ))}
        </Card>
      </Section>

      <Section title="약속한 할 일" right={<Txt t="tiny">확정되면 팀 보드에 생겨요</Txt>}>
        {tasks.map((t) => (
          <Card key={t.key} style={{ gap: S.md }}>
            <Row gap={S.sm}>
              <View style={{ flex: 1 }}>
                <Field value={t.title} onChangeText={(v) => update(t.key, { title: v })} maxLength={40} placeholder="할 일 (예: 발표 대본 작성)" />
              </View>
              <Pressable role="button" aria-label="할 일 빼기" onPress={() => setTasks(tasks.filter((x) => x.key !== t.key))} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={C.mute} />
              </Pressable>
            </Row>
            <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
              {members.map((m) => (
                <Chip key={m.member_id} label={m.display_name} selected={t.assignee === m.member_id} onPress={() => update(t.key, { assignee: m.member_id })} />
              ))}
            </Row>
            <DateField value={t.due} onChange={(v) => update(t.key, { due: v })} />
          </Card>
        ))}
        <Button kind="secondary" icon="add" label="할 일 추가" onPress={() => setTasks([...tasks, { key: Date.now(), title: '', assignee: null, due: null }])} />
        {incomplete ? <Txt t="tiny" color={C.warn}>담당자와 마감을 고르지 않은 할 일은 저장되지 않아요.</Txt> : null}
      </Section>

      <Section title="팀 규칙">
        <Txt t="label">연락 답장 기준</Txt>
        <Row gap={S.sm}>
          {[6, 12, 24, 48].map((h) => (
            <Chip key={h} label={`${h}시간`} selected={reply === h} onPress={() => setReply(h)} />
          ))}
        </Row>
        <Field label="회의" value={meeting} onChangeText={setMeeting} maxLength={50} placeholder="예: 회의 주 1회 (수요일)" />
        <Txt t="label">그 밖의 규칙 (3개까지)</Txt>
        {rules.map((r, i) => (
          <Field key={i} value={r} onChangeText={(v) => setRules(rules.map((x, j) => (j === i ? v : x)))} maxLength={60} placeholder="예: 늦을 것 같으면 하루 전에 알리기" />
        ))}
        {rules.length < 3 ? <Button small kind="ghost" icon="add" label="규칙 추가" onPress={() => setRules([...rules, ''])} /> : null}
      </Section>
      <ErrorText message={save.error instanceof ApiError ? save.error.message : null} />
    </Screen>
  );
}
