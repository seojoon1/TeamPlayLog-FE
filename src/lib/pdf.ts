/** 기여 리포트 PDF 열기. 웹은 새 탭, 휴대폰은 내려받아 공유 창으로 연다. */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { API_URL, authHeaders } from './api';

export async function openReportPdf(reportId: string, serial: string) {
  const url = `${API_URL}/api/v1/reports/${reportId}/pdf`;
  if (Platform.OS === 'web') {
    // 팝업 차단을 피하려고 누른 순간(첫 await 전) 빈 탭을 먼저 연다
    const win = window.open('', '_blank');
    try {
      const r = await fetch(url, { headers: await authHeaders() });
      if (!r.ok) throw new Error('PDF를 만들지 못했어요.');
      const blobUrl = URL.createObjectURL(await r.blob());
      if (win) {
        win.location.href = blobUrl;
      } else {
        // 새 탭이 막힌 브라우저: 파일로 내려받는다
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${serial}.pdf`;
        a.click();
      }
    } catch (e) {
      win?.close();
      throw e;
    }
    return;
  }
  const headers = await authHeaders();
  const dest = new File(Paths.cache, `${serial}.pdf`);
  if (dest.exists) dest.delete();
  const file = await File.downloadFileAsync(url, dest, { headers });
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: '기여 리포트' });
}
