/** 기록 카드에 들어가는 부품: 첨부 파일 열기, 확인·보류 버튼. 확인함과 할 일 상세가 같이 쓴다. */
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, ErrorText, Field, Row, Txt } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { fileExt, openAttachment } from '@/lib/pdf';
import type { RecordItem, RejectReason } from '@/lib/types';
import { C, R, S } from '@/theme';

/** 첨부 파일 열기. 웹은 새 탭, 휴대폰은 내려받아 공유 창(다른 앱으로 열기)으로 연다. */
export function AttachmentChip({ fileKey, authorName }: { fileKey: string; authorName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ext = fileExt(fileKey).toUpperCase();

  async function open() {
    setBusy(true);
    setError(null);
    try {
      await openAttachment(fileKey, authorName);
    } catch {
      setError('파일을 열지 못했어요. 잠시 뒤 다시 눌러 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 4, alignItems: 'flex-start' }}>
      <Chip icon="attach" label={busy ? '파일 여는 중…' : `첨부 파일 열기${ext ? ` · ${ext}` : ''}`} onPress={busy ? undefined : open} />
      <ErrorText message={error} />
    </View>
  );
}

const REASONS: { key: RejectReason; label: string }[] = [
  { key: 'NO_OUTPUT', label: '결과물 없음' },
  { key: 'MISMATCH', label: '내용과 다름' },
  { key: 'OTHER', label: '기타' },
];

/** 확인을 누른 뒤 되돌릴 수 있는 시간 */
const UNDO_MS = 4000;

/** 다른 팀원의 기록에 "확인했어요" / "보류" 하기 */
export function ConfirmActions({ record: r, teamId }: { record: RecordItem; teamId: string }) {
  const qc = useQueryClient();
  const [holding, setHolding] = useState(false);
  const [reason, setReason] = useState<RejectReason | null>(null);
  const [text, setText] = useState('');
  const decide = useMutation({
    mutationFn: (body: object) => api<RecordItem>(`/records/${r.id}/confirmations`, { method: 'POST', body }),
    onSuccess: () => refresh(qc, teamId),
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
      void api(`/records/${r.id}/confirmations`, { method: 'POST', body: { decision: 'CONFIRM' } }).then(() => refresh(qc, teamId));
    };
  }, [qc, r.id, teamId]);

  if (holding) {
    return (
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
    );
  }
  if (waiting) {
    return (
      <Row gap={S.sm} style={st.undo}>
        <Ionicons name="checkmark-circle" size={18} color={C.ok} />
        <Txt t="sm" color={C.text} style={{ flex: 1 }}>
          확인으로 처리할게요
        </Txt>
        <Button small kind="ghost" icon="arrow-undo" label="되돌리기" onPress={undo} />
      </Row>
    );
  }
  return (
    <>
      <ErrorText message={err} />
      <Row gap={S.sm}>
        <Button small kind="ghost" icon="hand-left-outline" label="보류" onPress={() => setHolding(true)} />
        <Button small grow icon="checkmark" label="확인했어요" loading={decide.isPending} onPress={confirmSoon} />
      </Row>
    </>
  );
}

function refresh(qc: ReturnType<typeof useQueryClient>, teamId: string) {
  qc.invalidateQueries({ queryKey: ['inbox', teamId] });
  qc.invalidateQueries({ queryKey: ['board', teamId] });
  qc.invalidateQueries({ queryKey: ['records', teamId] });
}

const st = StyleSheet.create({
  undo: { backgroundColor: C.ok50, borderRadius: R.md, paddingLeft: S.md, paddingVertical: 4 },
  hold: { gap: 10, borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: S.md },
});
