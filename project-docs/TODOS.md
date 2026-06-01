# TODOS

## 타겟팅 시스템 (2026-06-01 brainstorm)
- [x] **Phase 1 — 앞열 타겟팅.** 몹=앞열 첫 생존자(도발 override), `reorderParty`+UI. (→ CHANGELOG 2026-06-01)
- [ ] **Phase 2 — 위협도 스코어 일반화.** `selectMobTarget` → `threatScore=Σ factor×weight`(factor: 위치/저체력/atk/range/누적뎀), 디폴트=위치 지배(Phase1 등가). **몹 트레잇/스킬이 weight 변조** = 다양성: `저체력추적`·`강타추적`·`후열관통`·광역. 도발=weight 폭증 특수케이스 흡수. 선언적 규칙(`applyRules` 철학). 신직업(궁수·도적) 정체성을 factor/weight로. (spec: `docs/superpowers/specs/2026-06-01-targeting-threat-system-design.md`)

## 다음 마일스톤 (로드맵 step 3~)
- [x] **step3a — 스킬 골격.** 평타=스킬, 근/원 태그(데이터), `type` 제거, 엔진 `skill.kind` 분기. (완료 → CHANGELOG 2026-05-31)
- [x] **step3b — 몹 트레잇 규칙엔진.** 범용 `applyRules`(trigger/cond/op/priority/exclusive), TRAITS 5종 정의, 라이브 = 근접회피(가시거북). (완료 → CHANGELOG 2026-05-31)
- [x] **조우 생성 시스템.** 시드 랜덤 몹+특성(절차 생성), MONSTERS/curve/stages, 면역 floor 수정. (완료 → CHANGELOG 2026-05-31)
- [~] **트레잇 확장.** ✅ `ranged_immune`(영웅) + `regeneration`(전설) 추가, ✅ **상호배제 룰** `conflicts()`(§7.2 전딜봉쇄 금지), ✅ 반사 killing-blow 핀, ✅ 자가회복/반사/면역/저항은 스테이지 슬롯(희귀/영웅)으로 이미 배치됨. **결정**: 광역(`mob.aoe`)은 엔진 네이티브 유지(트레잇 흡수 안 함) — 표기만 트레잇과 통합. **잔여**: 일반몹 variety(현 슬라임/가시거북 2종 — 추가 일반몹), 트레잇별 RPS 시뮬 측정(밸런스). (→ CHANGELOG 2026-06-01)
- [x] **전직 리워크.** 전직=레벨업(자동 +1), 노비스는 전직레벨(L1)에서만·강화 불가, persist v2. (→ CHANGELOG 2026-06-01)
- [ ] **보스 스테이지 배치.** `BOSSES`(오우거·드래곤) 정의·생성 가능(`generateEncounter(stage,rng,monId)`)하나 어느 스테이지에 노출할지 미정 — `STAGES.boss` 필드 도입 + 배치 결정 필요(사용자 결정 대기).
- [x] **step4 — 성장 경제.** (→ CHANGELOG 2026-05-31)
- [x] **step5 — 스킬(우선순위+마나/쿨 + effect 지속).** (완료 → CHANGELOG 2026-06-01)
- [x] **step5b — 플레이어 스킬 우선순위 재배열 UI.** roster `skillOrder` + `reorderSkill(▲▼)`. (완료 → CHANGELOG 2026-06-01)
- [ ] step6 — 상호작용 동사(마법사 방깎부터). **보류: 디자인 분기**(방깎=몹 def↓ 전체 vs 근접한정 amp) → brainstorm 필요.
- [ ] step7 — 스킬 레벨업. step8 — 2차 전직 트리(전직 리워크가 `PROMOTE_LEVEL` 토대 마련). step9 — 속성 degree화. step10 — (선택) 유물. **전부 새 시스템/디자인 분기 → 단계별 brainstorm 필요.**

## 스테이지 확장 + 밸런스 (2026-06-01 사용자 방향)
- [ ] **스테이지 ~20 확장.** 현 `STAGES`=1~5 수기 테이블(6+ = `cfg.level` undefined 크래시). **절차생성 `stageCfg(s)→{level, traitSlots, reward}`** 추천(장기 목표 50~100, 재작업 0). 난이도 곡선·트레잇 밀도(슬롯+레어도 floor)·온보딩 구간(S1~3 관대) 설계 = brainstorm.
- [ ] **econ-sim (런루프 밸런스 측정).** 현 sim=전투 승률만(고정 레벨·노비스 미모델·골드경제 미측정). 런루프(newRun→소비정책→fight→next, 시드 반복)로 **사망 스테이지 분포** 측정 → "초반 사망 트레잇 vs 경제 어느쪽 지배" 가름. 소비정책=그리디 1개 가정 명시. **목표선: 무뇌플레이=실패, 성장투자=클리어** 측정 확정.
- [ ] **클래스 수치 정체성.** 마법사=유리대포지만 느린 한방, 전사 DPS 패리티(물/마공 구분 없음 보정). 원거리저항 하드락 = 앞열타겟(Phase1)으로 완화됐으나 수치 재확인. → econ-sim 측정 기반.

## 베이스 후속
- [ ] **밸런스 튜닝**(요청으로 이번엔 미수행) — `curve`/`monsters`(계수)/`stages`(슬롯) + 스킬 수치(power/cost/cd/MANA) + 신규 트레잇/보스 수치 placeholder 확정. 보스 분리 후 sim(2026-06-01) = 일반풀(슬라임/가시거북)만이라 승률 상승. 트레잇별 RPS 갈림(§8 검증기준 3) 측정.
- [ ] 마법사 차별점 재설계(방무시 제거로 niche 약화 → 향후 동사). **보류: step6 동사와 함께 brainstorm.**

## 방어적 가드 (해당 단계 들어올 때)
- [x] 빈 파티 / 전원 사망 입력 = 즉시 몹 승(틱0). (완료 → CHANGELOG 2026-06-01)
- [ ] speed ≥ 1000 게이지 오버플로(현재 틱당 1행동) — 속도 버프(신규 effect type) 들어올 때. (트리거 아직 없음 → 보류.)
