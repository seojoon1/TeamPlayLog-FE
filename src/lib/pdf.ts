/** 로그인이 필요한 파일(기여 리포트 PDF, 기록 첨부 파일) 열기. 웹은 새 탭, 휴대폰은 내려받아 공유 창으로 연다. */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { API_URL, authHeaders } from './api';

async function openProtectedFile(url: string, fileName: string, mimeType: string, dialogTitle: string) {
  if (Platform.OS === 'web') {
    // 팝업 차단을 피하려고 누른 순간(첫 await 전) 빈 탭을 먼저 연다
    const win = window.open('', '_blank');
    try {
      const r = await fetch(url, { headers: await authHeaders() });
      if (!r.ok) throw new Error('파일을 열지 못했어요.');
      const blobUrl = URL.createObjectURL(await r.blob());
      if (win) {
        win.location.href = blobUrl;
      } else {
        // 새 탭이 막힌 브라우저: 파일로 내려받는다
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.click();
      }
    } catch (e) {
      win?.close();
      throw e;
    }
    return;
  }
  const headers = await authHeaders();
  const dest = new File(Paths.cache, fileName);
  if (dest.exists) dest.delete();
  const file = await File.downloadFileAsync(url, dest, { headers });
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
}

export function openReportPdf(reportId: string, serial: string) {
  return openProtectedFile(`${API_URL}/api/v1/reports/${reportId}/pdf`, `${serial}.pdf`, 'application/pdf', '기여 리포트');
}

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  txt: 'text/plain',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  hwp: 'application/x-hwp',
};

/** 첨부 파일의 확장자 (예: "pdf"). 화면에 종류를 보여 줄 때 쓴다. */
export function fileExt(fileKey: string) {
  const m = /\.([a-z0-9]+)$/i.exec(fileKey);
  return m ? m[1].toLowerCase() : '';
}

/** 기록에 붙은 결과물 파일 열기. file_key는 "<올린 사람 id>/<임의 이름>.<확장자>" */
export function openAttachment(fileKey: string, authorName: string) {
  const ext = fileExt(fileKey);
  const name = `${authorName}_결과물${ext ? `.${ext}` : ''}`;
  return openProtectedFile(`${API_URL}/api/v1/files/${fileKey}`, name, MIME[ext] ?? 'application/octet-stream', '첨부 파일');
}
