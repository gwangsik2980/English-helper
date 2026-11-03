# 작업 인수인계 (다음 세션용)

새 세션은 이 문서와 `CLAUDE.md`, `README.md`를 먼저 읽고 시작한다.
배포 브랜치: `main` (Vercel이 main을 배포). 마지막 작업 브랜치: `claude/loving-fermat-2dlpem` (main과 같은 내용, 모두 배포됨)

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
- 역량 관찰 개선: 모두 "성장 중 · 60%"로 나오던 문제
  - 원인: 프롬프트에 세 단계 기준이 없고 숫자는 듣기 상한 0.6 하나뿐이라 모델이 가운데 단계와 0.6에 몰림. 화면은 확신도를 퍼센트로 보여 줘서 점수처럼 읽힘
  - 프롬프트(`feedback-prompt.v2`): 단계별 기준, 근거 개수에 따른 확신도 범위, 역량마다 `reason_ko` 한 줄
  - 스키마 `feedback.v2`: skill_observations에 `reason_ko` 추가 (v1 기록에는 없음, 화면은 있을 때만 표시)
  - 서버 규칙(`validateFeedback`): 근거 문장 수로 확신도 상한(1개 0.5, 2~3개 0.7, 4개 이상 0.85, 듣기 0.6), 근거 없는 관찰 제거
  - 결과 화면: 확신도 퍼센트 대신 "근거 n문장"과 이유 한 줄, 추세 제외 항목에 "참고만"
  - 실제 Opus 재현: 중간 수준 대화 → 성장 중 0.55~0.6, 잘한 대화 → 능숙 0.65~0.8. 단계와 확신도가 갈라짐
- 홈 화면 앱: `src/app/manifest.ts`(이름 QUEST, standalone), `public/icon-*.png`, `src/app/apple-icon.png`, `layout.tsx`의 `appleWebApp`
  - 아이콘은 메인 화면 엠블럼(`LogoMark` 별)을 검은 바탕에 흰색으로 그린 PNG. 다시 만들려면 같은 SVG path를 Playwright로 캡처
- 듣기 목소리 선택(`src/features/voice/voice-choice.ts`, 사용자가 고른 C안)
  - 기본은 기기 내장 음성 우선(바로 재생). 설정 > 음성 > `자연스러운 목소리 쓰기`(`naturalVoice`, localStorage)를 켜면 온라인 음성(크롬 Google, 엣지 Online (Natural)) 우선
  - 예전 코드는 natural/google 이름을 먼저 골라 PC에서 1~2초 지연된 것으로 추정
  - iOS 장난용 음성(Albert, Bubbles 등)은 제외. 아이폰은 두 설정 모두 Samantha
  - "듣기"를 누를 때마다 목소리를 다시 고름 (설정 변경이 바로 적용)
- 대화 화면 스크롤 버그 수정 (사용자 제보: 폰에서 대화창을 누르고 위로 밀면 화면이 끝없이 올라감)
  - 원인 추정: 아이폰 사파리는 `interactive-widget=resizes-content`를 무시해서, 키보드가 열리면 문서 전체가 끌려 움직임
  - `src/features/conversation/use-chat-viewport.ts`: 대화 화면을 visualViewport 크기에 고정, `html.chat-lock`으로 뒤 페이지 잠금, 목록과 입력창 밖의 touchmove 막기. 목록은 `overscroll-contain`
  - 크로미움 폰 에뮬레이션에서 터치 드래그로 확인(페이지 scrollY 0 유지, 목록만 스크롤). 실제 아이폰 확인은 아직
- 목소리 개선 (사용자 선택: 무료로 최대한 개선)
  - `pickEnglishVoice`: 기기에 내려받은 애플 프리미엄·향상된 음성(voiceURI `com.apple.voice.premium|enhanced`, 이름의 Premium/Enhanced)을 두 설정 모두에서 최우선
  - 설정 > 음성에 "지금 쓰는 목소리" 표시와 고품질 음성 내려받는 방법 안내. iOS 메뉴 이름은 추정이라 사용자 확인 필요
