# TODOS

## UI/UX 개편 (2026-06-03 완료 → CHANGELOG)
component+store 프레임워크로 교체. spec = `docs/superpowers/specs/2026-06-03-ui-overhaul-design.md`.
- [x] **캐릭터 카드 + 1열/2열 토글**(폭 고정) / **스킬 2×2 pill** / **click·tap 툴팁**(적 특성·광역) / **pointer 드래그**(출전순서·우선순위) / **상세 모달**. (→ CHANGELOG 2026-06-03)
- [x] **전투 재생뷰(2026-06-03).** `runBattle({record})` 액션단위 frame + `BattleStage` + 전체로그 접이식. (→ CHANGELOG)
- [x] **재생뷰 UX·명명 버프·스킬 상세 팝업 개편(2026-06-06).** 행동/피격 강조 + #번호 badge + 배속 1/2/3× + 몹 상단·특성 / 슬스식 명명 버프 키워드(`status.js`, 정밀 표기) / `SkillDetailModal`(코어+부여효과+레벨업변화, 클릭 위치 팝업) / 평타="기본 공격" / **우선순위 드래그 버그 수정**(`.prio-item.dragging` pointer-events). (→ CHANGELOG 2026-06-06)
- **잔여(실측, 브라우저):** 실기기 터치 드래그·sticky-hover 거동, 스킬 상세 팝업 위치(가장자리 클램프). (시각 스크린샷·드래그 재배열·콘솔 = 도그푸드 확인됨.)
- **미래:** 캐릭터 애니메이션/이펙트 = `BattleStage`만 render 타깃 교체(update 타깃패치 or CanvasStage). frame 입도 조정(틱 단위).

### UI 개편서 갈린 데이터 결정
- [x] **가디언 도발 제거** — 확인 결과 `JOBS.guardian.skills`에 이미 없음(키트=4액티브, CHANGELOG 2026-06-01서 제거). 추가 작업 불필요. (taunt 메커니즘은 SKILLS·엔진 유지.)

## 타겟팅 시스템 (2026-06-01 brainstorm)
- [x] **Phase 1 — 앞열 타겟팅.** 몹=앞열 첫 생존자(도발 override), `reorderParty`+UI. (→ CHANGELOG 2026-06-01)
- [x] **Phase 2 — 위협도 스코어 일반화.** `engine/threat.js` factor 가중합(위치/저체력/atk), 디폴트=위치 지배(Phase1 등가). 몹 트레잇 `targeting` 메타가 weight 변조. 도발=보너스 흡수. 데모 = 저체력추적(일반)·후열관통(희귀). (→ CHANGELOG 2026-06-01)
  - **잔여(Phase 2+):** 강타추적(`{atk:1}`) 메커니즘 지원되나 미배치. `range`/`누적뎀(aggro)` factor 미도입. 신직업(궁수·도적) 정체성 weight. **weight 정밀 튜닝 = econ-sim 후.**

## 스킬 시스템 리워크 (2026-06-01 brainstorm, spec: docs/superpowers/specs/2026-06-01-skill-system-rework-design.md)
- [x] **P1 토대** — 레벨10·직업마나·경제리워크·스킬레벨스케일·학습/레벨업·기존메커닉 신규스킬·사제평타원거리·persist v3. (→ CHANGELOG)
- [ ] **신규 메커닉 (순차, 각 조각=구현→테스트→커밋/푸시):**
  - [x] 속도 effect(게이지 속도 mod + 오버플로 가드=틱당 다중행동) → 강화·빙결 (속박사격=궁수 때). (→ CHANGELOG)
  - [x] DoT(지속 데미지, 시전자 atk 비례) → 출혈(도적, 미배선=P11). (→ CHANGELOG)
  - [x] 파티 전체 타겟(target 'allies') → 파티힐·파티뎀버프 (사제 키트 완성). (→ CHANGELOG)
  - [x] intercept(최저체력 아군 대신 받기) → 수호. (→ CHANGELOG)
  - [x] 유닛 데미지 반사(reflect effect) → 가시방패. (→ CHANGELOG)
  - [x] 멀티히트(skill.hits N회 타격, 각 히트 on-hit 발동) → 더블어택·연사(미배선=P11). (→ CHANGELOG)
  - [x] mark(피격시 추가뎀, 시전자 atk 비례 스냅샷) → 라이트닝 (마법사 키트 완성). (→ CHANGELOG)
  - [x] 방어무시(skill.ignoreDef) → 방어무시딜(도적, 미배선=P11). (→ CHANGELOG)
  - [x] 스턴(게이지 프리즈+행동불가) → 분쇄 (전사 키트 완성). (→ CHANGELOG)
  - [x] 신규직업 **도적**(출혈/속도/더블어택/방어무시) + **궁수**(조준사격/연사/방어구관통/속박사격) — 정의·전직경로·배선. (→ CHANGELOG)
