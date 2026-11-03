# 작업 인수인계 (다음 세션용)

새 세션은 이 문서와 `CLAUDE.md`, `README.md`를 먼저 읽고 시작한다.
작업 브랜치: `claude/dreamy-brahmagupta-gf2yoq` (`claude/laughing-dirac-yd3y27`에서 이어서 작업, main에는 아직 합치지 않음)

## 현재 상태

- 명세서 로드맵 1~4단계 완료: 텍스트 미션, 근거 기반 피드백, XP 원장, 복습, 추천, 성장 기록, 무료 음성(Web Speech API)
- 배포 전 정리 완료: 피드백 대기 진행 화면, 온보딩 레벨 확인(선택 5문항), API 크레딧 소진(402) 안내
- 디자인: 구조는 Lumora, 분위기는 Flowstate (검은 바탕 + WebGL 잉크 배경, 흰 알약 버튼)
  - 잉크 모드: 로그인 `hero`, 일반 화면 기본(어둡게), 대화/결과 `calm`
- 비밀번호 재설정 완료: 메일 어댑터(`src/server/mail`, Resend REST + 개발용 콘솔), 서비스 `src/server/services/password-reset.ts`, 화면 `/forgot-password`, `/reset-password`
  - 토큰 해시만 저장, 1회용, 30분 만료, 새 요청 시 이전 링크 만료, 사용 시 모든 로그인 세션 폐기
  - 계정 존재 여부 비노출 (조회와 발송을 `after()`로 응답 뒤에 처리), IP당 15분 5회 + 계정당 1시간 3통
  - 설정 > 계정 보안에서 비밀번호 변경 (`POST /api/account/password`, 지금 비밀번호 확인, 사용자당 15분 5회, 현재 세션만 유지)
  - 로그인 상태로도 재설정 링크를 열 수 있게 `(public)` 레이아웃의 로그인 리다이렉트를 로그인·가입·비밀번호 찾기 페이지로 옮김
- 점검: `npm run typecheck`, `npm run lint`, `npm test`(32개), `npm run build` 모두 통과. Playwright로 재설정 전체 흐름 확인

## 다음 할 일 (사용자 확정 순서)

1. **Resend 실제 발송 연결** (사용자가 가입 진행하기로 함, 키와 도메인 받으면 연결)
   - 무료 구간: 월 3,000통, 하루 100통 (검색 결과 요약 기준, resend.com은 이 환경 네트워크에서 막혀 직접 확인 못 함)
   - `onboarding@resend.dev` 발신은 Resend 계정 본인 메일로만 감. 다른 사람에게 보내려면 도메인 DNS 인증 필요
   - 환경 변수: `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL`(운영 필수)
2. **배포** (5단계): Vercel + Neon으로 결정. 계정 생성과 연결은 사용자가 직접 함
   - 코드 준비 완료: Postgres 전환, 첫 마이그레이션 `prisma/migrations/*_init`, `vercel-build`(마이그레이션 → 시드 → 빌드), 대화·완료 API `maxDuration = 60`
   - 남은 일: 사용자가 Neon/Vercel 가입 후 환경 변수 입력 → 첫 배포 확인
   - Resend 키는 사용자가 발급함. 클라우드 환경 변수 또는 Vercel 환경 변수로 받기로 함 (채팅에 붙여 넣지 않기)
   - 휴대폰에서 마이크를 쓰려면 HTTPS가 필요해서 배포(또는 터널)가 있어야 함
3. main으로 합치는 PR (사용자가 요청하면)

## 사용자에게 받은 결정

- 모델: 지금은 대화와 피드백 모두 Opus 5.5 (기본값). Max 플랜 월 $100 API 크레딧 안에서 사용
  - 측정값: Opus 미션 1회 약 $0.07, Haiku 약 $0.002. Haiku는 대화는 괜찮지만 대화 중 교정 팁이 없고 피드백 판정이 흔들림
  - `CLAUDE_PARTNER_MODEL`, `CLAUDE_FEEDBACK_MODEL`로 역할별 모델 분리 가능
- 음성은 무료 브라우저 기능 유지. 사용자가 실제 기기에서 음성 테스트 예정 (결과 받으면 반영)

## 이 환경에서 알아둘 점

- DB는 PostgreSQL. 컨테이너에 Postgres 16이 깔려 있음: `service postgresql start` 후 `postgres/postgres` 계정, DB `english_quest`, `english_quest_test` (세션마다 새로 만들어야 할 수 있음)
- Prisma는 AI가 `migrate reset`을 실행하면 사용자 동의를 요구한다. 테스트 초기화는 `_test` DB만 스키마를 지우고 `migrate deploy` 하는 방식으로 대신함
- `.claude/skills/neon-postgres`만 남김 (Neon 공식 스킬). 나머지 Neon 스킬은 기존 로그인·AI 구조와 겹쳐서 지움

- API 키는 클라우드 환경 변수 `EQ_ANTHROPIC_API_KEY`로 들어와 있다. 앱은 `ANTHROPIC_API_KEY`를 읽으므로 실행할 때만 넘긴다:
  `env ANTHROPIC_API_KEY="$EQ_ANTHROPIC_API_KEY" npx next start -p 3100`
  키 값을 출력하거나 로그에 남기지 않는다.
- 키가 없으면 데모 모드(정해진 대사, 규칙 기반 피드백)로 동작한다.
- Next.js 16: 작업 전 `node_modules/next/dist/docs/` 확인. `cacheComponents`는 일부러 끔.
- Tailwind v4: 재사용 클래스는 `@utility`로 선언해야 `@apply` 가능.
- ESLint의 React 컴파일러 규칙: effect 안 setState, 렌더 중 ref 쓰기 금지. 브라우저 기능 감지는 `useSyncExternalStore` 사용.
- Haiku 5.5는 server-side fallback 미지원이라 `fallbackParams()`가 모델별로 넣고 뺀다.
- 서버 종료 시 `pkill -f "next start"`는 셸까지 종료하므로 PID로 kill 한다.
- 브라우저 확인은 Playwright(사전 설치됨)로 한다. 음성은 헤드리스에 마이크가 없어 가짜 인식기를 주입해 테스트했다.

## 사용자 선호 (요약)

- 답변은 한국어, 소제목과 줄바꿈으로 훑어보기 쉽게, 이유와 근거 포함
- 수치와 사실은 출처를 남기고, 추정이면 추정이라고 밝힘
- 부족한 점은 돌려 말하지 않고 솔직하게