- 사용자 피드백 반영 (2차)
  - 대화 화면: Enter 안내 문구 삭제, 마지막 내 말 `고치기`(내 말과 그 답을 지우고 입력창에 되돌림, `DELETE /api/sessions/[id]/turns/last`), 끝내기 창을 `종료`(피드백 없이 대화 삭제, `DELETE /api/sessions/[id]`, 진행 중 대화만) / `계속 대화하기` / `피드백 받기` 세 버튼으로
  - 설정: 부연 설명 삭제(`ProfileForm compact`), 계정 보안 섹션 삭제, 맨 아래 이메일 줄 대신 비밀번호 바꾸기·로그아웃 버튼. 저작권 표시 가운데 정렬
  - 인풋 장치 (사용자 선택: 둘 다)
    - 미션별 핵심 표현 5개 `src/server/missions/key-expressions.ts` (직접 작성, 책 내용 아님). 미션 화면, 대화 `표현 보기` 패널, 결과 화면 `써 본 표현 n/5`
    - 내 표현장 `/phrases` (Phrase 테이블, 마이그레이션 `add_phrasebook`, 최대 200개, 중복 거부). 대화 패널과 결과 화면에 표시
    - 사용 여부는 AI 판단이 아닌 글자 매칭 `src/shared/expressions.ts` (~는 빈칸, /는 대안, 순서대로 단어 단위 포함)
  - Speak Simple 책 내용은 저작권 때문에 앱에 넣지 않기로 함. 사용자가 배운 표현을 표현장에 직접 적는 방식
- 입력칸 글자 16px (`globals.css` `@utility input`): 아이폰 사파리는 16px 미만 입력칸을 누르면 화면을 확대해서 대화 화면 위아래 바가 밀려남. 예전 주석 "15px면 안 커짐"은 틀렸음
  - 손가락 확대 막음 (사용자 요청: 확대해도 위아래 바가 고정돼야 함). viewport `maximumScale 1, userScalable false`, `html { touch-action: pan-x pan-y }`, iOS용 `NoPinchZoom`(gesture 이벤트와 두 손가락 touchmove 차단). 대신 글씨를 키울 방법이 없어서 필요하면 글자 크기 설정 추가
- 대화 목록은 메시지가 하나여도 위아래로 끌리고 튕기게 (사용자 요청: 실제 메신저처럼). 목록 안 `<ol>`을 `min-h-[calc(100%+1px)]`로 항상 1px 넘치게 함. `touch-action: pan-x pan-y`는 html뿐 아니라 모든 요소에 (스크롤 영역은 상속받지 않음)
- 목소리 직접 고르기 (사용자 제보: 아이폰에 Ava 받고 시스템 기본 음성으로 바꿨는데 앱 목소리 그대로)
  - 시스템 기본 음성 설정은 웹 음성에 영향 없음. 앱은 `getVoices()` 목록에서 직접 고름
  - 설정 > 음성에 목소리 목록(영어만, 고품질 먼저)과 `들어 보기`. 선택값은 `voiceURI`로 localStorage에 저장, 그 기기에 없으면 자동 선택으로
  - 목록에 고품질이 없으면 "브라우저가 그 음성을 웹에 안 열어 줌" 안내. 사파리가 Ava를 넘겨주는지는 사용자 확인 대기
- Google Cloud TTS 목소리 (사용자 선택: Google. 아이폰 사파리는 받아 둔 Ava 프리미엄을 웹에 안 넘겨줌, 목록 6개가 모두 저용량)
  - 서버 `src/server/tts/google.ts`(REST, `X-Goog-Api-Key` 헤더, `GOOGLE_TTS_API_KEY`), `src/server/services/speech.ts`, `GET /api/speech?turnId|preview=1&voice=`
  - 내 대화의 AI 턴만 읽음(남의 것·내 말은 404), 사용자당 10분 40회, 응답 `Cache-Control: private, immutable`
  - 목소리 Chirp 3 HD `Aoede`(기본)·`Kore`·`Charon`·`Puck` (`src/shared/cloud-voices.ts`). 느리게는 클라이언트 `playbackRate`
  - 클라이언트: 공유 `<audio>` 하나, 보내기·마이크 탭에서 `primeAudio()`로 아이폰 자동 재생 허용. 실패하면 기기 음성으로 한 번만 전환
  - 키가 없으면 예전과 같음. 공식 가격: Chirp 3 HD 월 100만 글자 무료 (cloud.google.com/text-to-speech/pricing, 2026-11-03 확인)
  - **아직 확인 안 됨**: 사용자가 키를 Vercel에 넣은 뒤 실제 Google 응답, 아이폰 자동 읽기
