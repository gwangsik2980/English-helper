# ENGLISH QUEST

생활 속 상황 미션(카페 주문, 길 묻기, 회의 일정 변경 등)에서 AI 상대와 영어로 대화하고, 실제 발화를 근거로 한 피드백과 성장 기록을 받는 반응형 웹앱입니다.

현재 구현 범위는 명세서 로드맵 **1~4단계**(제품 골격, 텍스트 MVP, 학습 피드백, 음성)입니다. 출시 준비(5단계)는 아직 없습니다.

## 빠르게 실행하기

PostgreSQL이 필요합니다. 로컬에 없으면 Docker로 띄울 수 있습니다.

```bash
docker run -d --name eq-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
```

```bash
docker exec eq-postgres psql -U postgres -c "create database english_quest" -c "create database english_quest_test"
```

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

- `npm run db:setup`은 마이그레이션(`prisma/migrations`)을 적용하고 미션을 시드합니다.
- 스키마를 바꿀 때는 `npm run db:migrate -- --name 변경내용`으로 새 마이그레이션을 만듭니다.
- 테스트는 `english_quest_test` DB를 매번 비우고 다시 만듭니다. 다른 DB를 쓰려면 `TEST_DATABASE_URL`을 지정하되, 이름이 `_test`로 끝나지 않으면 실행을 거부합니다.

http://localhost:3000 에서 회원가입하면 바로 쓸 수 있습니다.

### 데모 모드와 Claude 모드

| 모드 | 조건 | 상대역 | 피드백 | 비용 |
|---|---|---|---|---|
| 데모 | `ANTHROPIC_API_KEY` 비어 있음 | 미션별로 정해진 대사 | 키워드·규칙 기반 판정 | 없음 |
| Claude | `.env`에 `ANTHROPIC_API_KEY` 설정 | Claude가 역할극 | Claude가 구조화된 JSON으로 분석 | API 사용량만큼 과금 |

모델은 기본 `claude-opus-5-5`이고, `.env`의 `CLAUDE_MODEL`로 바꿀 수 있습니다. 대화 상대와 피드백 분석을 다른 모델로 돌리려면 `CLAUDE_PARTNER_MODEL`, `CLAUDE_FEEDBACK_MODEL`을 따로 지정합니다. 데모 모드에서는 화면 상단에 노란 안내 띠가 보입니다.

### 음성

브라우저 내장 Web Speech API를 써서 추가 비용이 없습니다. 말하기(음성 인식)는 Chrome, Edge, Safari에서 되고 Firefox에서는 안 됩니다. 듣기(소리로 읽기)는 대부분의 브라우저에서 됩니다. 음성은 서버로 오지 않고, 받아 적은 문장과 인식 확신도만 저장합니다. 확신도가 0.5 미만이고 사용자가 고치지 않은 문장은 평가에서 뺍니다.

### 비밀번호 재설정

로그인 화면의 "비밀번호를 잊으셨나요?"에서 재설정 링크를 메일로 받습니다.

| 조건 | 동작 |
|---|---|
| `RESEND_API_KEY` 비어 있음, 개발 서버 | 메일 대신 서버 콘솔에 재설정 링크 출력 |
| `RESEND_API_KEY` 비어 있음, 운영 | 메일을 보내지 않고 경고만 남김 (링크는 로그에 남기지 않음) |
| `RESEND_API_KEY` 설정 | Resend로 발송. `MAIL_FROM`은 Resend에서 인증한 도메인 주소여야 함 |

- 링크는 30분 동안 1회만 쓸 수 있고, DB에는 토큰의 SHA-256 해시만 저장합니다.
- 새 링크를 요청하면 이전 링크는 바로 만료됩니다.
- 비밀번호를 바꾸면 모든 기기의 로그인 세션이 끊깁니다.
- 가입 여부와 상관없이 같은 응답을 주고, 실제 조회와 발송은 응답 뒤(`after`)에 해서 응답 시간으로도 구분되지 않게 했습니다.
- 속도 제한: IP당 15분 5회, 계정당 1시간 3통.
- 로그인한 상태에서는 설정 > 계정 보안에서 지금 비밀번호를 확인한 뒤 바꿀 수 있습니다. 이 기기는 로그인이 유지되고 다른 기기 로그인과 남아 있던 재설정 링크는 무효가 됩니다.
- 운영에서는 `APP_URL`이 꼭 있어야 합니다. 요청의 Host 헤더로 링크를 만들면 공격자가 링크 주소를 자기 도메인으로 바꿀 수 있어서입니다.

## 배포 (Vercel + Neon)

1. Neon 프로젝트 연결 정보는 `neon.ts`(서비스 선언, Postgres만 사용)와 `.neon`(로컬 링크, git 제외)에 있습니다. `neon login` 후 `neon deploy`를 실행하면 `.env`에 연결 문자열이 들어옵니다.
2. Vercel 환경 변수에 아래 값을 넣습니다.
   - `DATABASE_URL`: Neon pooled 연결 문자열 (호스트에 `-pooler`가 있는 것)
   - `DATABASE_URL_UNPOOLED`: Neon direct 연결 문자열 (마이그레이션용)
   - `APP_URL`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `MAIL_FROM`
3. Vercel은 `vercel-build` 스크립트로 빌드합니다. 마이그레이션 적용, 미션 시드, `next build` 순서입니다.

DB 연결은 Prisma가 `pg`(node-postgres) 풀을 `@prisma/adapter-pg`로 쓰고, `@vercel/functions`의 `attachDatabasePool`로 Vercel이 쉬는 인스턴스의 연결을 정리하게 했습니다. Neon 가이드의 Vercel 권장 방식입니다.

Claude를 부르는 API(대화 턴, 미션 완료)는 `maxDuration = 60`으로 최대 60초까지 기다립니다. 2026-11-03에 Opus로 한 번 재 보니 대화 턴은 2~3초, 피드백 분석은 약 12초였습니다. Vercel 무료 플랜 기본 한도 10초는 넘기 때문에 이 설정이 필요합니다.

## 구조

```
prisma/schema.prisma        데이터 모델 (명세 8장)
prisma/seed.ts              미션 시드
src/app/                    페이지와 API 라우트 (명세 9장 경로)
src/features/               화면 컴포넌트 (missions, conversation, voice, progress, profile, settings)
src/server/ai/              LLM 어댑터: ports.ts(인터페이스), claude.ts, mock.ts(데모), prompts.ts
src/server/mail/            메일 어댑터: resend.ts, console.ts(개발용)
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
- 이메일 인증, OAuth 로그인 없음
- IP 기준 속도 제한이 서버 메모리 기반이라 서버를 여러 대 띄우면 각각 따로 셈. 또 `x-forwarded-for`를 그대로 믿으므로 프록시 뒤가 아니면 우회 가능 (비밀번호 재설정의 계정당 제한은 DB 기준이라 영향 없음)
- 데모 모드 상대역은 정해진 대사를 순서대로 말하므로 사용자 답에 반응하지 못함
- 미션 문구와 힌트는 초안이라 검수 필요
