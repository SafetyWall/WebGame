# CHANGELOG

## 2026-05-31
- **step3a — 스킬 골격.** 평타를 스킬로 통일(`SKILLS` 선언적 테이블), 근접/원거리 이진 태그 도입(데이터만 — step3b 근접회피가 소비), phys/magic `type` 제거. 엔진 행동 분기 `role` → `skill.kind`(`selectSkill(u)=u.skills[0]`). 기존 전투 거동·결정론 불변(base 대비 sim 출력 char-identical로 검증).
- 테스트 25→**31 통과**. 4-task TDD + task별 2단 리뷰(spec 준수 / 코드 품질) + 최종 전체 리뷰.

## 2026-05-30
- **베이스 ATB 평타 전투 엔진** + 직업5/몹2 데이터 테이블 + 헤드리스 시뮬 + 브라우저 UI 골격 (로드맵 step 1+2).
- 테스트 `node:test` **25 통과**. 어드버서리얼 리뷰(28에이전트) 반영: 라운드 스냅샷 중복 픽스, 광역 로그 적용값 일치, 동시틱=파티우선 의도 확정.
- 데미지 모델: 마법사 방어무시 **제거** → 전 타입 `공격−방어(최소1)` 동일.
- GitHub repo(`SafetyWall/WebGame`) 생성 + 초기 push.
- 문서 분리: 기획/프로그램/아트 → `project-docs/design/`, CLAUDE.md 슬림화. superpowers 임시 산출물 git 제외.