- 저작권 표시 `© 2026 GWANG. All rights reserved.` (`src/features/ui/SiteFooter.tsx`)
  - 앱 화면, 로그인·가입·비밀번호 찾기, 온보딩 맨 아래. 대화 화면은 입력창과 겹쳐서 제외
- 로그인·가입 화면 정리: 제목 위 작은 문구("다시 오셨네요", "처음 시작하기")와 로그인 아래 데이터 안내 문장 삭제 (사용자 요청. 데이터 안내는 온보딩·설정에 남아 있음)
- 점검: `npm run typecheck`, `npm run lint`, `npm test`(39개), `npm run build` 모두 통과. 실제 Claude로 미션 → 결과 화면 확인

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
  - Vercel 함수 지역 `sin1` (응답 헤더 `x-vercel-id`의 `iad1::sin1`), GitHub 기본 브랜치 `main` (사용자 확인)
  - 마지막 배포 `ceacdeb`: 로그인 화면에 저작권 표시, 삭제한 문구 없음을 실제 사이트에서 확인 (main push 후 약 60초)
  - 배포 확인 팁: 로그인 없이 열리는 `/login` HTML에 바뀐 문구가 있는지로 확인. 로그인 뒤 화면만 바뀐 경우는 여기서 확인 불가 → 사용자에게 Vercel Deployments 확인 요청
- 아직 확인 안 됨 (사용자가 실제 기기로 확인)
  - **휴대폰 마이크 음성 입력**
  - **듣기 지연이 줄었는지** (사용자 기기: 아이폰 사파리, PC 크롬·엣지)
  - 아이폰 홈 화면 추가 시 별 아이콘과 이름 QUEST로 보이는지
  - 실제 사이트 결과 화면에 "근거 n문장"과 이유 한 줄이 나오는지 (예전 기록은 이유 없이 표시)

## 다음 할 일

1. 위 "아직 확인 안 됨" 항목의 사용자 테스트 결과를 받아 반영
2. 초보 학습자의 짧은 대화(8단어 미만)는 평가 보류돼 역량 기록이 안 남음. 기준 조정할지 사용자와 논의
3. (보류) 도메인 구매 → Vercel 연결 + Resend 도메인 인증 → `MAIL_FROM`. 사용자가 먼저 익숙해진 뒤 진행
4. `claude/friendly-tesla-oymvp0` 브랜치는 반영 안 하기로 함(Vercel은 `ANTHROPIC_API_KEY`라 필요 없음). 세션은 지정 브랜치 외 push가 403이라 삭제 못 함 → 사용자가 GitHub Branches에서 삭제

## 사용자에게 받은 결정

- 모델: 지금은 대화와 피드백 모두 Opus 5.5 (기본값). Max 플랜 월 $100 API 크레딧 안에서 사용
  - 측정값: Opus 미션 1회 약 $0.07, Haiku 약 $0.002. Haiku는 대화는 괜찮지만 대화 중 교정 팁이 없고 피드백 판정이 흔들림
  - `CLAUDE_PARTNER_MODEL`, `CLAUDE_FEEDBACK_MODEL`로 역할별 모델 분리 가능
- 음성은 무료 브라우저 기능 유지. 듣기 목소리는 C안(기본 내장 음성 + 설정으로 자연스러운 목소리)
- 도메인·다른 사람 공개는 사용자가 먼저 익숙해진 뒤에
- 홈 화면 앱 이름 QUEST, 아이콘은 메인 엠블럼
- 배포: 작업이 끝나고 검사를 통과하면 묻지 않고 바로 main에 머지하고 배포 확인까지 한다 (2026-11-03 사용자 지시. 예전 "말할 때만 배포"를 대체)

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
- 로컬 Postgres가 세션 중에 꺼질 수 있음. 테스트가 global-setup에서 실패하면 `service postgresql start`
- 이 세션은 지정된 작업 브랜치와 main(사용자 요청 시)에만 push 가능. 다른 원격 브랜치 삭제는 403
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
