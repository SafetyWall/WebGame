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
src/data/traits.js      # 몹 트레잇 — 규칙형(trigger/op) + 타겟팅형(weight) + 스탯형(mult) + 2차 메타(pierce/lifesteal/resist/hitCap/aura)
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
src/ui/components/*.js   # StageHeader·EnemyPreview·Roster·CharacterCard·ActionBar·CharacterModal·SkillDetailModal(스킬 상세 팝업)·ResultView·BattleStage(재생뷰) + parts.js(공유) — 각 순수 render
src/ui/describe.js      # 스킬·트레잇 필드 → 설명 텍스트(코어/부여효과 clause/레벨업 비교값) 생성 (순수)
src/ui/status.js        # 버프/디버프 공용 키워드(취약/강화/둔화…) 이름·분류(buff/debuff)·정밀표기 단일출처 (순수)
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
- `runBattle(party, mob, opts={maxTicks, record}) → { winner:'party'|'mob', rounds, ticks, frames }`. **순수함수, 부수효과 0.** ui·sim 공용.
  - `rounds[]` = `{ tick, party:[{name,hp,maxHp}], mob:{name,hp,maxHp,aoe,traits:[name...]}, log:[...] }` 스냅샷(100틱 묶음, 결과 로그용).
  - **`opts.record`(opt-in)** = `frames[]` 채움(재생뷰용 **액션단위**): `{tick, actor, actorRef(파티 idx|'mob'|null), targets:[파티 idx|'mob'](피격/힐/effect 대상), log:[이 액션 로그], party:[{name,level,hp,maxHp,mana,manaMax,gauge,alive,effects:[{type,value,expireTick,interval?}]}], mob:{name,hp,maxHp,mana,manaMax,gauge,boss,aoe,traits:[id],effects:[{...}]}}`. **몹도 mana/gauge 기록**(재생뷰 바; 마나는 현재 0=미사용, 향후 몬스터 스킬). `actorRef`/`targets`=강조용(이름 충돌 회피 — 인덱스 기반), effect=인스턴스(정밀 표기·남은 지속). 미설정=`frames:[]`(기존 동작·sim 무영향). `run.battleFrames(s)`=상태에서 결정론 재생성(UI 휘발, 영속 X).
  - **빈/전멸 파티 가드**: 비었거나 전원 hp≤0이면 루프 진입 전 즉시 `finish('mob')`(틱0).
- `makeUnit(job, level=1, skillOrder=null, skillLevels={}, learnedSkills=null) → unit`. 런타임 가변 `hp`·`gauge`·`mana`(0)·`manaMax`(직업별)·`skillLevels`·`cooldowns`·`effects` 부여. **플레이어 def=`job.def ?? 0`**(직업 메타 상수=탱 레버, 레벨 불변). `job.levels[level]`에서 스탯(잘못된 level=RangeError). 전투 스킬 = `unitSkillIds(job, learnedSkills)`(학습 액티브 + 평타; learnedSkills 미지정=전체) → `normalizeSkillOrder`로 우선순위 보정 → `SKILLS` 공유 def resolve. `makeMob(mob)`도 `mob.traits`(id) → `TRAITS` 공유 def(없으면 `[]`) + `gauge`·`mana`(0)·`manaMax`(`mob.mana ?? 100`, 현재 미사용=향후 몬스터 스킬).
- `damage(atk, def) = atk×DEF_K/(def+DEF_K)` (**% 경감**: def=0→항등, def=K→50%, **스케일 불변**; 분수 반환=`min1`·`floor`은 호출부). `DEF_K`(=100, placeholder·econ-sim), `lowestHpAlly`(힐 대상), `selectMobTarget(party, mob)`, `skillLevelMult`, `scaledEffectValue` export.
- **행동 = `selectSkill(u, tick)` → `skill.kind` 분기.** `selectSkill` = 우선순위 톱다운 `canUse`(마나≥cost & tick≥readyTick) 첫 스킬, 없으면 마지막(평타, cost0·cd0). **`normalizeSkillOrder`가 평타(=validIds 마지막)를 항상 끝 고정** — 평타 cost0=항상 usable이라 앞에 오면 액티브 무력화. UI/reorderSkill도 평타 이동 거부. `actUnit` = 자원(마나 충전/소비·쿨)+행동. **스킬 레벨 위력** = `skillLevelMult(lv)=1+0.25(lv-1)`(L1 1.0→L5 2.0)을 `u.skillLevels[skill.id]`로 적용(평타·미지정=1).
  - attack: `damage(floor(atk×power×mult), effDef) × dmgDealtMult(u) × dmgTakenMult(mob)` → `applyRules('incomingDamage')`. `effDef = floor(def×(1-skill.ignoreDef))`(방어무시). **멀티히트** `hits = min(skill.hits||1, hitCap(mob))`(연타봉쇄 트레잇이 상한) = 1행동 N회 타격(각 히트가 mark 등 on-hit 발동). 히트 후 `markBonus(mob)` 추가뎀. **몹 대상 effect 부여 = `resolveMobEffect`(지속/디버프 저항·면역) 통과**(면역=미부여).
  - heal: `floor(heal×power×mult)` → 최저HP아군. power0=버프전용.
- **effect = 전투중 상태(engine/effects.js, 순수).** type 12종: `dmgTaken`·`dmgDealt`·`speed`(배율, `*Mult` 곱) / `taunt`·`stun`·`intercept`(플래그, `has*`/`isStunned`) / `hot`·`dot`(지속 회복/데미지, `tickHoT`/`tickDoT`, interval; hot은 `healReceivedMult` 반영) / `reflect`(받은뎀 반사 비율, `reflectFrac` 합) / `mark`(피격당 추가뎀, `markBonus` 합) / **`healReduce`·`manaSuppress`(몹 오라 — 받는회복·마나획득 배율, `healReceivedMult`/`manaSuppressMult`)**. `applyEffect`(refresh: 같은 `(type,source)` 덮어쓰기·다른 source 별도). `expireEffects`. **스킬 effect 스펙 인스턴스화 레벨스케일**: hot/mark/dot value=`floor((heal|atk)×valueRatio×mult)`, reflect=`value×mult`, dmgTaken/dmgDealt/speed=`scaledEffectValue`(1.0 기준 편차×mult), taunt/stun=불변. `target`: `self`/`enemy`/`allies`(파티전원)/`lowestHpAlly`.
- **타겟팅 = 위협도 스코어(engine/threat.js).** `selectMobTarget(party, mob)` = 생존자별 `threatScore = Σ factor×weight` 최고. factor(0~1정규화): 위치(앞열)/저체력/atk. **디폴트 weight=위치 지배 → 앞열 첫 생존자**(동률=앞 유지=결정론). 도발=+대량 보너스(override). 몹 트레잇의 `targeting` 메타가 weight 변조(저체력추적 등). **수호(intercept)**: 몹이 최저체력 아군 겨냥 시 intercept 보유 아군이 대신 받음(actMob). **반사**: 몹 공격 후 대상 `reflectFrac`만큼 몹에 되돌림. **몹 공격(actMob)**: 유효방어 `floor(def×(1−pierceFrac(mob)))`(관통), 가한뎀 합 `×lifestealFrac`만큼 몹 자가회복(흡혈). **광역** `mob.aoeMode`: `uniform`(전원 `atk×aoeRatio`) / `splash`(주타깃 풀뎀 + 그외 `atk×aoeRatio`). **오라**: 전투 시작 시 `applyMobAuras`가 `aura` 트레잇(힐봉쇄·마나억제·게이지지연)을 파티 전원에 영구 effect 스탬프(`source:'mob'`).
- **트레잇 = 규칙엔진.** `applyRules(trigger, value, ctx, mob)`(engine/traits.js, 순수)가 mob.traits를 priority 오름차순 적용(mult/add 변환, heal/reflect side-effect, exclusive 중단). 3 지점: `incomingDamage`(받는뎀 변환), `postIncomingDamage`(반사), `turnStart`(자가회복). **타겟팅 트레잇(targeting 필드 보유)은 trigger 없음 → applyRules 무간섭**. 데미지: `t=applyRules('incomingDamage',…)` → `dmg = t===0 ? 0 : max(1,floor(t))`(0=진짜 면역, 그 외 최소1=회피≠면역). **2차 메타 트레잇**(trigger 없음, engine이 시점별 직접 읽음): `pierce`(관통)·`lifesteal`(흡혈)=actMob / `resist:{dot,debuff}`=`resolveMobEffect`(들어오는 effect 저항·면역, 0=면역=미부여) / `hitCap`=actUnit(연타봉쇄) / `aura:{aura,value}`=applyMobAuras(파티 오라).
- **조우 생성 = 시드 결정론.** `makeRng(seed)` → `generateEncounter(stage, rng, monId=null)`: monId 없으면 일반 풀(MONSTERS) 랜덤, 있으면 그 몹. 스탯 = `levelCurve(stageCfg.level)×mul × 스탯트레잇 mult`(반올림 1회). 트레잇 = 고정(`mon.fixed`) + 스테이지 슬롯 + 보스 `bonus`, 각 레어도별 distinct 랜덤(`!inactive`) + `conflicts()` 상호배제(전딜봉쇄 금지). 같은 (stage,seed,monId)=같은 조우.
- **런 상태기계 = 순수(engine/run.js).** `RunState{ phase:'prep'|'result', gold, stage, slots, roster:[{job, level, skillOrder?, learnedSkills?, skillLevels?}], party:[idx], encounter, lastResult }`. 액션(새 상태 반환, no-op=같은 ref): newRun·recruit·upgrade·changeJob·**learnSkill**·**levelUpSkill**·reorderSkill·**reorderParty**·expandSlot·toggleParty·fight·next·restart. **경제 상수**: START_GOLD 20·RECRUIT 4·UPGRADE 8·PROMOTE 10·LEARN_COST 6·SKILL_LV_COST 4·slotCost `5+4*(slots-3)`·보상 `10+2*stage`·MAX_LEVEL 10·MAX_SKILL_LEVEL 5·MAX_STAGE 50. **전직(changeJob)** = 노비스만·`level===PROMOTE_LEVEL`(1)에서만 → `PROMOTE_TARGETS`(전사/마법사/가디언/사제/도적/궁수), 비가역·레벨+1·기본 액티브 1개 학습. **강화** = 노비스 거부(성장=전직), ~L10. **스킬 학습/레벨업** = 직업 액티브(평타 제외), learnedSkills/skillLevels 갱신. **출전 순서(reorderParty)** = party 배열 순서(앞→뒤). fight=prep만·승=gold+보상·outcome win/loss/clear·MAX_STAGE서 clear. rng는 newRun/next만(조우), fight 결정론.
- **런 영속 = UI 레이어(ui/persist.js).** 매 액션 후 `save(state, rng.snapshot())` → localStorage(버전키 `partyrpg.save.v3`). 부팅 시 `load()` 있으면 복원, 손상·구버전(v≠3)=null→새 런. storage 주입가능(테스트=Map shim).

## 틱 구현 ([game-design.md](game-design.md) §5 규칙의 구현)
- **시간 모델: `TICKS_PER_SEC`=100(100틱=1초). 게이지 `THRESHOLD`=10000 → 속도 100 = 100틱마다 행동 = 1초/턴.** 속도는 100-스케일(jobs/curve). 내부는 틱, **UI는 초 표시**(`ui/time.js fmtSec(ticks)=ticks/100+"초"`; 쿨·지속·재생뷰 시간·툴팁 남은시간). cd/지속/interval 데이터는 틱이지만 ÷100=깔끔한 초(예 cd 500=5초, interval 100=1초).
- 매 틱: 살아있는 + 스턴 아닌 유닛 `gauge += spd × speedMult(u)`; **`while gauge≥THRESHOLD(10000)`이면 행동 후 `-=10000`**(오버플로/고속 시 한 틱 다중 행동 = 턴 유실 방지, carry).
- **틱 내 순서: ①effect(tickHoT→tickDoT→expireEffects) ②게이지 증가 ③행동(파티 우선, 그다음 몹).** 만료 전 마지막 proc 보장.
- 매 틱 계산 채택(min-heap 점프 기각 — 속도 변조 잦음). 라운드 = `ROUND_TICKS`(100)틱 = 1초 스냅샷(표시용). 쿨타임=절대 틱(속도 무관 실시간).

## 결정 / 불변식
- **동시틱 = 파티 우선**(2026-05-30 확정).
- **결정론:** 전투 자체 RNG 0 → 같은 (파티,몹)=같은 결과. **조우 생성만 시드 랜덤**. 전투 변동성 = ATB 타이밍 + 마나/쿨(결정론적). 타겟팅도 결정론(위협도 스코어, RNG 0).
- 교착: `maxTicks`(기본 20000) 초과 → 몹 승.

## 데이터 구조 (수치 placeholder — 코드 수정 없이 튜닝)
- `JOBS{ key:{ name, spd, role, mana, [def], skills:[id...], levels:{1:{hp,atk,[heal]},…10:{}} } }` — 레벨별 명시 스탯(L1~10, ≈×1.2/레벨, spd·mana·def 레벨 불변=전직으로만; `def` 미지정=0=딜러, **전사만 보유**[가디언 제거]). `skills`=기본 우선순위(액티브 먼저, **평타=마지막**). 노비스=평타만. **5전직**(전사/마법사/사제/도적/궁수) 각 평타+액티브4. **가디언 클래스 제거**(향후 2차전직용 보류) — 가시방패만 전사 흡수(`warrior_thorns`); taunt/intercept 등은 **엔진 메커니즘으로만** 잔존(부여 스킬 없음), `warrior_might`/`mage_frost`/`priest_hot`은 미배선 def.
- `MONSTERS{ id:{name,mul} }`(일반, 고정특성 없음) / `BOSSES{ id:{name,boss,mul,[aoe],[fixed],[bonus]} }`. 스탯=`round(levelCurve(L)×mul)`. (보스 자동배치 미정.)
- `levelCurve(L)→{hp,atk,def,spd}`(curve.js: hp×1.15·atk×1.10·def×1.10/레벨, **spd 90 고정**(100-스케일·속도100=1초/턴, ×mul로 몹 개성)). `stageCfg(s)→{level:s, traitSlots:[rarity...]}`(stages.js, 절차생성; **`SLOT_SEQ`=10스테마다 1슬롯 추가, 일반/희귀/일반/영웅/희귀 누적**). `STAGES`=1..MAX_STAGE 생성객체(소비처 호환).
- `SKILLS{ id:{ id,name,kind:'attack'|'heal',range:'melee'|'ranged'|null,power,manaGain,cost,cd,effects,[learnCost],[hits],[ignoreDef],[manaDrain] } }` — 평타도 스킬. `manaDrain`=명중 시 적 마나 차감(현재 몹 마나 미사용=휴면). effect 스펙=`{target,type,value|valueRatio,duration,interval?}`; `type`∈{dmgTaken,dmgDealt,speed,stun,dot,hot,mark,reflect,**extraHit**(평타 추가타 비율),intercept,taunt}. effect `target`∈{self,enemy,allies,lowestHpAlly}. `MANA_MAX`/`MANA_GAIN` 상수(직업 마나 상한=`job.mana`→unit.manaMax).
- `TRAITS{ id:{...} }` 계열: **규칙형**`{rarity,trigger,cond?,op,value,priority?,defends?}`(회피·면역·저항·자가회복·반사·재생) + **타겟팅형**`{rarity,targeting:{position?,lowHp?,atk?}}`(저체력추적·고공격력추적 — threat weight, trigger 없음) + **스탯형**`{rarity,stat:'atk'|'def'|'hp'|'spd',mult}`(맹공·철갑·강골·쾌속 — 생성 시 base×mult) + **2차 메타형**`{rarity, pierce|lifesteal|resist:{dot?,debuff?}|hitCap|aura:{aura,value}}`(관통·흡혈·지속/디버프 저항·면역·연타봉쇄·힐/마나/게이지 오라 — trigger 없음, engine이 시점별 직접 읽음, applyRules/conflicts 무간섭). rarity∈{일반,희귀,영웅,전설}. `inactive:true`=정의 유지·슬롯 미등장(보류). 조우 생성기가 슬롯 레어도에 맞춰 랜덤 부착 + `conflicts()` 필터.
- `range` 근/원 이진 태그 = 근접회피/원거리저항 등이 소비.

## 테스트 전략
`node:test` **317개**. 데이터 형태 / 유닛 팩토리(레벨·skillOrder·learnedSkills 필터·manaMax·**직업 def**) / **damage(% 경감 atk×K/(def+K)·DEF_K)**·타게팅(위협도·앞열·도발·intercept) / 전투(승·결정론·힐·스냅샷·빈전멸가드·멀티히트·게이지 while) / 트레잇 규칙엔진 / **2차 트레잇(관통·흡혈·지속/디버프 저항·면역·연타봉쇄·힐/마나/게이지 오라·aoe splash)** / 조우 생성 / 절차 스테이지(MAX_STAGE 50·SLOT_SEQ·레어도캡) / 런 상태기계(전직·학습·레벨업·순서) / 스킬 메커닉(레벨스케일·속도·스턴·파티·반사·intercept·mark·DoT·멀티히트·방어무시·추가타extraHit·마나차감manaDrain) / 신규직업 / **UI 순수단위(describe 설명텍스트[+2차 트레잇]·status 키워드/정밀표기[+오라]·preview before→after·store·uiPrefs·view 렌더 부분문자열·dragMove 인덱스·전투 frame(actorRef·targets·effect 인스턴스·mob traits)·BattleStage 재생뷰·SkillDetailModal)** / persist v3. 엔진 테스트는 `tests/_fixtures.js` 고정 몹 사용. **UI DOM 글루(tooltip·drag·main 이벤트·팝업 위치)는 수동/헤드리스 실측**(드래그·tap 거동·sticky-hover = 실기기).

## 설계 원칙
- **시스템 확장성 우선** — 스킬·effect·트리거·데미지 파이프는 견고히(토대 약하면 갈아엎음). 단 단일 스킬·옵션 과추상화 금지. 시스템=구조적 / 개별 기능=YAGNI OK.
- **데이터·코드 분리** — 직업·몹·트레잇·스킬·곡선 = 테이블 → 밸런스 튜닝이 코드 수정 없이. 시뮬(sim/*)로 수치 변경 자동 재측정.
