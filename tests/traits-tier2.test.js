// 특성 2차 엔진 훅 테스트. 트레잇 메타를 인라인 raw 몹으로 직접 검증(TRAITS 데이터/draw풀과 디커플).
// 데미지 % 경감식: damage(atk,def)=atk×100/(def+100), DEF_K=100.
import { test } from 'node:test'
import assert from 'node:assert'
import { runBattle } from '../src/engine/battle.js'
import { tickHoT } from '../src/engine/effects.js'

const rawMob = (o) => ({
  name: 'M', maxHp: 1e6, hp: 1e6, atk: 50, def: 0, spd: 1000,
  aoe: false, aoeRatio: 0.6, gauge: 0, isMob: true, traits: [], effects: [], ...o,
})
const basicAtk = { id: 'x', name: 'x', kind: 'attack', range: 'melee', power: 1, manaGain: 0, cost: 0, cd: 0, effects: [] }
const target = (def, o = {}) => ({
  id: 1, name: 'P', maxHp: 1e6, hp: 1e6, atk: 0, spd: 0, role: 'tank', heal: 0,
  def, gauge: 0, mana: 0, manaMax: 100, skillLevels: {}, cooldowns: {}, skills: [basicAtk], effects: [], ...o,
})
const logs = (r) => r.rounds.flatMap(x => x.log).join('\n')
const dmgToP = (r) => Number((logs(r).match(/→ P \(-(\d+)\)/) || [])[1])

// === 관통 (pierce) — 몹이 플레이어 def 일부 무시 ===
test('관통: effDef = floor(def×(1−pierce)), 몹 atk50 vs def100', () => {
  // 무관통: damage(50,100)=25. 관통0.5: effDef50 → damage(50,50)=33. 관통1.0: effDef0 → 50.
  assert.strictEqual(dmgToP(runBattle([target(100)], rawMob({ traits: [] }), { maxTicks: 1 })), 25)
  assert.strictEqual(dmgToP(runBattle([target(100)], rawMob({ traits: [{ pierce: 0.5 }] }), { maxTicks: 1 })), 33)
  assert.strictEqual(dmgToP(runBattle([target(100)], rawMob({ traits: [{ pierce: 1.0 }] }), { maxTicks: 1 })), 50)
})

// === 흡혈 (lifesteal) — 몹이 가한 데미지 일부를 회복 ===
test('흡혈: 몹이 가한 데미지 × frac 회복 (단일), maxHp 캡', () => {
  // 가한 dmg = damage(50,0)=50. 회복 floor(50×0.3)=15.
  const mob = rawMob({ hp: 1000, maxHp: 1e6, atk: 50, traits: [{ lifesteal: 0.3 }] })
  runBattle([target(0)], mob, { maxTicks: 1 })
  assert.strictEqual(mob.hp, 1015)
  // 캡: 995+15=1010 → maxHp 1000
  const capped = rawMob({ hp: 995, maxHp: 1000, atk: 50, traits: [{ lifesteal: 0.3 }] })
  runBattle([target(0)], capped, { maxTicks: 1 })
  assert.strictEqual(capped.hp, 1000)
})

test('흡혈(광역): 전 피격 데미지 합 × frac 회복', () => {
  // base=floor(50×0.6)=30. 2명 def0 → 각 damage(30,0)=30, 합60. 회복 floor(60×0.3)=18.
  const mob = rawMob({ hp: 1000, maxHp: 1e6, atk: 50, aoe: true, aoeRatio: 0.6, traits: [{ lifesteal: 0.3 }] })
  runBattle([target(0), target(0, { id: 2, name: 'Q' })], mob, { maxTicks: 1 })
  assert.strictEqual(mob.hp, 1018)
})

// === 들어오는 effect 필터 — 몹 트레잇이 플레이어가 거는 디버프/DoT 저항/면역 ===
// resist.<key> = 남는 위력 배율(0=면역=미부여, 0.5=절반, 미지정=1=무저항).
const striker = (skill, atk = 20) => ({
  id: 1, name: 'S', hp: 1e6, maxHp: 1e6, atk, spd: 1000, role: 'dps', heal: 0,
  def: 0, gauge: 0, mana: 0, manaMax: 100, skillLevels: {}, cooldowns: {}, skills: [skill], effects: [],
})
const effSkill = (type, extra) => ({ id: 'e', name: 'e', kind: 'attack', range: 'melee', power: 0, manaGain: 0, cost: 0, cd: 0, effects: [{ type, target: 'enemy', ...extra }] })
function applyToMob(traits, skill) {
  const mob = rawMob({ atk: 0, spd: 0, traits })  // 몹 spd0=미행동, striker spd1000=틱1 시전
  runBattle([striker(skill)], mob, { maxTicks: 1 })
  return mob
}
const effOf = (mob, type) => mob.effects.find(e => e.type === type)