- [~] **파워커브 튜닝** — ✅ econ-sim(`sim/econ-sim.js`) 구축, START_GOLD 20·곡선 완화로 풀투자 중앙값 S19·클리어 6/30. **잔여**: 직업/트레잇별 RPS 미세조정, 실플레이 검증, lazy-정책 대조(무투자 즉사 확인).
- [ ] **4-스킬 보유 캡 미강제** — learnSkill이 직업 액티브 무제한 학습 허용(가디언 5개 등). 캡 강제할지 = 배치질문.

### 배치 질문 (작업 일단락 후)
- [x] **가디언 도발 제거 확인(2026-06-03).** `JOBS.guardian.skills`=무기파괴·방벽·가시방패·수호+평타 = 액티브4(2×2 딱). 도발(`guardian_taunt`)은 SKILLS 정의에만 잔존(메커니즘 유지, 미배치). → 추가 작업 없음.
- 사제 평타 원거리딜 전환 → 사제 정체성(딜 기여) 재확인.
- 신규직업 도적·궁수 영입/전직 경로(노비스 전직 대상 추가?).

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

## 특성 리워크 + 밸런스 (2026-06-07, 활성)
- [x] **특성 1차 + 스테이지 50.** 일반=스탯강화(맹공/철갑/강골/쾌속), 회피·저항=일반, 저체력·고공격력추적=희귀, 면역=영웅. `SLOT_SEQ`(10스테마다 일반/희귀/일반/영웅/희귀), MAX_STAGE 50. econ-sim stale 수정. (→ CHANGELOG 2026-06-07)
- [ ] **특성 2차 (신규 엔진 필요).** 연타봉쇄(멀티히트 첫 히트만) · 지속(DoT)면역/저항 · 디버프면역/저항 · 힐봉쇄/약화(플레이어 받는 회복↓, **흡혈 제외**) · 흡혈(준뎀%回) · 광역 트레잇화(균등 저%/스플래시 주풀+그외%) · 마나억제·게이지지연(템포). 풀·등급 = game-design §7.2.
- [ ] **곡선 완화 (다음 큰 밸런스).** `levelCurve` ×1.15/레벨 지수 → **풀투자도 S28서 전멸(클리어 0/30, econ-sim)**. 50스테 완주 가능하게 곡선·보상·플레이어 파워원(2차전직 등) 재설계. **눈대중 금지, econ-sim 측정 기반.**
- [ ] **별도 시스템(스폰됨).** ① **몬스터 스킬** — 능동 디버프·넉백·힐(effect 엔진 재활용, 플레이어 스킬 거울). ② **플레이어 방어도 복귀** — 직업 def 테이블 + 데미지식(`공−방`) 플레이어쪽 활성 + 리밸런스 + 관통 트레잇. 둘 다 brainstorm/scope 필요.
- [ ] **일반몹 variety** — 현 슬라임/가시거북 2종 → 추가(스탯 mul만 다른 풀 확장).
- [ ] **클래스 수치 정체성.** 마법사=유리대포 느린 한방, 전사 DPS 패리티. → econ-sim 측정 기반.

## 베이스 후속
- [ ] **밸런스 튜닝**(요청으로 이번엔 미수행) — `curve`/`monsters`(계수)/`stages`(슬롯) + 스킬 수치(power/cost/cd/MANA) + 신규 트레잇/보스 수치 placeholder 확정. 보스 분리 후 sim(2026-06-01) = 일반풀(슬라임/가시거북)만이라 승률 상승. 트레잇별 RPS 갈림(§8 검증기준 3) 측정.
- [ ] 마법사 차별점 재설계(방무시 제거로 niche 약화 → 향후 동사). **보류: step6 동사와 함께 brainstorm.**

## 방어적 가드 (해당 단계 들어올 때)
- [x] 빈 파티 / 전원 사망 입력 = 즉시 몹 승(틱0). (완료 → CHANGELOG 2026-06-01)
- [ ] speed ≥ 1000 게이지 오버플로(현재 틱당 1행동) — 속도 버프(신규 effect type) 들어올 때. (트리거 아직 없음 → 보류.)
