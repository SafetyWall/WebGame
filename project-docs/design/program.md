# 프로그램 — 아키텍처 / 엔진 계약

> 코드가 "어떻게" 돌아가는지의 owner. 게임 규칙(무엇/왜)은 [game-design.md](game-design.md), UI는 [art.md](art.md), 명령은 [../runbook.md](../runbook.md).

## 스택
정적 ES 모듈, 외부 의존성 0. 엔진 **DOM-free** → 브라우저(UI)와 node(시뮬) 공용. 테스트 = Node 내장 `node:test`. 배포 = GitHub Pages(정적 멀티파일 그대로). 번들러·빌드 단계 없음.

## 파일 구조 / 모듈 경계
```
index.html              # 엔트리, <script type=module src=src/ui/main.js>
package.json            # {"type":"module"}, 의존성 0
src/data/jobs.js        # 직업 테이블 — 7직업(노비스+6전직), 메타(spd/role/mana/skills) + 레벨별 스탯 levels{1..10}
src/data/skills.js      # 스킬 테이블 — 평타+액티브, 발동/효과/멀티히트/방어무시 필드
src/data/traits.js      # 몹 트레잇 — 규칙형(trigger/op) + 타겟팅형(targeting weight)
src/data/monsters.js    # 몹 풀 — MONSTERS(일반) + BOSSES(보스, aoe|fixed + bonus)
src/data/curve.js       # 전역 레벨 성장 커브 levelCurve(L) — 몹 스탯용
src/data/stages.js      # 절차생성 stageCfg(s) → {level, traitSlots}; STAGES(1..MAX_STAGE 생성), MAX_STAGE
src/engine/unit.js      # 직업/몹 → 전투 인스턴스 팩토리(스킬/트레잇 resolve), unitSkillIds·normalizeSkillOrder
src/engine/battle.js    # 틱루프·데미지·스킬발동·멀티히트·교착. 순수, DOM 0. ← 핵심 단위
src/engine/threat.js    # 위협도 타겟팅 스코어(몹 타겟 선택) — selectMobTarget이 사용
src/engine/effects.js   # 전투중 effect(버프/디버프/지속/특수) 순수 모듈. 트레잇과 평행
src/engine/traits.js    # 몹 트레잇 규칙 인터프리터 applyRules
src/engine/rng.js       # 시드 PRNG(mulberry32) — 조우 랜덤(+snapshot=영속용)
src/engine/encounter.js # 절차적 조우 생성 generateEncounter(stage, rng, monId?), conflicts
src/engine/run.js       # 런 상태기계(순수): 영입/강화/전직/스킬학습·레벨업/선발·순서/전투/진행
src/ui/render.js        # 전투결과 → HTML 문자열 (순수, ResultView가 재사용)
src/ui/store.js         # 중앙 상태 {run,ui} + dispatch + subscribe (순수, DOM-free)
src/ui/component.js     # 미니 컴포넌트 베이스(render→innerHTML, update(el,state) seam)
src/ui/view.js          # 앱 합성 renderApp({run,ui}) prep/result 분기 (순수)
src/ui/components/*.js   # StageHeader·EnemyPreview·Roster·CharacterCard·PartyOrder·ActionBar·CharacterModal·ResultView + parts.js(공유) — 각 순수 render
src/ui/describe.js      # 스킬·트레잇 필드 → 툴팁 텍스트 생성 (순수)
src/ui/preview.js       # 레벨업/스킬업 before→after 계산 (순수)
src/ui/dragMove.js      # 드롭=목표 인덱스(기존 ±1 reorder를 |delta|회 접음, 순수)
src/ui/tooltip.js       # 단일 플로팅 툴팁(click/tap 토글) (DOM 의존)
src/ui/drag.js          # pointer 기반 재배열(터치+마우스) (DOM 의존)
src/ui/main.js          # 부트: store + 컴포넌트 마운트 + 이벤트 위임 + 드래그 + 영속 (DOM 의존)
src/ui/persist.js       # localStorage 런 영속 save/load/clear(버전키, 순수)
src/ui/uiPrefs.js       # UI 취향(layout) 영속 — 런 세이브와 별도 키 (순수)
sim/sim.js              # 전투 시뮬(고정파티 × 스테이지×시드 승률)
sim/econ-sim.js         # 경제 런루프 시뮬(풀투자 정책 → 사망/클리어 분포)
tests/*.test.js         # node:test (tests/_fixtures.js = 엔진 테스트용 고정 몹)
```
- `data/*` = 순수 테이블, 로직 없음. `ui/*` = 표시만(전투 계산 안 함). `sim/*` = node 전용.

