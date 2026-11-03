# 작업 인수인계 (다음 세션용)

새 세션은 이 문서와 `CLAUDE.md`, `README.md`를 먼저 읽고 시작한다.
작업 브랜치: `claude/laughing-dirac-yd3y27` (main에는 아직 합치지 않음)

## 현재 상태

- 명세서 로드맵 1~4단계 완료: 텍스트 미션, 근거 기반 피드백, XP 원장, 복습, 추천, 성장 기록, 무료 음성(Web Speech API)
- 배포 전 정리 완료: 피드백 대기 진행 화면, 온보딩 레벨 확인(선택 5문항), API 크레딧 소진(402) 안내
- 디자인: 구조는 Lumora, 분위기는 Flowstate (검은 바탕 + WebGL 잉크 배경, 흰 알약 버튼)
  - 잉크 모드: 로그인 `hero`, 일반 화면 기본(어둡게), 대화/결과 `calm`
- 점검: `npm run typecheck`, `npm run lint`, `npm test`(24개), `npm run build` 모두 통과

## 다음 할 일 (사용자 확정 순서)

1. **비밀번호 재설정** (사용자가 넣기로 결정)
   - 메일 발송 서비스가 필요하다. 후보: Resend 무료 구간 (조건 미확인, 확인 후 사용자에게 안내)
   - 메일 발송은 서버 어댑터 뒤에 두고, 키가 없으면 개발용으로 콘솔에 재설정 링크만 출력
   - 토큰: 무작위 값의 해시만 DB 저장, 1회용, 30분 만료, 사용 시 기존 로그인 세션 모두 폐기
   - 존재하지 않는 이메일에도 같은 응답 (계정 존재 여부 노출 금지), 요청 속도 제한
2. **배포** (5단계): Vercel + Postgres(Neon 등). 계정 생성과 연결은 사용자가 직접 함
   - `prisma/schema.prisma` provider를 `postgresql`로, 마이그레이션 방식 정리
   - 휴대폰에서 마이크를 쓰려면 HTTPS가 필요해서 배포(또는 터널)가 있어야 함
3. main으로 합치는 PR (사용자가 요청하면)

## 사용자에게 받은 결정

- 모델: 지금은 대화와 피드백 모두 Opus 5.5 (기본값). Max 플랜 월 $100 API 크레딧 안에서 사용
  - 측정값: Opus 미션 1회 약 $0.07, Haiku 약 $0.002. Haiku는 대화는 괜찮지만 대화 중 교정 팁이 없고 피드백 판정이 흔들림
  - `CLAUDE_PARTNER_MODEL`, `CLAUDE_FEEDBACK_MODEL`로 역할별 모델 분리 가능
- 음성은 무료 브라우저 기능 유지. 사용자가 실제 기기에서 음성 테스트 예정 (결과 받으면 반영)

## 이 환경에서 알아둘 점

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
