import { test } from 'node:test'
import assert from 'node:assert'
import { STAGES, MAX_STAGE, stageCfg } from '../src/data/stages.js'
import { TRAITS } from '../src/data/traits.js'
import { generateEncounter } from '../src/engine/encounter.js'
import { makeRng } from '../src/engine/rng.js'

const poolSize = (rarity) => Object.values(TRAITS).filter(t => t.rarity === rarity).length

test('MAX_STAGE = 20, STAGES covers 1..20', () => {
  assert.strictEqual(MAX_STAGE, 20)
  assert.strictEqual(Object.keys(STAGES).length, 20)
  assert.ok(STAGES[1] && STAGES[20])
})

test('stageCfg: level = stage', () => {
  for (let s = 1; s <= MAX_STAGE; s++) assert.strictEqual(stageCfg(s).level, s)
})

test('온보딩: S1~2 무트레잇', () => {
  assert.deepStrictEqual(stageCfg(1).traitSlots, [])
  assert.deepStrictEqual(stageCfg(2).traitSlots, [])
})

test('트레잇 슬롯 수 단조 증가(비감소)', () => {
  for (let s = 2; s <= MAX_STAGE; s++) {
    assert.ok(stageCfg(s).traitSlots.length >= stageCfg(s - 1).traitSlots.length, `S${s} >= S${s-1}`)
  }
})

test('레어도별 동시 슬롯 수 ≤ 그 레어도 풀 크기 (조우생성 스킵 방지)', () => {
  for (let s = 1; s <= MAX_STAGE; s++) {
    const counts = {}
    for (const r of stageCfg(s).traitSlots) counts[r] = (counts[r] || 0) + 1
    for (const r in counts) assert.ok(counts[r] <= poolSize(r), `S${s} ${r} ${counts[r]} <= pool ${poolSize(r)}`)
  }
})

test('generateEncounter(20)이 크래시 없이 유효 조우 생성', () => {
  const e = generateEncounter(20, makeRng(7))
  assert.ok(e.name && Number.isFinite(e.hp))
  assert.ok(Array.isArray(e.traits))
})
