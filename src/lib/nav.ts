import { router, type Href } from 'expo-router';

/** 이전 화면으로. 알림이나 주소로 바로 들어와 돌아갈 화면이 없으면 fallback으로 간다. */
export function goBack(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/**
 * 팀 화면(탭)에서 나가 내 팀 목록으로. 탭 사이의 뒤로가기(첫 탭으로 이동)가 아니라 팀 밖으로 나간다.
 * 목록이 기록에 없으면 dismissTo가 현재 화면을 목록으로 바꾼다.
 */
export function leaveTeamScreens() {
  router.dismissTo('/');
}
