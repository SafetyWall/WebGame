import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runBattle, selectSkill, selectMobTarget } from '../src/engine/battle.js'
import { makeUnit, makeMob } from '../src/engine/unit.js'
import { JOBS } from '../src/data/jobs.js'
import { SLIME } from './_fixtures.js'
import { SKILLS } from '../src/data/skills.js'

// 더미 몹: spd 0(반격 안 함) + 큰 hp(안 죽음) → 유닛 1행동만 격리해 수치 직접 검증.
// 유닛 1행동 시점 = ceil(10000/spd): 마법사(90)=112, 전사(120)=84, 가디언(70)=143, 사제(100)=100. (THRESHOLD 10000)
const dummyMob = (over = {}) => makeMob({ name: '더미', hp: 100000, atk: 0, def: 8, spd: 0, ...over })

// --- selectSkill: 우선순위 게이팅 (직접) ---

test('selectSkill: 마나 부족 → 평타 fallback', () => {
  const u = makeUnit(JOBS.mage, 1)   // skills=[mage_nuke(cost50), ranged_strike(cost0)]
  u.mana = 0
  assert.equal(selectSkill(u, 0).id, 'ranged_strike')
})

test('selectSkill: 마나 충분 + 쿨 끝 → 발동스킬', () => {
  const u = makeUnit(JOBS.mage, 1)
  u.mana = 100
  assert.equal(selectSkill(u, 0).id, 'mage_nuke')
})

test('selectSkill: 쿨 중 → 평타', () => {
  const u = makeUnit(JOBS.mage, 1, null, {}, ['mage_nuke'])  // 파이어볼만 학습 → 나머지=평타
  u.mana = 100
  u.cooldowns['mage_nuke'] = 500
  assert.equal(selectSkill(u, 100).id, 'ranged_strike')   // tick100 < readyTick500
})

// --- 데미지 수치 직접 (1행동 격리) ---

test('mage_nuke: 데미지 = damage(floor(atk×10.0), def), 평타보다 큼(약평타·큰스킬 버스트)', () => {
  // 마법사 atk16(약화), nuke power10.0 → floor(160)→damage(160,8)=148.1→148. 평타 = damage(16,8)=14.8→14. (% 경감식)
  const nukeMage = makeUnit(JOBS.mage, 1); nukeMage.mana = 100
  const nm = dummyMob()
  runBattle([nukeMage], nm, { maxTicks: 125 })   // 마법사 spd90 → tick112 발동(1행동)
  assert.equal(nm.hp, 100000 - 148)

  const plainMage = makeUnit(JOBS.mage, 1); plainMage.mana = 0
  plainMage.cooldowns['mage_nuke'] = 999999       // 발동 봉쇄 → 평타
  const pm = dummyMob()
  runBattle([plainMage], pm, { maxTicks: 125 })
  assert.equal(pm.hp, 100000 - 14)
})

test('mage_nuke: 발동 시 마나 −45, 쿨 = tick+350', () => {
  const m = makeUnit(JOBS.mage, 1); m.mana = 100
  runBattle([m], dummyMob(), { maxTicks: 125 })   // 마법사 spd90 → tick112 발동(10000/90)
  assert.equal(m.mana, 55)                         // 100 − 45
  assert.equal(m.cooldowns['mage_nuke'], 462)      // 112 + 350
})

test('평타: 발동 시 마나 +manaGain(25)', () => {
  const m = makeUnit(JOBS.mage, 1); m.mana = 0     // 마나 부족 → 평타
  runBattle([m], dummyMob(), { maxTicks: 125 })
  assert.equal(m.mana, 25)
})

// --- effect 부여 직접 ---

test('warrior_cleave: 몹에 dmgTaken 1.15 디버프 부여 + 첫타 = damage(floor(atk×1.7), def)', () => {
  // 전사 atk22, cleave power1.7 → floor(37)→damage(37,8)=34.2→34(첫타엔 디버프 미적용). (% 경감식)
  const w = makeUnit(JOBS.warrior, 1); w.mana = 100
  const mob = dummyMob()
  runBattle([w], mob, { maxTicks: 112 })           // tick112 = 전사 1행동
  assert.equal(mob.hp, 100000 - 34)
  const deb = mob.effects.find(e => e.type === 'dmgTaken')
  assert.ok(deb, 'dmgTaken 디버프 존재')
  assert.equal(deb.value, 1.15)
  assert.equal(deb.source, w.id)
})

test('도발(taunt) 메커니즘 보존: taunt 보유 유닛이 몹 강제 타겟(스킬 미배선=향후 2차전직)', () => {
  // 도발 스킬(guardian_taunt)은 가디언과 함께 제거. taunt 엔진 메커니즘은 유지 → effect 직접 주입해 검증.
  const g = makeUnit(JOBS.warrior, 1)
  g.effects.push({ type: 'taunt', value: 1, source: g.id, expireTick: 99999 })
  const m = makeUnit(JOBS.mage, 1); m.hp = 1         // 마법사가 최저HP인데도
  assert.equal(selectMobTarget([g, m]).name, '전사')  // 도발이 어그로 강제
})

test('priest_hot: 최저HP 아군에 hot effect 부여(value=floor(heal×0.5), interval 100)', () => {
  const p = makeUnit(JOBS.priest, 3); p.skills = [SKILLS.priest_hot, SKILLS.holy_bolt]; p.mana = 100  // 재생 주입(키트 외=2차전직 보관). L3 heal=43 → hot floor(21.5)=21
  const wounded = makeUnit(JOBS.novice, 1); wounded.hp = 10  // 최저HP = 부여 대상
  runBattle([p, wounded], dummyMob(), { maxTicks: 143 })     // tick143 = 사제 1행동
  const hot = wounded.effects.find(e => e.type === 'hot')
  assert.ok(hot, 'hot effect 부여됨')
  assert.equal(hot.value, 21)                        // floor(43 × 0.5)
  assert.equal(hot.interval, 100)
})

// --- 회귀: 평타파티 결정론 (마나/effect가 결과 안 바꿈) ---

test('노비스 평타파티 결정론(같은 입력=같은 결과)', () => {
  const a = runBattle([makeUnit(JOBS.novice, 1)], makeMob({ ...SLIME }))
  const b = runBattle([makeUnit(JOBS.novice, 1)], makeMob({ ...SLIME }))
  assert.equal(a.winner, b.winner)
  assert.equal(a.ticks, b.ticks)
})
