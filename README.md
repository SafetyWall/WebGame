# WebGame — 성장형 파티빌더 RPG

랜덤 적에 맞춰 **재화로 파티를 키우는** ATB(틱 기반) 자동전투 싱글 로그라이크. 텍스트 기반, 정적 웹.
깊이의 출처 = 성장 선택의 다축 트레이드오프 + 직업 간 카운터 관계망.

## 빠른 시작
```bash
serve.bat          # 로컬 서버 + 브라우저 자동오픈 → 직접 플레이 (= npm run serve)
node --test        # 테스트
```
플레이(웹): GitHub Pages. 명령 상세(시뮬·배포 등) → [project-docs/runbook.md](project-docs/runbook.md).

## 상태
**플레이 가능** — 인터랙티브 런 루프(영입/강화/전직[=레벨업]/슬롯확장/선발/스킬 우선순위 재배열 → 자동전투 → 진행 / 패배 리셋, localStorage 영속). 전투 엔진 + 몹 트레잇 RPS(상호배제) + 절차적 조우 생성(일반/보스 몹 분리) + 직업별 스킬(마나/쿨 발동·effect 지속) 완료. → [CHANGELOG](project-docs/CHANGELOG.md) / [TODOS](project-docs/TODOS.md).

## 문서
- **기획** (게임 디자인) → [project-docs/design/game-design.md](project-docs/design/game-design.md)
- **프로그램** (아키텍처·엔진 계약) → [project-docs/design/program.md](project-docs/design/program.md)
- **아트/UI** → [project-docs/design/art.md](project-docs/design/art.md)
- **명령** (빌드·실행·테스트·배포) → [project-docs/runbook.md](project-docs/runbook.md)
