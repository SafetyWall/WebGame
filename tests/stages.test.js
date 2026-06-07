import { test } from 'node:test'
import assert from 'node:assert'
import { STAGES, MAX_STAGE, stageCfg } from '../src/data/stages.js'
import { TRAITS } from '../src/data/traits.js'
import { generateEncounter } from '../src/engine/encounter.js'
import { makeRng } from '../src/engine/rng.js'

const poolSize = (rarity) => Object.values(TRAITS).filter(t => t.rarity === rarity && !t.inactive).length

test('MAX_STAGE = 50, STAGES covers 1..50', () => {
  assert.strictEqual(MAX_STAGE, 50)
  assert.strictEqual(Object.keys(STAGES).length, 50)
  assert.ok(STAGES[1] && STAGES[50])
})

test('stageCfg: level = stage', () => {
  for (let s = 1; s <= MAX_STAGE; s++) assert.strictEqual(stageCfg(s).level, s)
})

test('트레잇 슬롯 = 10스테이지마다 1개 추가(일반/희귀/일반/영웅/희귀 누적)', () => {
  const eq = (s, exp) => assert.deepStrictEqual(stageCfg(s).traitSlots, exp, `S${s}`)
  for (const s of [1, 10]) eq(s, ['일반'])
  for (const s of [11, 20]) eq(s, ['일반', '희귀'])
  for (const s of [21, 30]) eq(s, ['일반', '희귀', '일반'])
  for (const s of [31, 40]) eq(s, ['일반', '희귀', '일반', '영웅'])
  for (const s of [41, 50]) eq(s, ['일반', '희귀', '일반', '영웅', '희귀'])
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

test('generateEncounter(50)이 크래시 없이 유효 조우 생성(일반2+희귀2+영웅1 슬롯)', () => {
  const e = generateEncounter(50, makeRng(7))
  assert.ok(e.name && Number.isFinite(e.hp))
  assert.ok(Array.isArray(e.traits))
})
