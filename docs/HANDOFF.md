# 작업 인수인계 (다음 세션용)

새 세션은 이 문서와 `CLAUDE.md`, `README.md`를 먼저 읽고 시작한다.
배포 브랜치: `main` (Vercel이 main을 배포). 마지막 작업 브랜치: `claude/loving-fermat-2dlpem` (역량 관찰 개선 + 홈 화면 아이콘, main에 반영함)

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
- 역량 관찰 개선 (`claude/loving-fermat-2dlpem`): 모두 "성장 중 · 60%"로 나오던 문제
  - 원인: 프롬프트에 세 단계 기준이 없고 숫자는 듣기 상한 0.6 하나뿐이라 모델이 가운데 단계와 0.6에 몰림. 화면은 확신도를 퍼센트로 보여 줘서 점수처럼 읽힘
  - 프롬프트(`feedback-prompt.v2`): 단계별 기준, 근거 개수에 따른 확신도 범위, 역량마다 `reason_ko` 한 줄
  - 스키마 `feedback.v2`: skill_observations에 `reason_ko` 추가 (v1 기록에는 없음, 화면은 있을 때만 표시)
  - 서버 규칙(`validateFeedback`): 근거 문장 수로 확신도 상한(1개 0.5, 2~3개 0.7, 4개 이상 0.85, 듣기 0.6), 근거 없는 관찰 제거
  - 결과 화면: 확신도 퍼센트 대신 "근거 n문장"과 이유 한 줄, 추세 제외 항목에 "참고만"
  - 실제 Opus 재현: 중간 수준 대화 → 성장 중 0.55~0.6, 잘한 대화 → 능숙 0.65~0.8. 단계와 확신도가 갈라짐
- 홈 화면 앱: `src/app/manifest.ts`(이름 QUEST, standalone), `public/icon-*.png`, `src/app/apple-icon.png`, `layout.tsx`의 `appleWebApp`
  - 아이콘은 메인 화면 엠블럼(`LogoMark` 별)을 검은 바탕에 흰색으로 그린 PNG. 다시 만들려면 같은 SVG path를 Playwright로 캡처
- 점검: `npm run typecheck`, `npm run lint`, `npm test`(35개), `npm run build` 모두 통과. 실제 Claude로 미션 → 결과 화면 확인

## 배포 상태 (2026-11-03)

