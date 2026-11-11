/** 날짜·시간 고르기. 앞으로 3주의 날짜 칩과 자주 쓰는 시각 칩으로 고른다 (휴대폰·웹 모두 같은 모양). */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { DAYS, dueLabel, kstParts, kstToIso } from '@/lib/format';
import { C, F, R, S } from '@/theme';

import { Txt } from './ui';

const TIMES = [
  [9, 0],
  [12, 0],
  [15, 0],
  [18, 0],
  [21, 0],
  [23, 59],
] as const;

export function DateField({ label, value, onChange, days = 21 }: { label?: string; value: string | null; onChange: (iso: string) => void; days?: number }) {
  const [open, setOpen] = useState(!value);
  const today = kstParts(new Date().toISOString());
  const list = useMemo(() => {
    const base = Date.UTC(today.y, today.m - 1, today.d);
    return Array.from({ length: days }, (_, i) => {
      const t = new Date(base + i * 86400000);
      return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay() };
    });
  }, [today.y, today.m, today.d, days]);
  const cur = value ? kstParts(value) : null;
  const pickDay = (x: { y: number; m: number; d: number }) => onChange(kstToIso(x.y, x.m, x.d, cur?.h ?? 18, cur?.min ?? 0));
  const pickTime = (h: number, min: number) => {
    const base = cur ?? list[0];
    onChange(kstToIso(base.y, base.m, base.d, h, min));
  };

  return (
    <View style={{ gap: 6 }}>
      {label ? <Txt t="label">{label}</Txt> : null}
      <Pressable role="button" onPress={() => setOpen(!open)} style={st.box}>
        <Ionicons name="calendar-outline" size={18} color={value ? C.primary : C.mute} />
        <Txt t="body" color={value ? C.text : C.mute} style={{ flex: 1 }}>
          {value ? dueLabel(value) : '날짜와 시간을 골라 주세요'}
        </Txt>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.mute} />
      </Pressable>
      {open ? (
        <View style={st.panel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}>
            {list.map((x) => {
              const on = cur && cur.y === x.y && cur.m === x.m && cur.d === x.d;
              const weekend = x.wd === 0 || x.wd === 6;
              return (
                <Pressable key={`${x.m}-${x.d}`} role="button" aria-selected={!!on} onPress={() => pickDay(x)} style={[st.day, on && st.on]}>
                  <Text style={[st.dayW, weekend && { color: C.danger }, on && { color: C.heroSub }]}>{DAYS[x.wd]}</Text>
                  <Text style={[st.dayN, on && { color: C.white }]}>{x.d}</Text>
                  <Text style={[st.dayM, on && { color: C.heroSub }]}>{x.m}월</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={st.times}>
            {TIMES.map(([h, min]) => {
              const on = cur && cur.h === h && cur.min === min;
              return (
                <Pressable key={`${h}:${min}`} role="button" aria-selected={!!on} onPress={() => pickTime(h, min)} style={[st.time, on && st.on]}>
                  <Text style={[st.timeText, on && { color: C.white }]}>{`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  box: { minHeight: 50, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: S.sm },
  panel: { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 1, borderColor: C.line, padding: 10, gap: 10 },
  day: { width: 50, paddingVertical: 8, borderRadius: R.sm, alignItems: 'center', borderWidth: 1, borderColor: C.line },
  on: { backgroundColor: C.primary, borderColor: C.primary },
  dayW: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.sub },
  dayN: { fontFamily: F.bold, fontSize: 17, lineHeight: 24, color: C.text },
  dayM: { fontFamily: F.regular, fontSize: 11, lineHeight: 14, color: C.mute },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  time: { height: 34, paddingHorizontal: 12, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontFamily: F.bold, fontSize: 13, lineHeight: 18, color: C.text },
});
