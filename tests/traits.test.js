import { test } from 'node:test'
import assert from 'node:assert'
import { TRAITS } from '../src/data/traits.js'
import { applyRules } from '../src/engine/traits.js'
import { JOBS } from '../src/data/jobs.js'
import { SLIME, TURTLE } from './_fixtures.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

const TRIGGERS = ['incomingDamage', 'postIncomingDamage', 'turnStart']
const OPS = ['mult', 'add', 'heal', 'reflect']

test('TRAITS entries have id(=key)/name; 규칙 트레잇은 trigger/op/value 유효 enum', () => {
  for (const [key, t] of Object.entries(TRAITS)) {
    assert.strictEqual(t.id, key, `${key} id matches key`)
    assert.ok(t.name, `${key} name`)
    if (t.targeting || t.stat) continue                  // 타겟팅·스탯 트레잇 = 규칙 파이프 무관(별도 테스트)
    assert.ok(TRIGGERS.includes(t.trigger), `${key} trigger`)
    assert.ok(OPS.includes(t.op), `${key} op`)
    assert.ok(Number.isFinite(t.value), `${key} value`)
  }
})

test('melee_evade is a melee incoming-damage 0.7 multiplier', () => {
  const e = TRAITS.melee_evade
  assert.strictEqual(e.trigger, 'incomingDamage')
  assert.deepStrictEqual(e.cond, { attackerRange: 'melee' })
  assert.strictEqual(e.op, 'mult')
  assert.strictEqual(e.value, 0.7)
})

// 합성 규칙으로 엔진 단독 검증(data 테이블 무관).
const mobWith = (traits, over = {}) => ({ name: 'M', hp: 100, maxHp: 100, traits, ...over })

test('mult op transforms the incoming value', () => {
  const mob = mobWith([{ trigger: 'incomingDamage', op: 'mult', value: 0.7 }])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 7)
})

test('mult by 0 produces 0 (total immunity, not skipped)', () => {
  const mob = mobWith([{ trigger: 'incomingDamage', op: 'mult', value: 0 }])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 0)
})

test('add op transforms the incoming value', () => {
  const mob = mobWith([{ trigger: 'incomingDamage', op: 'add', value: 5 }])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 15)
})

test('cond matches only when every key equals ctx', () => {
  const mob = mobWith([{ trigger: 'incomingDamage', cond: { attackerRange: 'melee' }, op: 'mult', value: 0.5 }])
  assert.strictEqual(applyRules('incomingDamage', 10, { attackerRange: 'melee' }, mob), 5)   // 매칭
  assert.strictEqual(applyRules('incomingDamage', 10, { attackerRange: 'ranged' }, mob), 10) // 불일치
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 10)                          // 키 없음
})

test('only rules for the fired trigger apply', () => {
  const mob = mobWith([{ trigger: 'turnStart', op: 'mult', value: 0 }])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 10)
})

test('priority ascending: lower applies first (order changes result)', () => {
  const mob = mobWith([
    { trigger: 'incomingDamage', op: 'add', value: 5, priority: 200 },
    { trigger: 'incomingDamage', op: 'mult', value: 0.7, priority: 100 },
  ])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 12) // (10*0.7)+5
})

test('default priority is 100', () => {
  const mob = mobWith([
    { trigger: 'incomingDamage', op: 'add', value: 5, priority: 50 }, // 먼저
    { trigger: 'incomingDamage', op: 'mult', value: 0.7 },            // 기본 100 → 나중
  ])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 10.5) // (10+5)*0.7
})

test('exclusive rule stops later rules', () => {
  const mob = mobWith([
    { trigger: 'incomingDamage', op: 'mult', value: 0, priority: 100, exclusive: true },
    { trigger: 'incomingDamage', op: 'add', value: 5, priority: 200 },
  ])
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mob), 0) // add 무적용
})

test('heal op raises mob hp capped at maxHp; value passes through', () => {
  const mob = mobWith([{ trigger: 'turnStart', op: 'heal', value: 20 }], { hp: 90, maxHp: 100 })
  const ret = applyRules('turnStart', 0, {}, mob)
  assert.strictEqual(mob.hp, 100) // 90+20 capped
  assert.strictEqual(ret, 0)
})

