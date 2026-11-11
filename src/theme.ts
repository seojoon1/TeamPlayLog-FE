/** 팀플로그 디자인 토큰. 피그마 「디자인 초안 v1 › 디자인 기초」와 같은 값. */

export const C = {
  primary: '#990033',
  primary700: '#7A0029',
  primary50: '#F9ECF1',
  primaryLine: '#E2B8C8',
  primaryWash: '#FDF7F9',
  heroSub: '#F3C5D4',
  bg: '#F7F5F6',
  surface: '#FFFFFF',
  line: '#ECE6E9',
  lineSoft: '#F1ECEE',
  muted50: '#EFEBED',
  text: '#1B1A1B',
  sub: '#6B6468',
  mute: '#9A9396',
  ok: '#1F7A4D',
  ok50: '#E6F4EC',
  info: '#2F5AA8',
  info50: '#E8EEF9',
  warn: '#A15C00',
  warn50: '#FBF0E0',
  danger: '#B3261E',
  danger50: '#FBE9E8',
  dangerLine: '#F1C6C3',
  white: '#FFFFFF',
} as const;

/** Noto Sans KR. 안드로이드에서는 fontWeight 대신 굵기별 글꼴 이름을 써야 한다. */
export const F = {
  regular: 'NotoSansKR_400Regular',
  bold: 'NotoSansKR_700Bold',
  black: 'NotoSansKR_900Black',
} as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const R = { sm: 10, md: 12, lg: 16, pill: 999 } as const;

/** 글자 단계 (크기 / 줄 높이 / 굵기) */
export const TYPE = {
  brand: { fontSize: 28, lineHeight: 36, fontFamily: F.black, letterSpacing: -0.5 },
  title: { fontSize: 22, lineHeight: 30, fontFamily: F.bold },
  h2: { fontSize: 17, lineHeight: 24, fontFamily: F.bold },
  h3: { fontSize: 16, lineHeight: 22, fontFamily: F.bold },
  b: { fontSize: 15, lineHeight: 21, fontFamily: F.bold },
  body: { fontSize: 15, lineHeight: 22, fontFamily: F.regular },
  sm: { fontSize: 13, lineHeight: 19, fontFamily: F.regular },
  tiny: { fontSize: 12, lineHeight: 17, fontFamily: F.regular },
  sec: { fontSize: 14, lineHeight: 20, fontFamily: F.bold },
  link: { fontSize: 14, lineHeight: 20, fontFamily: F.bold },
  label: { fontSize: 14, lineHeight: 20, fontFamily: F.bold },
} as const;

export type TypeName = keyof typeof TYPE;

export const TYPE_COLOR: Record<TypeName, string> = {
  brand: C.text,
  title: C.text,
  h2: C.text,
  h3: C.text,
  b: C.text,
  body: C.text,
  sm: C.sub,
  tiny: C.mute,
  sec: C.sub,
  link: C.primary,
  label: C.text,
};

export const MAX_WIDTH = 520;

/** 아바타 색 4가지 (배경, 글자) */
export const AVATAR_TONES = [
  [C.primary50, C.primary],
  [C.info50, C.info],
  [C.ok50, C.ok],
  [C.warn50, C.warn],
] as const;
