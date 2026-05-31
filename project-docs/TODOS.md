# TODOS

## 다음 마일스톤 (로드맵 step 3~)
- [x] **step3a — 스킬 골격.** 평타=스킬, 근/원 태그(데이터), `type` 제거, 엔진 `skill.kind` 분기. (완료 → CHANGELOG 2026-05-31)
- [x] **step3b — 몹 트레잇 규칙엔진.** 범용 `applyRules`(trigger/cond/op/priority/exclusive), TRAITS 5종 정의, 라이브 = 근접회피(가시거북). (완료 → CHANGELOG 2026-05-31)
- [x] **조우 생성 시스템.** 시드 랜덤 몹+특성(절차 생성), MONSTERS/curve/stages, 면역 floor 수정. (완료 → CHANGELOG 2026-05-31)
- [ ] **트레잇 확장.** 자가회복/반사/면역/저항을 스테이지 슬롯에 실제 배치(현재 일반=회피/저항만 초반 등장). 전설 tier 트레잇 추가. 광역(`mob.aoe`) 트레잇 흡수 여부. ranged_immune 생기면 **상호배제 룰**(§7.2 전딜봉쇄 금지). 반사 killing-blow 의미. (면역 floor·근접면역 mult0=0뎀은 해결됨.)
- [x] **step4 — 성장 경제.** 코어 루프 + **전직(비가역·레벨유지)·슬롯확장(체증)·localStorage 영속·결과 이중헤더 제거·풀파티 출전버튼 disabled** 전부 완료. (→ CHANGELOG 2026-05-31)
- [x] **step5 — 스킬(우선순위+마나/쿨 + effect 지속).** 직업당 스킬1, effect 시스템(`engine/effects.js`), 데미지 배율 합성, 도발=스킬, 노비스=평타만. (완료 → CHANGELOG 2026-06-01)
- [ ] step5b — 플레이어 스킬 우선순위 재배열 UI(현재 데이터 순서 고정).
- [ ] step6 — 상호작용 동사(마법사 방깎부터).
- [ ] step7 — 스킬 레벨업. step8 — 2차 전직 트리. step9 — 속성 degree화. step10 — (선택) 유물.

## 베이스 후속
- [ ] **밸런스 튜닝** — `curve`/`monsters`(계수)/`stages`(슬롯) + 스킬 수치(power/cost/cd/MANA) placeholder 확정. 시뮬(2026-06-01): L1 후반 가파름(S4~5 ≈0/30), L3는 S5 9~22/30·조합별 갈림(근접 최약·딜조합 최강). 트레잇별 RPS 갈림(§8 검증기준 3)도 측정.
- [ ] 마법사 차별점 재설계(방무시 제거로 niche 약화 → 향후 동사).

## 방어적 가드 (해당 단계 들어올 때)
- [ ] 빈 파티 / 전원 사망 입력 처리(현재 vacuous 몹승) — 경제·선발 단계(step4)에서.
- [ ] speed ≥ 1000 게이지 오버플로(현재 틱당 1행동) — 속도 버프(`dmgTaken`/`dmgDealt`/`taunt`/`hot` 외 신규 effect type) 들어올 때.
