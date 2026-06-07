// ATB 전투 엔진. 순수, DOM 의존 0. ui/sim 공용.
import { applyRules, pierceFrac, lifestealFrac, metaResist, hitCap } from './traits.js'
import { applyEffect, expireEffects, tickHoT, tickDoT, dmgTakenMult, dmgDealtMult, speedMult, isStunned, reflectFrac, hasIntercept, markBonus, healReceivedMult, manaSuppressMult } from './effects.js'
import { mobWeights, threatScore } from './threat.js'
import { MANA_MAX } from '../data/skills.js'

// 데미지 경감 곡률 상수. def=DEF_K → 50% 경감. 스케일 불변(% 경감). placeholder — econ-sim 튜닝.
export const DEF_K = 100

// % 경감: atk × K/(def+K) = atk × (1 − def/(def+K)). def=0 → 항등. 분수 반환(min1·floor은 호출부).
export function damage(atk, def) {
  return atk * DEF_K / (def + DEF_K)
}

// 관통 적용 후 유효 방어 = floor(def × (1 − 몹 관통)). 몹 공격이 플레이어 def 무시(트레잇).
const piercedDef = (def, mob) => Math.floor(def * (1 - pierceFrac(mob)))

// 흡혈: 몹이 가한 데미지 합 × frac 만큼 자기 회복(maxHp 캡). 트레잇 없으면 no-op.
function applyLifesteal(mob, dealt, log) {
  const heal = Math.floor(dealt * lifestealFrac(mob))
  if (heal > 0) {
    mob.hp = Math.min(mob.maxHp, mob.hp + heal)
    log.push(`${mob.name} 흡혈 (+${heal})`)
  }
}

// 파티 오라: 몹 aura 트레잇({aura:type, value})을 전투 시작 시 파티 전원에 영구 effect로 스탬프.
// 힐봉쇄/약화=healReduce, 마나억제=manaSuppress, 게이지지연=speed(기존 타입 재사용). source='mob'.
function applyMobAuras(party, mob) {
  for (const t of (mob.traits || [])) {
    if (!t.aura) continue
    for (const u of party) if (u.hp > 0) applyEffect(u, { type: t.aura, value: t.value, source: 'mob', expireTick: Infinity })
  }
}

export function lowestHpAlly(party) {
  const alive = party.filter(u => u.hp > 0)
  if (alive.length === 0) return null
  return alive.reduce((a, b) => (b.hp < a.hp ? b : a), alive[0])
}

