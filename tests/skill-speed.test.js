import { test } from 'node:test'
import assert from 'node:assert'
import { JOBS } from '../src/data/jobs.js'
import { SKILLS } from '../src/data/skills.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { runBattle } from '../src/engine/battle.js'
import { speedMult } from '../src/engine/effects.js'

test('speedMult = speed effect 곱(없으면 1)', () => {
  assert.strictEqual(speedMult({ effects: [] }), 1)
  assert.strictEqual(speedMult({ effects: [{ type: 'speed', value: 1.3 }] }), 1.3)
  assert.ok(Math.abs(speedMult({ effects: [{ type: 'speed', value: 2 }, { type: 'speed', value: 0.5 }] }) - 1) < 1e-9)
  assert.strictEqual(speedMult({ effects: [{ type: 'dmgTaken', value: 0.5 }] }), 1)  // 다른 타입 무시
})

test('강화 = 자기 dmgDealt↑ + speed↑(미배선 보관) / 질풍격 = 자기 speed↑ / 속박 = 적 speed↓(궁수 감속)', () => {
  assert.ok(SKILLS.warrior_might.effects.some(e => e.type === 'speed' && e.value > 1))    // 강화 def 유지(미배치)
  assert.ok(SKILLS.warrior_might.effects.some(e => e.type === 'dmgDealt' && e.value > 1))
  assert.ok(SKILLS.rogue_haste.effects.some(e => e.type === 'speed' && e.value > 1))       // 질풍격=자기 속도 라이더
  assert.ok(SKILLS.archer_bind.effects.some(e => e.type === 'speed' && e.value < 1))       // 감속=궁수 전용
})

// 오버플로 가드: 게이지가 THRESHOLD 배수만큼 쌓이면(고속) 한 틱에 여러 번 행동(턴 유실 없음).
test('게이지 오버플로 = 한 틱 다중 행동(while 루프)', () => {
  const u = makeUnit(JOBS.warrior, 1)              // spd120, 마나0 → 평타만
  u.effects.push({ type: 'speed', value: 200, source: u.id, expireTick: 9999 })  // 120×200=24000/틱
  const mob = makeMob({ name: 'D', hp: 1e6, atk: 0, def: 0, spd: 0, traits: [] })
  const r = runBattle([u], mob, { maxTicks: 1 })
  const hits = (r.rounds.flatMap(x => x.log).join('\n').match(/→ D \(-/g) || []).length
  assert.strictEqual(hits, 2)                      // 24000(THRESHOLD 10000) → 2회(14000→4000)
})

test('적 speed 디버프 = 몹 행동 횟수 감소', () => {
  // 동일 더미몹: speed×0.5 디버프 부여 시 같은 틱수 동안 몹 행동 절반.
  const mk = () => makeMob({ name: 'M', hp: 1e6, atk: 5, def: 0, spd: 100, traits: [] })
  const target = () => { const t = makeUnit(JOBS.warrior, 1); t.hp = 1e6; return t }
  const fast = mk(), slow = mk()
  slow.effects.push({ type: 'speed', value: 0.5, source: 0, expireTick: 9999 })
  runBattle([target()], fast, { maxTicks: 1000 })
  runBattle([target()], slow, { maxTicks: 1000 })
  // 검증: 느린 몹 게이지가 더 적게 쌓임 → 행동 적음(여기선 speedMult 직접)
  assert.ok(speedMult(slow) < speedMult(fast))
})
