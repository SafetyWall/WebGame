// 리뷰(2026-05-30)에서 드러난 엔진 규칙 미검증 구멍을 메우는 테스트.
import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { MOBS } from '../src/data/mobs.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'

// 게이지·동시틱 등 정밀 제어용 원시 유닛/몹 (makeUnit은 spd 고정·def0 강제라 부적합).
const rawUnit = (o) => ({
  name: 'U', maxHp: 100, hp: 100, atk: 1, type: 'phys',
  spd: 1, role: 'dps', taunt: false, heal: 0, def: 0, gauge: 0, ...o,
})
const rawMob = (o) => ({
  name: 'M', maxHp: 100, hp: 100, atk: 0, def: 0, spd: 0,
  aoe: false, aoeRatio: 0.6, gauge: 0, isMob: true, ...o,
})
const logsOf = (r) => r.rounds.flatMap(rd => rd.log)

// #4 — 광역 데미지 실제값 고정 (floor(28*0.6)=16), 로그도 적용값과 일치.
test('aoe applies floor(atk*ratio) and logs the applied value', () => {
  // 가디언(spd5) vs 오우거(spd6, aoe). maxTicks 170: 오우거만 1회 행동(틱167), 가디언 미행동.
  const party = [makeUnit(JOBS.guardian)]
  const mob = makeMob(MOBS.ogre)
  const r = runBattle(party, mob, { maxTicks: 170 })
  assert.strictEqual(r.rounds.at(-1).party[0].hp, 260 - 16) // 244
  assert.match(logsOf(r).join('\n'), /광역 \(개당 -16\)/)
})

// #5 — 몹 단일공격이 실전에서 도발 탱으로 라우팅되는지(콜사이트 통합).
test('mob single-target routes to taunt tank inside a real battle', () => {
  const party = [makeUnit(JOBS.guardian), makeUnit(JOBS.mage)]
  const mob = makeMob(MOBS.slime) // aoe:false
  const r = runBattle(party, mob)
  const log = logsOf(r).join('\n')
  assert.match(log, /→ 가디언/)      // 몹이 탱 때림
  assert.doesNotMatch(log, /→ 마법사/) // 탱 살아있는 동안 딜러 안 맞음
})

// #6 — 진짜 교착: 유닛이 행동하지만 못 이김 → maxTicks 도달 → 몹 승.
test('active stalemate (units act but cannot win) -> mob wins at maxTicks', () => {
  const party = [makeUnit(JOBS.priest)] // 힐러는 몹 공격 안 함 → 못 죽임
  const mob = makeMob(MOBS.ogre)
  const r = runBattle(party, mob, { maxTicks: 3000 })
  assert.strictEqual(r.winner, 'mob')
  assert.strictEqual(r.ticks, 3000)
  assert.match(logsOf(r).join('\n'), /회복/) // 실제로 행동했음(frozen 아님)
})

// #7a — 동시틱 치명타 = 파티 우선(의도된 결정) 고정.
test('same-tick lethal: party acts first, mob does not retaliate', () => {
  const A = rawUnit({ name: 'A', maxHp: 5, hp: 5, atk: 100, spd: 1000 })
  const M = rawMob({ name: 'M', maxHp: 5, hp: 5, atk: 100, spd: 1000 })
  const r = runBattle([A], M)
  assert.strictEqual(r.winner, 'party')
  assert.strictEqual(r.ticks, 1)
  assert.strictEqual(r.rounds.at(-1).party[0].hp, 5) // 반격 안 당함
  assert.doesNotMatch(logsOf(r).join('\n'), /M 공격 →/) // 몹 행동 안 함
})

// #7b — 게이지 carry(초과분 보존, 0 리셋 아님) 고정.
test('gauge carry: overflow is preserved, not reset to zero', () => {
  // spd700: 틱2 gauge1400→행동(carry400), 틱3 1100→행동. carry면 2히트, 리셋이면 1히트.
  const C = rawUnit({ name: 'C', maxHp: 100, hp: 100, atk: 1, spd: 700 })
  const M = rawMob({ name: 'M2', maxHp: 1000, hp: 1000, spd: 0 })
  const r = runBattle([C], M, { maxTicks: 3 })
  assert.strictEqual(r.rounds.at(-1).mob.hp, 998) // 2히트 = carry. 리셋이면 999.
})

// #9 — 스냅샷 로그내용 / 플러시 / hp clamp.
test('snapshot: log content, final flush, hp clamp', () => {
  const party = [makeUnit(JOBS.warrior), makeUnit(JOBS.mage), makeUnit(JOBS.guardian), makeUnit(JOBS.priest)]
  const mob = makeMob(MOBS.slime)
  const r = runBattle(party, mob)
  assert.strictEqual(r.winner, 'party')
  assert.match(logsOf(r).join('\n'), /전사 공격 → 슬라임 \(-19\)/) // 내용+데미지 정확
  assert.strictEqual(r.rounds.at(-1).tick, r.ticks)               // 막 라운드 플러시
  for (const rd of r.rounds) {                                    // clamp: 음수 hp 없음
    assert.ok(rd.mob.hp >= 0)
    for (const u of rd.party) assert.ok(u.hp >= 0)
  }
})

// #10 — 몹 사망시 같은 틱 남은 아군 행동 중단(break).
test('mob death mid party-loop halts remaining ready allies', () => {
  const mk = (n) => rawUnit({ name: n, maxHp: 5, hp: 5, atk: 100, spd: 1000 })
  const M = rawMob({ name: 'M3', maxHp: 50, hp: 50, spd: 0 })
  const r = runBattle([mk('A'), mk('B')], M, { maxTicks: 2 })
  const attacks = logsOf(r).filter(l => /공격 →/.test(l))
  assert.strictEqual(attacks.length, 1) // A만, B는 시체 안 침
})

// B — 라운드 경계 틱(28배수)에 끝나도 스냅샷 중복 안 됨.
test('battle ending on a round boundary tick produces no duplicate snapshot', () => {
  // spd36: 틱28에 첫 행동(27*36=972<1000, 28*36=1008). atk100으로 mob(hp50) 한 방 → 틱28 종료.
  const U = rawUnit({ name: 'U', atk: 100, spd: 36 })
  const M = rawMob({ name: 'B1', maxHp: 50, hp: 50, spd: 0 })
  const r = runBattle([U], M)
  assert.strictEqual(r.winner, 'party')
  assert.strictEqual(r.ticks, 28)
  const ticks = r.rounds.map(rd => rd.tick)
  assert.strictEqual(new Set(ticks).size, ticks.length) // 중복 틱 없음
  assert.match(r.rounds.at(-1).log.join('\n'), /공격 →/) // 막 스냅샷에 킬 로그 보존
})

// #11 — 힐 오버힐 cap(maxHp 초과 금지).
test('heal does not overheal above maxHp', () => {
  // 사제 단독: 풀피에서 자가힐 → maxHp(95) 초과 안 함.
  const party = [makeUnit(JOBS.priest)]
  const mob = makeMob(MOBS.ogre)
  const r = runBattle(party, mob, { maxTicks: 150 }) // 틱143 힐, 틱167 몹공격 전
  assert.match(logsOf(r).join('\n'), /회복/)
  for (const rd of r.rounds) {
    for (const u of rd.party) assert.ok(u.hp <= 95, `hp ${u.hp} <= 95`)
  }
})
