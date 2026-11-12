import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button, Chip, ErrorText, Field, Notice, Row, Screen, Section, Segment, Txt } from '@/components/ui';
import { goBack } from '@/lib/nav';
import { api, ApiError, uploadFile } from '@/lib/api';
import { isPast, RECORD_TYPE_SHORT } from '@/lib/format';
import { useBoard, useTeamId } from '@/lib/hooks';
import type { RecordItem, RecordType } from '@/lib/types';
import { C, F, R, S } from '@/theme';

type Picked = { uri: string; name: string; mimeType?: string; size?: number };
const TYPES = (Object.keys(RECORD_TYPE_SHORT) as RecordType[]).map((k) => ({ key: k, label: RECORD_TYPE_SHORT[k] }));

/** S-07 기록하기: 할 일 → 유형 → 결과물 → 한 줄 설명 */
export default function NewRecord() {
  const teamId = useTeamId();
  const { taskId: initialTask } = useLocalSearchParams<{ taskId?: string }>();
  const qc = useQueryClient();
  const board = useBoard(teamId, true);
  // undefined = 아직 고르지 않음 → 마감이 가장 가까운 내 할 일을 골라 둔다. null = "할 일 없이 기록"
  const [picked, setPicked] = useState<string | null | undefined>(initialTask ?? undefined);
  const [type, setType] = useState<RecordType>('OUTPUT');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<Picked | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tasks = useMemo(() => (board.data?.tasks ?? []).filter((t) => t.status !== 'DONE' || t.id === initialTask), [board.data, initialTask]);
  const nearest = useMemo(
    () => tasks.filter((t) => t.status !== 'DONE').sort((a, b) => a.due_at.localeCompare(b.due_at))[0],
    [tasks],
  );
  const taskId = picked !== undefined ? picked : (nearest?.id ?? null);
  const selected = tasks.find((t) => t.id === taskId);
  const late = selected ? isPast(selected.due_at) : false;
  const hasSomething = !!(link.trim() || file || note.trim());

  const save = useMutation({
    mutationFn: async () => {
      const file_key = file ? await uploadFile(file) : undefined;
      const raw = link.trim();
      const url = raw ? (/^https?:\/\//.test(raw) ? raw : `https://${raw}`) : undefined;
      return api<RecordItem>(`/teams/${teamId}/records`, {
        method: 'POST',
        body: { task_id: taskId ?? undefined, type, link_url: url, file_key, note: note.trim() || undefined },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board', teamId] });
      qc.invalidateQueries({ queryKey: ['records', teamId] });
      qc.invalidateQueries({ queryKey: ['task'] });
      goBack(`/team/${teamId}`);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '저장하지 못했어요. 다시 시도해 주세요.'),
  });

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if (a.size && a.size > 10 * 1024 * 1024) {
      setError('파일은 10MB까지 올릴 수 있어요. 큰 파일은 링크로 남겨 주세요.');
      return;
    }
    setError(null);
    setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? undefined, size: a.size ?? undefined });
  }

  return (
    <Screen
      title="기록하기"
      right={<Txt t="sm">10초면 돼요</Txt>}
      gap={18}
      footer={<Button label="기록 남기기" icon="checkmark" onPress={() => save.mutate()} loading={save.isPending} disabled={!hasSomething} grow />}>
      <Section title="어떤 일을 했나요?">
        <Row gap={S.sm} style={{ flexWrap: 'wrap' }}>
          {tasks.map((t) => (
            <Chip key={t.id} label={t.title} selected={taskId === t.id} onPress={() => setPicked(taskId === t.id ? null : t.id)} />
          ))}
          <Chip label="할 일 없이 기록" selected={taskId === null} onPress={() => setPicked(null)} />
        </Row>
        {late ? (
          <Notice tone="warn" icon="time-outline">
            마감이 지난 할 일이라 ‘사후 기록’으로 표시돼요.
          </Notice>
        ) : null}
      </Section>

      <Section title="기록 유형">
        <Segment options={TYPES} value={type} onChange={setType} />
      </Section>

      <Section title="결과물">
        <Field icon="link" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" placeholder="링크 붙여넣기 (드라이브, 노션, 깃허브)" />
        {file ? (
          <Row gap={S.sm} style={st.file}>
            <Ionicons name="document-attach-outline" size={18} color={C.primary} />
            <Txt t="b" style={{ flex: 1 }} numberOfLines={1}>
              {file.name}
            </Txt>
            <Button small kind="ghost" label="빼기" onPress={() => setFile(null)} />
          </Row>
        ) : (
          <Pressable role="button" onPress={pickFile} style={({ pressed }) => [st.attach, pressed && { opacity: 0.8 }]}>
            <Ionicons name="attach" size={18} color={C.primary} />
            <Text style={st.attachText}>파일·사진 첨부</Text>
            <Txt t="tiny">10MB까지</Txt>
          </Pressable>
        )}
      </Section>

      <Section title="한 줄 설명" right={<Txt t="tiny">{note.length}/60</Txt>}>
        <Field value={note} onChangeText={setNote} maxLength={60} placeholder="예: 출처 형식을 APA로 통일" />
      </Section>

      <Notice icon="people-outline">저장하면 다른 팀원에게 확인 요청이 가요. 1명 이상 확인하면 ‘확인됨’이 됩니다.</Notice>
      {!hasSomething ? (
        <Txt t="tiny" style={{ textAlign: 'center' }}>
          링크, 파일, 한 줄 설명 중 하나는 있어야 저장할 수 있어요.
        </Txt>
      ) : null}
      <ErrorText message={error} />
    </Screen>
  );
}

const st = StyleSheet.create({
  attach: {
    height: 52,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.primaryLine,
    backgroundColor: C.primaryWash,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
  },
  attachText: { fontFamily: F.bold, fontSize: 15, lineHeight: 21, color: C.primary },
  file: { padding: S.sm, paddingLeft: S.md, borderRadius: R.md, backgroundColor: C.primary50 },
});