test('reflect op damages attacker by floor(damage * value)', () => {
  const attacker = { name: 'A', hp: 50 }
  const mob = mobWith([{ trigger: 'postIncomingDamage', op: 'reflect', value: 0.3 }])
  applyRules('postIncomingDamage', 0, { attacker, damage: 17 }, mob)
  assert.strictEqual(attacker.hp, 45) // 50 - floor(17*0.3)=5
})

test('reflect clamps attacker hp at 0 (never negative)', () => {
  const attacker = { name: 'A', hp: 3 }
  const mob = mobWith([{ trigger: 'postIncomingDamage', op: 'reflect', value: 0.5 }])
  applyRules('postIncomingDamage', 0, { attacker, damage: 20 }, mob) // floor(20*0.5)=10 > 3
  assert.strictEqual(attacker.hp, 0) // -7 아니라 0
})

test('reflect is a no-op when ctx has no attacker', () => {
  const mob = mobWith([{ trigger: 'postIncomingDamage', op: 'reflect', value: 0.3 }])
  assert.strictEqual(applyRules('postIncomingDamage', 9, { damage: 9 }, mob), 9) // throw 없음, value 그대로
})

test('empty or missing traits leaves value unchanged', () => {
  assert.strictEqual(applyRules('incomingDamage', 10, {}, mobWith([])), 10)
  assert.strictEqual(applyRules('incomingDamage', 10, {}, { name: 'M', hp: 1, maxHp: 1 }), 10) // traits undefined
})

test('makeMob resolves trait ids into shared TRAITS defs', () => {
  const m = makeMob({ name: 'T', hp: 100, atk: 10, def: 0, spd: 5, traits: ['melee_evade'] })
  assert.strictEqual(m.traits[0], TRAITS.melee_evade) // 공유 def 참조(clone 아님)
})

test('makeMob defaults to empty traits when mob has none', () => {
  assert.deepStrictEqual(makeMob(SLIME).traits, [])
})

const logsOf = (r) => r.rounds.flatMap(rd => rd.log)

test('melee_evade reduces a melee attacker damage by 30% (floor, min 1)', () => {
  // 전사 atk22 vs 가시거북 def8 → base 14, ×0.7=9.8 → floor 9
  const r = runBattle([makeUnit(JOBS.warrior)], makeMob({ ...TURTLE, traits: ['melee_evade'] }), { maxTicks: 200 })
  assert.match(logsOf(r).join('\n'), /전사 공격 → 가시거북 \(-9\)/)
})

test('melee_evade does not reduce a ranged (mage) attacker damage', () => {
  // 마법사 atk32 vs def8 → 24, range=ranged → 미감소
  const r = runBattle([makeUnit(JOBS.mage)], makeMob({ ...TURTLE, traits: ['melee_evade'] }), { maxTicks: 200 })
  assert.match(logsOf(r).join('\n'), /마법사 공격 → 가시거북 \(-24\)/)
})

test('snapshot includes mob trait names', () => {
  const r = runBattle([makeUnit(JOBS.warrior)], makeMob({ ...TURTLE, traits: ['melee_evade'] }), { maxTicks: 200 })
  assert.deepStrictEqual(r.rounds.at(-1).mob.traits, ['근접회피'])
})

test('mobs without traits report empty trait list in snapshot', () => {
  const r = runBattle([makeUnit(JOBS.warrior)], makeMob(SLIME), { maxTicks: 50 })
  assert.deepStrictEqual(r.rounds.at(-1).mob.traits, [])
})

test('every trait has a valid rarity', () => {
  const RARITIES = ['일반', '희귀', '영웅', '전설']
  for (const t of Object.values(TRAITS)) {
    assert.ok(RARITIES.includes(t.rarity), `${t.id} rarity: ${t.rarity}`)
  }
})

test('trait rarities match the assigned roster', () => {
  assert.strictEqual(TRAITS.self_heal.rarity, '희귀')
  assert.strictEqual(TRAITS.damage_reflect.rarity, '희귀')
  assert.strictEqual(TRAITS.melee_immune.rarity, '영웅')
})

