import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar, Card, Empty, ListRow, Loading, TextLink, Txt, type IconName } from '@/components/ui';
import { api } from '@/lib/api';
import { ago, dateTime, dayDiff } from '@/lib/format';
import { useNotifications, useTeamId } from '@/lib/hooks';
import { leaveTeamScreens } from '@/lib/nav';
import type { AppNotification, NotificationKind } from '@/lib/types';
import { C, MAX_WIDTH, S } from '@/theme';

const KIND: Record<NotificationKind, { icon: IconName; bg: string; fg: string }> = {
  DUE_SOON: { icon: 'time-outline', bg: C.warn50, fg: C.warn },
  OVERDUE: { icon: 'alert-circle-outline', bg: C.danger50, fg: C.danger },
  CONFIRM_REQUEST: { icon: 'checkmark-done', bg: C.primary50, fg: C.primary },
  RECORD_REJECTED: { icon: 'hand-left-outline', bg: C.danger50, fg: C.danger },
  TASK_ASSIGNED: { icon: 'person-outline', bg: C.info50, fg: C.info },
  AGREEMENT_CONSENT: { icon: 'people-outline', bg: C.info50, fg: C.info },
  MUTUAL_CONFIRM_WARNING: { icon: 'alert-circle-outline', bg: C.warn50, fg: C.warn },
  REPORT_VIEW_REQUEST: { icon: 'document-text-outline', bg: C.primary50, fg: C.primary },
};

/** S-09 알림 (이 팀 알림만) */
export default function AlertsScreen() {
  const teamId = useTeamId();
  const qc = useQueryClient();
  const q = useNotifications();
  const items = (q.data?.items ?? []).filter((n) => !n.team_id || n.team_id === teamId);
  const groups: [string, AppNotification[]][] = [
    // 안 읽은 알림을 맨 위에 따로 모으고, 읽은 알림은 날짜로 나눈다
    ['새 알림', items.filter((n) => !n.read_at)],
    ['오늘', items.filter((n) => n.read_at && dayDiff(n.created_at) === 0)],
    ['어제', items.filter((n) => n.read_at && dayDiff(n.created_at) === 1)],
    ['이전', items.filter((n) => n.read_at && dayDiff(n.created_at) > 1)],
  ];

  const read = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api(`/notifications/${id}/read`, { method: 'PATCH' }))),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  function open(n: AppNotification) {
    if (!n.read_at) read.mutate([n.id]);
    const p = n.payload;
    const tid = p.team_id ?? n.team_id ?? teamId;
    if (p.screen === 'agreement') router.push(`/team/${tid}/agreement`);
    else if (p.screen === 'task' && p.task_id) router.push(`/team/${tid}/task/${p.task_id}`);
    else if (p.screen === 'record_new') router.push({ pathname: '/team/[teamId]/record', params: p.task_id ? { teamId: tid, taskId: p.task_id } : { teamId: tid } });
    else if (p.screen === 'report') router.push(`/team/${tid}/report`);
    else if (n.kind === 'CONFIRM_REQUEST' || p.screen === 'inbox') router.push(`/team/${tid}/inbox`);
    else router.push(`/team/${tid}`);
  }

  const unread = items.filter((n) => !n.read_at).map((n) => n.id);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <AppBar title="알림" onBack={leaveTeamScreens} right={unread.length ? <TextLink label="모두 읽음" onPress={() => read.mutate(unread)} /> : undefined} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={C.primary} />}>
        <View style={st.inner}>
          {q.isLoading ? <Loading /> : null}
          {q.data && items.length === 0 ? <Empty icon="notifications-outline" title="아직 알림이 없어요" /> : null}
          {groups.map(([label, list]) =>
            list.length ? (
              <View key={label} style={{ gap: S.sm }}>
                <Txt t="sec">{label}</Txt>
                <Card style={{ paddingVertical: 4, gap: 0 }}>
                  {list.map((n, i) => {
                    const k = KIND[n.kind];
                    return (
                      <ListRow key={n.id} last={i === list.length - 1} onPress={() => open(n)} align="flex-start">
                        <View style={[st.icon, { backgroundColor: k.bg }]}>
                          <Ionicons name={k.icon} size={18} color={k.fg} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Txt t="b">{n.title}</Txt>
                          <Txt t="sm">{n.body}</Txt>
                          <Txt t="tiny">{dayDiff(n.created_at) === 0 ? ago(n.created_at) : dateTime(n.created_at)}</Txt>
                        </View>
                        {!n.read_at ? <View style={st.dot} /> : null}
                      </ListRow>
                    );
                  })}
                </Card>
              </View>
            ) : null,
          )}
          {items.length ? (
            <Txt t="tiny" style={{ textAlign: 'center', paddingVertical: S.sm }}>
              밤 11시~아침 8시에 생긴 알림은 아침 8시에 모아서 보내요.
            </Txt>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: S.lg, paddingTop: S.xs, paddingBottom: S.xl, gap: S.lg },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 6 },
});
