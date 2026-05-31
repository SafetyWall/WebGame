# 프로그램 — 아키텍처 / 엔진 계약

> 코드가 "어떻게" 돌아가는지의 owner. 게임 규칙(무엇/왜)은 [game-design.md](game-design.md), UI는 [art.md](art.md), 명령은 [../runbook.md](../runbook.md).

## 스택
정적 ES 모듈, 외부 의존성 0. 엔진 **DOM-free** → 브라우저(UI)와 node(시뮬) 공용. 테스트 = Node 내장 `node:test`. 배포 = GitHub Pages(정적 멀티파일 그대로). 번들러·빌드 단계 없음.

## 파일 구조 / 모듈 경계
```
index.html              # 엔트리, <script type=module src=src/ui/main.js>
package.json            # {"type":"module"}, 의존성 0
src/data/jobs.js        # 직업 테이블 (메타 + 레벨별 스탯 levels{1..5})
src/data/skills.js      # 스킬 테이블(평타=스킬, 근/원 태그)
src/data/traits.js      # 몹 트레잇 규칙 테이블(+rarity)
src/data/monsters.js    # 몹 풀(이름+레벨 계수 mul) ← mobs.js 대체
src/data/curve.js       # 전역 레벨 성장 커브 levelCurve(L)
src/data/stages.js      # 스테이지별 몹레벨 + 특성 슬롯
src/engine/unit.js      # 직업/몹 → 전투용 인스턴스 팩토리(스킬/트레잇 resolve)
src/engine/battle.js    # 틱루프·데미지·타게팅·교착. 순수, DOM 0. ← 핵심 단위
src/engine/traits.js    # 트레잇 규칙 인터프리터 applyRules
src/engine/rng.js       # 시드 PRNG(mulberry32) — 조우 랜덤용
src/engine/encounter.js # 절차적 조우 생성 generateEncounter(stage, rng)
src/engine/run.js       # 런 상태기계(순수): 영입/강화/선발/전투/진행/리셋
src/ui/render.js        # 전투결과 → HTML 문자열 (순수, 테스트 가능)
src/ui/game.js          # 게임 화면 renderGame(state) prep/result (순수, data-action)
src/ui/main.js          # 부트: 런상태 보유 + 이벤트 위임 + 재렌더 (DOM 의존)
sim/sim.js              # node 헤드리스 시뮬(스테이지×시드 trial)
tests/*.test.js         # node:test (tests/_fixtures.js = 엔진 테스트용 고정 몹)
```
- `data/*` = 순수 테이블, 로직 없음. `ui/*` = 표시만(전투 계산 안 함). `sim/sim.js` = node 전용.

## 엔진 계약 (battle.js)
- `runBattle(party, mob, opts={maxTicks}) → { winner:'party'|'mob', rounds, ticks }`. **순수함수, 부수효과 0.** ui·sim 공용.
  - `rounds[]` = `{ tick, party:[{name,hp,maxHp}], mob:{name,hp,maxHp,traits:[name...]}, log:[...] }` 스냅샷.
- `makeUnit(job, level=1) → unit`, `makeMob(mob) → 몹`. 런타임 가변 `hp`·`gauge` 부여. **플레이어 유닛 def=0.** makeUnit은 `job.levels[level]`(hp·atk·[heal])에서 스탯, spd는 메타(레벨 불변), 잘못된 level은 RangeError(fail-fast). `job.skills`(id)를 `SKILLS` 공유 def로 resolve. `makeMob`도 `mob.traits`(id)를 `TRAITS` 공유 def로 resolve(없으면 `[]`).
- `damage(atk, def) = max(1, atk-def)`. `lowestHpAlly`, `selectMobTarget` export(테스트용).
- **행동 = `selectSkill(u)=u.skills[0]` → `skill.kind` 분기** (attack→몹 데미지, heal→최저HP아군 +heal). `role`은 서술 라벨일 뿐(분기는 kind+taunt). step5에서 마나/쿨/우선순위 `canUse`가 `selectSkill`에 얹힘.
- **트레잇 = 규칙엔진.** `applyRules(trigger, value, ctx, mob)`(engine/traits.js, 순수)가 mob.traits를 priority 오름차순 적용(value-변환 mult/add, side-effect heal/reflect, `exclusive` 중단). battle.js 3 지점: `incomingDamage`(받는 데미지 변환 — 근접회피), `postIncomingDamage`(반사), `turnStart`(자가회복, actMob 진입). 트레잇 없는 몹 = no-op → 거동 불변. 데미지 적용: `t=applyRules('incomingDamage',base,…)` → `dmg = t===0 ? 0 : max(1,floor(t))`(트레잇이 0으로 만들면 **진짜 면역**, 그 외 최소1 = 회피≠면역).
- **조우 생성 = 시드 결정론.** `makeRng(seed)`(engine/rng.js, mulberry32) → `generateEncounter(stage, rng)`(engine/encounter.js): 풀 랜덤 몹 × `levelCurve(stage.level)×mul`(반올림) + 스테이지 슬롯별 distinct 랜덤 특성 → makeMob 평면 스펙. 같은 (stage,seed)=같은 조우. UI(main.js)가 `Math.random`로 시드 주입(엔진은 시드만 받아 순수).
- **런 상태기계 = 순수**(engine/run.js). `RunState{ phase:'prep'|'result', gold, stage, slots, roster:[{job,level}], party:[idx], encounter, lastResult }`. 액션 = newRun/recruit/upgrade/toggleParty/fight/next/restart (새 상태 반환, no-op=같은 ref). 골드 경제(영입4·강화4·보상 4+stage), fight→prep만·승=gold+보상·outcome win/loss/clear, next=최종스테이지서 terminal. rng는 newRun/next만(조우 생성), fight는 결정론. UI(game.js/main.js)가 렌더+이벤트위임으로 구동(전투 자동, 결정은 준비단계).

