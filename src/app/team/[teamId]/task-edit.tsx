import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { DateField } from '@/components/date-field';
import { Button, Chip, ErrorText, Field, Loading, Notice, Row, Screen, Section, Txt } from '@/components/ui';
import { goBack } from '@/lib/nav';
import { api, ApiError } from '@/lib/api';
import { useMyMember, useTask, useTeam, useTeamId } from '@/lib/hooks';
import type { Member, Task, TaskDetail } from '@/lib/types';
import { S } from '@/theme';

/** 할 일 추가(taskId 없음) · 고치기(taskId 있음) */
export default function TaskEdit() {
  const teamId = useTeamId();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const team = useTeam(teamId);
  const task = useTask(taskId ?? '');
  const me = useMyMember(teamId);
  if (!team.data || !me || (taskId && !task.data)) {
    return (
      <Screen title={taskId ? '할 일 고치기' : '할 일 추가'}>
        <Loading />
      </Screen>
    );
  }
  return <Editor teamId={teamId} members={team.data.members} me={me} task={task.data ?? null} />;
}

function Editor({ teamId, members, me, task }: { teamId: string; members: Member[]; me: Member; task: TaskDetail | null }) {
  const qc = useQueryClient();
  const leader = me.role === 'LEADER';
  const [title, setTitle] = useState(task?.title ?? '');
  const [due, setDue] = useState<string | null>(task?.due_at ?? null);
  const [memo, setMemo] = useState(task?.memo ?? '');
  const [everyone, setEveryone] = useState(task?.for_everyone ?? false);
  const [assignees, setAssignees] = useState<string[]>(task ? task.assignees.map((a) => a.member_id) : [me.member_id]);

  const toggle = (id: string) => {
    setEveryone(false);
    setAssignees((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  };
  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = { title: title.trim(), due_at: due, memo: memo.trim() || (task ? '' : undefined) };
      if (leader) {
        body.for_everyone = everyone;
        body.assignee_member_ids = everyone ? [] : assignees;
      }
      return task
        ? api<Task>(`/tasks/${task.id}`, { method: 'PATCH', body })
        : api<Task>(`/teams/${teamId}/tasks`, { method: 'POST', body: { ...body, assignee_member_ids: leader ? body.assignee_member_ids : [me.member_id] } });
    },
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ['board', teamId] });
      qc.invalidateQueries({ queryKey: ['team', teamId] });
      qc.invalidateQueries({ queryKey: ['task', t.id] });
      goBack(`/team/${teamId}`);
    },
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const remove = useMutation({
    mutationFn: () => api(`/tasks/${task!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board', teamId] });
      qc.invalidateQueries({ queryKey: ['team', teamId] });
      // 지운 할 일의 상세 화면이 뒤에 남지 않도록 쌓인 화면을 닫으며 보드로 돌아간다
      router.dismissTo(`/team/${teamId}`);
    },
  });
  const ok = title.trim() && due && (!leader || everyone || assignees.length > 0);

  return (
    <Screen
      title={task ? '할 일 고치기' : '할 일 추가'}
      gap={20}
      footer={<Button grow icon="checkmark" label={task ? '저장' : '할 일 추가'} disabled={!ok} loading={save.isPending} onPress={() => save.mutate()} />}>
      <Field label="할 일" value={title} onChangeText={setTitle} maxLength={40} placeholder="예: 발표 대본 작성" />
      <DateField label="마감" value={due} onChange={setDue} days={45} />
      {leader ? (
        <Section title="담당">
          <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
            <Chip
              label="전원"
              selected={everyone}
              onPress={() => {
                setEveryone(!everyone);
                setAssignees([]);
              }}
            />
            {members.map((m) => (
              <Chip key={m.member_id} label={m.display_name} selected={!everyone && assignees.includes(m.member_id)} onPress={() => toggle(m.member_id)} />
            ))}
          </Row>
        </Section>
      ) : (
        <Notice icon="person-outline">{task ? '담당자는 조장만 바꿀 수 있어요.' : '팀원은 본인이 맡을 할 일만 추가할 수 있어요. 다른 사람의 할 일은 조장에게 요청해 주세요.'}</Notice>
      )}
      <Field label="메모 (선택)" value={memo} onChangeText={setMemo} maxLength={500} placeholder="예: 논문·기사 링크를 표로 정리" multiline />
      {task && task.due_at !== due ? (
        <Txt t="tiny">마감을 바꾸면 할 일 상세의 변경 이력에 남아요.</Txt>
      ) : null}
      <ErrorText message={[save.error, remove.error].find((e) => e instanceof ApiError)?.message ?? null} />
      {task ? (
        <Button
          kind="danger"
          icon="trash-outline"
          label={confirmDelete ? '한 번 더 누르면 지워져요' : '할 일 지우기'}
          loading={remove.isPending}
          onPress={() => (confirmDelete ? remove.mutate() : setConfirmDelete(true))}
        />
      ) : null}
    </Screen>
  );
}
