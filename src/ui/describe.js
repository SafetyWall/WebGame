// 스킬/트레잇 데이터 필드 → 사람용 툴팁 텍스트(순수). 데이터 테이블에 설명문 없음 → 여기서 생성.
// 수치 튜닝(sim) 시 설명 자동 동기화. 스킬 레벨 위력은 skillLevelMult로 반영.
import { skillLevelMult, scaledEffectValue } from '../engine/battle.js'

const round2 = (n) => String(Math.round(n * 100) / 100)
const pct = (v) => `${v >= 1 ? '+' : '-'}${Math.round(Math.abs(v - 1) * 100)}%`

// effect 스펙 1개 → 문구. mult = skillLevelMult(level).
function describeEffect(e, mult) {
  switch (e.type) {
    case 'dmgTaken': {
      const subj = e.target === 'enemy' ? '적 받는 데미지' : '받는 데미지'
      return `${subj} ${pct(scaledEffectValue('dmgTaken', e.value, mult))}`
    }
    case 'dmgDealt': {
      const subj = e.target === 'enemy' ? '적 주는 데미지' : e.target === 'allies' ? '아군 주는 데미지' : '주는 데미지'
      return `${subj} ${pct(scaledEffectValue('dmgDealt', e.value, mult))}`
    }
    case 'speed': {
      const subj = e.target === 'enemy' ? '적 속도' : '속도'
      return `${subj} ${pct(scaledEffectValue('speed', e.value, mult))}`
    }
    case 'stun':      return `기절 ${e.duration}틱`
    case 'dot':       return `지속 데미지 ATK×${round2(e.valueRatio * mult)} (${e.duration}틱)`
    case 'hot': {
      const subj = e.target === 'allies' ? '파티 지속 회복' : '지속 회복'
      return `${subj} 회복력×${round2(e.valueRatio * mult)} (${e.duration}틱)`
    }
    case 'mark':      return `표식: 피격 시 +ATK×${round2(e.valueRatio * mult)}`
    case 'reflect':   return `받은 데미지 ${Math.round(e.value * mult * 100)}% 반사`
    case 'intercept': return '최저체력 아군 대신 피격'
    case 'taunt':     return '도발(적 강제 타겟)'
    default:          return e.type
  }
}

// 스킬 → 설명 라인 배열(name 제외 — 툴팁이 헤더로 따로 표기).
export function describeSkillLines(skill, level = 1) {
  const mult = skillLevelMult(level)
  const lines = []
  lines.push(skill.kind === 'heal' ? '회복' : (skill.range === 'ranged' ? '원거리 공격' : '근접 공격'))
  if (skill.power > 0) lines.push(`위력 ×${round2(skill.power * mult)}`)
  if (skill.hits > 1) lines.push(`${skill.hits}회 타격`)
  if (skill.ignoreDef) lines.push(`방어 ${Math.round(skill.ignoreDef * 100)}% 무시`)
  lines.push(skill.cost > 0 ? `마나 ${skill.cost}` : `평타(마나 충전 +${skill.manaGain})`)
  if (skill.cd > 0) lines.push(`쿨 ${skill.cd}틱`)
  for (const e of (skill.effects || [])) lines.push(describeEffect(e, mult))
  return lines
}

export function describeSkill(skill, level = 1) {
  return describeSkillLines(skill, level).join('\n')
}

// 트레잇 → 설명 라인 배열.
export function describeTraitLines(trait) {
  const t = trait
  if (t.targeting) {
    const lines = []
    if (t.targeting.lowHp) lines.push('저체력 아군 우선 공격')
    if (t.targeting.atk) lines.push('고공격력 아군 우선 공격')
    if (t.targeting.position) lines.push('후열 아군 우선 공격')
    return lines.length ? lines : ['특수 타겟팅']
  }
  if (t.op === 'mult') {
    const rangeKo = t.cond && t.cond.attackerRange === 'melee' ? '근접' : '원거리'
    return [t.value === 0 ? `${rangeKo} 공격 면역` : `${rangeKo} 공격 데미지 -${Math.round((1 - t.value) * 100)}%`]
  }
  if (t.op === 'heal')    return [`매 턴 시작 HP +${t.value}`]
  if (t.op === 'reflect') return [`받은 데미지 ${Math.round(t.value * 100)}% 반사`]
  return [t.name]
}

export function describeTrait(trait) {
  return describeTraitLines(trait).join('\n')
}

// 광역(엔진 네이티브 고정능력) 설명.
export function describeAoe() {
  return '광역 공격 — 파티 전체 타격'
}
