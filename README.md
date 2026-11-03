# ENGLISH QUEST

생활 속 상황 미션(카페 주문, 길 묻기, 회의 일정 변경 등)에서 AI 상대와 영어로 대화하고, 실제 발화를 근거로 한 피드백과 성장 기록을 받는 반응형 웹앱입니다.

현재 구현 범위는 명세서 로드맵 **1~4단계**(제품 골격, 텍스트 MVP, 학습 피드백, 음성)입니다. 출시 준비(5단계)는 아직 없습니다.

## 빠르게 실행하기

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

http://localhost:3000 에서 회원가입하면 바로 쓸 수 있습니다.

### 데모 모드와 Claude 모드

| 모드 | 조건 | 상대역 | 피드백 | 비용 |
|---|---|---|---|---|
| 데모 | `ANTHROPIC_API_KEY` 비어 있음 | 미션별로 정해진 대사 | 키워드·규칙 기반 판정 | 없음 |
| Claude | `.env`에 `ANTHROPIC_API_KEY` 설정 | Claude가 역할극 | Claude가 구조화된 JSON으로 분석 | API 사용량만큼 과금 |

모델은 기본 `claude-opus-5-5`이고, `.env`의 `CLAUDE_MODEL`로 바꿀 수 있습니다. 대화 상대와 피드백 분석을 다른 모델로 돌리려면 `CLAUDE_PARTNER_MODEL`, `CLAUDE_FEEDBACK_MODEL`을 따로 지정합니다. 데모 모드에서는 화면 상단에 노란 안내 띠가 보입니다.

### 음성

브라우저 내장 Web Speech API를 써서 추가 비용이 없습니다. 말하기(음성 인식)는 Chrome, Edge, Safari에서 되고 Firefox에서는 안 됩니다. 듣기(소리로 읽기)는 대부분의 브라우저에서 됩니다. 음성은 서버로 오지 않고, 받아 적은 문장과 인식 확신도만 저장합니다. 확신도가 0.5 미만이고 사용자가 고치지 않은 문장은 평가에서 뺍니다.

## 구조

```
prisma/schema.prisma        데이터 모델 (명세 8장)
prisma/seed.ts              미션 시드
src/app/                    페이지와 API 라우트 (명세 9장 경로)
src/features/               화면 컴포넌트 (missions, conversation, voice, progress, profile, settings)
src/server/ai/              LLM 어댑터: ports.ts(인터페이스), claude.ts, mock.ts(데모), prompts.ts
src/server/services/        도메인 규칙: 세션, 피드백 검증, XP 원장, 복습, 추천, 계정
src/server/missions/        미션 카탈로그 초안 8개
src/shared/schemas/         요청·응답·AI 결과 스키마 (zod)
tests/                      서비스 단위·통합 테스트
```

## 점검 명령

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 알려진 한계

- 음성 인식 품질과 지원 여부가 브라우저마다 다름 (Firefox는 말하기 불가, 텍스트로 대체)
- 발음 평가 없음 (명세서 7.4: 음성 분석 없이 전사 결과만으로는 평가하지 않음)
- 온보딩 레벨 확인은 선택형 5문항뿐이라 잠정 추천 수준 (짧은 대화형 진단은 없음)
- 이메일 인증, 비밀번호 재설정, OAuth 로그인 없음
- 속도 제한이 서버 메모리 기반이라 서버를 여러 대 띄우면 각각 따로 셈
- 데모 모드 상대역은 정해진 대사를 순서대로 말하므로 사용자 답에 반응하지 못함
- 미션 문구와 힌트는 초안이라 검수 필요
- SQLite로 개발. 배포 시 `prisma/schema.prisma`의 provider를 `postgresql`로 바꿔야 함
