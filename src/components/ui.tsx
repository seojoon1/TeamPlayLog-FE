/** 공통 부품. 피그마 「디자인 기초」의 버튼·칩·배지·카드·입력 칸과 같은 모양. */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { AVATAR_TONES, C, F, MAX_WIDTH, R, S, TYPE, TYPE_COLOR, type TypeName } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ---- 글자 -------------------------------------------------------------------------

export function Txt({ t = 'body', color, style, ...rest }: TextProps & { t?: TypeName; color?: string }) {
  return <Text {...rest} style={[TYPE[t], { color: color ?? TYPE_COLOR[t] }, style]} />;
}

// ---- 화면 틀 ------------------------------------------------------------------------

export function AppBar({ title, back = true, right, onBack }: { title: string; back?: boolean; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={st.appbar}>
      {back ? (
        <Pressable
          role="button"
          aria-label="뒤로"
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
          style={st.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </Pressable>
      ) : null}
      <Txt t="h2" style={[st.appbarTitle, !back && { paddingLeft: S.lg }]} numberOfLines={1}>
        {title}
      </Txt>
      {right ? <View style={st.appbarRight}>{right}</View> : null}
    </View>
  );
}

/** 상단 바 + 본문(스크롤) + 하단 고정 영역 */
export function Screen({
  title,
  back = true,
  right,
  children,
  footer,
  scroll = true,
  edges = ['top'],
  gap = S.lg,
  bar = true,
}: {
  title?: string;
  back?: boolean;
  right?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  gap?: number;
  bar?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const body = <View style={[st.inner, { gap }]}>{children}</View>;
  return (
    <KeyboardScreen>
      <SafeAreaView style={st.screen} edges={edges}>
        {bar && title !== undefined ? <AppBar title={title} back={back} right={right} /> : null}
        {scroll ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{body}</View>
        )}
        {footer ? <View style={[st.footer, { paddingBottom: 20 + (edges.includes('bottom') ? 0 : insets.bottom) }]}>{footer}</View> : null}
      </SafeAreaView>
    </KeyboardScreen>
  );
}

/**
 * 키보드가 올라오면 화면 아래쪽을 그만큼 비워, 하단 고정 버튼이 키보드 위로 올라오게 한다.
 * Expo 앱은 안드로이드에서도 edge-to-edge라 창이 저절로 줄지 않으므로 양쪽 모두 padding을 쓴다.
 * (Expo 키보드 가이드) 화면 맨 위에 놓고 쓰므로 keyboardVerticalOffset은 0.
 */
export function KeyboardScreen({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: C.bg }}>
      {children}
    </KeyboardAvoidingView>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable role="button" onPress={onPress} style={({ pressed }) => [st.card, style, pressed && st.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[st.card, style]}>{children}</View>;
}

export function Row({ children, gap = 0, style, align = 'center' }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; align?: ViewStyle['alignItems'] }) {
  return <View style={[{ flexDirection: 'row', alignItems: align, gap }, style]}>{children}</View>;
}

export function Section({ title, right, children, gap = 10 }: { title: string; right?: ReactNode; children: ReactNode; gap?: number }) {
  return (
    <View style={{ gap }}>
      <Row>
        <Txt t="sec" style={{ flex: 1 }}>
          {title}
        </Txt>
        {right}
      </Row>
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: C.lineSoft }, style]} />;
}