## 틱 구현 ([game-design.md](game-design.md) §5 규칙의 구현)
- 매 틱: 살아있는 유닛 `gauge += spd`; `≥1000`이면 1회 행동 후 `gauge -= 1000`(**carry — 0 리셋 아님**).
- **틱 내 순서: ①버프만료(미래) ②게이지 증가 ③행동.** 일관성이 결정론 보장.
- **매 틱 계산 채택**, "다음 행동자 min-heap 점프"는 기각(속도 변조 잦아 큐 재계산 빈번 → 이득 상쇄). 측정 전 최적화 금지.
- 속도 버프 구현규칙(미래): 이미 찬 게이지 소급 수정 금지, 매 틱 현재 속도로 재계산.
- 라운드 = `ROUND_TICKS`(현재 100)틱 스냅샷(표시용, 계산 영향 0).

## 결정 / 불변식
- **동시틱 = 파티 우선 (의도된 결정, 2026-05-30 확정).** 같은 틱에 양쪽 1000 도달 + 파티가 치명타면 몹은 반격 못 함. ATB 속도순 아님 — 단순성 위해 고정.
- **결정론:** 전투 자체는 RNG 없음 → 같은 (파티,몹)=같은 결과. **조우 생성만 시드 랜덤**(랜덤 몹+특성) → 시뮬은 매치업당 시드 trial **승률 분포**(전투 내 변동성[마나/쿨]은 §9 step5부터).
- 교착: `maxTicks`(기본 20000) 초과 → 몹 승.

## 데이터 구조 (수치 placeholder — 코드 수정 없이 튜닝)
- `JOBS{ key: { name, spd, role, skills:[id...], [taunt], levels:{ 1:{hp,atk,[heal]}, …5:{} } } }` — 레벨별 명시 스탯(hp·atk·[heal] 스케일, spd 불변). 강화=level+1(상한 5). level1=베이스.
- `MONSTERS{ id: { name, mul:{hp,atk,def,spd}, [aoe] } }`(monsters.js) — 몹 풀(계수). 스탯 = `round(levelCurve(L) × mul)`. 특성 없음(생성기가 랜덤 부착). 구 flat MOBS 대체. (`aoeRatio`는 makeMob 기본 0.6.)
- `levelCurve(L) → {hp,atk,def,spd}`(curve.js, 전역 커브) / `STAGES{ n:{ level, traitSlots:[rarity...] } }`(stages.js, 스테이지별 몹레벨+특성슬롯).
- `SKILLS{ id: { id, name, kind:'attack'|'heal', range:'melee'|'ranged'|null } }` — 평타도 스킬. 위력은 유닛 스탯(attack→atk, heal→heal), 스킬엔 power 없음.
- `TRAITS{ id: { id, name, rarity, trigger, cond?, op, value, priority?, exclusive? } }` — 몹 트레잇 규칙. trigger∈{incomingDamage,postIncomingDamage,turnStart}, op∈{mult,add,heal,reflect}, cond 매처(attackerRange/attackerKind), rarity∈{일반,희귀,영웅,전설}. 5종 정의. **조우 생성기가 스테이지 슬롯 레어도에 맞춰 랜덤 부착**(과거 정적 부착 아님).
- `range` 근/원 이진 태그 = 근접회피(`cond:{attackerRange:'melee'}`)가 소비. (phys/magic `type`은 효과 0이라 step3a에서 제거 → 스킬 모델이 대체.)

## 테스트 전략
`node:test` 92개. 핀된 규칙: 데이터 형태 / 유닛 팩토리(레벨 스케일·잘못된 level RangeError) / damage·타게팅 / 전투(승·결정론·힐·스냅샷) / 교착 / 광역 / 도발 / 게이지 carry / 동시틱 / 몹사망 break / 힐 cap / 라운드경계 / 스킬 resolve·skill.kind / 트레잇 규칙엔진(op·trigger·cond·priority·exclusive·reflect 0클램프) / 근접회피 통합 / 시드 PRNG / 레벨커브·몹계수·스테이지 / 조우 생성(결정론·스탯·distinct·레어도) / 면역 0뎀·회피≠면역 / **런 상태기계(newRun·영입·강화·선발·전투 승패clear·next terminal·prep-only fight·결정론) / 게임 렌더(prep/result)**. 엔진 동작 테스트는 `tests/_fixtures.js` 고정 몹 사용(밸런스 데이터 디커플). UI 이벤트(main.js)는 수동 실측(serve.bat).

## 설계 원칙 — 확장성 우선 (시스템 레벨)
시스템(스킬·버프/디버프·발동 효과 트리거·데미지 파이프라인·이벤트 훅)은 **확장 가능하게 견고히** 짠다 — 토대가 약하면 기능 얹을 때마다 갈아엎게 됨. 단 **단일 스킬·단일 옵션을 위한 추상화는 과설계라 금지.** 경계: 시스템=구조적으로 / 개별 기능 디테일=YAGNI OK. 기능은 작게 단계적으로 추가하되 매 시스템은 처음부터 튼튼하게. (베이스 평타 엔진은 의도적으로 단순 — RPS·스킬·버프가 들어올 때 위 시스템들을 견고히 설계.)

## 데이터·코드 분리 원칙
직업·몹·속성·스킬 = 테이블로 분리 → 밸런스 튜닝이 코드 수정 없이. 시뮬은 프로젝트 내 스크립트로 두어 수치 변경 시 자동 재측정.
