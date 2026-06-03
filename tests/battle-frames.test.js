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

test('record: effect = effects 태그 노출(전사 강화 학습 시 speed/dmgDealt)', () => {
  const w = makeUnit(JOBS.warrior, 5, ['warrior_might', 'melee_strike'], { warrior_might: 1 }, ['warrior_might'])
  const r = runBattle([w], makeMob(SLIME), { record: true })
  const hasBuff = r.frames.some(f => f.party[0].effects.includes('speed') || f.party[0].effects.includes('dmgDealt'))
  assert.ok(hasBuff, '강화 effect 태그가 frame에 나와야')
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