test('스탯 트레잇 = 일반(stat/mult), 속도 증가폭이 더 작음', () => {
  for (const id of ['stat_atk', 'stat_def', 'stat_hp', 'stat_spd']) {
    const t = TRAITS[id]
    assert.strictEqual(t.rarity, '일반')
    assert.ok(['atk', 'def', 'hp', 'spd'].includes(t.stat), `${id} stat`)
    assert.ok(t.mult > 1, `${id} mult>1`)
  }
  assert.ok(TRAITS.stat_spd.mult < TRAITS.stat_atk.mult, '속도 < 공격 증가폭')
})

test('타겟팅 트레잇 = 희귀(탱월 무력화): 저체력추적·고공격력추적', () => {
  assert.strictEqual(TRAITS.low_hp_seek.rarity, '희귀')
  assert.deepStrictEqual(TRAITS.low_hp_seek.targeting, { position: 0, lowHp: 1 })
  assert.strictEqual(TRAITS.atk_seek.rarity, '희귀')
  assert.deepStrictEqual(TRAITS.atk_seek.targeting, { position: 0, atk: 1 })
})

test('melee_immune nullifies melee damage to exactly 0', () => {
  // 전사 평타가 근접면역(mult 0) 몹에 0뎀. mob spd0 → 반격 없음.
  const mob = makeMob({ name: 'X', hp: 100, atk: 0, def: 0, spd: 0, traits: ['melee_immune'] })
  const r = runBattle([makeUnit(JOBS.warrior)], mob, { maxTicks: 200 })
  assert.match(logsOf(r).join('\n'), /전사 공격 → X \(-0\)/)
})

test('melee_evade keeps a 1-damage hit at min 1 (evade ≠ immune)', () => {
  // atk1 평타 → base damage 1; evade ×0.7=0.7 → floor 0 → t≠0 → max(1)=1.
  const atk1 = { ...makeUnit(JOBS.warrior), atk: 1 }
  const mob = makeMob({ name: 'Y', hp: 100, atk: 0, def: 0, spd: 0, traits: ['melee_evade'] })
  const r = runBattle([atk1], mob, { maxTicks: 200 })
  assert.match(logsOf(r).join('\n'), /→ Y \(-1\)/)
})

test('ranged_immune = 원거리 0뎀 (영웅, melee_immune의 거울)', () => {
  const t = TRAITS.ranged_immune
  assert.strictEqual(t.rarity, '영웅')
  assert.strictEqual(t.trigger, 'incomingDamage')
  assert.deepStrictEqual(t.cond, { attackerRange: 'ranged' })
  assert.strictEqual(t.op, 'mult')
  assert.strictEqual(t.value, 0)
})

test('ranged_immune: 마법사(원거리) 0뎀, 전사(근접)는 통함', () => {
  const m1 = makeMob({ name: 'X', hp: 100000, atk: 0, def: 0, spd: 0, traits: ['ranged_immune'] })
  const r1 = runBattle([makeUnit(JOBS.mage)], m1, { maxTicks: 200 })
  assert.match(logsOf(r1).join('\n'), /마법사 공격 → X \(-0\)/)
  const m2 = makeMob({ name: 'Y', hp: 100000, atk: 0, def: 0, spd: 0, traits: ['ranged_immune'] })
  const r2 = runBattle([makeUnit(JOBS.warrior)], m2, { maxTicks: 200 })
  assert.match(logsOf(r2).join('\n'), /전사 공격 → Y \(-22\)/)
})

test('전설 트레잇 존재 (regeneration = turnStart heal)', () => {
  const legendaries = Object.values(TRAITS).filter(t => t.rarity === '전설')
  assert.ok(legendaries.length >= 1, '전설 1종 이상')
  const regen = TRAITS.regeneration
  assert.strictEqual(regen.rarity, '전설')
  assert.strictEqual(regen.trigger, 'turnStart')
  assert.strictEqual(regen.op, 'heal')
  assert.ok(regen.value > 0)
})

test('targeting 트레잇 = trigger 없음(applyRules 무간섭) + targeting weight 보유', () => {
  const t = TRAITS.low_hp_seek
  assert.ok(t.targeting && typeof t.targeting === 'object', 'low_hp_seek targeting')
  assert.strictEqual(t.trigger, undefined, 'low_hp_seek no trigger')
  assert.strictEqual(t.targeting.lowHp, 1)
})
