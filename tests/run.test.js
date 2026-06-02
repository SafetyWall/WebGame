import { test } from 'node:test'
import assert from 'node:assert'
import { makeRng } from '../src/engine/rng.js'
import { newRun, recruit, upgrade, toggleParty, fight, next, restart, changeJob, expandSlot, slotCost, reorderSkill, reorderParty, MAX_STAGE } from '../src/engine/run.js'

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

test('upgrade: 노비스는 강화 불가(전직만), 비노비스는 레벨+1', () => {
  const s = { ...fresh(), roster: [{ job: 'novice', level: 1 }, { job: 'warrior', level: 1 }], party: [0, 1], gold: 12 }
  assert.strictEqual(upgrade(s, 0), s)   // 노비스 강화 거부(전직해야 성장) → same ref
  const r = upgrade(s, 1)                // 전사 L1→L2, 12→4 gold (UPGRADE_COST 8)
  assert.strictEqual(r.roster[1].level, 2)
  assert.strictEqual(r.gold, 4)
  assert.strictEqual(upgrade(r, 1), r)   // gold 4 < 8 → no-op
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

test('fight win: gold += reward(stage), phase result, outcome win', () => {
  let s = fresh()
  s = { ...s, roster: [{ job: 'guardian', level: 5 }, { job: 'warrior', level: 5 }, { job: 'mage', level: 5 }], party: [0, 1, 2] }
  const r = fight(s)
  assert.strictEqual(r.phase, 'result')
  assert.strictEqual(r.lastResult.outcome, 'win')
  assert.strictEqual(r.gold, s.gold + (10 + 2 * s.stage))
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

test('changeJob: 노비스(L1) → 전사, 레벨 자동 +1(L2), PROMOTE_COST 10', () => {
  const s = { ...fresh(), roster: [{ job: 'novice', level: 1 }], party: [0], gold: 10 }
  const r = changeJob(s, 0, 'warrior')
  assert.strictEqual(r.roster[0].job, 'warrior')
  assert.strictEqual(r.roster[0].level, 2)   // 전직 = 레벨업(자동 +1)
  assert.strictEqual(r.gold, 0)
  assert.deepStrictEqual(r.roster[0].learnedSkills, ['warrior_cleave'])  // 기본 학습 1개
  assert.deepStrictEqual(r.roster[0].skillLevels, { warrior_cleave: 1 })
})

test('changeJob refused: 비노비스/골드부족/잘못된job/없는인덱스/전직레벨아님 (same ref)', () => {
  const base = { ...fresh(), roster: [{ job: 'warrior', level: 2 }, { job: 'novice', level: 1 }], gold: 5 }
  assert.strictEqual(changeJob(base, 0, 'mage'), base)        // 비노비스
  const poor = { ...base, gold: 4 }
  assert.strictEqual(changeJob(poor, 1, 'mage'), poor)        // 골드부족
  assert.strictEqual(changeJob(base, 1, 'cleric'), base)      // 잘못된 job
  assert.strictEqual(changeJob(base, 9, 'mage'), base)        // 없는 인덱스
  const l2 = { ...fresh(), roster: [{ job: 'novice', level: 2 }], gold: 5 }
  assert.strictEqual(changeJob(l2, 0, 'mage'), l2)            // 전직레벨(1) 아님
})

test('slotCost increments: 3→4=5, 4→5=9, 5→6=13', () => {
  assert.strictEqual(slotCost(3), 5)
  assert.strictEqual(slotCost(4), 9)
  assert.strictEqual(slotCost(5), 13)
})

test('reorderSkill: 스킬 우선순위 위/아래 이동, 경계/무효는 no-op(same ref)', () => {
  const s = { ...fresh(), roster: [{ job: 'warrior', level: 2 }], party: [0] }
  const r = reorderSkill(s, 0, 'melee_strike', -1)            // 평타를 위로
  assert.deepStrictEqual(r.roster[0].skillOrder, ['melee_strike', 'warrior_cleave'])
  assert.strictEqual(reorderSkill(r, 0, 'melee_strike', -1), r) // 이미 맨 위 → no-op
  assert.strictEqual(reorderSkill(s, 0, 'bogus', -1), s)        // 없는 스킬
  assert.strictEqual(reorderSkill(s, 9, 'melee_strike', -1), s) // 없는 인덱스
})

test('fight가 roster.skillOrder를 전투에 반영(순서 다르면 결과 다름)', () => {
  const enc = { name: '더미', hp: 100000, atk: 0, def: 0, spd: 0, aoe: false, boss: false, traits: [] }
  const base = { ...fresh(), party: [0], encounter: enc }
  const def = fight({ ...base, roster: [{ job: 'warrior', level: 5 }] })                                         // 기본순(갑옷부수기 우선)
  const plain = fight({ ...base, roster: [{ job: 'warrior', level: 5, skillOrder: ['melee_strike', 'warrior_cleave'] }] }) // 평타 우선
  const dlog = def.lastResult.rounds.flatMap(r => r.log).join('\n')
  const plog = plain.lastResult.rounds.flatMap(r => r.log).join('\n')
  assert.notStrictEqual(dlog, plog)        // 우선순위 override가 전투를 바꿈 = skillOrder 전달됨
  assert.match(dlog, /\(-74\)/)            // 기본: 갑옷부수기(floor(44×1.7)=74) 발동
  assert.doesNotMatch(plog, /\(-74\)/)     // 평타우선: 발동 안 함(평타만)
})

test('expandSlot: slots+1 for slotCost gold; refused when poor (same ref)', () => {
  const s = { ...fresh(), gold: 5, slots: 3 }
  const r = expandSlot(s)
  assert.strictEqual(r.slots, 4)
  assert.strictEqual(r.gold, 0)
  const poor = { ...fresh(), gold: 4, slots: 3 }
  assert.strictEqual(expandSlot(poor), poor)
})

test('reorderParty moves a unit toward the front', () => {
  const s = { ...fresh(), party: [0, 1, 2] }
  assert.deepStrictEqual(reorderParty(s, 2, -1).party, [0, 2, 1])
})

test('reorderParty moves a unit toward the back', () => {
  const s = { ...fresh(), party: [0, 1, 2] }
  assert.deepStrictEqual(reorderParty(s, 0, 1).party, [1, 0, 2])
})

test('reorderParty is a no-op at boundaries or for non-party units', () => {
  const s = { ...fresh(), party: [0, 1, 2] }
  assert.strictEqual(reorderParty(s, 0, -1), s)   // 이미 맨앞
  assert.strictEqual(reorderParty(s, 2, 1), s)    // 이미 맨뒤
  assert.strictEqual(reorderParty(s, 5, -1), s)   // 미출전 인덱스
})