test('지속(DoT) 면역/저항: dot value 감쇠 / 미부여', () => {
  const dot = effSkill('dot', { valueRatio: 1.0, duration: 1000, interval: 100 })  // value=floor(20×1)=20
  assert.strictEqual(effOf(applyToMob([], dot), 'dot').value, 20)                       // 무저항
  assert.strictEqual(effOf(applyToMob([{ resist: { dot: 0.5 } }], dot), 'dot').value, 10) // 저항 floor(20×0.5)
  assert.strictEqual(effOf(applyToMob([{ resist: { dot: 0 } }], dot), 'dot'), undefined)   // 면역=미부여
})

test('디버프 면역/저항: 배율형(speed) 편차 감쇠 / 미부여', () => {
  const slow = effSkill('speed', { value: 0.6, duration: 1000 })
  assert.strictEqual(effOf(applyToMob([], slow), 'speed').value, 0.6)
  assert.strictEqual(effOf(applyToMob([{ resist: { debuff: 0.5 } }], slow), 'speed').value, 0.8) // 1+(0.6−1)×0.5
  assert.strictEqual(effOf(applyToMob([{ resist: { debuff: 0 } }], slow), 'speed'), undefined)
})

test('디버프 저항: 스턴 duration 감쇠 (순수 플래그)', () => {
  const stun = effSkill('stun', { value: 1, duration: 200 })  // 시전 tick1 → expireTick 1+200
  assert.strictEqual(effOf(applyToMob([], stun), 'stun').expireTick, 201)
  assert.strictEqual(effOf(applyToMob([{ resist: { debuff: 0.5 } }], stun), 'stun').expireTick, 101) // 1+floor(200×0.5)
  assert.strictEqual(effOf(applyToMob([{ resist: { debuff: 0 } }], stun), 'stun'), undefined)
})

test('디버프 저항: mark value 감쇠 (원시값형, debuff 분류)', () => {
  const mark = effSkill('mark', { valueRatio: 1.0, duration: 1000 })  // value=floor(20×1)=20
  assert.strictEqual(effOf(applyToMob([], mark), 'mark').value, 20)
  assert.strictEqual(effOf(applyToMob([{ resist: { debuff: 0.5 } }], mark), 'mark').value, 10)
  assert.strictEqual(effOf(applyToMob([{ resist: { debuff: 0 } }], mark), 'mark'), undefined)
})

// === 연타봉쇄 (hitCap) — 멀티히트 타격 횟수 제한 ===
test('연타봉쇄: hits = min(skill.hits, hitCap)', () => {
  const mh = { id: 'mh', name: 'mh', kind: 'attack', range: 'melee', power: 1.0, hits: 2, manaGain: 0, cost: 0, cd: 0, effects: [] }
  // 무봉쇄: 2히트 → 각 damage(50,0)=50, 합 −100. 봉쇄(hitCap1): 1히트 → −50.
  const free = rawMob({ atk: 0, spd: 0, hp: 1e6, maxHp: 1e6, def: 0, traits: [] })
  runBattle([striker(mh, 50)], free, { maxTicks: 1 })
  assert.strictEqual(1e6 - free.hp, 100)
  const capped = rawMob({ atk: 0, spd: 0, hp: 1e6, maxHp: 1e6, def: 0, traits: [{ hitCap: 1 }] })
  runBattle([striker(mh, 50)], capped, { maxTicks: 1 })
  assert.strictEqual(1e6 - capped.hp, 50)
})

// === 파티 오라 — 몹 트레잇이 전투 시작 시 파티 전원에 effect 스탬프(영구) ===
const idleMob = (traits = []) => rawMob({ atk: 0, spd: 0, hp: 1e6, maxHp: 1e6, traits })

