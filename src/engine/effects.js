// 전투중 일시 버프/디버프. 순수, DOM·RNG 0. 몹 트레잇(applyRules)과 평행:
// 트레잇=몹 정적특성(조우생성 고정), effect=전투중 일시상태(스킬 부여·틱 만료).
// effect = { type, value, source, expireTick, interval?, nextTick? }
//   type∈{dmgTaken,dmgDealt,taunt,hot}. value=배율 | 회복량 | 무의미.

// refresh: 같은 (type, source) 있으면 그 자리 교체(expireTick·value 갱신), 없으면 push.
export function applyEffect(target, eff) {
  const i = target.effects.findIndex(e => e.type === eff.type && e.source === eff.source)
  if (i >= 0) target.effects[i] = eff
  else target.effects.push(eff)
}

// 만료(expireTick<=tick) 제거. HoT 적용 뒤에 호출해야 만료틱 마지막 proc 보장.
export function expireEffects(target, tick) {
  target.effects = (target.effects || []).filter(e => e.expireTick > tick)
}

// hot effect 중 nextTick 도달분 회복 적용 + nextTick 전진. 죽은 대상 no-op.
export function tickHoT(target, tick, log) {
  for (const e of (target.effects || [])) {
    if (e.type === 'hot' && e.nextTick <= tick) {
      if (target.hp > 0) {
        target.hp = Math.min(target.maxHp, target.hp + e.value)
        log.push(`${target.name} 지속회복 (+${e.value})`)
      }
      e.nextTick += e.interval
    }
  }
}

export function dmgTakenMult(unit) {
  return (unit.effects || []).reduce((m, e) => (e.type === 'dmgTaken' ? m * e.value : m), 1)
}

export function dmgDealtMult(unit) {
  return (unit.effects || []).reduce((m, e) => (e.type === 'dmgDealt' ? m * e.value : m), 1)
}

export function hasTaunt(unit) {
  return (unit.effects || []).some(e => e.type === 'taunt')
}
