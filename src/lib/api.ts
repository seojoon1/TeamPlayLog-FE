/**
 * BE API 호출. 액세스 토큰이 만료되면(401) 리프레시 토큰으로 한 번 재발급받고 다시 시도한다.
 * 서버 주소는 EXPO_PUBLIC_API_URL (휴대폰 테스트 때는 PC의 내부 IP로 지정).
 */
import { getItem, removeItem, setItem } from './storage';
import type { ApiErrorBody, Tokens } from './types';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

const ACCESS = 'tpl.access';
const REFRESH = 'tpl.refresh';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message);
  }
}

let onSignedOut: (() => void) | null = null;
export function setSignedOutHandler(fn: () => void) {
  onSignedOut = fn;
}

export async function saveTokens(t: Tokens) {
  await setItem(ACCESS, t.access_token);
  await setItem(REFRESH, t.refresh_token);
}

export async function clearTokens() {
  await removeItem(ACCESS);
  await removeItem(REFRESH);
}

export async function hasTokens() {
  return (await getItem(REFRESH)) != null;
}

let refreshing: Promise<boolean> | null = null;

async function refresh(): Promise<boolean> {
  const token = await getItem(REFRESH);
  if (!token) return false;
  const r = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: token }),
  });
  if (!r.ok) return false;
  await saveTokens(await r.json());
  return true;
}

async function parseError(r: Response): Promise<ApiError> {
  let body: ApiErrorBody = { code: `HTTP_${r.status}`, message: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
  try {
    const j = await r.json();
    if (j && typeof j.message === 'string') body = j;
  } catch {
    // 본문이 JSON이 아니면 기본 문구를 쓴다
  }
  return new ApiError(r.status, body);
}

type Opts = { method?: string; body?: unknown; raw?: BodyInit; headers?: Record<string, string> };

/** path는 '/teams'처럼 /api/v1 뒤 경로, 또는 BE가 준 '/api/v1/...' 전체 경로. */
export async function api<T>(path: string, opts: Opts = {}, retried = false): Promise<T> {
  const url = `${API_URL}${path.startsWith('/api/') ? path : `/api/v1${path}`}`;
  const token = await getItem(ACCESS);
  const headers: Record<string, string> = { ...opts.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  let r: Response;
  try {
    r = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    });
  } catch {
    throw new ApiError(0, { code: 'NETWORK', message: '서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.' });
  }
  if (r.status === 401 && !retried && !path.startsWith('/auth/')) {
    refreshing ??= refresh().finally(() => (refreshing = null));
    if (await refreshing) return api<T>(path, opts, true);
    await clearTokens();
    onSignedOut?.();
  }
  if (!r.ok) throw await parseError(r);
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}

/** 로그인이 필요한 파일 주소를 받을 때 쓸 헤더. 만료된 토큰이면 먼저 한 번 재발급받는다. */
export async function authHeaders(): Promise<Record<string, string>> {
  await api('/me'); // 401이면 여기서 재발급된다
  const token = await getItem(ACCESS);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** 결과물 파일 업로드: 주소 발급 → 바이트 PUT → file_key 반환 */
export async function uploadFile(file: { uri: string; name: string; mimeType?: string; size?: number }) {
  const blob = await (await fetch(file.uri)).blob();
  const { upload_url, file_key } = await api<{ upload_url: string; file_key: string }>('/files/upload-url', {
    method: 'POST',
    body: { filename: file.name, content_type: file.mimeType ?? blob.type ?? 'application/octet-stream', size: file.size ?? blob.size },
  });
  await api<void>(upload_url, { method: 'PUT', raw: blob, headers: { 'Content-Type': file.mimeType ?? 'application/octet-stream' } });
  return file_key;
}