test('마나억제: manaGain × manaSuppressMult', () => {
  const atkSkill = { id: 'a', name: 'a', kind: 'attack', range: 'melee', power: 1, manaGain: 20, cost: 0, cd: 0, effects: [] }
  const free = striker(atkSkill, 10)
  runBattle([free], idleMob(), { maxTicks: 1 })
  assert.strictEqual(free.mana, 20)
  const supp = striker(atkSkill, 10)
  runBattle([supp], idleMob([{ aura: 'manaSuppress', value: 0.5 }]), { maxTicks: 1 })
  assert.strictEqual(supp.mana, 10)  // floor(20×0.5)
})

const healSkill = { id: 'h', name: 'h', kind: 'heal', range: null, power: 1.0, manaGain: 0, cost: 0, cd: 0, effects: [] }
const healer = () => ({ id: 1, name: 'H', hp: 1e6, maxHp: 1e6, atk: 0, spd: 1000, role: 'heal', heal: 40, def: 0, gauge: 0, mana: 0, manaMax: 100, skillLevels: {}, cooldowns: {}, skills: [healSkill], effects: [] })
const wounded = () => ({ id: 2, name: 'W', hp: 100, maxHp: 1e6, atk: 0, spd: 0, role: 'dps', heal: 0, def: 0, gauge: 0, mana: 0, manaMax: 100, skillLevels: {}, cooldowns: {}, skills: [basicAtk], effects: [] })

test('힐약화/봉쇄: 받는 회복 × healReceivedMult (직접 힐)', () => {
  const w1 = wounded(); runBattle([healer(), w1], idleMob(), { maxTicks: 1 }); assert.strictEqual(w1.hp, 140)                          // +40
  const w2 = wounded(); runBattle([healer(), w2], idleMob([{ aura: 'healReduce', value: 0.5 }]), { maxTicks: 1 }); assert.strictEqual(w2.hp, 120) // +floor(40×0.5)=20
  const w3 = wounded(); runBattle([healer(), w3], idleMob([{ aura: 'healReduce', value: 0 }]), { maxTicks: 1 }); assert.strictEqual(w3.hp, 100)   // +0 봉쇄
})

test('힐약화: HoT proc 회복 × healReceivedMult (tickHoT)', () => {
  const u = { name: 'U', hp: 100, maxHp: 1e6, effects: [
    { type: 'hot', value: 40, nextTick: 1, interval: 100, expireTick: 9999, source: 'p' },
    { type: 'healReduce', value: 0.5, source: 'mob', expireTick: Infinity },
  ] }
  tickHoT(u, 1, [])
  assert.strictEqual(u.hp, 120)  // 100 + floor(40×0.5)
})

test('게이지지연: aura speed<1 → 파티 게이지 감속 (speed effect 재사용)', () => {
  const mk = () => { const u = striker({ id: 'x', name: 'x', kind: 'attack', range: 'melee', power: 1, manaGain: 0, cost: 0, cd: 0, effects: [] }); u.spd = 100; return u }
  const free = mk(); runBattle([free], idleMob(), { maxTicks: 5 }); assert.strictEqual(free.gauge, 500)            // 100×5
  const slow = mk(); runBattle([slow], idleMob([{ aura: 'speed', value: 0.5 }]), { maxTicks: 5 }); assert.strictEqual(slow.gauge, 250) // 100×0.5×5
})

// === 광역 스플래시 모드 (네이티브, 트레잇 아님) ===
test('aoe splash: 주타깃 풀뎀(×1.0) + 그외 floor(atk×aoeRatio)', () => {
  // mob atk50, ratio0.6. 주타깃=앞열(A). 주: damage(50,0)=50. 그외: base floor(30) → damage(30,0)=30.
  const mob = rawMob({ atk: 50, spd: 1000, aoe: true, aoeMode: 'splash', aoeRatio: 0.6 })
  const a = target(0, { id: 1, name: 'A' }); const b = target(0, { id: 2, name: 'B' })
  runBattle([a, b], mob, { maxTicks: 1 })
  assert.strictEqual(1e6 - a.hp, 50)  // 주타깃(앞열)
  assert.strictEqual(1e6 - b.hp, 30)  // 그외
})

test('aoe uniform(기본 aoeMode 미지정): 전원 동일 floor(atk×ratio)', () => {
  const mob = rawMob({ atk: 50, spd: 1000, aoe: true, aoeRatio: 0.6 })
  const a = target(0, { id: 1, name: 'A' }); const b = target(0, { id: 2, name: 'B' })
  runBattle([a, b], mob, { maxTicks: 1 })
  assert.strictEqual(1e6 - a.hp, 30)
  assert.strictEqual(1e6 - b.hp, 30)
})