## 엔진 계약 (battle.js)
- `runBattle(party, mob, opts={maxTicks}) → { winner:'party'|'mob', rounds, ticks }`. **순수함수, 부수효과 0.** ui·sim 공용.
  - `rounds[]` = `{ tick, party:[{name,hp,maxHp}], mob:{name,hp,maxHp,aoe,traits:[name...]}, log:[...] }` 스냅샷.
  - **빈/전멸 파티 가드**: 비었거나 전원 hp≤0이면 루프 진입 전 즉시 `finish('mob')`(틱0).
- `makeUnit(job, level=1, skillOrder=null, skillLevels={}, learnedSkills=null) → unit`. 런타임 가변 `hp`·`gauge`·`mana`(0)·`manaMax`(직업별)·`skillLevels`·`cooldowns`·`effects` 부여. **플레이어 def=0.** `job.levels[level]`에서 스탯(잘못된 level=RangeError). 전투 스킬 = `unitSkillIds(job, learnedSkills)`(학습 액티브 + 평타; learnedSkills 미지정=전체) → `normalizeSkillOrder`로 우선순위 보정 → `SKILLS` 공유 def resolve. `makeMob(mob)`도 `mob.traits`(id) → `TRAITS` 공유 def(없으면 `[]`).
- `damage(atk, def) = max(1, atk-def)`. `lowestHpAlly`(힐 대상), `selectMobTarget(party, mob)`, `skillLevelMult`, `scaledEffectValue` export.
- **행동 = `selectSkill(u, tick)` → `skill.kind` 분기.** `selectSkill` = 우선순위 톱다운 `canUse`(마나≥cost & tick≥readyTick) 첫 스킬, 없으면 마지막(평타, cost0·cd0). `actUnit` = 자원(마나 충전/소비·쿨)+행동. **스킬 레벨 위력** = `skillLevelMult(lv)=1+0.25(lv-1)`(L1 1.0→L5 2.0)을 `u.skillLevels[skill.id]`로 적용(평타·미지정=1).
  - attack: `damage(floor(atk×power×mult), effDef) × dmgDealtMult(u) × dmgTakenMult(mob)` → `applyRules('incomingDamage')`. `effDef = floor(def×(1-skill.ignoreDef))`(방어무시). **멀티히트** `skill.hits`(기본1) = 1행동 N회 타격(각 히트가 mark 등 on-hit 발동). 히트 후 `markBonus(mob)` 추가뎀.
  - heal: `floor(heal×power×mult)` → 최저HP아군. power0=버프전용.
