import { test } from 'node:test'
import assert from 'node:assert'
import { runBattle } from '../src/engine/battle.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { JOBS } from '../src/data/jobs.js'
import { battleFrames, newRun, fight } from '../src/engine/run.js'
import { makeRng } from '../src/engine/rng.js'
import { SLIME } from './_fixtures.js'

test('record off = frames 빈 배열(기존 동작·sim 무영향)', () => {
  const w = makeUnit(JOBS.warrior, 3)
  const r = runBattle([w], makeMob(SLIME))
  assert.deepStrictEqual(r.frames, [])
})

test('record on = 액션단위 frame, 전체 전황 포함', () => {
  const w = makeUnit(JOBS.warrior, 5)
  const r = runBattle([w], makeMob(SLIME), { record: true })
  assert.ok(r.frames.length > 0)
  const f = r.frames[0]
  assert.ok(typeof f.tick === 'number')
  assert.ok(typeof f.actor === 'string')
  assert.ok(Array.isArray(f.log))
  // 파티 유닛 전황: hp/maxHp/mana/manaMax/gauge/alive/effects
  const p = f.party[0]
  for (const k of ['name', 'level', 'hp', 'maxHp', 'mana', 'manaMax', 'gauge', 'alive', 'effects']) assert.ok(k in p, `missing ${k}`)
  assert.ok('hp' in f.mob && 'maxHp' in f.mob && Array.isArray(f.mob.effects))
})

test('record: 결정론 — frames 켜도 승패·틱 동일', () => {
  const mk = () => [makeUnit(JOBS.warrior, 5)]
  const a = runBattle(mk(), makeMob(SLIME))
  const b = runBattle(mk(), makeMob(SLIME), { record: true })
  assert.strictEqual(a.winner, b.winner)
  assert.strictEqual(a.ticks, b.ticks)
})

test('record: 마지막 frame = 전투 종료 상태(몹 사망)', () => {
  const w = makeUnit(JOBS.warrior, 10)
  const r = runBattle([w], makeMob(SLIME), { record: true })
  assert.strictEqual(r.winner, 'party')
  assert.strictEqual(r.frames[r.frames.length - 1].mob.hp, 0)
})

test('record: effect = effects 태그 노출(마법사 마력집중 학습 시 dmgDealt)', () => {
  const w = makeUnit(JOBS.mage, 5, ['mage_focus', 'ranged_strike'], { mage_focus: 1 }, ['mage_focus'])
  const r = runBattle([w], makeMob(SLIME), { record: true })
  const hasBuff = r.frames.some(f => f.party[0].effects.some(e => e.type === 'speed' || e.type === 'dmgDealt'))
  assert.ok(hasBuff, '버프 effect 태그가 frame에 나와야')
  // 인스턴스 = 정확표기용 value/expireTick 보존
  const ef = r.frames.flatMap(f => f.party[0].effects).find(e => e.type === 'dmgDealt')
  assert.ok(ef && typeof ef.value === 'number' && typeof ef.expireTick === 'number', 'effect 인스턴스에 value·expireTick')
})

test('record: frame에 행동자 인덱스 + 타겟 ref', () => {
  const w = makeUnit(JOBS.warrior, 5)
  const r = runBattle([w], makeMob(SLIME), { record: true })
  const pAtk = r.frames.find(f => f.actorRef === 0 && f.targets.includes('mob'))
  assert.ok(pAtk, '파티원 공격 frame: actorRef=0, targets에 mob')
  const mAtk = r.frames.find(f => f.actorRef === 'mob' && f.targets.includes(0))
  assert.ok(mAtk, '몹 공격 frame: actorRef=mob, targets에 파티 인덱스 0')
})

test('record: 행동자 인덱스로 동일유닛 구분(0과 1 모두 등장)', () => {
  const party = [makeUnit(JOBS.warrior, 5), makeUnit(JOBS.warrior, 5)]
  const r = runBattle(party, makeMob(SLIME), { record: true })
  const refs = new Set(r.frames.filter(f => typeof f.actorRef === 'number').map(f => f.actorRef))
  assert.ok(refs.has(0) && refs.has(1), '두 유닛 모두 행동자로 기록(인덱스 0,1)')
})

test('record: frame.mob에 트레잇 id 노출(재생뷰 특성 표시용)', () => {
  const w = makeUnit(JOBS.warrior, 5)
  const mob = makeMob({ name: '가시거북', hp: 60, atk: 8, spd: 8, traits: ['melee_evade'] })
  const r = runBattle([w], mob, { record: true })
  assert.ok(r.frames[0].mob.traits.includes('melee_evade'), 'frame.mob.traits에 트레잇 id')
})

test('battleFrames(run): fight 후 상태로 frame 재생성', () => {
  let s = { ...newRun(makeRng(1)), roster: [{ job: 'warrior', level: 6 }], party: [0] }
  const frames = battleFrames(s)
  assert.ok(frames.length > 0)
  assert.ok(frames[0].party[0].name === '전사')
})

test('battleFrames: 빈 파티 = []', () => {
  const s = { ...newRun(makeRng(1)), party: [] }
  assert.deepStrictEqual(battleFrames(s), [])
})