- 주소: https://english-quest-gwang.vercel.app (예전 `english-quest-rho-eight.vercel.app`은 307로 넘어감)
- Vercel 프로젝트 `english-quest`(Hobby), 배포 브랜치 `main`, 함수 지역 `sin1`(vercel.json)
- Neon 프로젝트 `GWANG`(싱가포르). `my-first-project`는 연결 주소가 채팅에 노출돼서 사용자가 삭제함
- Vercel 환경 변수: `DATABASE_URL`(pooled), `DATABASE_URL_UNPOOLED`(direct), `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `APP_URL`
- 확인됨
  - 빌드(마이그레이션·시드 포함) 성공
  - 실제 Opus로 미션 → 피드백 → XP 40 저장
  - 비밀번호 재설정 메일이 Resend로 `kgs2980@naver.com`에 도착, 링크 주소 정상 (`APP_URL` 반영)
  - 예전 Vercel 프로젝트 `english-helper` 삭제 완료
  - Vercel 함수 지역 `sin1`, GitHub 기본 브랜치 `main` (사용자 확인)
- 아직 확인 안 됨
  - **휴대폰 마이크 음성 입력: 사용자가 집에서 실제 기기로 테스트 예정. 결과 받으면 반영**
  - 사용자 보고: 듣기 버튼을 누르면 약 2초 뒤에 소리가 남. 브라우저 내장 음성(OS 음성 엔진)의 시작 지연으로 추정. 기기·브라우저 확인 필요

## 다음 할 일

1. 듣기 지연: 사용자 기기는 아이폰 사파리, PC 크롬·엣지. 코드가 natural/google 이름 음성을 우선하는데 크롬 Google 음성과 엣지 Online (Natural) 음성은 네트워크 음성이라 지연 원인으로 추정. 기기 내장 음성 우선으로 바꿀지 사용자 결정 대기
2. 초보 학습자의 짧은 대화(8단어 미만)는 평가 보류돼 역량 기록이 안 남음. 기준 조정할지 사용자와 논의
3. (보류) 도메인 구매 → Vercel 연결 + Resend 도메인 인증 → `MAIL_FROM`. 사용자가 먼저 익숙해진 뒤 진행
4. `claude/friendly-tesla-oymvp0` 브랜치는 반영 안 하기로 함. 세션 권한으로 원격 삭제가 막혀 사용자가 GitHub에서 지울 예정

## 사용자에게 받은 결정

- 모델: 지금은 대화와 피드백 모두 Opus 5.5 (기본값). Max 플랜 월 $100 API 크레딧 안에서 사용
  - 측정값: Opus 미션 1회 약 $0.07, Haiku 약 $0.002. Haiku는 대화는 괜찮지만 대화 중 교정 팁이 없고 피드백 판정이 흔들림
  - `CLAUDE_PARTNER_MODEL`, `CLAUDE_FEEDBACK_MODEL`로 역할별 모델 분리 가능
- 음성은 무료 브라우저 기능 유지. 사용자가 실제 기기에서 음성 테스트 예정 (결과 받으면 반영)

## 새 세션 시작 순서

1. 이 문서, `CLAUDE.md`, `README.md`를 읽는다. 배포 브랜치는 `main`이다.
2. 새 세션에 지정된 작업 브랜치가 따로 있으면 `origin/main`에서 그 브랜치를 만들어 작업한다.
3. `npm ci` (postinstall이 `prisma generate`까지 함)
4. 로컬 DB: `service postgresql start` 후
   `su postgres -c "psql -c \"alter user postgres password 'postgres'\" -c 'create database english_quest' -c 'create database english_quest_test'"`
5. `cp .env.example .env` (기본값이 위 로컬 DB를 가리킴) → `npm run db:setup`
   - 시드(`tsx prisma/seed.ts`)는 `.env`를 읽지 않아 실패함. `set -a; . ./.env; set +a` 후 `npx tsx prisma/seed.ts`로 따로 실행
6. 점검: `npm run typecheck && npm run lint && npm test && npm run build`
7. main에 push하면 Vercel이 바로 배포한다. 사용자가 요청할 때만 main에 올린다.

## 이 환경에서 알아둘 점

- DB는 PostgreSQL. 컨테이너에 Postgres 16이 깔려 있음: `service postgresql start` 후 `postgres/postgres` 계정, DB `english_quest`, `english_quest_test` (세션마다 새로 만들어야 할 수 있음)
- Prisma는 AI가 `migrate reset`을 실행하면 사용자 동의를 요구한다. 테스트 초기화는 `_test` DB만 스키마를 지우고 `migrate deploy` 하는 방식으로 대신함
- 이 클라우드 환경은 resend.com, neon.tech, neon.com 접속이 막혀 있음. Neon CLI(`neon login`, `neon deploy`)와 실제 Neon DB 직접 접속은 안 됨. Neon·Vercel 작업은 사용자가 대시보드에서 함
- `.claude/skills/neon-postgres`만 남김 (Neon 공식 스킬). 나머지 Neon 스킬은 기존 로그인·AI 구조와 겹쳐서 지움

- API 키는 클라우드 환경 변수 `EQ_ANTHROPIC_API_KEY`로 들어와 있다. 앱은 `ANTHROPIC_API_KEY`를 읽으므로 실행할 때만 넘긴다:
  `env ANTHROPIC_API_KEY="$EQ_ANTHROPIC_API_KEY" npx next start -p 3100`
  키 값을 출력하거나 로그에 남기지 않는다.
- 키가 없으면 데모 모드(정해진 대사, 규칙 기반 피드백)로 동작한다.
- Next.js 16: 작업 전 `node_modules/next/dist/docs/` 확인. `cacheComponents`는 일부러 끔.
- Tailwind v4: 재사용 클래스는 `@utility`로 선언해야 `@apply` 가능.
- ESLint의 React 컴파일러 규칙: effect 안 setState, 렌더 중 ref 쓰기 금지. 브라우저 기능 감지는 `useSyncExternalStore` 사용.
- Haiku 5.5는 server-side fallback 미지원이라 `fallbackParams()`가 모델별로 넣고 뺀다.
- 서버 종료 시 `pkill -f "next start"`나 `pgrep -f`는 그 문자열이 든 자기 셸까지 잡아서 종료하므로, `ps -eo pid,args | grep ... | grep -v grep`으로 PID를 찾아 kill 한다.
- 브라우저 확인은 Playwright(사전 설치됨)로 한다. 음성은 헤드리스에 마이크가 없어 가짜 인식기를 주입해 테스트했다.

## 사용자 선호 (요약)

- 답변은 한국어, 소제목과 줄바꿈으로 훑어보기 쉽게, 이유와 근거 포함
- 수치와 사실은 출처를 남기고, 추정이면 추정이라고 밝힘
- 부족한 점은 돌려 말하지 않고 솔직하게
