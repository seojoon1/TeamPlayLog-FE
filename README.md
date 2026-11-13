# TeamPlayLog-FE

팀플로그 안드로이드 앱 (Expo SDK 58, Expo Router). 디자인: [피그마 디자인 초안](https://www.figma.com/design/Z21C6eDwqgrP7OzN9EKpG1)

## 준비

```bash
npm install
cp .env.example .env.local   # EXPO_PUBLIC_API_URL 을 BE 서버 주소로 고친다
```

## 웹 미리보기

```bash
npm run web          # http://localhost:8081
```

## 휴대폰(Expo Go)으로 보기

1. 휴대폰에 **Expo Go**를 설치한다 (Play 스토어).
2. PC와 휴대폰을 **같은 와이파이**에 연결한다.
3. `ipconfig`로 PC의 IPv4 주소를 확인하고 `.env.local`에 넣는다: `EXPO_PUBLIC_API_URL=http://<PC IP>:8000`
4. BE를 모든 네트워크에서 받도록 띄운다 (TeamPlayLog-BE 폴더에서):
   `.venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
   Windows 방화벽 창이 뜨면 "개인 네트워크" 허용.
5. `npx expo start` → 터미널의 QR 코드를 Expo Go로 찍는다.

학교 와이파이처럼 기기끼리 접속을 막는 네트워크에서는 휴대폰이 PC에 닿지 않는다. 그때는 휴대폰 핫스팟에 PC를 연결하거나, BE를 배포한 뒤 그 주소를 쓴다.

## APK 빌드 (EAS)

```bash
npx eas-cli@latest login        # Expo 계정 (처음 한 번)
npx eas-cli@latest init         # 프로젝트 연결 (처음 한 번, app.json에 projectId가 생긴다)
npx eas-cli@latest build -p android --profile preview
```

- APK가 접속할 서버 주소는 `eas.json`의 `EXPO_PUBLIC_API_URL`이다. 배포 주소가 정해지면 여기를 고친다.
- 빌드가 끝나면 나오는 링크에서 APK를 받아 휴대폰에 설치한다 ("출처를 알 수 없는 앱" 허용 필요).

## 웹 버전 배포 (EAS Hosting)

웹 버전 주소: https://teamplaylog.expo.app

```bash
# .env.local 의 개발용 주소 대신 배포 서버 주소로 빌드한다 (셸에 넣은 값이 .env.local 보다 우선)
EXPO_PUBLIC_API_URL=https://teamplaylog-api.onrender.com npx expo export -p web
npx eas-cli@latest deploy --prod
```

- 서버(BE)의 `CORS_ORIGINS`에 이 웹 주소가 있어야 브라우저에서 API를 부를 수 있다 (BE `render.yaml`).
- PowerShell에서는 `$env:EXPO_PUBLIC_API_URL="https://teamplaylog-api.onrender.com"; npx expo export -p web` 로 실행한다.

## 검사

```bash
npx tsc --noEmit
npx eslint src
```
