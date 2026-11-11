import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/components/ui';
import { useInbox, useNotifications, useTeamId } from '@/lib/hooks';
import { C, F } from '@/theme';

const TABS: Record<string, { label: string; icon: IconName; iconOn: IconName }> = {
  index: { label: '팀 보드', icon: 'grid-outline', iconOn: 'grid' },
  inbox: { label: '확인함', icon: 'checkmark-done-outline', iconOn: 'checkmark-done' },
  alerts: { label: '알림', icon: 'notifications-outline', iconOn: 'notifications' },
  more: { label: '팀', icon: 'people-outline', iconOn: 'people' },
};

type BarProps = { state: { index: number; routes: { key: string; name: string }[] }; navigateToTab: (routeKey: string) => void };

/** 피그마 하단 탭과 같은 모양: 높이 68 + 하단 안전 영역, 숫자 배지 */
function TabBar({ state, navigateToTab }: BarProps) {
  const insets = useSafeAreaInsets();
  const teamId = useTeamId();
  const inbox = useInbox(teamId);
  const notis = useNotifications();
  const unread = (notis.data?.items ?? []).filter((n) => !n.read_at && (!n.team_id || n.team_id === teamId)).length;
  const badges: Record<string, number> = { inbox: inbox.data?.length ?? 0, alerts: unread };

  return (
    <View style={[st.bar, { paddingBottom: 10 + insets.bottom }]}>
      {state.routes.map((r, i) => {
        const tab = TABS[r.name];
        if (!tab) return null;
        const on = state.index === i;
        const n = badges[r.name] ?? 0;
        return (
          <Pressable key={r.key} role="tab" aria-selected={on} aria-label={tab.label} onPress={() => navigateToTab(r.key)} style={st.item}>
            <View>
              <Ionicons name={on ? tab.iconOn : tab.icon} size={24} color={on ? C.primary : C.mute} />
              {n > 0 ? (
                <View style={st.badge}>
                  <Text style={st.badgeText}>{n > 99 ? '99+' : n}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[st.label, on && { color: C.primary, fontFamily: F.bold }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TeamTabs() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontFamily: F.bold, fontSize: 12, lineHeight: 16, color: C.mute },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: F.bold, fontSize: 10, lineHeight: 13, color: C.white },
});
