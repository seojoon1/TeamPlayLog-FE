import type { Tone } from '@/components/ui';

import type { RecordStatus, TaskStatus } from './types';

export const TASK_STATUS: Record<TaskStatus, { label: string; tone: Tone }> = {
  TODO: { label: '예정', tone: 'muted' },
  DOING: { label: '진행 중', tone: 'info' },
  DONE: { label: '완료', tone: 'ok' },
  OVERDUE: { label: '마감 지남', tone: 'danger' },
};

export const RECORD_STATUS: Record<RecordStatus, { label: string; tone: Tone }> = {
  PENDING: { label: '확인 대기', tone: 'muted' },
  CONFIRMED: { label: '확인됨', tone: 'ok' },
  ON_HOLD: { label: '보류', tone: 'danger' },
  RECHECK: { label: '다시 확인', tone: 'info' },
  UNCONFIRMED: { label: '미확인', tone: 'muted' },
  WITHDRAWN: { label: '철회', tone: 'muted' },
};