- **effect = 전투중 상태(engine/effects.js, 순수).** type 10종: `dmgTaken`·`dmgDealt`·`speed`(배율, `*Mult` 곱) / `taunt`·`stun`·`intercept`(플래그, `has*`/`isStunned`) / `hot`·`dot`(지속 회복/데미지, `tickHoT`/`tickDoT`, interval) / `reflect`(받은뎀 반사 비율, `reflectFrac` 합) / `mark`(피격당 추가뎀, `markBonus` 합). `applyEffect`(refresh: 같은 `(type,source)` 덮어쓰기·다른 source 별도). `expireEffects`. **스킬 effect 스펙 인스턴스화 레벨스케일**: hot/mark/dot value=`floor((heal|atk)×valueRatio×mult)`, reflect=`value×mult`, dmgTaken/dmgDealt/speed=`scaledEffectValue`(1.0 기준 편차×mult), taunt/stun=불변. `target`: `self`/`enemy`/`allies`(파티전원)/`lowestHpAlly`.
- **타겟팅 = 위협도 스코어(engine/threat.js).** `selectMobTarget(party, mob)` = 생존자별 `threatScore = Σ factor×weight` 최고. factor(0~1정규화): 위치(앞열)/저체력/atk. **디폴트 weight=위치 지배 → 앞열 첫 생존자**(동률=앞 유지=결정론). 도발=+대량 보너스(override). 몹 트레잇의 `targeting` 메타가 weight 변조(저체력추적 등). **수호(intercept)**: 몹이 최저체력 아군 겨냥 시 intercept 보유 아군이 대신 받음(actMob). **반사**: 몹 공격 후 대상 `reflectFrac`만큼 몹에 되돌림.
- **트레잇 = 규칙엔진.** `applyRules(trigger, value, ctx, mob)`(engine/traits.js, 순수)가 mob.traits를 priority 오름차순 적용(mult/add 변환, heal/reflect side-effect, exclusive 중단). 3 지점: `incomingDamage`(받는뎀 변환), `postIncomingDamage`(반사), `turnStart`(자가회복). **타겟팅 트레잇(targeting 필드 보유)은 trigger 없음 → applyRules 무간섭**. 데미지: `t=applyRules('incomingDamage',…)` → `dmg = t===0 ? 0 : max(1,floor(t))`(0=진짜 면역, 그 외 최소1=회피≠면역).
- **조우 생성 = 시드 결정론.** `makeRng(seed)` → `generateEncounter(stage, rng, monId=null)`: monId 없으면 일반 풀(MONSTERS) 랜덤, 있으면 그 몹. 스탯 = `levelCurve(stageCfg.level)×mul`(반올림). 트레잇 = 고정(`mon.fixed`) + 스테이지 슬롯 + 보스 `bonus`, 각 레어도별 distinct 랜덤 + `conflicts()` 상호배제(전딜봉쇄 금지). 같은 (stage,seed,monId)=같은 조우.
- **런 상태기계 = 순수(engine/run.js).** `RunState{ phase:'prep'|'result', gold, stage, slots, roster:[{job, level, skillOrder?, learnedSkills?, skillLevels?}], party:[idx], encounter, lastResult }`. 액션(새 상태 반환, no-op=같은 ref): newRun·recruit·upgrade·changeJob·**learnSkill**·**levelUpSkill**·reorderSkill·**reorderParty**·expandSlot·toggleParty·fight·next·restart. **경제 상수**: START_GOLD 20·RECRUIT 4·UPGRADE 8·PROMOTE 10·LEARN_COST 6·SKILL_LV_COST 4·slotCost `5+4*(slots-3)`·보상 `10+2*stage`·MAX_LEVEL 10·MAX_SKILL_LEVEL 5·MAX_STAGE 20. **전직(changeJob)** = 노비스만·`level===PROMOTE_LEVEL`(1)에서만 → `PROMOTE_TARGETS`(전사/마법사/가디언/사제/도적/궁수), 비가역·레벨+1·기본 액티브 1개 학습. **강화** = 노비스 거부(성장=전직), ~L10. **스킬 학습/레벨업** = 직업 액티브(평타 제외), learnedSkills/skillLevels 갱신. **출전 순서(reorderParty)** = party 배열 순서(앞→뒤). fight=prep만·승=gold+보상·outcome win/loss/clear·MAX_STAGE서 clear. rng는 newRun/next만(조우), fight 결정론.
- **런 영속 = UI 레이어(ui/persist.js).** 매 액션 후 `save(state, rng.snapshot())` → localStorage(버전키 `partyrpg.save.v3`). 부팅 시 `load()` 있으면 복원, 손상·구버전(v≠3)=null→새 런. storage 주입가능(테스트=Map shim).

## 틱 구현 ([game-design.md](game-design.md) §5 규칙의 구현)
- 매 틱: 살아있는 + 스턴 아닌 유닛 `gauge += spd × speedMult(u)`; **`while gauge≥1000`이면 행동 후 `-=1000`**(오버플로/고속 시 한 틱 다중 행동 = 턴 유실 방지, carry).
- **틱 내 순서: ①effect(tickHoT→tickDoT→expireEffects) ②게이지 증가 ③행동(파티 우선, 그다음 몹).** 만료 전 마지막 proc 보장.
- 매 틱 계산 채택(min-heap 점프 기각 — 속도 변조 잦음). 라운드 = `ROUND_TICKS`(100)틱 스냅샷(표시용).