// 몹 타겟 = 위협도 최고 생존자(threat.js). 디폴트 weight=위치 지배(앞열). 몹 트레잇이 weight 변조.
// 동률 = 앞(먼저 만난 것) 유지 → 결정론. lowestHpAlly는 힐 타겟 전용(actUnit/스킬 effect).
export function selectMobTarget(party, mob) {
  const alive = party.filter(u => u.hp > 0)
  if (alive.length === 0) return null
  const w = mobWeights(mob)
  let best = alive[0], bestScore = threatScore(alive[0], 0, alive, w)
  for (let i = 1; i < alive.length; i++) {
    const sc = threatScore(alive[i], i, alive, w)
    if (sc > bestScore) { best = alive[i]; bestScore = sc }
  }
  return best
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

// 스킬 레벨 위력 배율. L1 1.0 → L5 2.0 (효율 2배). 미지정=1.
export const skillLevelMult = (lv) => 1 + 0.25 * ((lv ?? 1) - 1)

// 버프/디버프(dmgTaken·dmgDealt·speed) = 1.0 기준 편차를 mult배(예 1.3→1.6, 0.6→0.2). 그 외(taunt)=불변.
export function scaledEffectValue(type, value, mult) {
  if (type === 'dmgTaken' || type === 'dmgDealt' || type === 'speed') return 1 + (value - 1) * mult
  return value
}

// 들어오는 디버프/DoT를 몹 트레잇 저항/면역으로 변조. null=면역(미부여). dot→resist.dot, 그 외 디버프→resist.debuff.
// 저항(0<fr<1): 배율형(dmgTaken/dmgDealt/speed)=1기준 편차 ×fr / 원시값형(dot/mark)=value ×fr / 순수플래그(stun)=duration ×fr.
function resolveMobEffect(mob, inst, baseDuration, tick) {
  const fr = metaResist(mob, inst.type === 'dot' ? 'dot' : 'debuff')
  if (fr === undefined) return inst    // 저항 트레잇 없음 → 통과
  if (fr <= 0) return null             // 면역 → 미부여
  if (inst.type === 'dmgTaken' || inst.type === 'dmgDealt' || inst.type === 'speed') {
    inst.value = scaledEffectValue(inst.type, inst.value, fr)
  } else if (inst.type === 'dot' || inst.type === 'mark') {
    inst.value = Math.floor(inst.value * fr)
  } else if (inst.type === 'stun') {
    inst.expireTick = tick + Math.floor(baseDuration * fr)
  }
  return inst
}

// 스킬 effect 스펙 → 인스턴스화 + 대상 부여. self=시전자, enemy=몹, allies=파티전체, lowestHpAlly=힐대상.
// 반환 = effect를 실제로 부여한 대상 객체 목록(재생뷰 타겟 하이라이트용. 비-record 호출은 무시).
function applySkillEffects(skill, u, mob, healTarget, tick, mult = 1, party = null) {
  const applied = []
  for (const spec of skill.effects) {
    const targets = spec.target === 'self' ? [u]
      : spec.target === 'enemy' ? [mob]
      : spec.target === 'allies' ? (party || []).filter(a => a.hp > 0)
      : (healTarget ? [healTarget] : [])
    for (const target of targets) {
      let inst = { type: spec.type, source: u.id, expireTick: tick + spec.duration }
      if (spec.type === 'hot') {
        inst.value = Math.floor(u.heal * spec.valueRatio * mult)
        inst.interval = spec.interval
        inst.nextTick = tick + spec.interval
      } else if (spec.type === 'reflect') {
        inst.value = spec.value * mult     // 반사 비율 = 직접 ×레벨배율(0.3→0.6)
      } else if (spec.type === 'mark' || spec.type === 'dot') {
        inst.value = Math.floor(u.atk * spec.valueRatio * mult)  // mark=피격당 추가뎀 / dot=틱당 데미지. 둘 다 시전자 atk 비례
        if (spec.type === 'dot') { inst.interval = spec.interval; inst.nextTick = tick + spec.interval }
      } else {
        inst.value = scaledEffectValue(spec.type, spec.value, mult)
      }
      // 몹 대상 디버프/DoT = 트레잇 저항/면역 통과(면역 → 미부여).
      if (target === mob) {
        inst = resolveMobEffect(mob, inst, spec.duration, tick)
        if (!inst) continue
      }
      applyEffect(target, inst)
      applied.push(target)
    }
  }
  return applied
}

// 행동 객체 → 재생뷰 타겟 ref. 몹='mob', 파티 유닛=배열 인덱스(동일 이름 유닛 구분용).
const refOf = (obj, party, mob) => (obj === mob ? 'mob' : party.indexOf(obj))

function actUnit(u, party, mob, tick, log) {
  const skill = selectSkill(u, tick)
  u.mana = Math.min(u.manaMax ?? MANA_MAX, u.mana + Math.floor(skill.manaGain * manaSuppressMult(u)) - skill.cost)
  if (skill.cost > 0) u.cooldowns[skill.id] = tick + skill.cd
  const mult = skillLevelMult(u.skillLevels && u.skillLevels[skill.id])  // 평타·미학습=1
  const hit = new Set()  // 이 행동이 직접 건드린 대상 ref(데미지/힐/effect)

  if (skill.kind === 'heal') {
    const target = lowestHpAlly(party)
    if (target) {
      if (skill.power > 0) {
        const amt = Math.floor(u.heal * skill.power * mult * healReceivedMult(target))
        target.hp = Math.min(target.maxHp, target.hp + amt)
        log.push(`${u.name} 회복 → ${target.name} (+${amt})`)
        hit.add(refOf(target, party, mob))
      }
      for (const t of applySkillEffects(skill, u, mob, target, tick, mult, party)) hit.add(refOf(t, party, mob))
    }
    return [...hit]
  }
  // kind === 'attack' → 몹 공격. effect 배율(자기 주는뎀·몹 받는뎀) + 트레잇이 데미지 수정.
  // hits>1 = 멀티히트(1행동 N회 타격, 각 히트가 mark 등 on-hit 발동).
  if (skill.power > 0) {
    const ctx = { attackerRange: skill.range, attackerKind: skill.kind, attacker: u }
    const hits = Math.min(skill.hits || 1, hitCap(mob))   // 연타봉쇄 트레잇이 멀티히트 횟수 제한
    for (let h = 0; h < hits; h++) {
      if (mob.hp <= 0) break
      const effDef = Math.floor(mob.def * (1 - (skill.ignoreDef || 0)))  // 방어무시: def 일부/전부 무시
      const base = damage(Math.floor(u.atk * skill.power * mult), effDef)
      const afterMult = base * dmgDealtMult(u) * dmgTakenMult(mob)
      // 트레잇이 정확히 0으로 만들면 0(진짜 면역). 그 외엔 최소 1 유지(회피≠면역).
      const t = applyRules('incomingDamage', afterMult, ctx, mob)
      const dmg = t === 0 ? 0 : Math.max(1, Math.floor(t))
      mob.hp -= dmg
      applyRules('postIncomingDamage', dmg, { ...ctx, damage: dmg }, mob) // 반사 등 side-effect
      log.push(`${u.name} 공격 → ${mob.name} (-${dmg})`)
      hit.add('mob')
      // 표식(mark): 이 타격으로 기존 표식 발동(추가뎀). 이번 스킬이 거는 표식은 아래 applySkillEffects라 자기발동 안 함.
      const mk = markBonus(mob)
      if (mk > 0) { mob.hp -= mk; log.push(`표식 → ${mob.name} (-${mk})`) }
    }
  }
  for (const t of applySkillEffects(skill, u, mob, lowestHpAlly(party), tick, mult, party)) hit.add(refOf(t, party, mob))
  return [...hit]
}

// 받은뎀 일부를 공격자(몹)에게 반사. reflect effect 보유 대상만.
function reflectTo(mob, target, dmg, log) {
  const refl = Math.floor(dmg * reflectFrac(target))
  if (refl > 0) {
    mob.hp -= refl
    log.push(`${target.name} 반사 → ${mob.name} (-${refl})`)
  }
}

function actMob(mob, party, tick, log) {
  applyRules('turnStart', 0, {}, mob) // 자가회복 등 side-effect (현재 라이브 몹 미부착)
  if (mob.aoe) {
    // uniform(기본)=전원 atk×aoeRatio. splash=주타깃(위협도 최고) 풀뎀(×1.0) + 그외 atk×aoeRatio.
    const splash = mob.aoeMode === 'splash'
    const mainTgt = splash ? selectMobTarget(party) : null
    const otherBase = Math.floor(mob.atk * mob.aoeRatio)
    const mainBase = splash ? mob.atk : otherBase
    const aoeDmg = (u) => Math.max(1, Math.floor(damage((u === mainTgt ? mainBase : otherBase), piercedDef(u.def, mob)) * dmgTakenMult(u)))
    const rep = party.find(u => u.hp > 0 && u !== mainTgt)   // 로그 대표(그외/개당) — hp 무관값이라 루프 후도 동일
    const hitIdx = []
    let dealt = 0
    party.forEach((u, i) => {
      if (u.hp > 0) {
        const dmg = aoeDmg(u)
        u.hp -= dmg
        dealt += dmg
        reflectTo(mob, u, dmg, log)
        hitIdx.push(i)
      }
    })
    // 로그 = 실제 적용값(dmgTakenMult·관통 반영).
    if (splash && mainTgt) {
      log.push(`${mob.name} 광역(스플래시) ${mainTgt.name} -${aoeDmg(mainTgt)}` + (rep ? ` / 그외 -${aoeDmg(rep)}` : ''))
    } else {
      log.push(`${mob.name} 광역 (개당 -${rep ? aoeDmg(rep) : Math.floor(damage(otherBase, 0))})`)
    }
    applyLifesteal(mob, dealt, log)   // 흡혈: 전 피격 합 기준
    return hitIdx
  }
  // 수호(intercept): 최저체력 아군을 겨냥하면, intercept 보유 아군(가디언)이 대신 받음.
  let target = selectMobTarget(party, mob)
  if (target === lowestHpAlly(party)) {
    const guard = party.find(u => u.hp > 0 && u !== target && hasIntercept(u))
    if (guard) target = guard
  }
  if (target) {
    const dmg = Math.max(1, Math.floor(damage(mob.atk, piercedDef(target.def, mob)) * dmgTakenMult(target)))
    target.hp -= dmg
    log.push(`${mob.name} 공격 → ${target.name} (-${dmg})`)
    reflectTo(mob, target, dmg, log)
    applyLifesteal(mob, dmg, log)   // 흡혈
    return [party.indexOf(target)]
  }
  return []
}

// effect 인스턴스 → 재생뷰용 스냅샷(이름/정확표기 + 남은지속 계산용). value=배율 or 확정수치, expireTick=만료틱.
const effSnap = (u) => (u.effects || []).map(e => ({ type: e.type, value: e.value, expireTick: e.expireTick, interval: e.interval }))

export function runBattle(party, mob, opts = {}) {
  const maxTicks = opts.maxTicks ?? DEFAULT_MAX_TICKS
  const record = Boolean(opts.record)   // true = 액션단위 frame 기록(재생뷰용). 미설정=기존 동작·sim 무영향.
  const rounds = []
  const frames = []
  let log = []
  let tick = 0

  const snapshot = (t) => ({
    tick: t,
    party: party.map(u => ({ name: u.name, hp: Math.max(0, u.hp), maxHp: u.maxHp })),
    mob: { name: mob.name, hp: Math.max(0, mob.hp), maxHp: mob.maxHp, aoe: Boolean(mob.aoe), traits: (mob.traits || []).map(t => t.name) },
    log,
  })
  // 액션단위 frame: 그 시점 전체 전황(HP·마나·게이지·effect) + 이 액션이 만든 로그.
  // actorRef = 행동자 ref(파티 인덱스 | 'mob' | null), targets = 피격/힐 대상 ref 배열(하이라이트용).
  const frame = (actor, lines, actorRef = null, targets = []) => frames.push({
    tick,
    actor,
    actorRef,
    targets,
    log: lines.slice(),
    party: party.map(u => ({ name: u.name, level: u.level, hp: Math.max(0, u.hp), maxHp: u.maxHp, mana: u.mana, manaMax: u.manaMax, gauge: Math.floor(u.gauge), alive: u.hp > 0, effects: effSnap(u) })),
    mob: { name: mob.name, hp: Math.max(0, mob.hp), maxHp: mob.maxHp, boss: Boolean(mob.boss), aoe: Boolean(mob.aoe), traits: (mob.traits || []).map(t => t.id), effects: effSnap(mob) },
  })
  const finish = (winner) => {
    const last = rounds[rounds.length - 1]
    if (!last || last.tick !== tick) rounds.push(snapshot(tick))
    return { winner, rounds, ticks: tick, frames }
  }

  // 빈/전멸 파티 = 전투 성립 안 함 → 즉시 몹 승(틱0). run.fight가 빈 파티를 막지만 엔진 계약도 명시.
  if (party.length === 0 || party.every(u => u.hp <= 0)) return finish('mob')

  applyMobAuras(party, mob)   // 몹 오라 트레잇(힐봉쇄·마나억제·게이지지연)을 파티에 스탬프

  while (tick < maxTicks) {
    tick++
    // ① effect: HoT/DoT 적용 후 만료 (전 유닛 + 몹). 만료틱 마지막 proc 보장.
    const efLen = log.length
    for (const u of party) { tickHoT(u, tick, log); tickDoT(u, tick, log); expireEffects(u, tick) }
    tickHoT(mob, tick, log); tickDoT(mob, tick, log); expireEffects(mob, tick)
    if (record && log.length > efLen) frame('지속효과', log.slice(efLen))
    // ② 게이지 증가 (살아있는 + 스턴 아닌 유닛만). speed effect로 가감속.
    for (const u of party) if (u.hp > 0 && !isStunned(u)) u.gauge += u.spd * speedMult(u)
    if (mob.hp > 0 && !isStunned(mob)) mob.gauge += mob.spd * speedMult(mob)
    // ③ 행동: 파티 먼저(배열 순), 그다음 몹.
    // 동시틱 처리 = 파티 우선(의도된 결정, 2026-05-30 사용자 확정).
    // while = 게이지가 THRESHOLD 배수만큼 쌓였으면(고속/오버플로) 그 횟수만큼 행동(턴 유실 방지).
    for (const u of party) {
      while (u.hp > 0 && !isStunned(u) && u.gauge >= THRESHOLD) {
        u.gauge -= THRESHOLD
        const aLen = log.length
        const tgts = actUnit(u, party, mob, tick, log)
        if (record) frame(u.name, log.slice(aLen), party.indexOf(u), tgts)
        if (mob.hp <= 0) break
      }
      if (mob.hp <= 0) break
    }
    while (mob.hp > 0 && !isStunned(mob) && mob.gauge >= THRESHOLD) {
      mob.gauge -= THRESHOLD
      const mLen = log.length
      const tgts = actMob(mob, party, tick, log)
      if (record) frame(mob.name, log.slice(mLen), 'mob', tgts)
    }
    // 라운드 스냅샷 (표시 단위)
    if (tick % ROUND_TICKS === 0) { rounds.push(snapshot(tick)); log = [] }
    // 승패 판정
    if (mob.hp <= 0) return finish('party')
    if (party.every(u => u.hp <= 0)) return finish('mob')
  }
  return finish('mob') // 교착 → 몹 승
}
