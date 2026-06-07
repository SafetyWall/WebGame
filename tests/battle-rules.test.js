// 리뷰(2026-05-30)에서 드러난 엔진 규칙 미검증 구멍을 메우는 테스트.
import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SLIME, OGRE } from './_fixtures.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle, ROUND_TICKS } from '../src/engine/battle.js'

// 게이지·동시틱 등 정밀 제어용 원시 유닛/몹 (makeUnit은 spd 고정·def0 강제라 부적합).
const rawUnit = (o) => ({
  name: 'U', maxHp: 100, hp: 100, atk: 1,
  spd: 1, role: 'dps', heal: 0, def: 0, gauge: 0,
  skills: [{ id: 'melee_strike', name: '평타', kind: 'attack', range: 'melee', power: 1, manaGain: 0, cost: 0, cd: 0, effects: [] }],
  mana: 0, cooldowns: {}, effects: [], ...o,
})
const rawMob = (o) => ({
  name: 'M', maxHp: 100, hp: 100, atk: 0, def: 0, spd: 0,
  aoe: false, aoeRatio: 0.6, gauge: 0, isMob: true, effects: [], ...o,
})
const logsOf = (r) => r.rounds.flatMap(rd => rd.log)

// #4 — 광역 데미지 = base floor(atk*ratio)=floor(28*0.6)=16, 그 뒤 def % 경감. 로그도 적용값과 일치.
test('aoe applies floor(atk*ratio) then def mitigation, logs the applied value', () => {
  // 가디언(spd5, def100) vs 오우거(spd6, aoe). maxTicks 170: 오우거만 1회 행동(틱167), 가디언 미행동.
  // base16 → damage(16,100)=8 (def100=50% 경감).
  const party = [makeUnit(JOBS.guardian)]
  const mob = makeMob(OGRE)
  const r = runBattle(party, mob, { maxTicks: 170 })
  assert.strictEqual(r.rounds.at(-1).party[0].hp, 260 - 8) // 252
  assert.match(logsOf(r).join('\n'), /광역 \(개당 -8\)/)
})

// 스냅샷에 aoe 플래그 노출(렌더가 광역 라벨 표기에 사용).
test('snapshot exposes mob.aoe flag', () => {
  const r = runBattle([makeUnit(JOBS.guardian)], makeMob(OGRE), { maxTicks: 170 })
  assert.strictEqual(r.rounds.at(-1).mob.aoe, true)
  const r2 = runBattle([makeUnit(JOBS.guardian)], makeMob(SLIME), { maxTicks: 50 })
  assert.strictEqual(r2.rounds.at(-1).mob.aoe, false)
})

// #5 — 몹 단일공격이 실전에서 도발 탱으로 라우팅되는지(콜사이트 통합).
test('mob single-target routes to taunt tank inside a real battle', () => {
  const g = makeUnit(JOBS.guardian); g.mana = 100   // 첫 행동에 도발 발동
  const party = [g, makeUnit(JOBS.mage)]
  const mob = makeMob(SLIME) // aoe:false
  const r = runBattle(party, mob, { maxTicks: 400 })
  const log = logsOf(r).join('\n')
  assert.match(log, /→ 가디언/)   // 도발 발동 후 몹이 탱 때림
  // doesNotMatch(/→ 마법사/)는 삭제 — 도발 발동 전 1~2틱 노출 가능. 도발 작동=가디언 피격으로 검증.
})

// #6 — 진짜 교착: 유닛이 행동하지만 못 이김 → maxTicks 도달 → 몹 승.
test('active stalemate (units act but cannot win) -> mob wins at maxTicks', () => {
  const party = [makeUnit(JOBS.priest)] // 힐러는 몹 공격 안 함 → 못 죽임
  const mob = makeMob(OGRE)
  const r = runBattle(party, mob, { maxTicks: 3000 })
  assert.strictEqual(r.winner, 'mob')
  assert.strictEqual(r.ticks, 3000)
  assert.match(logsOf(r).join('\n'), /회복/) // 실제로 행동했음(frozen 아님)
})

// #7a — 동시틱 치명타 = 파티 우선(의도된 결정) 고정.
test('same-tick lethal: party acts first, mob does not retaliate', () => {
  const A = rawUnit({ name: 'A', maxHp: 5, hp: 5, atk: 100, spd: 10000 })
  const M = rawMob({ name: 'M', maxHp: 5, hp: 5, atk: 100, spd: 10000 })
  const r = runBattle([A], M)
  assert.strictEqual(r.winner, 'party')
  assert.strictEqual(r.ticks, 1)
  assert.strictEqual(r.rounds.at(-1).party[0].hp, 5) // 반격 안 당함
  assert.doesNotMatch(logsOf(r).join('\n'), /M 공격 →/) // 몹 행동 안 함
})

// #7b — 게이지 carry(초과분 보존, 0 리셋 아님) 고정.
test('gauge carry: overflow is preserved, not reset to zero', () => {
  // spd7000(THRESHOLD 10000): 틱2 gauge14000→행동(carry4000), 틱3 11000→행동. carry면 2히트, 리셋이면 1히트.
  const C = rawUnit({ name: 'C', maxHp: 100, hp: 100, atk: 1, spd: 7000 })
  const M = rawMob({ name: 'M2', maxHp: 1000, hp: 1000, spd: 0 })
  const r = runBattle([C], M, { maxTicks: 3 })
  assert.strictEqual(r.rounds.at(-1).mob.hp, 998) // 2히트 = carry. 리셋이면 999.
})

