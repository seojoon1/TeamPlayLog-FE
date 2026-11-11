import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, Badge, Button, Card, Empty, ErrorText, Field, ListRow, Loading, Notice, Row, Screen, Section, Txt } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { shortDate } from '@/lib/format';
import { useAgreement, useMyMember, useTeam, useTeamId } from '@/lib/hooks';
import type { Agreement } from '@/lib/types';
import { C, S } from '@/theme';

/** S-04 역할 약속 */
export default function AgreementScreen() {
  const teamId = useTeamId();
  const qc = useQueryClient();
  const q = useAgreement(teamId);
  const team = useTeam(teamId);
  const me = useMyMember(teamId);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const ag = q.data?.current ?? null;
  const leader = me?.role === 'LEADER';

  const refresh = (x: Agreement) => {
    qc.invalidateQueries({ queryKey: ['agreement', teamId] });
    qc.invalidateQueries({ queryKey: ['board', teamId] });
    qc.invalidateQueries({ queryKey: ['team', teamId] });
    return x;
  };
  const consent = useMutation({
    mutationFn: (body: object) => api<Agreement>(`/teams/${teamId}/agreement/consent`, { method: 'POST', body }),
    onSuccess: (x) => {
      refresh(x);
      setAsking(false);
      setReason('');
    },
  });
  const submit = useMutation({ mutationFn: () => api<Agreement>(`/teams/${teamId}/agreement/submit`, { method: 'POST' }), onSuccess: refresh });
  const err = [consent.error, submit.error].find((e) => e instanceof ApiError) as ApiError | undefined;

  if (q.isLoading) {
    return (
      <Screen title="역할 약속">
        <Loading />
      </Screen>
    );
  }
  if (!ag) {
    return (
      <Screen title="역할 약속" footer={leader ? <Button grow icon="create-outline" label="약속 만들기" onPress={() => router.push(`/team/${teamId}/agreement-edit`)} /> : undefined}>
        <Empty
          icon="people-outline"
          title="아직 역할 약속이 없어요"
          body={leader ? '누가 무엇을 맡을지, 팀 규칙과 할 일을 정해 팀원에게 동의를 받아 보세요.' : '조장이 약속을 만들면 여기서 확인하고 동의할 수 있어요.'}
        />
      </Screen>
    );
  }

  const name = (id: string) => team.data?.members.find((m) => m.member_id === id)?.display_name ?? '팀원';
  const agreed = ag.consents.filter((c) => c.agreed === true).length;
  const total = ag.consents.length;
  const mine = ag.consents.find((c) => c.member_id === me?.member_id);
  const rules = [`연락은 ${ag.reply_hours}시간 안에 답장`, ...(ag.meeting_rule ? [ag.meeting_rule] : []), ...ag.free_rules];
  const ruleIcons = ['chatbox-outline', 'people-outline', 'flag-outline'] as const;

  let footer;
  if (leader && ag.status === 'DRAFT') {
    footer = (
      <>
        <Button kind="ghost" label="고치기" onPress={() => router.push(`/team/${teamId}/agreement-edit`)} />
        <Button grow icon="paper-plane-outline" label="동의 요청 보내기" loading={submit.isPending} onPress={() => submit.mutate()} />
      </>
    );
  } else if (ag.status === 'PENDING' && mine && mine.agreed !== true) {
    footer = asking ? (
      <>
        <Button kind="ghost" label="취소" onPress={() => setAsking(false)} />
        <Button grow kind="danger" label="수정 요청 보내기" disabled={!reason.trim()} loading={consent.isPending} onPress={() => consent.mutate({ agreed: false, change_request: reason.trim() })} />
      </>
    ) : (
      <>
        <Button kind="ghost" label="수정 요청" onPress={() => setAsking(true)} />
        <Button grow icon="checkmark" label="약속에 동의하기" loading={consent.isPending} onPress={() => consent.mutate({ agreed: true })} />
      </>
    );
  } else if (leader) {
    footer = <Button grow kind="ghost" icon="create-outline" label="약속 고치기 (새 버전)" onPress={() => router.push(`/team/${teamId}/agreement-edit`)} />;
  }

  return (
    <Screen title="역할 약속" right={<Txt t="sm">버전 {ag.version}</Txt>} footer={footer}>
      {ag.status === 'CONFIRMED' ? (
        <Notice tone="ok" icon="checkmark-circle-outline">
          {ag.confirmed_at ? `${shortDate(ag.confirmed_at)}에 ` : ''}모두 동의해 확정된 약속이에요. 약속한 할 일은 팀 보드에 있어요.
        </Notice>
      ) : ag.status === 'PENDING' ? (
        <Notice tone="warn">
          {total}명 중 {agreed}명이 동의했어요. 모두 동의하면 약속한 할 일이 보드에 생깁니다.
        </Notice>
      ) : (
        <Notice icon="create-outline">{leader ? '아직 초안이에요. 다 쓰면 동의 요청을 보내 주세요.' : '조장이 약속을 작성하고 있어요.'}</Notice>
      )}

      {asking ? <Field label="무엇을 바꾸면 좋을까요?" value={reason} onChangeText={setReason} maxLength={200} placeholder="예: 대본 마감을 하루 늦춰 주세요" /> : null}
      <ErrorText message={err?.message} />

      <Section title="누가 무엇을 맡나요">
        <Card style={{ paddingVertical: 4, gap: 0 }}>
          {ag.consents.map((c, i) => {
            const role = ag.roles.find((r) => r.member_id === c.member_id)?.role_name;
            return (
              <ListRow key={c.member_id} last={i === ag.consents.length - 1}>
                <Avatar name={c.display_name} seed={c.member_id} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt t="b">{c.display_name}</Txt>
                  <Txt t="sm">{role ?? '역할 미정'}</Txt>
                  {c.change_request ? <Txt t="tiny" color={C.danger}>수정 요청: {c.change_request}</Txt> : null}
                </View>
                {ag.status === 'DRAFT' ? null : c.agreed === true ? (
                  <Badge label="동의함" tone="ok" icon="checkmark" />
                ) : c.agreed === false ? (
                  <Badge label="수정 요청" tone="danger" />
                ) : (
                  <Badge label="응답 대기" tone="muted" icon="time-outline" />
                )}
              </ListRow>
            );
          })}
        </Card>
      </Section>

      <Section title="팀 규칙">
        <Card style={{ gap: 10 }}>
          {rules.map((r, i) => (
            <Row key={i} gap={10}>
              <Ionicons name={ruleIcons[Math.min(i, 2)]} size={18} color={C.primary} />
              <Txt t="body" style={{ flex: 1 }}>
                {r}
              </Txt>
            </Row>
          ))}
        </Card>
      </Section>

      {ag.tasks.length ? (
        <Section title="약속한 할 일">
          <Card style={{ paddingVertical: 4, gap: 0 }}>
            {ag.tasks.map((t, i) => (
              <ListRow key={i} last={i === ag.tasks.length - 1}>
                <Txt t="b" style={{ flex: 1 }}>
                  {t.title}
                </Txt>
                <Txt t="sm">
                  {name(t.assignee_member_id)} · {shortDate(t.due_at)}
                </Txt>
              </ListRow>
            ))}
          </Card>
        </Section>
      ) : null}
      <View style={{ height: S.sm }} />
    </Screen>
  );
}
