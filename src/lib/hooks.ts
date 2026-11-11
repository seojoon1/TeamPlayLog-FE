import { useQuery } from '@tanstack/react-query';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';

import { api } from './api';
import type { AgreementHistory, AppNotification, Board, Me, Page, RecordItem, Report, TaskDetail, Team } from './types';

/** 팀 화면들(탭 안쪽 포함)에서 현재 팀 ID. 탭 안쪽 화면은 지역 파라미터에 부모 경로 값이 없을 수 있어 URL 기준으로도 읽는다. */
export function useTeamId() {
  const local = useLocalSearchParams<{ teamId?: string }>();
  const global = useGlobalSearchParams<{ teamId?: string }>();
  return (local.teamId ?? global.teamId) as string;
}

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/me') });

export const useTeam = (teamId: string) =>
  useQuery({ queryKey: ['team', teamId], queryFn: () => api<Team>(`/teams/${teamId}`), enabled: !!teamId });

export const useBoard = (teamId: string, mine = false) =>
  useQuery({
    queryKey: ['board', teamId, mine],
    queryFn: () => api<Board>(`/teams/${teamId}/tasks${mine ? '?mine=true' : ''}`),
    enabled: !!teamId,
  });

export const useInbox = (teamId: string) =>
  useQuery({ queryKey: ['inbox', teamId], queryFn: () => api<RecordItem[]>(`/teams/${teamId}/inbox`), enabled: !!teamId });

export const useTask = (taskId: string) =>
  useQuery({ queryKey: ['task', taskId], queryFn: () => api<TaskDetail>(`/tasks/${taskId}`), enabled: !!taskId });

export const useTaskRecords = (teamId: string, taskId: string) =>
  useQuery({
    queryKey: ['records', teamId, taskId],
    queryFn: () => api<Page<RecordItem>>(`/teams/${teamId}/records?task_id=${taskId}&limit=50`),
    enabled: !!teamId && !!taskId,
  });

export const useAgreement = (teamId: string) =>
  useQuery({ queryKey: ['agreement', teamId], queryFn: () => api<AgreementHistory>(`/teams/${teamId}/agreement`), enabled: !!teamId });

export const useReports = (teamId: string) =>
  useQuery({ queryKey: ['reports', teamId], queryFn: () => api<Report[]>(`/teams/${teamId}/reports`), enabled: !!teamId });

export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: () => api<Page<AppNotification>>('/notifications?limit=50'), refetchInterval: 60_000 });

/** 현재 로그인한 사람의 이 팀 멤버 정보 */
export function useMyMember(teamId: string) {
  const me = useMe();
  const team = useTeam(teamId);
  return team.data?.members.find((m) => m.user_id === me.data?.id);
}

export function useMyMemberId(teamId: string) {
  return useMyMember(teamId)?.member_id;
}
