# Runbook — 빌드 / 실행 / 테스트 / 배포

> 명령의 **단일 출처**. AI는 명령을 추론하지 말고 여기서만 읽음.

## 환경
- Windows 10, PowerShell. Node v24.13 (≥18 필요). 외부 의존성 0 (npm install 불필요).
- git 설치됨. 원격: `https://github.com/SafetyWall/WebGame.git` (branch `main`).

## 사전 준비
- 1회성 설치 없음(의존성 0). 첫 `git push`만 github.com 인증 필요(Git Credential Manager 브라우저 로그인).

## 빌드
- **빌드 단계 없음.** 정적 ES 모듈을 그대로 배포. 산출물 = `index.html` + `src/` 모듈(번들·컴파일·codegen 없음).

## 실행
```bash
# 헤드리스 시뮬 (밸런스 측정)
node sim/sim.js
```
- 브라우저 플레이: GitHub Pages URL(아래 배포). `file://` 더블클릭은 ES모듈 CORS로 막힘 → Pages 또는 로컬 정적서버(미구현, 필요시 추가).

## 테스트
```bash
node --test                      # 전체
node --test tests/battle-run.test.js   # 단일 파일
```

## 배포
| 산출물 | 대상 | 방법 |
|---|---|---|
| 정적 사이트(index.html+src) | GitHub Pages | repo Settings → Pages → Source: `main` / `(root)` → 저장 |
- URL: `https://safetywall.github.io/WebGame/`. push하면 Pages 자동 재빌드.

## 디버깅
- 테스트 실패 → `node --test` 출력의 ✘ 항목.
- 시뮬 이상 → `node sim/sim.js` 콘솔(매치업별 승/패·킬틱).
- 브라우저 안 뜸 → ES모듈 CORS(file:// 금지, http로 서빙해야).
