import { Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttachmentChip, ConfirmActions } from '@/components/record-parts';
import { AppBar, Avatar, Badge, Card, Chip, Empty, KeyboardScreen, Loading, Notice, Row, Txt } from '@/components/ui';
import { ago, RECORD_TYPE_LABEL } from '@/lib/format';
import { useInbox, useTeamId } from '@/lib/hooks';
import { leaveTeamScreens } from '@/lib/nav';
import type { RecordItem } from '@/lib/types';
import { C, MAX_WIDTH, S } from '@/theme';

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
      {r.file_key ? <AttachmentChip fileKey={r.file_key} authorName={r.author_name} /> : null}
      {r.is_late || !r.has_output || r.status !== 'PENDING' ? (
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {r.is_late ? <Badge label="사후 기록" tone="warn" icon="time-outline" /> : null}
          {!r.has_output ? <Badge label="설명만 있음" tone="muted" /> : null}
          {r.status === 'RECHECK' ? <Badge label="수정되어 다시 확인" tone="info" icon="refresh" /> : null}
          {r.status === 'UNCONFIRMED' ? <Badge label="72시간 미확인" tone="muted" /> : null}
        </Row>
      ) : null}
      <ConfirmActions record={r} teamId={teamId} />
    </Card>
  );
}

function short(u: string) {
  const s = u.replace(/^https?:\/\//, '');
  return s.length > 34 ? `${s.slice(0, 33)}…` : s;
}

const st = StyleSheet.create({
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: S.lg, paddingTop: S.xs, paddingBottom: S.xl, gap: S.md },
});
