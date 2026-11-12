import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar, Avatar, Badge, Button, Card, Chip, Empty, ErrorText, Field, KeyboardScreen, Loading, Notice, Row, Txt } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { ago, RECORD_TYPE_LABEL } from '@/lib/format';
import { useInbox, useTeamId } from '@/lib/hooks';
import { leaveTeamScreens } from '@/lib/nav';
import type { RecordItem, RejectReason } from '@/lib/types';
import { C, MAX_WIDTH, R, S } from '@/theme';

const REASONS: { key: RejectReason; label: string }[] = [
  { key: 'NO_OUTPUT', label: '결과물 없음' },
  { key: 'MISMATCH', label: '내용과 다름' },
  { key: 'OTHER', label: '기타' },
];

/** 확인을 누른 뒤 되돌릴 수 있는 시간 */
const UNDO_MS = 4000;

/** S-08 확인함 */
export default function InboxScreen() {
  const teamId = useTeamId();
  const inbox = useInbox(teamId);
  const n = inbox.data?.length ?? 0;

  return (
    <KeyboardScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
        <AppBar title="확인함" onBack={leaveTeamScreens} right={inbox.data ? <Txt t="sm">{n}건</Txt> : undefined} />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={inbox.isRefetching} onRefresh={() => void inbox.refetch()} tintColor={C.primary} />}>
          <View style={st.inner}>
            <Notice>작성자가 아닌 팀원 1명 이상이 확인하면 ‘확인됨’. 확인된 기록만 기여 리포트의 근거가 돼요.</Notice>
            {inbox.isLoading ? <Loading /> : null}
            {inbox.data?.length === 0 ? <Empty icon="checkmark-circle-outline" title="확인할 기록이 없어요" body="팀원이 기록을 남기면 여기에 모여요." /> : null}
            {inbox.data?.map((r) => <InboxCard key={r.id} record={r} teamId={teamId} />)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardScreen>
  );
}

function InboxCard({ record: r, teamId }: { record: RecordItem; teamId: string }) {
  const qc = useQueryClient();
  const [holding, setHolding] = useState(false);
  const [reason, setReason] = useState<RejectReason | null>(null);
  const [text, setText] = useState('');
  const decide = useMutation({
    mutationFn: (body: object) => api<RecordItem>(`/records/${r.id}/confirmations`, { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox', teamId] });
      qc.invalidateQueries({ queryKey: ['board', teamId] });
      qc.invalidateQueries({ queryKey: ['records', teamId] });
    },
  });
  const err = decide.error instanceof ApiError ? decide.error.message : null;

  // "확인했어요"는 바로 보내지 않고 몇 초 기다린다. 그동안 되돌리기를 누르면 아무것도 보내지 않는다.
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendConfirm = decide.mutate;
  function confirmSoon() {
    setWaiting(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setWaiting(false);
      sendConfirm({ decision: 'CONFIRM' });
    }, UNDO_MS);
  }
  function undo() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setWaiting(false);
  }
  // 기다리는 중에 화면을 떠나면 되돌리지 않은 것으로 보고 바로 보낸다
  useEffect(() => {
    const t = timer;
    return () => {
      if (!t.current) return;
      clearTimeout(t.current);
      t.current = null;
      void api(`/records/${r.id}/confirmations`, { method: 'POST', body: { decision: 'CONFIRM' } }).then(() => {
        qc.invalidateQueries({ queryKey: ['inbox', teamId] });
        qc.invalidateQueries({ queryKey: ['board', teamId] });
        qc.invalidateQueries({ queryKey: ['records', teamId] });
      });
    };
  }, [qc, r.id, teamId]);

  return (
    <Card style={{ gap: 10 }}>
      <Row gap={10}>
        <Avatar name={r.author_name} seed={r.author_id} />
        <View style={{ flex: 1, gap: 1 }}>
          <Txt t="b">{r.author_name}</Txt>
          <Txt t="tiny" numberOfLines={1}>
            {ago(r.created_at)}
            {r.task_title ? ` · ${r.task_title}` : ''}
          </Txt>
        </View>
        <Badge label={RECORD_TYPE_LABEL[r.type]} tone="brand" />
      </Row>
      {r.note ? <Txt t="body">{r.note}</Txt> : null}
      {r.link_url ? <Chip icon="link" label={short(r.link_url)} onPress={() => Linking.openURL(r.link_url!)} /> : null}
      {r.file_key || r.is_late || !r.has_output || r.status !== 'PENDING' ? (
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {r.file_key ? <Badge label="첨부 파일" tone="info" icon="attach" /> : null}
          {r.is_late ? <Badge label="사후 기록" tone="warn" icon="time-outline" /> : null}
          {!r.has_output ? <Badge label="설명만 있음" tone="muted" /> : null}
          {r.status === 'RECHECK' ? <Badge label="수정되어 다시 확인" tone="info" icon="refresh" /> : null}
          {r.status === 'UNCONFIRMED' ? <Badge label="72시간 미확인" tone="muted" /> : null}
        </Row>
      ) : null}

      {holding ? (
        <View style={st.hold}>
          <Txt t="sm">보류하는 이유를 알려 주세요. 작성자에게 전달돼요.</Txt>
          <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
            {REASONS.map((x) => (
              <Chip key={x.key} label={x.label} selected={reason === x.key} onPress={() => setReason(x.key)} />
            ))}
          </Row>
          <Field value={text} onChangeText={setText} maxLength={100} placeholder="한 줄 사유 (예: 대본 파일이 아직 없어요)" />
          <ErrorText message={err} />
          <Row gap={S.sm}>
            <Button small kind="ghost" label="취소" onPress={() => setHolding(false)} />
            <Button
              small
              grow
              kind="danger"
              label="보류하기"
              loading={decide.isPending}
              disabled={!reason || !text.trim()}
              onPress={() => decide.mutate({ decision: 'REJECT', reason_type: reason, reason_text: text.trim() })}
            />
          </Row>
        </View>
      ) : waiting ? (
        <Row gap={S.sm} style={st.undo}>
          <Ionicons name="checkmark-circle" size={18} color={C.ok} />
          <Txt t="sm" color={C.text} style={{ flex: 1 }}>
            확인으로 처리할게요
          </Txt>
          <Button small kind="ghost" icon="arrow-undo" label="되돌리기" onPress={undo} />
        </Row>
      ) : (
        <>
          <ErrorText message={err} />
          <Row gap={S.sm}>
            <Button small kind="ghost" icon="hand-left-outline" label="보류" onPress={() => setHolding(true)} />
            <Button small grow icon="checkmark" label="확인했어요" loading={decide.isPending} onPress={confirmSoon} />
          </Row>
        </>
      )}
    </Card>
  );
}

function short(u: string) {
  const s = u.replace(/^https?:\/\//, '');
  return s.length > 34 ? `${s.slice(0, 33)}…` : s;
}

const st = StyleSheet.create({
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: S.lg, paddingTop: S.xs, paddingBottom: S.xl, gap: S.md },
  undo: { backgroundColor: C.ok50, borderRadius: R.md, paddingLeft: S.md, paddingVertical: 4 },
  hold: { gap: 10, borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: S.md },
});