// ---- 버튼 -------------------------------------------------------------------------

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'danger';
const BTN: Record<BtnKind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: C.primary, fg: C.white },
  secondary: { bg: C.primary50, fg: C.primary },
  ghost: { bg: C.surface, fg: C.text, border: C.line },
  danger: { bg: C.danger50, fg: C.danger },
};

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  small,
  grow,
}: {
  label: string;
  onPress: () => void;
  kind?: BtnKind;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  grow?: boolean;
}) {
  const off = disabled || loading;
  const k = BTN[kind];
  return (
    <Pressable
      role="button"
      aria-disabled={!!off}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        st.btn,
        small && st.btnSm,
        { backgroundColor: k.bg, borderColor: k.border ?? k.bg },
        grow && { flex: 1 },
        pressed && st.pressed,
        off && { opacity: 0.45 },
      ]}>
      {loading ? (
        <ActivityIndicator color={k.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={k.fg} /> : null}
          <Text style={[small ? st.btnTextSm : st.btnText, { color: k.fg }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable role="button" onPress={onPress} hitSlop={8}>
      <Txt t="link">{label}</Txt>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable role="button" aria-label={label} onPress={onPress} style={st.iconBtn}>
      <Ionicons name={icon} size={22} color={C.text} />
    </Pressable>
  );
}

/** 오른쪽 아래에 떠 있는 버튼 (팀 보드의 '기록하기') */
export function Fab({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable role="button" onPress={onPress} style={({ pressed }) => [st.fab, pressed && st.pressed]}>
      <Ionicons name={icon} size={20} color={C.white} />
      <Text style={st.btnText}>{label}</Text>
    </Pressable>
  );
}

// ---- 칩 · 배지 · 세그먼트 ---------------------------------------------------------

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable
      role="button"
      aria-selected={!!selected}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [st.chip, selected && st.chipOn, pressed && st.pressed]}>
      {icon ? <Ionicons name={icon} size={15} color={selected ? C.white : C.text} /> : null}
      <Text style={[st.chipText, selected && { color: C.white }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const BADGE = {
  ok: [C.ok50, C.ok],
  info: [C.info50, C.info],
  warn: [C.warn50, C.warn],
  danger: [C.danger50, C.danger],
  muted: [C.muted50, C.sub],
  brand: [C.primary50, C.primary],
} as const;
export type Tone = keyof typeof BADGE;

export function Badge({ label, tone = 'muted', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const [bg, fg] = BADGE[tone];
  return (
    <View style={[st.badge, { backgroundColor: bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={[st.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Segment<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={st.seg}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} role="button" aria-selected={on} onPress={() => onChange(o.key)} style={[st.segItem, on && st.segOn]}>
            <Text style={[st.segText, on && { color: C.primary, fontFamily: F.bold }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---- 입력 -------------------------------------------------------------------------

export function Field({
  label,
  hint,
  error,
  icon,
  right,
  ...props
}: TextInputProps & { label?: string; hint?: string; error?: string; icon?: IconName; right?: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Row>
          <Txt t="label" style={{ flex: 1 }}>
            {label}
          </Txt>
          {right}
        </Row>
      ) : null}
      <View style={[st.input, !!error && { borderColor: C.danger }]}>
        {icon ? <Ionicons name={icon} size={18} color={C.mute} /> : null}
        <TextInput placeholderTextColor={C.mute} style={st.inputText} {...props} />
      </View>
      {error ? <Txt t="tiny" color={C.danger}>{error}</Txt> : hint ? <Txt t="tiny">{hint}</Txt> : null}
    </View>
  );
}

// ---- 기타 -------------------------------------------------------------------------

export function Avatar({ name, seed, size = 36, ghost }: { name: string; seed?: string; size?: number; ghost?: boolean }) {
  const [bg, fg] = AVATAR_TONES[hash(seed ?? name) % AVATAR_TONES.length];
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg },
        ghost && { backgroundColor: C.surface, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C9C1C5' },
      ]}>
      <Text style={{ fontFamily: F.black, fontSize: size * 0.42, lineHeight: size * 0.6, color: ghost ? C.mute : fg }}>{name.slice(0, 1)}</Text>
    </View>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Track({ value, light }: { value: number; light?: boolean }) {
  return (
    <View style={[st.track, light && { backgroundColor: 'rgba(255,255,255,0.28)' }]}>
      <View style={[st.trackFill, { width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }, light && { backgroundColor: C.white }]} />
    </View>
  );
}

const NOTICE = { brand: [C.primary50, C.primary], warn: [C.warn50, C.warn], ok: [C.ok50, C.ok], danger: [C.danger50, C.danger] } as const;

export function Notice({ children, tone = 'brand', icon = 'information-circle-outline' }: { children: ReactNode; tone?: keyof typeof NOTICE; icon?: IconName }) {
  const [bg, fg] = NOTICE[tone];
  return (
    <View style={[st.notice, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={fg} style={{ marginTop: 1 }} />
      <Txt t="sm" color={C.text} style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}

export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={st.empty}>
      <View style={st.emptyIcon}>
        <Ionicons name={icon} size={26} color={C.primary} />
      </View>
      <Txt t="h3">{title}</Txt>
      {body ? (
        <Txt t="sm" style={{ textAlign: 'center' }}>
          {body}
        </Txt>
      ) : null}
      {action}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: S.xxl, alignItems: 'center' }}>
      <ActivityIndicator color={C.primary} />
    </View>
  );
}

export function ErrorText({ message, style }: { message?: string | null; style?: StyleProp<TextStyle> }) {
  if (!message) return null;
  return (
    <Txt t="sm" color={C.danger} style={style}>
      {message}
    </Txt>
  );
}

/** 목록 카드 안의 한 줄 (아래 구분선 포함) */
export function ListRow({ children, last, onPress, align = 'center' }: { children: ReactNode; last?: boolean; onPress?: () => void; align?: ViewStyle['alignItems'] }) {
  const style = [st.li, { alignItems: align }, last && { borderBottomWidth: 0 }];
  if (onPress) {
    return (
      <Pressable role="button" onPress={onPress} style={({ pressed }) => [...style, pressed && st.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={style}>{children}</View>;
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: S.lg, paddingTop: S.xs, paddingBottom: S.xl },
  appbar: { height: 52, flexDirection: 'row', alignItems: 'center', paddingLeft: 4, paddingRight: 12, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  appbarTitle: { flex: 1, fontSize: 18, lineHeight: 26, paddingLeft: 4 },
  appbarRight: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: S.md,
    paddingHorizontal: S.lg,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.line,
    width: '100%',
    alignSelf: 'center',
  },
  card: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: S.lg, gap: S.sm },
  pressed: { opacity: 0.8 },
  btn: { height: 52, borderRadius: R.md, borderWidth: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm },
  btnSm: { height: 42, borderRadius: R.sm, paddingHorizontal: 14 },
  btnText: { fontFamily: F.bold, fontSize: 16, lineHeight: 22, color: C.white },
  btnTextSm: { fontFamily: F.bold, fontSize: 14, lineHeight: 20 },
  fab: {
    position: 'absolute',
    right: S.lg,
    bottom: S.lg,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingLeft: 18,
    paddingRight: 20,
    shadowColor: C.primary,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  chip: { height: 36, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontFamily: F.bold, fontSize: 14, lineHeight: 20, color: C.text },
  badge: { height: 24, borderRadius: R.pill, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start' },
  badgeText: { fontFamily: F.bold, fontSize: 12, lineHeight: 17 },
  seg: { flexDirection: 'row', backgroundColor: C.muted50, borderRadius: R.md, padding: 4, gap: 4 },
  segItem: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segText: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.sub },
  input: { minHeight: 50, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: S.sm },
  inputText: { flex: 1, minHeight: 48, fontFamily: F.regular, fontSize: 15, color: C.text },
  track: { height: 8, borderRadius: 4, backgroundColor: C.muted50, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 4, backgroundColor: C.primary },
  notice: { flexDirection: 'row', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: R.md, alignItems: 'flex-start' },
  empty: { alignItems: 'center', gap: S.sm, paddingVertical: S.xxl, paddingHorizontal: S.lg },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary50, alignItems: 'center', justifyContent: 'center' },
  li: { flexDirection: 'row', gap: S.md, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
});
