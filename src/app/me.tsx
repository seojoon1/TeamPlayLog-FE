import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Avatar, Card, ListRow, Loading, Screen, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useMe } from '@/lib/hooks';
import { C, S } from '@/theme';

/** 내 정보 (팀 목록의 내 아바타를 누르면 열린다). 팀이 없어도 로그아웃할 수 있게 한다. */
export default function MeScreen() {
  const me = useMe();
  const { logout } = useAuth();

  return (
    <Screen title="내 정보">
      {me.data ? (
        <View style={{ alignItems: 'center', gap: S.sm, paddingVertical: S.lg }}>
          <Avatar name={me.data.display_name} seed={me.data.id} size={72} />
          <Txt t="title">{me.data.display_name}</Txt>
          <Txt t="sm">{me.data.email}</Txt>
          {me.data.department ? <Txt t="sm">{me.data.department}</Txt> : null}
        </View>
      ) : (
        <Loading />
      )}
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        <ListRow onPress={logout} last>
          <Ionicons name="log-out-outline" size={20} color={C.primary} />
          <Txt t="b" color={C.text} style={{ flex: 1 }}>
            로그아웃
          </Txt>
          <Ionicons name="chevron-forward" size={18} color={C.mute} />
        </ListRow>
      </Card>
    </Screen>
  );
}
