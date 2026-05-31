import { test } from 'node:test'
import assert from 'node:assert'
import { makeRng } from '../src/engine/rng.js'
import { newRun, recruit, upgrade, toggleParty, fight, next, restart, changeJob, expandSlot, slotCost, MAX_STAGE } from '../src/engine/run.js'

const fresh = () => newRun(makeRng(1))

test('newRun gives start state', () => {
  const s = fresh()
  assert.strictEqual(s.phase, 'prep')
  assert.strictEqual(s.gold, 5)
  assert.strictEqual(s.stage, 1)
  assert.strictEqual(s.slots, 3)
  assert.strictEqual(s.roster.length, 2)
  assert.deepStrictEqual(s.party, [0, 1])
  assert.ok(s.encounter && s.encounter.name)
})

test('recruit adds a novice for 4 gold; refused when gold < 4', () => {
  const s = recruit(fresh())            // 5 → 1 gold, roster 3
  assert.strictEqual(s.gold, 1)
  assert.strictEqual(s.roster.length, 3)
  const s2 = recruit(s)                 // gold 1 < 4 → no-op
  assert.strictEqual(s2, s)
})

test('upgrade raises a unit level for 4 gold; refused at gold<4 and at MAX_LEVEL', () => {
  const s = upgrade(fresh(), 0)         // novice L1→L2, 5→1 gold
  assert.strictEqual(s.roster[0].level, 2)
  assert.strictEqual(s.gold, 1)
  assert.strictEqual(upgrade(s, 0), s)  // gold 1 < 4 → no-op
})

test('toggleParty adds/removes; refuses over slots', () => {
  let s = fresh()                       // party [0,1], slots 3
  s = recruit(s)                        // roster has idx 2
  s = toggleParty(s, 2)                 // [0,1,2] (==slots 3)
  assert.deepStrictEqual(s.party, [0, 1, 2])
  s = toggleParty(s, 1)                 // remove 1 → [0,2]
  assert.deepStrictEqual(s.party, [0, 2])
  s = toggleParty(s, 1)                 // re-add → [0,2,1] (len 3 == slots)
  assert.strictEqual(s.party.length, 3)
})

test('fight win: gold += 4+stage, phase result, outcome win', () => {
  let s = fresh()
  s = { ...s, roster: [{ job: 'guardian', level: 5 }, { job: 'warrior', level: 5 }, { job: 'mage', level: 5 }], party: [0, 1, 2] }
  const r = fight(s)
  assert.strictEqual(r.phase, 'result')
  assert.strictEqual(r.lastResult.outcome, 'win')
  assert.strictEqual(r.gold, s.gold + (4 + s.stage))
  assert.ok(Array.isArray(r.lastResult.rounds))
})

test('fight loss: outcome loss, gold unchanged', () => {
  let s = fresh()
  s = { ...s, roster: [{ job: 'priest', level: 1 }], party: [0] } // 사제 단독 → 몹 못 죽임 → 교착 패
  const r = fight(s)
  assert.strictEqual(r.lastResult.outcome, 'loss')
  assert.strictEqual(r.gold, s.gold)
})

test('fight with empty party is a no-op', () => {
  const s = { ...fresh(), party: [] }
  assert.strictEqual(fight(s), s)
})

test('fight win on the final stage yields clear', () => {
  let s = fresh()
  s = { ...s, stage: MAX_STAGE, roster: [{ job: 'guardian', level: 5 }, { job: 'warrior', level: 5 }, { job: 'mage', level: 5 }], party: [0, 1, 2], encounter: { name: '약골', hp: 1, atk: 0, def: 0, spd: 0, aoe: false, traits: [] } }
  const r = fight(s)
  assert.strictEqual(r.lastResult.outcome, 'clear')
})

test('next advances stage and generates a new encounter', () => {
  const rng = makeRng(2)
  let s = newRun(rng)
  s = { ...s, phase: 'result', lastResult: { outcome: 'win', rounds: [], ticks: 1, reward: 5 } }
  const r = next(s, rng)
  assert.strictEqual(r.stage, 2)
  assert.strictEqual(r.phase, 'prep')
  assert.ok(r.encounter && r.encounter.name)
  assert.strictEqual(r.lastResult, null)
})

test('restart returns a fresh run', () => {
  const r = restart(makeRng(1))
  assert.strictEqual(r.stage, 1)
  assert.strictEqual(r.gold, 5)
})

test('deterministic: same seed + same actions → same state', () => {
  const a = recruit(newRun(makeRng(7)))
  const b = recruit(newRun(makeRng(7)))
  assert.deepStrictEqual(a, b)
})

test('next is a no-op at the final stage (terminal)', () => {
  const rng = makeRng(3)
  const s = { ...newRun(rng), stage: MAX_STAGE }
  assert.strictEqual(next(s, rng), s) // 같은 ref, 크래시 없음
})

test('fight only runs in prep phase (no double-resolve)', () => {
  const s = { ...newRun(makeRng(3)), phase: 'result' }
  assert.strictEqual(fight(s), s) // result 국면 → no-op
})

test('changeJob: novice → warrior for 5 gold, level preserved', () => {
  const s = { ...fresh(), roster: [{ job: 'novice', level: 3 }], party: [0], gold: 5 }
  const r = changeJob(s, 0, 'warrior')
  assert.strictEqual(r.roster[0].job, 'warrior')
  assert.strictEqual(r.roster[0].level, 3)   // 레벨 유지
  assert.strictEqual(r.gold, 0)
})

test('changeJob refused: non-novice, gold<5, invalid job (same ref)', () => {
  const base = { ...fresh(), roster: [{ job: 'warrior', level: 1 }, { job: 'novice', level: 1 }], gold: 5 }
  assert.strictEqual(changeJob(base, 0, 'mage'), base)        // 비노비스
  const poor = { ...base, gold: 4 }
  assert.strictEqual(changeJob(poor, 1, 'mage'), poor)        // 골드부족
  assert.strictEqual(changeJob(base, 1, 'cleric'), base)      // 잘못된 job
  assert.strictEqual(changeJob(base, 9, 'mage'), base)        // 없는 인덱스
})

test('slotCost increments: 3→4=5, 4→5=9, 5→6=13', () => {
  assert.strictEqual(slotCost(3), 5)
  assert.strictEqual(slotCost(4), 9)
  assert.strictEqual(slotCost(5), 13)
})

test('expandSlot: slots+1 for slotCost gold; refused when poor (same ref)', () => {
  const s = { ...fresh(), gold: 5, slots: 3 }
  const r = expandSlot(s)
  assert.strictEqual(r.slots, 4)
  assert.strictEqual(r.gold, 0)
  const poor = { ...fresh(), gold: 4, slots: 3 }
  assert.strictEqual(expandSlot(poor), poor)
})