// 반사 killing-blow — 반사 데미지로 공격자가 0이 되면 사망(추가 행동 없음, 파티 전멸).
test('reflect killing-blow: attacker reduced to 0 dies and stops acting', () => {
  const A = rawUnit({ name: 'A', hp: 5, atk: 20, spd: 10000 })
  const M = rawMob({ name: 'M', hp: 100000, spd: 0,
    traits: [{ trigger: 'postIncomingDamage', op: 'reflect', value: 0.5 }] }) // floor(20*0.5)=10 ≥ 5
  const r = runBattle([A], M, { maxTicks: 50 })
  assert.strictEqual(r.winner, 'mob')                                   // 자멸 → 전멸
  assert.strictEqual(logsOf(r).filter(l => /A 공격 →/.test(l)).length, 1) // 한 번 치고 죽음
  assert.strictEqual(r.rounds.at(-1).party[0].hp, 0)
})

// #9 — 스냅샷 로그내용 / 플러시 / hp clamp.
test('snapshot: log content, final flush, hp clamp', () => {
  const party = [makeUnit(JOBS.warrior), makeUnit(JOBS.mage), makeUnit(JOBS.guardian), makeUnit(JOBS.priest)]
  const mob = makeMob(SLIME)
  const r = runBattle(party, mob)
  assert.strictEqual(r.winner, 'party')
  assert.match(logsOf(r).join('\n'), /전사 공격 → 슬라임 \(-21\)/) // 내용+데미지 정확(% 경감: damage(22,3)=21.3→21)
  assert.strictEqual(r.rounds.at(-1).tick, r.ticks)               // 막 라운드 플러시
  for (const rd of r.rounds) {                                    // clamp: 음수 hp 없음
    assert.ok(rd.mob.hp >= 0)
    for (const u of rd.party) assert.ok(u.hp >= 0)
  }
})

// #10 — 몹 사망시 같은 틱 남은 아군 행동 중단(break).
test('mob death mid party-loop halts remaining ready allies', () => {
  const mk = (n) => rawUnit({ name: n, maxHp: 5, hp: 5, atk: 100, spd: 10000 })
  const M = rawMob({ name: 'M3', maxHp: 50, hp: 50, spd: 0 })
  const r = runBattle([mk('A'), mk('B')], M, { maxTicks: 2 })
  const attacks = logsOf(r).filter(l => /공격 →/.test(l))
  assert.strictEqual(attacks.length, 1) // A만, B는 시체 안 침
})

// B — 라운드 경계 틱에 끝나도 스냅샷 중복 안 됨 (ROUND_TICKS 값에 독립).
test('battle ending on a round boundary tick produces no duplicate snapshot', () => {
  // spd0 = 양쪽 frozen, maxTicks=ROUND_TICKS → 정확히 경계 틱에 종료(교착=몹승).
  const U = rawUnit({ name: 'U', spd: 0 })
  const M = rawMob({ name: 'B1', spd: 0 })
  const r = runBattle([U], M, { maxTicks: ROUND_TICKS })
  assert.strictEqual(r.winner, 'mob')
  assert.strictEqual(r.ticks, ROUND_TICKS)
  const ticks = r.rounds.map(rd => rd.tick)
  assert.strictEqual(new Set(ticks).size, ticks.length) // 중복 틱 없음
})

// 방어적 가드 — 빈 파티 / 전원 사망 입력 = 전투 성립 안 함 → 즉시 몹 승(틱0).
test('empty party = immediate mob win at tick 0 (vacuous guard)', () => {
  const r = runBattle([], rawMob({ name: 'M' }))
  assert.strictEqual(r.winner, 'mob')
  assert.strictEqual(r.ticks, 0)
})

test('all-dead party = immediate mob win at tick 0', () => {
  const r = runBattle([rawUnit({ name: 'D', hp: 0 })], rawMob({ name: 'M' }))
  assert.strictEqual(r.winner, 'mob')
  assert.strictEqual(r.ticks, 0)
})

// #11 — 힐 오버힐 cap(maxHp 초과 금지).
test('heal does not overheal above maxHp', () => {
  // 사제 단독: 풀피에서 자가힐(치유) → maxHp(95) 초과 안 함. (사제 평타=원거리딜이므로 마나 충전해 즉발힐 발동)
  const party = [makeUnit(JOBS.priest)]; party[0].mana = 100
  const mob = makeMob(OGRE)
  const r = runBattle(party, mob, { maxTicks: 150 }) // 틱143 힐, 틱167 몹공격 전
  assert.match(logsOf(r).join('\n'), /회복/)
  for (const rd of r.rounds) {
    for (const u of rd.party) assert.ok(u.hp <= 95, `hp ${u.hp} <= 95`)
  }
})

// step3a — 행동이 role 아닌 skill.kind로 분기. role:'dps'인데 힐 스킬이면 힐한다.
test('action dispatches on skill.kind, not role', () => {
  const healer = rawUnit({
    name: 'H', role: 'dps', heal: 10, hp: 50, maxHp: 100, spd: 10000,
    skills: [{ id: 'basic_heal', name: '평타', kind: 'heal', range: null, power: 1, manaGain: 0, cost: 0, cd: 0, effects: [] }],
  })
  const wounded = rawUnit({ name: 'W', hp: 30, maxHp: 100, spd: 0 }) // 최저HP, 행동 안 함
  const M = rawMob({ name: 'M', maxHp: 100, hp: 100, spd: 0 })       // 몹도 행동 안 함
  const r = runBattle([healer, wounded], M, { maxTicks: 1 })
  const log = logsOf(r).join('\n')
  assert.match(log, /H 회복 → W/)         // role:'dps'지만 힐 스킬 → 힐 수행
  assert.strictEqual(r.rounds.at(-1).mob.hp, 100) // 몹 안 맞음(공격 안 함)
})
