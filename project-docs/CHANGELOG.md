# CHANGELOG

## 2026-05-31
- **조우 생성 시스템.** 시드 PRNG(`engine/rng.js`, mulberry32) → `generateEncounter(stage, rng)`: 풀에서 랜덤 몹 × `levelCurve(level)×계수` + 스테이지 슬롯별 distinct 랜덤 특성. flat `MOBS` → 레벨형 `MONSTERS`(계수)+`curve`+`stages` 교체, 트레잇에 rarity. 면역(mult0)=진짜 0뎀 floor 수정. 전투는 결정론 유지(조우만 시드 랜덤) → sim = 스테이지×시드 trial 분포. 엔진 테스트는 `tests/_fixtures.js`로 밸런스 데이터 디커플. 테스트 54→**71**. (밸런스 수치 placeholder — 시뮬상 3유닛 파티가 S4+ 전멸, 튜닝 대상.)
- **step3b — 몹 트레잇 = 범용 규칙엔진.** 트레잇 = 선언적 규칙 `{trigger, cond, op, value, priority, exclusive}`. 인터프리터 `applyRules`가 priority 오름차순 파이프라인 적용(mult/add 변환, heal/reflect side-effect, exclusive 중단). 어휘 전체(3 trigger·4 op·2 cond) 구현 + §7.2 5종 정의, **라이브 부착 = 근접회피(가시거북, 근접 −30%)만**. RPS 레버 작동 확인(sim: 가시거북 vs 원거리 500틱 vs 근접 1334틱; 오우거 광역엔 원거리 패 — 반대 카운터). 결정론·트레잇 없는 몹 거동 불변.
- 테스트 31→**54 통과**. 6-task TDD + task별 2단 리뷰 + reflect 0-클램프 수정 + 최종 전체 리뷰.
- **step3a — 스킬 골격.** 평타를 스킬로 통일(`SKILLS` 선언적 테이블), 근접/원거리 이진 태그 도입(데이터만 — step3b 근접회피가 소비), phys/magic `type` 제거. 엔진 행동 분기 `role` → `skill.kind`(`selectSkill(u)=u.skills[0]`). 기존 전투 거동·결정론 불변(base 대비 sim 출력 char-identical로 검증).
- 테스트 25→**31 통과**. 4-task TDD + task별 2단 리뷰(spec 준수 / 코드 품질) + 최종 전체 리뷰.

## 2026-05-30
- **베이스 ATB 평타 전투 엔진** + 직업5/몹2 데이터 테이블 + 헤드리스 시뮬 + 브라우저 UI 골격 (로드맵 step 1+2).
- 테스트 `node:test` **25 통과**. 어드버서리얼 리뷰(28에이전트) 반영: 라운드 스냅샷 중복 픽스, 광역 로그 적용값 일치, 동시틱=파티우선 의도 확정.
- 데미지 모델: 마법사 방어무시 **제거** → 전 타입 `공격−방어(최소1)` 동일.
- GitHub repo(`SafetyWall/WebGame`) 생성 + 초기 push.
- 문서 분리: 기획/프로그램/아트 → `project-docs/design/`, CLAUDE.md 슬림화. superpowers 임시 산출물 git 제외.
