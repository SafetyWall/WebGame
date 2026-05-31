// ATB 전투 엔진. 순수, DOM 의존 0. ui/sim 공용.
import { applyRules } from './traits.js'
import { applyEffect, expireEffects, tickHoT, dmgTakenMult, dmgDealtMult, hasTaunt } from './effects.js'
import { MANA_MAX } from '../data/skills.js'

export function damage(atk, def) {
  return Math.max(1, atk - def)
}

export function lowestHpAlly(party) {
  const alive = party.filter(u => u.hp > 0)
  if (alive.length === 0) return null
  return alive.reduce((a, b) => (b.hp < a.hp ? b : a), alive[0])
}

export function selectMobTarget(party) {
  const taunt = party.find(u => u.hp > 0 && hasTaunt(u))
  if (taunt) return taunt
  return lowestHpAlly(party)
}

const THRESHOLD = 1000
export const ROUND_TICKS = 100 // 표시용 라운드 묶음(틱). 전투 계산 영향 0.
const DEFAULT_MAX_TICKS = 20000

function canUse(u, skill, tick) {
  return u.mana >= skill.cost && tick >= (u.cooldowns[skill.id] ?? 0)
}

// 우선순위 톱다운: 지금 쓸 수 있는 첫 스킬, 없으면 마지막(평타, 항상 cost0·cd0).
export function selectSkill(u, tick) {
  for (const skill of u.skills) if (canUse(u, skill, tick)) return skill
  return u.skills[u.skills.length - 1]
}

// 스킬 effect 스펙 → 인스턴스화 + 대상 부여. self=시전자, enemy=몹, lowestHpAlly=힐대상.
function applySkillEffects(skill, u, mob, healTarget, tick) {
  for (const spec of skill.effects) {
    const target = spec.target === 'self' ? u : spec.target === 'enemy' ? mob : healTarget
    if (!target) continue
    const inst = { type: spec.type, source: u.id, expireTick: tick + spec.duration }
    if (spec.type === 'hot') {
      inst.value = Math.floor(u.heal * spec.valueRatio)
      inst.interval = spec.interval
      inst.nextTick = tick + spec.interval
    } else {
      inst.value = spec.value
    }
    applyEffect(target, inst)
  }
}

function actUnit(u, party, mob, tick, log) {
  const skill = selectSkill(u, tick)
  u.mana = Math.min(MANA_MAX, u.mana + skill.manaGain - skill.cost)
  if (skill.cost > 0) u.cooldowns[skill.id] = tick + skill.cd

  if (skill.kind === 'heal') {
    const target = lowestHpAlly(party)
    if (target) {
      if (skill.power > 0) {
        const amt = Math.floor(u.heal * skill.power)
        target.hp = Math.min(target.maxHp, target.hp + amt)
        log.push(`${u.name} 회복 → ${target.name} (+${amt})`)
      }
      applySkillEffects(skill, u, mob, target, tick)
    }
    return
  }
  // kind === 'attack' → 몹 공격. effect 배율(자기 주는뎀·몹 받는뎀) + 트레잇이 데미지 수정.
  if (skill.power > 0) {
    const ctx = { attackerRange: skill.range, attackerKind: skill.kind, attacker: u }
    const base = damage(Math.floor(u.atk * skill.power), mob.def)
    const afterMult = base * dmgDealtMult(u) * dmgTakenMult(mob)
    // 트레잇이 정확히 0으로 만들면 0(진짜 면역). 그 외엔 최소 1 유지(회피≠면역).
    const t = applyRules('incomingDamage', afterMult, ctx, mob)
    const dmg = t === 0 ? 0 : Math.max(1, Math.floor(t))
    mob.hp -= dmg
    applyRules('postIncomingDamage', dmg, { ...ctx, damage: dmg }, mob) // 반사 등 side-effect
    log.push(`${u.name} 공격 → ${mob.name} (-${dmg})`)
  }
  applySkillEffects(skill, u, mob, lowestHpAlly(party), tick)
}

function actMob(mob, party, tick, log) {
  applyRules('turnStart', 0, {}, mob) // 자가회복 등 side-effect (현재 라이브 몹 미부착)
  if (mob.aoe) {
    const base = Math.floor(mob.atk * mob.aoeRatio)
    for (const u of party) {
      if (u.hp > 0) u.hp -= Math.max(1, Math.floor(damage(base, u.def) * dmgTakenMult(u)))
    }
    // 로그는 실제 적용값 기준(살아있는 첫 아군 기준 표기). dmgTakenMult 반영.
    const ref = party.find(u => u.hp > 0)
    const shown = ref ? Math.max(1, Math.floor(damage(base, ref.def) * dmgTakenMult(ref))) : damage(base, 0)
    log.push(`${mob.name} 광역 (개당 -${shown})`)
    return
  }
  const target = selectMobTarget(party)
  if (target) {
    const dmg = Math.max(1, Math.floor(damage(mob.atk, target.def) * dmgTakenMult(target)))
    target.hp -= dmg
    log.push(`${mob.name} 공격 → ${target.name} (-${dmg})`)
  }
}

export function runBattle(party, mob, opts = {}) {
  const maxTicks = opts.maxTicks ?? DEFAULT_MAX_TICKS
  const rounds = []
  let log = []
  let tick = 0

  const snapshot = (t) => ({
    tick: t,
    party: party.map(u => ({ name: u.name, hp: Math.max(0, u.hp), maxHp: u.maxHp })),
    mob: { name: mob.name, hp: Math.max(0, mob.hp), maxHp: mob.maxHp, traits: (mob.traits || []).map(t => t.name) },
    log,
  })
  const finish = (winner) => {
    // 라운드 경계 틱에 끝나면 위에서 이미 푸시됨 → 같은 틱 중복 방지
    const last = rounds[rounds.length - 1]
    if (!last || last.tick !== tick) rounds.push(snapshot(tick))
    return { winner, rounds, ticks: tick }
  }

  while (tick < maxTicks) {
    tick++
    // ① effect: HoT 적용 후 만료 (전 유닛 + 몹). 만료틱 마지막 HoT proc 보장.
    for (const u of party) { tickHoT(u, tick, log); expireEffects(u, tick) }
    tickHoT(mob, tick, log); expireEffects(mob, tick)
    // ② 게이지 증가 (살아있는 유닛만)
    for (const u of party) if (u.hp > 0) u.gauge += u.spd
    if (mob.hp > 0) mob.gauge += mob.spd
    // ③ 행동: 파티 먼저(배열 순), 그다음 몹.
    // 동시틱 처리 = 파티 우선(의도된 결정, 2026-05-30 사용자 확정).
    for (const u of party) {
      if (u.hp > 0 && u.gauge >= THRESHOLD) {
        u.gauge -= THRESHOLD
        actUnit(u, party, mob, tick, log)
        if (mob.hp <= 0) break
      }
    }
    if (mob.hp > 0 && mob.gauge >= THRESHOLD) {
      mob.gauge -= THRESHOLD
      actMob(mob, party, tick, log)
    }
    // 라운드 스냅샷 (표시 단위)
    if (tick % ROUND_TICKS === 0) { rounds.push(snapshot(tick)); log = [] }
    // 승패 판정
    if (mob.hp <= 0) return finish('party')
    if (party.every(u => u.hp <= 0)) return finish('mob')
  }
  return finish('mob') // 교착 → 몹 승
}