## 결정 / 불변식
- **동시틱 = 파티 우선**(2026-05-30 확정).
- **결정론:** 전투 자체 RNG 0 → 같은 (파티,몹)=같은 결과. **조우 생성만 시드 랜덤**. 전투 변동성 = ATB 타이밍 + 마나/쿨(결정론적). 타겟팅도 결정론(위협도 스코어, RNG 0).
- 교착: `maxTicks`(기본 20000) 초과 → 몹 승.

## 데이터 구조 (수치 placeholder — 코드 수정 없이 튜닝)
- `JOBS{ key:{ name, spd, role, mana, skills:[id...], levels:{1:{hp,atk,[heal]},…10:{}} } }` — 레벨별 명시 스탯(L1~10, ≈×1.2/레벨, spd·mana 레벨 불변=전직으로만). `skills`=기본 우선순위(액티브 먼저, **평타=마지막**). 노비스=평타만. 6전직 각 평타+액티브4(2차전직용 guardian_taunt는 키트 외 def만 유지).
- `MONSTERS{ id:{name,mul} }`(일반, 고정특성 없음) / `BOSSES{ id:{name,boss,mul,[aoe],[fixed],[bonus]} }`. 스탯=`round(levelCurve(L)×mul)`. (보스 자동배치 미정.)
- `levelCurve(L)→{hp,atk,def,spd}`(curve.js: hp×1.15·atk×1.10·def×1.10/레벨, spd 6 고정). `stageCfg(s)→{level:s, traitSlots:[rarity...]}`(stages.js, 절차생성; 온보딩 S1~2 무트레잇 → 레어도 unlock/간격/상한 규칙으로 점증). `STAGES`=1..MAX_STAGE 생성객체(소비처 호환).
- `SKILLS{ id:{ id,name,kind:'attack'|'heal',range:'melee'|'ranged'|null,power,manaGain,cost,cd,effects,[learnCost],[hits],[ignoreDef] } }` — 평타도 스킬. effect 스펙=`{target,type,value|valueRatio,duration,interval?}`. `MANA_MAX`/`MANA_GAIN` 상수(직업 마나 상한=`job.mana`→unit.manaMax).
- `TRAITS{ id:{...} }` 2계열: **규칙형**`{rarity,trigger,cond?,op,value,priority?,defends?}`(근접회피·근접면역·원거리저항·원거리면역·자가회복·데미지반사·재생) + **타겟팅형**`{rarity,targeting:{position?,lowHp?,atk?}}`(저체력추적 — threat weight 변조, trigger 없음). rarity∈{일반,희귀,영웅,전설}. 조우 생성기가 슬롯 레어도에 맞춰 랜덤 부착 + `conflicts()` 필터.
- `range` 근/원 이진 태그 = 근접회피/원거리저항 등이 소비.

## 테스트 전략
`node:test` **252개**. 데이터 형태 / 유닛 팩토리(레벨·skillOrder·learnedSkills 필터·manaMax) / damage·타게팅(위협도·앞열·도발·intercept) / 전투(승·결정론·힐·스냅샷·빈전멸가드·멀티히트·게이지 while) / 트레잇 규칙엔진 / 조우 생성 / 절차 스테이지(MAX_STAGE 20·온보딩·레어도캡) / 런 상태기계(전직·학습·레벨업·순서) / 스킬 메커닉(레벨스케일·속도·스턴·파티·반사·intercept·mark·DoT·멀티히트·방어무시) / 신규직업 / **UI 순수단위(describe 툴팁텍스트·preview before→after·store dispatch/구독·uiPrefs·view 렌더 부분문자열·dragMove 인덱스)** / persist v3. 엔진 테스트는 `tests/_fixtures.js` 고정 몹 사용. **UI DOM 글루(tooltip·drag·main 이벤트)는 수동/헤드리스 실측**(드래그·tap 거동·sticky-hover = 실기기).

## 설계 원칙
- **시스템 확장성 우선** — 스킬·effect·트리거·데미지 파이프는 견고히(토대 약하면 갈아엎음). 단 단일 스킬·옵션 과추상화 금지. 시스템=구조적 / 개별 기능=YAGNI OK.
- **데이터·코드 분리** — 직업·몹·트레잇·스킬·곡선 = 테이블 → 밸런스 튜닝이 코드 수정 없이. 시뮬(sim/*)로 수치 변경 자동 재측정.
