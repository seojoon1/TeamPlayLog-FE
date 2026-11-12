import { router, type Href } from 'expo-router';

/** 이전 화면으로. 알림이나 주소로 바로 들어와 돌아갈 화면이 없으면 fallback으로 간다. */
export function goBack(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
